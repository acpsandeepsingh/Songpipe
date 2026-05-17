import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import ExtractionDialog from './ExtractionDialog';

export default function VideoPlayer({ video }: { video: any }) {
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExtractionOpen, setIsExtractionOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  useEffect(() => {
    async function fetchInfo() {
      try {
        setLoading(true);
        const response = await fetch(`/api/video-info?id=${video.id}`);
        const data = await response.json();
        setVideoInfo(data);
      } catch (error) {
        console.error("Failed to fetch video info:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchInfo();
  }, [video.id]);

  if (loading) {
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

  if (!videoInfo || videoInfo.error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-center p-8 bg-[#121212] sm:rounded-xl border border-white/5 mx-4 sm:mx-0">
        <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mb-4">
          <Share2 className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-white font-bold mb-2">Extraction Restricted</p>
        <p className="text-sm text-[#aaa] mb-6 max-w-xs">
          {videoInfo?.isBotError 
            ? "YouTube detected automated access. Please wait or try another video." 
            : "This video has content restrictions that prevent direct extraction."}
        </p>
        <button 
          onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
          className="bg-white text-black px-8 py-2.5 rounded-full font-bold hover:bg-white/90 transition-colors"
        >
          Watch on YouTube
        </button>
      </div>
    );
  }

  const bestVideo = videoInfo?.formats?.video?.[0]?.url;

  return (
    <div className="flex-1 select-none">
      <div className="aspect-video w-full bg-black sm:rounded-xl overflow-hidden shadow-2xl relative group">
        {bestVideo ? (
          <video 
            src={bestVideo} 
            controls 
            autoPlay 
            playsInline
            className="w-full h-full"
            poster={video.thumbnail}
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
              <img src={video.channelAvatar} className="w-10 h-10 rounded-full border border-white/5" alt="" />
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight">{videoInfo.author.name}</span>
                <span className="text-[11px] text-[#aaa] font-medium leading-none">{video.views}</span>
              </div>
            </div>
            <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition-colors active:scale-95">
              Subscribe
            </button>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center bg-[#272727] rounded-full overflow-hidden shrink-0">
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#3f3f3f] border-r border-white/5 transition-colors active:bg-white/10">
                <ThumbsUp className="w-5 h-5" /> <span className="font-bold text-sm">{video.views}</span>
              </button>
              <button className="px-4 py-2 hover:bg-[#3f3f3f] transition-colors active:bg-white/10">
                <ThumbsDown className="w-5 h-5" />
              </button>
            </div>
            
            <button 
              onClick={() => setIsExtractionOpen(true)}
              className="flex items-center gap-2 bg-red-600 px-5 py-2 rounded-full hover:bg-red-700 shrink-0 font-bold text-sm shadow-lg active:scale-95 transition-all text-white"
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
