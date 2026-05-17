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

        Log.d("YoutubeExtractor", "Native extraction requested for: " + videoId);

        new Thread(() -> {
            try {
                java.net.URL url = new java.net.URL("https://www.youtube.com/watch?v=" + videoId);
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestProperty("User-Agent", "com.google.android.youtube/19.11.38 (Linux; U; Android 14; en_US) gzip");
                conn.setRequestProperty("X-Android-Package", "com.google.android.youtube");
                
                java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
                String inputLine;
                StringBuilder content = new StringBuilder();
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                    if (content.length() > 500000) break; // Limit to 500kb
                }
                in.close();

                String html = content.toString();
                String playerResponse = "";
                
                // Try to extract ytInitialPlayerResponse using regex-like logic
                int startIdx = html.indexOf("ytInitialPlayerResponse = ");
                if (startIdx != -1) {
                    startIdx += "ytInitialPlayerResponse = ".length();
                    int endIdx = html.indexOf(";</script>", startIdx);
                    if (endIdx != -1) {
                        playerResponse = html.substring(startIdx, endIdx);
                    }
                }

                JSObject ret = new JSObject();
                ret.put("nativeMode", true);
                ret.put("isNativeApk", true);
                ret.put("videoId", videoId);
                ret.put("playerResponse", playerResponse);
                ret.put("androidVersion", android.os.Build.VERSION.RELEASE);
                
                call.resolve(ret);
            } catch (Exception e) {
                Log.e("YoutubeExtractor", "Native scraper failed", e);
                // Fallback to basic info if scrape fails
                JSObject ret = new JSObject();
                ret.put("nativeMode", true);
                ret.put("error", e.getMessage());
                call.resolve(ret);
            }
        }).start();
    }

    @PluginMethod
    public void getNativeHeaders(PluginCall call) {
        JSObject headers = new JSObject();
        headers.put("User-Agent", "com.google.android.youtube/19.11.38 (Linux; U; Android 14; en_US) gzip");
        headers.put("X-Android-Package", "com.google.android.youtube");
        call.resolve(headers);
    }
}
