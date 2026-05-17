
export interface LogEntry {
  timestamp: string;
  type: 'error' | 'warn' | 'info';
  message: string;
  context?: any;
}

class SessionLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

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
    // Also log to console if not already there
    if (type === 'info') console.log(`[SessionLog] ${message}`);
  }

  public getFullLog(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public clear() {
    this.logs = [];
  }
}

export const logger = new SessionLogger();
