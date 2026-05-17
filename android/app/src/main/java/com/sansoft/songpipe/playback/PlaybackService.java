package com.sansoft.songpipe.playback;

import android.content.Intent;
import androidx.annotation.Nullable;
import androidx.media3.common.AudioAttributes;
import androidx.media3.common.C;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

public class PlaybackService extends MediaSessionService {
    private ExoPlayer player;
    private MediaSession mediaSession;

    @Override
    public void onCreate() {
        super.onCreate();
        player = new ExoPlayer.Builder(this).build();
        
        AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setUsage(C.USAGE_MEDIA)
                .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                .build();
        player.setAudioAttributes(audioAttributes, true);
        
        mediaSession = new MediaSession.Builder(this, player).build();
    }

    @Nullable
    @Override
    public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) {
        return mediaSession;
    }

    @Override
    public void onDestroy() {
        if (player != null) {
            player.release();
            player = null;
        }
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }
        super.onDestroy();
    }
    
    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && intent.getAction() != null) {
            String action = intent.getAction();
            if ("PLAY_URL".equals(action)) {
                String url = intent.getStringExtra("url");
                String title = intent.getStringExtra("title");
                String artist = intent.getStringExtra("artist");
                String artUrl = intent.getStringExtra("artUrl");
                
                if (url != null) {
                    MediaMetadata metadata = new MediaMetadata.Builder()
                            .setTitle(title)
                            .setArtist(artist)
                            .setArtworkUri(android.net.Uri.parse(artUrl))
                            .build();
                            
                    MediaItem mediaItem = new MediaItem.Builder()
                            .setUri(url)
                            .setMediaMetadata(metadata)
                            .build();
                    
                    player.setMediaItem(mediaItem);
                    player.prepare();
                    player.play();
                }
            } else if ("STOP".equals(action)) {
                player.stop();
                stopSelf();
            }
        }
        return super.onStartCommand(intent, flags, startId);
    }
}
