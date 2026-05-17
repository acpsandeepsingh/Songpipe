
export interface LogEntry {
  timestamp: string;
  type: 'error' | 'warn' | 'info';
  message: string;
  context?: any;
}

interface StartupCheck {
  name: string;
  status: 'pending' | 'ok' | 'failed';
  detail?: string;
}

class SessionLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private startupChecks: StartupCheck[] = [
    { name: 'index.html loaded', status: 'pending' },
    { name: 'main JS bundle loaded', status: 'pending' },
    { name: 'main CSS bundle loaded', status: 'pending' },
    { name: 'API /api/trending JSON response', status: 'pending' },
    { name: 'Native YoutubeExtractor bridge', status: 'pending' }
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Capture unhandled errors
    window.onerror = (message, source, lineno, colno, error) => {
      this.add('error', `Global Error: ${message}`, { 
        source, 
        lineno, 
        colno, 
        stack: error?.stack,
        url: window.location.href 
      });
    };

    // Capture promise rejections
    window.onunhandledrejection = (event) => {
      this.add('error', `Unhandled Rejection: ${event.reason}`, { 
        reason: event.reason,
        url: window.location.href
      });
    };

    // Wrap console.error
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (!message.includes('[SessionLog]')) {
         this.add('error', message);
      }
      originalConsoleError.apply(console, args);
    };

    // Wrap console.warn
    const originalConsoleWarn = console.warn;
    console.warn = (...args: any[]) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (!message.includes('[SessionLog]')) {
         this.add('warn', message);
      }
      originalConsoleWarn.apply(console, args);
    };

    // Intercept fetch for logging
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      this.add('info', `Fetch Request: ${url}`);
      try {
        const response = await originalFetch(...args);
        if (!response.ok) {
           this.add('warn', `Fetch Failure: ${url} returned ${response.status}`);
        }
        return response;
      } catch (err: any) {
        this.add('error', `Fetch Exception: ${url}`, { error: err.message });
        throw err;
      }
    };

    this.add('info', 'Session Logger Active', { 
      userAgent: navigator.userAgent,
      platform: (window as any).Capacitor?.getPlatform() || 'web',
      time: new Date().toLocaleString()
    });

    this.detectStaticAssets();
  }

  public add(type: LogEntry['type'], message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      context
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.updateChecksFromLog(type, message, context);
    // Also log to console if not already there
    if (type === 'info') console.log(`[SessionLog] ${message}`);
  }

  public getFullLog(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public getErrorOnlyLog(): string {
    return JSON.stringify(this.logs.filter((l) => l.type === 'error'), null, 2);
  }

  public getStartupReport(): string {
    const checks = this.startupChecks.map((c) => ({
      ...c,
      timestamp: new Date().toISOString()
    }));
    const failed = checks.filter((c) => c.status === 'failed');
    return JSON.stringify({
      appState: failed.length > 0 ? 'Startup/Runtime Error' : 'OK',
      checks,
      runtimeErrors: this.logs.filter((l) => l.type === 'error'),
      platform: (window as any).Capacitor?.getPlatform() || 'web',
      browser: navigator.userAgent,
      timestamp: new Date().toISOString()
    }, null, 2);
  }

  private detectStaticAssets() {
    try {
      this.markCheck('index.html loaded', 'ok', window.location.href);
      const resources = performance.getEntriesByType('resource').map((r: any) => r.name || '');
      const jsLoaded = resources.some((r: string) => r.includes('/assets/index-') && r.endsWith('.js'));
      const cssLoaded = resources.some((r: string) => r.includes('/assets/index-') && r.endsWith('.css'));
      this.markCheck('main JS bundle loaded', jsLoaded ? 'ok' : 'failed', jsLoaded ? 'found in performance resources' : 'missing from performance resources');
      this.markCheck('main CSS bundle loaded', cssLoaded ? 'ok' : 'failed', cssLoaded ? 'found in performance resources' : 'missing from performance resources');
    } catch (e: any) {
      this.markCheck('main JS bundle loaded', 'failed', e?.message || 'resource check failed');
      this.markCheck('main CSS bundle loaded', 'failed', e?.message || 'resource check failed');
    }
  }

  private updateChecksFromLog(type: LogEntry['type'], message: string, context?: any) {
    if (message.includes('Fetch Request:') && message.includes('/api/trending')) {
      this.markCheck('API /api/trending JSON response', 'pending', 'request sent');
    }
    if (message.includes('Non-JSON response from') && message.includes('/api/trending')) {
      this.markCheck('API /api/trending JSON response', 'failed', context?.body?.substring?.(0, 120) || 'non-json response');
    }
    if (message.includes('Fetched') && message.includes('/api/trending')) {
      this.markCheck('API /api/trending JSON response', 'ok', 'received valid JSON');
    }
    if (message.includes('Native bridge unavailable') || message.includes('UNIMPLEMENTED')) {
      this.markCheck('Native YoutubeExtractor bridge', 'failed', message);
    }
    if (message.toLowerCase().includes('native') && message.toLowerCase().includes('extractor') && type === 'info') {
      this.markCheck('Native YoutubeExtractor bridge', 'ok', message);
    }
  }

  private markCheck(name: string, status: 'pending' | 'ok' | 'failed', detail?: string) {
    const check = this.startupChecks.find((c) => c.name === name);
    if (!check) return;
    check.status = status;
    check.detail = detail;
  }

  public clear() {
    this.logs = [];
  }
}

export const logger = new SessionLogger();
