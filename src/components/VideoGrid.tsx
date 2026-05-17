import { useEffect, useState } from 'react';
import VideoCard from './VideoCard';
import CategoryBar from './CategoryBar';

export default function VideoGrid({ onVideoSelect, searchQuery }: { onVideoSelect: (video: any) => void, searchQuery: string }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery || 'popular videos')}`);
        const data = await response.json();
        const formatted = (data.items || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          channelName: item.channelName || 'Unknown',
          channelAvatar: item.channelAvatar,
          views: item.views,
          uploadedAt: item.uploadedAt,
          duration: item.duration
        }));
        setVideos(formatted);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex flex-col">
        <CategoryBar />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2 sm:gap-y-10 pt-2 pb-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse px-3 sm:px-0 mb-4 sm:mb-0">
              <div className="aspect-video bg-[#272727] sm:rounded-xl" />
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#272727]" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-[#272727] rounded w-full" />
                  <div className="h-4 bg-[#272727] rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <CategoryBar />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-0 sm:gap-y-8 pt-2 pb-10">
        {videos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onClick={() => onVideoSelect(video)} 
          />
        ))}
      </div>
    </div>
  );
}

