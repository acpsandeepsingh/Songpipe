package com.sansoft.songpipe;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.sansoft.songpipe.extractor.DownloaderImpl;
import com.sansoft.songpipe.plugins.NativeDownloadPlugin;
import com.sansoft.songpipe.plugins.NativePlaybackPlugin;
import com.sansoft.songpipe.plugins.YoutubeExtractorPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(YoutubeExtractorPlugin.class);
        registerPlugin(NativePlaybackPlugin.class);
        registerPlugin(NativeDownloadPlugin.class);
        super.onCreate(savedInstanceState);

        // Initialize NewPipe Extractor
        DownloaderImpl.init(null);
    }
}
