package com.sansoft.songpipe.plugins;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.sansoft.songpipe.playback.PlaybackService;

@CapacitorPlugin(name = "NativePlayback")
public class NativePlaybackPlugin extends Plugin {

    @PluginMethod
    public void play(PluginCall call) {
        String url = call.getString("url");
        String title = call.getString("title");
        String artist = call.getString("artist");
        String artUrl = call.getString("artUrl");

        Intent intent = new Intent(getContext(), PlaybackService.class);
        intent.setAction("PLAY_URL");
        intent.putExtra("url", url);
        intent.putExtra("title", title);
        intent.putExtra("artist", artist);
        intent.putExtra("artUrl", artUrl);
        
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent intent = new Intent(getContext(), PlaybackService.class);
        intent.setAction("STOP");
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void enterPip(PluginCall call) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            getActivity().enterPictureInPictureMode(new android.app.PictureInPictureParams.Builder().build());
            call.resolve();
        } else {
            call.reject("PiP not supported on this device");
        }
    }
}
