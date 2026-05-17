package com.sansoft.songpipe;

import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.ConsoleMessage;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;
import com.sansoft.songpipe.extractor.DownloaderImpl;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "SongPipeWebView";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize NewPipe Extractor
        DownloaderImpl.init(null);

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) {
            Log.e(TAG, "Bridge/WebView not available in onCreate");
            return;
        }

        WebSettings settings = webView.getSettings();
        settings.setDomStorageEnabled(true);
        settings.setJavaScriptEnabled(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                Log.i(TAG, "onPageStarted: " + url);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.i(TAG, "onPageFinished: " + url);
                view.evaluateJavascript(
                    "JSON.stringify({" +
                        "href: location.href," +
                        "readyState: document.readyState," +
                        "title: document.title" +
                    "})",
                    (ValueCallback<String>) value -> Log.i(TAG, "DOM state: " + value)
                );
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request != null && request.isForMainFrame()) {
                    Log.e(TAG, "Main frame error: code=" + error.getErrorCode() + " desc=" + error.getDescription() + " url=" + request.getUrl());
                }
            }

            @Override
            public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
                super.onReceivedHttpError(view, request, errorResponse);
                if (request != null && request.isForMainFrame()) {
                    Log.e(TAG, "Main frame HTTP error: status=" + (errorResponse != null ? errorResponse.getStatusCode() : -1) + " url=" + request.getUrl());
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
                Log.e(
                    TAG,
                    "JS console: " + consoleMessage.message() +
                        " @" + consoleMessage.sourceId() + ":" + consoleMessage.lineNumber()
                );
                return super.onConsoleMessage(consoleMessage);
            }
        });
    }
}
