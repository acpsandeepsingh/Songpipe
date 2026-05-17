package com.sansoft.songpipe.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.schabi.newpipe.extractor.NewPipe;
import org.schabi.newpipe.extractor.StreamingService;
import org.schabi.newpipe.extractor.ServiceList;
import org.schabi.newpipe.extractor.Image;
import org.schabi.newpipe.extractor.channel.ChannelInfo;
import org.schabi.newpipe.extractor.kiosk.KioskInfo;
import org.schabi.newpipe.extractor.search.SearchInfo;
import org.schabi.newpipe.extractor.InfoItem;
import org.schabi.newpipe.extractor.stream.StreamInfoItem;
import org.schabi.newpipe.extractor.stream.StreamInfo;
import org.schabi.newpipe.extractor.stream.VideoStream;
import org.schabi.newpipe.extractor.stream.AudioStream;
import com.sansoft.songpipe.extractor.DownloaderImpl;

import java.util.List;

import io.reactivex.rxjava3.core.Single;
import io.reactivex.rxjava3.schedulers.Schedulers;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;

@CapacitorPlugin(name = "YoutubeExtractor")
public class YoutubeExtractorPlugin extends Plugin {
    private static String firstImageUrl(List<Image> images) {
        if (images == null || images.isEmpty()) return "";
        Image img = images.get(0);
        return img != null && img.getUrl() != null ? img.getUrl() : "";
    }

    @Override
    public void load() {
        super.load();
        try {
            DownloaderImpl.init(null);
            NewPipe.init(DownloaderImpl.getInstance());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @PluginMethod
    public void extractVideo(PluginCall call) {
        String videoId = call.getString("videoId");
        if (videoId == null) {
            call.reject("Video ID is required");
            return;
        }

        String videoUrl = "https://www.youtube.com/watch?v=" + videoId;

        Single.fromCallable(() -> {
            StreamingService service = ServiceList.YouTube;
            try {
                return StreamInfo.getInfo(service, videoUrl);
            } catch (Exception first) {
                // Retry once because YouTube/Innertube occasionally returns transient "page needs reload" errors
                return StreamInfo.getInfo(service, videoUrl);
            }
        })
        .subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe(info -> {
            JSObject result = new JSObject();
            result.put("id", info.getId());
            result.put("title", info.getName());
            result.put("thumbnail", firstImageUrl(info.getThumbnails()));
            result.put("author", info.getUploaderName());
            result.put("views", info.getViewCount());
            result.put("description", info.getDescription());

            JSObject formats = new JSObject();
            
            JSArray videoStreams = new JSArray();
            for (VideoStream stream : info.getVideoStreams()) {
                JSObject s = new JSObject();
                s.put("url", stream.getUrl());
                s.put("quality", stream.getResolution());
                s.put("mimeType", stream.getFormat().getName());
                videoStreams.put(s);
            }
            formats.put("video", videoStreams);

            JSArray audioStreams = new JSArray();
            for (AudioStream stream : info.getAudioStreams()) {
                JSObject s = new JSObject();
                s.put("url", stream.getUrl());
                s.put("bitrate", stream.getAverageBitrate());
                s.put("mimeType", stream.getFormat().getName());
                audioStreams.put(s);
            }
            formats.put("audio", audioStreams);
            
            result.put("formats", formats);
            result.put("nativeMode", true);

            call.resolve(result);
        }, throwable -> {
            call.reject("Extraction failed: " + throwable.getMessage());
        });
    }

    @PluginMethod
    public void trending(PluginCall call) {
        Single.fromCallable(() -> {
            StreamingService service = ServiceList.YouTube;
            return KioskInfo.getInfo(service, "Trending");
        })
        .subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe(info -> {
            JSArray items = new JSArray();
            for (InfoItem raw : info.getRelatedItems()) {
                if (raw instanceof StreamInfoItem) {
                    StreamInfoItem item = (StreamInfoItem) raw;
                    JSObject i = new JSObject();
                    i.put("id", item.getUrl() != null ? item.getUrl().replace("https://www.youtube.com/watch?v=", "") : "");
                    i.put("title", item.getName());
                    i.put("thumbnail", firstImageUrl(item.getThumbnails()));
                    i.put("channelName", item.getUploaderName());
                    i.put("views", String.valueOf(item.getViewCount()));
                    i.put("uploadedAt", item.getTextualUploadDate());
                    i.put("duration", item.getDuration() > 0 ? String.valueOf(item.getDuration()) : "0");
                    items.put(i);
                }
            }
            JSObject result = new JSObject();
            result.put("items", items);
            call.resolve(result);
        }, throwable -> call.reject("Trending failed: " + throwable.getMessage()));
    }

    @PluginMethod
    public void search(PluginCall call) {
        String query = call.getString("query");
        if (query == null || query.trim().isEmpty()) {
            call.reject("Query is required");
            return;
        }

        Single.fromCallable(() -> {
            StreamingService service = ServiceList.YouTube;
            return SearchInfo.getInfo(service, service.getSearchQHFactory().fromQuery(query));
        })
        .subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe((SearchInfo info) -> {
            JSArray items = new JSArray();
            for (InfoItem raw : info.getRelatedItems()) {
                if (raw instanceof StreamInfoItem) {
                    StreamInfoItem item = (StreamInfoItem) raw;
                    JSObject i = new JSObject();
                    i.put("id", item.getUrl() != null ? item.getUrl().replace("https://www.youtube.com/watch?v=", "") : "");
                    i.put("title", item.getName());
                    i.put("thumbnail", firstImageUrl(item.getThumbnails()));
                    i.put("channelName", item.getUploaderName());
                    i.put("views", String.valueOf(item.getViewCount()));
                    i.put("uploadedAt", item.getTextualUploadDate());
                    i.put("duration", item.getDuration() > 0 ? String.valueOf(item.getDuration()) : "0");
                    items.put(i);
                }
            }
            JSObject result = new JSObject();
            result.put("items", items);
            call.resolve(result);
        }, throwable -> call.reject("Search failed: " + throwable.getMessage()));
    }

    @PluginMethod
    public void getChannelInfo(PluginCall call) {
        String channelUrl = call.getString("url");
        if (channelUrl == null) {
            call.reject("URL is required");
            return;
        }

        Single.fromCallable(() -> {
            StreamingService service = NewPipe.getServiceByUrl(channelUrl);
            return ChannelInfo.getInfo(service, channelUrl);
        })
        .subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
        .subscribe(info -> {
            JSObject result = new JSObject();
            result.put("id", info.getId());
            result.put("title", info.getName());
            result.put("thumbnail", firstImageUrl(info.getAvatars()));
            result.put("description", info.getDescription());
            result.put("subscriberCount", info.getSubscriberCount());

            JSArray items = new JSArray();
            result.put("items", items);

            call.resolve(result);
        }, throwable -> {
            call.reject("Channel extraction failed: " + throwable.getMessage());
        });
    }

    @PluginMethod
    public void getNativeHeaders(PluginCall call) {
        JSObject headers = new JSObject();
        headers.put("User-Agent", DownloaderImpl.USER_AGENT);
        call.resolve(headers);
    }
}
