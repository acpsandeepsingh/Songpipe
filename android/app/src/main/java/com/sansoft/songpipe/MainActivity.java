package com.sansoft.songpipe;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.sansoft.songpipe.extractor.DownloaderImpl;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Initialize NewPipe Extractor
        DownloaderImpl.init(null);
    }
}
