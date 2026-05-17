import { useEffect, useState } from 'react';
import VideoCard from './VideoCard';
import CategoryBar from './CategoryBar';

export default function VideoGrid({ onVideoSelect, searchQuery }: { onVideoSelect: (video: any) => void, searchQuery: string }) {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      try {
        let endpoint = `/api/search?q=${encodeURIComponent(searchQuery || 'new music 2024')}`;
        
        // Handle categories and trending
        if (!searchQuery) {
          if (activeCategory === 'All' || activeCategory === 'Trending' || activeCategory === "Today's Top") {
            endpoint = '/api/trending';
          } else {
            endpoint = `/api/search?q=${encodeURIComponent(activeCategory + ' songs')}`;
          }
        }

        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.items) {
          setVideos(data.items);
        } else {
          setVideos([]);
        }
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [searchQuery, activeCategory]);

  const GridContent = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-1 sm:gap-y-10 pt-2 pb-24">
      {videos.map((video) => (
        <VideoCard 
          key={video.id} 
          video={video} 
          onClick={() => onVideoSelect(video)} 
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <CategoryBar 
        activeCategory={activeCategory} 
        onCategorySelect={(cat) => setActiveCategory(cat)} 
      />
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2 sm:gap-y-10 pt-2 pb-10 px-3 sm:px-0">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3 animate-pulse mb-6">
              <div className="aspect-video bg-[#272727] sm:rounded-xl shadow-lg" />
              <div className="flex gap-3 px-2 sm:px-0">
                <div className="w-10 h-10 rounded-full bg-[#272727] shrink-0" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 bg-[#272727] rounded w-full" />
                  <div className="h-3 bg-[#272727] rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <GridContent />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
             <span className="text-3xl">🔍</span>
          </div>
          <h3 className="text-xl font-bold mb-2">No videos found</h3>
          <p className="text-[#aaa] max-w-xs">Try searching for something else or check your internet connection.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-white text-black rounded-full font-bold active:scale-95 transition-transform"
          >
            Refresh Page
          </button>
        </div>
      )}
    </div>
  );
}

