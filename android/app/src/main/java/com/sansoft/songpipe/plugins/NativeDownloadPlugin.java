package com.sansoft.songpipe.plugins;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Environment;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeDownload")
public class NativeDownloadPlugin extends Plugin {

    @PluginMethod
    public void downloadFile(PluginCall call) {
        String url = call.getString("url");
        String filename = call.getString("filename");
        String title = call.getString("title");

        if (url == null) {
            call.reject("URL is required");
            return;
        }

        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setTitle(title != null ? title : filename);
        request.setDescription("Downloading video content...");
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
        request.setAllowedOverMetered(true);
        request.setAllowedOverRoaming(true);

        DownloadManager downloadManager = (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager != null) {
            downloadManager.enqueue(request);
            call.resolve();
        } else {
            call.reject("DownloadManager not available");
        }
    }
}
