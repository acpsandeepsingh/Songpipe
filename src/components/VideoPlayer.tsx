import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, ChevronDown, ChevronUp, Cpu, Music, Video } from 'lucide-react';
import ExtractionDialog from './ExtractionDialog';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import YoutubeExtractor from '../lib/nativeBridge';
import { Capacitor } from '@capacitor/core';

import { logger } from '../lib/logger';
import { fetchJsonOrThrow, apiUrl } from '../lib/api';

export default function VideoPlayer({ video }: { video: any }) {
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [nativeInfo, setNativeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [isExtractionOpen, setIsExtractionOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(successMessage);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert(successMessage);
    }
  };

  useEffect(() => {
    async function checkLiked() {
      try {
        const likedDoc = doc(db, 'public_likes', video.id);
        const snapshot = await getDoc(likedDoc);
        if (snapshot.exists()) {
          setIsLiked(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
    checkLiked();
  }, [video.id]);

  const fetchInfo = async () => {
    try {
      setLoading(true);
      
      let nativeHeaders: any = {};
      let nativeData: any = null;
      // Try Native Extraction if on Android
      if (Capacitor.getPlatform() === 'android') {
        try {
          console.log("Attempting native extraction...");
          const nativeResult = await YoutubeExtractor.extractVideo({ videoId: video.id });
          console.log("Native extraction response:", nativeResult);
          setNativeInfo(nativeResult);
          
          if (nativeResult.nativeMode) {
             nativeHeaders = { 'X-Native-Mode': 'true' };
             // Map native result to the format expected by the app
             nativeData = {
                id: nativeResult.id,
                title: nativeResult.title,
                thumbnail: nativeResult.thumbnail,
                author: { name: nativeResult.author },
                views: nativeResult.views,
                description: nativeResult.description,
                formats: nativeResult.formats
             };

             // If native extraction already contains playable streams, skip backend dependency.
             const hasNativeStreams =
               (nativeData.formats?.audio?.length || 0) > 0 ||
               (nativeData.formats?.video?.length || 0) > 0;
             if (hasNativeStreams) {
               setVideoInfo(nativeData);
               return;
             }
          }
        } catch (nativeErr) {
          console.warn("Native bridge unavailable or failed:", nativeErr);
          setNativeInfo({
            nativeMode: false,
            error: (nativeErr as any)?.message || String(nativeErr)
          });
        }
      }

      const data = await fetchJsonOrThrow(`/api/video-info?id=${video.id}`, {
        headers: nativeHeaders
      });
      
      // If native data is better (has formats when server doesn't), use it
      const finalData = (nativeData && nativeData.formats?.audio?.length > 0) ? nativeData : data;
      setVideoInfo(finalData);
      
      if (finalData.error && !nativeData) {
        setErrorDetails(JSON.stringify(finalData, null, 2));
      }
      
      // Record to Firestore public history
      try {
        const historyDoc = doc(db, 'public_history', video.id);
        await setDoc(historyDoc, {
          ...video,
          watchedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        logger.add('warn', 'Failed to save Firestore history', { error: (e as any)?.message || String(e) });
        // Fallback to local if server/firestore fails
        const history = JSON.parse(localStorage.getItem('history') || '[]');
        const filtered = history.filter((v: any) => v.id !== video.id);
        localStorage.setItem('history', JSON.stringify([{ ...video, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 50)));
      }
      
    } catch (error: any) {
      logger.add('error', 'Failed to fetch video info', {
        error: error?.message || String(error),
        videoId: video.id,
        endpoint: apiUrl(`/api/video-info?id=${video.id}`)
      });
      setVideoInfo({ error: true, message: error.message || "Network Error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfo();
  }, [video.id]);

  if (loading) {
    // ... animation code
    return (
      <div className="flex-1 flex flex-col gap-4 animate-pulse pt-2 sm:pt-0">
        <div className="aspect-video bg-[#272727] sm:rounded-xl" />
        <div className="px-4 sm:px-0 space-y-4">
          <div className="h-6 bg-[#272727] rounded w-3/4" />
          <div className="flex justify-between items-center">
            <div className="flex gap-3 items-center">
               <div className="w-10 h-10 rounded-full bg-[#272727]" />
               <div className="flex flex-col gap-1">
                  <div className="h-4 bg-[#272727] rounded w-24" />
                  <div className="h-3 bg-[#272727] rounded w-16" />
               </div>
            </div>
          </div>
          <div className="flex gap-2 bg-[#272727] h-10 rounded-full w-full" />
        </div>
      </div>
    );
  }

  if (!videoInfo || videoInfo.error || videoInfo.isMetadataOnly || !videoInfo.formats || (videoInfo.formats.audio.length === 0 && videoInfo.formats.video.length === 0)) {
    const fullErrorObject = {
      appState: 'Extraction Error',
      videoId: video.id,
      serverError: videoInfo,
      nativeSystemInfo: nativeInfo,
      browser: navigator.userAgent,
      platform: Capacitor.getPlatform(),
      timestamp: new Date().toISOString()
    };
    const fullErrorText = JSON.stringify(fullErrorObject, null, 2);
    const errorParts = fullErrorText.length > 1800
      ? [fullErrorText.slice(0, 1800), fullErrorText.slice(1800)]
      : [fullErrorText];

    const connectivityRootCause =
      nativeInfo?.error?.includes('plugin is not implemented')
        ? 'Native plugin not registered in this APK build + backend unreachable.'
        : videoInfo?.message?.includes('All API candidates failed')
          ? 'Backend host is unreachable from this device (localhost/10.0.2.2 issue).'
          : 'Unknown extraction failure.';

    const copyFullError = () => {
      copyText(fullErrorText, "Full error log copied.");
    };

    const copySessionLog = () => {
      copyText(logger.getFullLog(), "Full session log copied.");
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[450px] text-center p-8 bg-[#0f0f0f] sm:rounded-xl border-x border-b border-white/5 mx-0">
        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mb-6 border border-red-600/20">
          <Share2 className="w-10 h-10 text-red-600" />
        </div>
        <h3 className="text-white font-black text-xl mb-3 uppercase">Extraction Protocol Challenge</h3>
        <p className="text-sm text-[#aaa] mb-8 max-w-sm px-2 font-medium leading-relaxed">
          {videoInfo?.isMetadataOnly 
            ? "Server restricted: This content requires Native Extraction to bypass regional signatures." 
            : videoInfo?.message?.includes('Sign in') 
              ? "YouTube restricted: High-security content detected. Use Native Mode."
              : "Extraction failed due to YouTube's latest signature protocol updates."}
        </p>
        <div className="bg-yellow-900/20 p-3 rounded-xl mb-4 w-full max-w-sm text-left border border-yellow-900/40 text-yellow-200 text-[11px]">
          <span className="font-bold block mb-1">Root Cause</span>
          {connectivityRootCause}
        </div>

        {videoInfo?.message && (
          <div className="bg-red-950/20 p-4 rounded-2xl mb-8 w-full max-w-sm text-left border border-red-900/30 font-mono text-[11px] text-red-400 overflow-auto max-h-40 shadow-inner">
            <div className="flex justify-between items-center mb-2 border-b border-red-900/40 pb-1">
               <span className="font-black text-[9px] uppercase tracking-widest text-red-500/50">Debug Console</span>
               <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
               </div>
            </div>
            {videoInfo.message}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-[260px]">
          <button 
            onClick={fetchInfo}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-red-600/30 tracking-tight"
          >
            <Cpu className="w-5 h-5" /> RETRY NATIVE MODE
          </button>
          
          <div className="grid grid-cols-2 gap-2">
             <button 
               onClick={copyFullError}
               className="bg-white/5 text-[#aaa] px-4 py-3 rounded-2xl font-black transition-all border border-white/10 text-[10px] uppercase tracking-wider hover:bg-white/10 active:scale-95"
             >
               ERROR LOG
             </button>
             <button 
               onClick={copySessionLog}
               className="bg-white/5 text-[#aaa] px-4 py-3 rounded-2xl font-black transition-all border border-white/10 text-[10px] uppercase tracking-wider hover:bg-white/10 active:scale-95"
             >
               FULL SESSION
             </button>
             {errorParts[0] && (
               <button 
                 onClick={() => copyText(errorParts[0], "Error Part 1 copied.")}
                 className="bg-white/5 text-[#aaa] px-4 py-3 rounded-2xl font-black transition-all border border-white/10 text-[10px] uppercase tracking-wider hover:bg-white/10 active:scale-95"
               >
                 ERROR 1
               </button>
             )}
             {errorParts[1] && (
               <button 
                 onClick={() => copyText(errorParts[1], "Error Part 2 copied.")}
                 className="bg-white/5 text-[#aaa] px-4 py-3 rounded-2xl font-black transition-all border border-white/10 text-[10px] uppercase tracking-wider hover:bg-white/10 active:scale-95"
               >
                 ERROR 2
               </button>
             )}
             <button 
               onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
               className="bg-white/5 text-white px-4 py-3 rounded-2xl font-black transition-all border border-white/10 text-[10px] uppercase tracking-wider hover:bg-white/10 active:scale-95"
             >
               YOUTUBE
             </button>
          </div>
        </div>
      </div>
    );
  }

  const bestVideo = videoInfo?.formats?.video?.find((f: any) => f.quality && (f.quality.includes('720') || f.quality.includes('480')))?.proxyUrl 
                  || videoInfo?.formats?.video?.[0]?.proxyUrl 
                  || videoInfo?.formats?.video?.[0]?.url;

  return (
    <div className="flex-1 select-none">
      <div className="aspect-video w-full bg-black sm:rounded-xl overflow-hidden shadow-2xl relative group">
        {bestVideo ? (
          <video 
            src={bestVideo} 
            key={video.id} // Add key to force remount on video change
            controls 
            autoPlay 
            playsInline
            className="w-full h-full"
            poster={video.thumbnail}
            onError={(e) => {
               console.error("Video play error:", e);
               // If proxy fails, try direct as last resort
               const videoTag = e.currentTarget;
               if (videoTag.src.includes('/api/stream')) {
                  const originalUrl = videoInfo?.formats?.video?.[0]?.url;
                  if (originalUrl && videoTag.src !== originalUrl) {
                    videoTag.src = originalUrl;
                  }
               }
            }}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-black to-zinc-900">
             <img src={video.thumbnail} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl" alt="" />
             <p className="relative z-10 text-white font-bold mb-4 px-4 text-center">Video player initialized. Use the extract button below for audio/video streams.</p>
             <button 
               onClick={() => setIsExtractionOpen(true)}
               className="relative z-10 bg-red-600 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 shadow-xl hover:bg-red-700 transition-colors"
             >
                <Download className="w-5 h-5" /> Extract Content
             </button>
          </div>
        )}
      </div>
      
      <div className="mt-4 px-4 sm:px-0 space-y-4">
        <h1 className="text-[18px] font-bold leading-tight tracking-tight">{videoInfo.title}</h1>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={video.channelAvatar} className="w-10 h-10 rounded-full border border-white/5 shadow-md" alt="" />
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight">{videoInfo.author.name}</span>
                <span className="text-[11px] text-[#aaa] font-medium leading-none">{video.views}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={async () => {
                   try {
                     const likedDoc = doc(db, 'public_likes', video.id);
                     if (isLiked) {
                        await deleteDoc(likedDoc);
                     } else {
                        await setDoc(likedDoc, { ...video, watchedAt: new Date().toISOString() });
                     }
                     setIsLiked(!isLiked);
                   } catch (e) {
                     console.error("Like error:", e);
                   }
                }}
                className={`p-2.5 rounded-full transition-all active:scale-95 shadow-md ${isLiked ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
              </button>
              <button 
                onClick={() => setIsSubscribed(!isSubscribed)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all active:scale-95 shadow-lg ${isSubscribed ? 'bg-white/10 text-white' : 'bg-white text-black hover:bg-white/90'}`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center bg-[#272727] rounded-full overflow-hidden shrink-0">
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center gap-2 px-4 py-2 transition-colors active:bg-white/10 border-r border-white/5 ${isLiked ? 'text-red-500' : 'hover:bg-[#3f3f3f]'}`}
              >
                <ThumbsUp className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} /> <span className="font-bold text-sm">{video.views}</span>
              </button>
              <button className="px-4 py-2 hover:bg-[#3f3f3f] transition-colors active:bg-white/10">
                <ThumbsDown className="w-5 h-5" />
              </button>
            </div>
            
            <button 
              onClick={() => setIsExtractionOpen(true)}
              className="flex items-center gap-2 bg-red-600 px-5 py-2.5 rounded-xl hover:bg-red-700 shrink-0 font-black text-sm shadow-lg active:scale-95 transition-all text-white"
            >
              <Download className="w-5 h-5" /> <span>Download</span>
            </button>

            <button 
              onClick={() => {
                if (videoInfo?.formats?.audio?.[0]) {
                  import('../lib/nativePlayback').then(m => {
                    m.default.play({
                      url: videoInfo.formats.audio[0].url,
                      title: videoInfo.title,
                      artist: videoInfo.author?.name || 'YouTube',
                      artUrl: videoInfo.thumbnail
                    });
                    alert("Background audio started!");
                  });
                } else {
                  alert("No audio stream available for background play.");
                }
              }}
              className="flex items-center gap-2 bg-[#272727] px-5 py-2.5 rounded-xl hover:bg-[#3f3f3f] shrink-0 font-black text-sm transition-all active:scale-95"
            >
              <Music className="w-5 h-5 text-red-500" /> <span>Background</span>
            </button>

            <button 
              onClick={() => {
                import('../lib/nativePlayback').then(m => {
                  m.default.enterPip().catch(err => alert(err.message));
                });
              }}
              className="flex items-center gap-2 bg-[#272727] px-5 py-2.5 rounded-xl hover:bg-[#3f3f3f] shrink-0 font-black text-sm transition-all active:scale-95"
            >
              <Video className="w-5 h-5 text-blue-500" /> <span>Popup</span>
            </button>
            
            <button className="p-2.5 bg-[#272727] rounded-full hover:bg-[#3f3f3f] shrink-0 transition-colors active:bg-white/10">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div 
          onClick={() => setIsDescExpanded(!isDescExpanded)}
          className={`bg-[#202020] p-3 rounded-xl hover:bg-[#2a2a2a] cursor-pointer transition-all border border-white/5 ${isDescExpanded ? '' : 'max-h-24 overflow-hidden relative'}`}
        >
          <div className="flex gap-2 font-bold text-xs text-[#aaa] mb-1">
            <span className="text-white">{video.views} views</span>
            <span>{video.uploadedAt}</span>
          </div>
          <p className={`text-sm text-[#f1f1f1] leading-relaxed whitespace-pre-wrap ${!isDescExpanded && 'line-clamp-2'}`}>
             {videoInfo.description}
          </p>
          {!isDescExpanded && (
            <div className="absolute bottom-0 right-0 left-0 h-10 bg-gradient-to-t from-[#202020] to-transparent pointer-events-none flex items-end justify-center pb-1">
              <ChevronDown className="w-5 h-5 text-[#aaa]" />
            </div>
          )}
          {isDescExpanded && (
             <div className="pt-4 flex items-center justify-center text-[#aaa] font-bold text-xs">
                SHOW LESS <ChevronUp className="ml-1 w-4 h-4" />
             </div>
          )}
        </div>
      </div>

      <ExtractionDialog 
        isOpen={isExtractionOpen} 
        onClose={() => setIsExtractionOpen(false)} 
        videoInfo={videoInfo}
      />
    </div>
  );
}
