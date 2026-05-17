import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Share2, Download, MoreHorizontal } from 'lucide-react';

export default function VideoPlayer({ video }: { video: any }) {
  const [videoInfo, setVideoInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="aspect-video bg-[#272727] rounded-xl" />
        <div className="h-8 bg-[#272727] rounded w-3/4" />
        <div className="flex justify-between">
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full bg-[#272727]" />
             <div className="flex flex-col gap-2">
                <div className="h-4 bg-[#272727] rounded w-24" />
                <div className="h-4 bg-[#272727] rounded w-16" />
             </div>
          </div>
          <div className="flex gap-2">
             <div className="w-20 h-10 bg-[#272727] rounded-full" />
             <div className="w-20 h-10 bg-[#272727] rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!videoInfo || videoInfo.error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-[#121212] rounded-xl border border-white/5">
        <p className="text-red-500 font-bold mb-4">
          {videoInfo?.isBotError 
            ? "YouTube is blocking our automated data extraction (Bot Detection). Try again later or search for another video." 
            : "Failed to load video details. Direct streaming might be restricted."}
        </p>
        <button 
          onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
          className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-red-500 hover:text-white transition-colors"
        >
          Watch on YouTube
        </button>
      </div>
    );
  }

  // Find a suitable stream
  const videoStream = videoInfo?.formats?.video?.[0]?.url;
  const audioStream = videoInfo?.formats?.audio?.[0]?.url;

  return (
    <div className="flex-1">
      <div className="aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl relative">
        {videoStream ? (
          <video 
            src={videoStream} 
            controls 
            autoPlay 
            className="w-full h-full"
            poster={video.thumbnail}
          >
             Your browser does not support the video tag.
          </video>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
             <p className="text-red-500 font-bold mb-4">Direct stream extraction might be restricted by YouTube.</p>
             <button className="bg-white text-black px-6 py-2 rounded-full font-bold">Open in New Window</button>
          </div>
        )}
      </div>
      
      <div className="mt-4 space-y-4">
        <h1 className="text-xl font-bold leading-tight">{videoInfo.title}</h1>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={video.channelAvatar} className="w-10 h-10 rounded-full" alt="" />
            <div className="flex flex-col">
              <span className="font-bold">{videoInfo.author.name}</span>
              <span className="text-sm text-[#aaa]">{videoInfo.author.subscriber_count || '1.2M'} subscribers</span>
            </div>
            <button className="ml-4 bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-[#e5e5e5] transition-colors">
              Subscribe
            </button>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <div className="flex items-center bg-[#272727] rounded-full overflow-hidden shrink-0">
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#3f3f3f] border-r border-white/10">
                <ThumbsUp className="w-5 h-5" /> <span>{video.views}</span>
              </button>
              <button className="px-4 py-2 hover:bg-[#3f3f3f]">
                <ThumbsDown className="w-5 h-5" />
              </button>
            </div>
            <button className="flex items-center gap-2 bg-[#272727] px-4 py-2 rounded-full hover:bg-[#3f3f3f] shrink-0">
              <Share2 className="w-5 h-5" /> <span>Share</span>
            </button>
            <button className="flex items-center gap-2 bg-[#272727] px-4 py-2 rounded-full hover:bg-[#3f3f3f] shrink-0">
              <Download className="w-5 h-5" /> <span>Download</span>
            </button>
            <button className="p-2 bg-[#272727] rounded-full hover:bg-[#3f3f3f] shrink-0">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-[#272727] p-3 rounded-xl hover:bg-[#3f3f3f] cursor-pointer transition-colors group">
          <div className="flex gap-2 font-bold text-sm">
            <span>{video.views} views</span>
            <span>{video.uploadedAt}</span>
          </div>
          <p className="text-sm mt-1 line-clamp-3 whitespace-pre-wrap">
             {videoInfo.description}
          </p>
          <span className="text-sm font-bold mt-2 block">show less</span>
        </div>
      </div>
    </div>
  );
}
