import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, ChevronDown, ChevronUp, Cpu } from 'lucide-react';
import ExtractionDialog from './ExtractionDialog';
import { db } from '../lib/firebase';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import YoutubeExtractor from '../lib/nativeBridge';
import { Capacitor } from '@capacitor/core';

export default function VideoPlayer({ video }: { video: any }) {
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [nativeInfo, setNativeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorDetails, setErrorDetails] = useState<string>('');
  const [isExtractionOpen, setIsExtractionOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

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
      
      let nativeHeaders = {};
      // Try Native Extraction if on Android
      if (Capacitor.getPlatform() === 'android') {
        try {
          console.log("Attempting native extraction...");
          const nativeResult = await YoutubeExtractor.extractVideo({ videoId: video.id });
          console.log("Native extraction triggered:", nativeResult);
          setNativeInfo(nativeResult);
          
          if (nativeResult.nativeMode) {
             nativeHeaders = { 'X-Native-Mode': 'true' };
          }
        } catch (nativeErr) {
          console.warn("Native bridge unavailable or failed:", nativeErr);
        }
      }

      const response = await fetch(`/api/video-info?id=${video.id}`, {
        headers: nativeHeaders
      });
      const data = await response.json();
      setVideoInfo(data);
      if (data.error) {
        setErrorDetails(JSON.stringify(data, null, 2));
      }
      
      // Record to Firestore public history
      try {
        const historyDoc = doc(db, 'public_history', video.id);
        await setDoc(historyDoc, {
          ...video,
          watchedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Failed to save Firestore history", e);
        // Fallback to local if server/firestore fails
        const history = JSON.parse(localStorage.getItem('history') || '[]');
        const filtered = history.filter((v: any) => v.id !== video.id);
        localStorage.setItem('history', JSON.stringify([{ ...video, watchedAt: new Date().toISOString() }, ...filtered].slice(0, 50)));
      }
      
    } catch (error) {
      console.error("Failed to fetch video info:", error);
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

  if (!videoInfo || videoInfo.error || !videoInfo.formats || (videoInfo.formats.audio.length === 0 && videoInfo.formats.video.length === 0)) {
    const copyFullError = () => {
      const fullLog = {
        appState: 'Extraction Error',
        videoId: video.id,
        serverError: videoInfo,
        nativeSystemInfo: nativeInfo,
        browser: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      navigator.clipboard.writeText(JSON.stringify(fullLog, null, 2));
      alert("Error log copied to clipboard! Share it with the developer.");
    };

    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-[#121212] sm:rounded-xl border border-white/5 mx-4 sm:mx-0">
        <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-4">
          <Share2 className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-white font-bold text-lg mb-2 tracking-tight">Extraction Blocked</h3>
        <p className="text-sm text-[#aaa] mb-6 max-w-xs px-6">
          {videoInfo?.message?.includes('Sign in') 
            ? "This video is age-restricted or private. Native bypass required." 
            : "Streaming is blocked on this network logic. If in APK, try Native Extraction."}
        </p>

        {videoInfo?.message && (
          <div className="bg-black/50 p-4 rounded-xl mb-6 w-full max-w-sm text-left border border-white/10 font-mono text-[10px] text-red-400 overflow-auto max-h-32">
            LOG: {videoInfo.message}
          </div>
        )}

        <div className="flex flex-col gap-3 w-full max-w-[220px]">
          <button 
            onClick={fetchInfo}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
          >
            <Cpu className="w-5 h-5" /> Native Extraction
          </button>
          
          <button 
            onClick={copyFullError}
            className="bg-white/5 text-[#aaa] px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-all border border-dashed border-white/20 text-xs"
          >
            Copy Full Error Log
          </button>

          <button 
            onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
            className="bg-white/5 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10"
          >
            Watch on YouTube
          </button>
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
              className="flex items-center gap-2 bg-red-600 px-5 py-2 rounded-full hover:bg-red-700 shrink-0 font-bold text-sm shadow-lg active:scale-95 transition-all text-white animate-pulse-slow"
            >
              <Download className="w-5 h-5" /> <span>Extract</span>
            </button>

            <button className="flex items-center gap-2 bg-[#272727] px-5 py-2 rounded-full hover:bg-[#3f3f3f] shrink-0 font-medium text-sm transition-colors active:bg-white/10">
              <Share2 className="w-5 h-5" /> <span>Share</span>
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
