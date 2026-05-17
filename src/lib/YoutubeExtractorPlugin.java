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

        // In a real APK, you would ideally use a library like NewPipeExtractor here.
        // This is a simplified native extraction logic.
        try {
            URL url = new URL("https://www.youtube.com/get_video_info?video_id=" + videoId + "&el=embedded");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Android 14; Mobile; rv:125.0) Gecko/125.0 Firefox/125.0");
            
            BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();

            JSObject ret = new JSObject();
            ret.put("extracted", true);
            ret.put("videoId", videoId);
            // This would normally parse the streamingData from the response
            ret.put("status", "Native extraction triggered");
            
            call.resolve(ret);
        } catch (Exception e) {
            Log.e("YoutubeExtractor", "Extraction failed", e);
            call.reject(e.getMessage());
        }
    }
}
