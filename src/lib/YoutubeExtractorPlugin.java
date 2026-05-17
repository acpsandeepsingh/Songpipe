package org.newpipe.web.plugins;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Native YouTube Extractor Plugin for Android (Native APK usage)
 */
@CapacitorPlugin(name = "YoutubeExtractor")
public class YoutubeExtractorPlugin extends Plugin {

    @PluginMethod
    public void extractVideo(PluginCall call) {
        String videoId = call.getString("videoId");
        if (videoId == null) {
            call.reject("Video ID is required");
            return;
        }

        Log.d("YoutubeExtractor", "Native extraction requested for videoId: " + videoId);

        try {
            JSObject ret = new JSObject();
            ret.put("nativeMode", true);
            ret.put("videoId", videoId);
            ret.put("androidVersion", android.os.Build.VERSION.RELEASE);
            ret.put("model", android.os.Build.MODEL);
            ret.put("isNativeApk", true);
            
            // Check connectivity
            android.net.ConnectivityManager cm = (android.net.ConnectivityManager) getContext().getSystemService(android.content.Context.CONNECTIVITY_SERVICE);
            android.net.NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
            boolean isConnected = activeNetwork != null && activeNetwork.isConnected();
            ret.put("isConnected", isConnected);
            
            // Signify success so JS uses native headers
            call.resolve(ret);
        } catch (Exception e) {
            Log.e("YoutubeExtractor", "Native logic failed", e);
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void getNativeHeaders(PluginCall call) {
        JSObject headers = new JSObject();
        headers.put("User-Agent", "com.google.android.youtube/19.11.38 (Linux; U; Android 14; en_US) gzip");
        headers.put("X-Android-Package", "com.google.android.youtube");
        call.resolve(headers);
    }
}
