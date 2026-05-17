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
                // Try 1: Web Scrape (standard)
                java.net.URL url = new java.net.URL("https://www.youtube.com/watch?v=" + videoId + "&pbj=1");
                java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.6167.164 Mobile Safari/537.36");
                conn.setRequestProperty("X-YouTube-Client-Name", "1");
                conn.setRequestProperty("X-YouTube-Client-Version", "2.20240210.00.00");
                
                java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
                String inputLine;
                StringBuilder content = new StringBuilder();
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                    if (content.length() > 800000) break; 
                }
                in.close();

                String html = content.toString();
                String playerResponse = "";
                
                // Pattern 1: ytInitialPlayerResponse
                int startIdx = html.indexOf("ytInitialPlayerResponse = ");
                if (startIdx != -1) {
                    startIdx += "ytInitialPlayerResponse = ".length();
                    int endIdx = html.indexOf(";</script>", startIdx);
                    if (endIdx != -1) playerResponse = html.substring(startIdx, endIdx);
                }
                
                // Pattern 2: var ytInitialPlayerResponse = {...}
                if (playerResponse.isEmpty()) {
                   java.util.regex.Pattern p = java.util.regex.Pattern.compile("ytInitialPlayerResponse\\s*=\\s*(\\{.+?\\});");
                   java.util.regex.Matcher m = p.matcher(html);
                   if (m.find()) playerResponse = m.group(1);
                }

                // Try 2: Embed Scrape (often less protected)
                if (playerResponse.isEmpty()) {
                   url = new java.net.URL("https://www.youtube.com/embed/" + videoId);
                   conn = (java.net.HttpURLConnection) url.openConnection();
                   conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36");
                   in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream()));
                   content = new StringBuilder();
                   while ((inputLine = in.readLine()) != null) {
                       content.append(inputLine);
                   }
                   in.close();
                   html = content.toString();
                   
                   int start = html.indexOf("\"ytInitialPlayerResponse\":");
                   if (start != -1) {
                       start += "\"ytInitialPlayerResponse\":".length();
                       int end = html.indexOf(",\"ytInitialData\"", start);
                       if (end != -1) playerResponse = html.substring(start, end);
                   }
                }

                JSObject ret = new JSObject();
                ret.put("nativeMode", true);
                ret.put("isNativeApk", true);
                ret.put("videoId", videoId);
                ret.put("playerResponse", playerResponse);
                ret.put("androidVersion", android.os.Build.VERSION.RELEASE);
                ret.put("scrapeLength", html.length());
                
                call.resolve(ret);
            } catch (Exception e) {
                Log.e("YoutubeExtractor", "Native scraper failed", e);
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
