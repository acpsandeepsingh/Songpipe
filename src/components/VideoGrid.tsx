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
        const formatted = (data.items || []).filter((item: any) => item.type === 'video').map((item: any) => ({
          id: item.id,
          title: item.title,
          thumbnail: item.bestThumbnail.url,
          channelName: item.author?.name || 'Unknown',
          channelAvatar: item.author?.bestAvatar?.url || `https://i.pravatar.cc/150?u=${item.author?.name}`,
          views: item.views?.toString() || '0',
          uploadedAt: item.uploadedAt || 'Recently',
          duration: item.duration || '0:00'
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 pt-2 pb-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse">
              <div className="aspect-video bg-[#272727] rounded-xl" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-[#272727]" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10 pt-2 pb-10">
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

