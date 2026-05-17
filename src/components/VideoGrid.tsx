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
        const timestamp = new Date().getTime();
        let endpoint = `/api/search?q=${encodeURIComponent(searchQuery || 'new music 2024')}&t=${timestamp}`;
        
        if (!searchQuery) {
          if (activeCategory === 'All' || activeCategory === 'Trending' || activeCategory === "Today's Top") {
            endpoint = `/api/trending?t=${timestamp}`;
          } else {
            endpoint = `/api/search?q=${encodeURIComponent(activeCategory + ' songs')}&t=${timestamp}`;
          }
        }

        let response;
        try {
          response = await fetch(endpoint);
        } catch (e) {
          console.warn("Network error, trying one more time...");
          response = await fetch(endpoint);
        }

        if (!response.ok) {
           throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.items && data.items.length > 0) {
          setVideos(data.items);
        } else {
          // If search yielded nothing, try a generic search instead of just showing empty
          if (searchQuery) {
             console.log("Search empty, trying generic music search...");
             const fallbackRes = await fetch(`/api/search?q=popular music ${searchQuery}`);
             const fallbackData = await fallbackRes.json();
             if (fallbackData.items?.length > 0) {
                setVideos(fallbackData.items);
                return;
             }
          }
          
          // ABSOLUTE EMERGENCY FALLBACK: Hardcoded popular videos
          setVideos([
            { id: 'kJQP7kiw5Fk', title: 'Luis Fonsi - Despacito ft. Daddy Yankee', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg', channelName: 'LuisFonsiVEVO', views: '8.4B views', uploadedAt: '7 years ago', duration: '4:42' },
            { id: 'pAgnJDJN4VA', title: 'Ed Sheeran - Shape of You [Official Video]', thumbnail: 'https://i.ytimg.com/vi/pAgnJDJN4VA/hqdefault.jpg', channelName: 'Ed Sheeran', views: '6.2B views', uploadedAt: '7 years ago', duration: '4:24' },
            { id: 'dQw4w9WgXcQ', title: 'Rick Astley - Never Gonna Give You Up', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', channelName: 'RickAstleyVEVO', views: '1.5B views', uploadedAt: '14 years ago', duration: '3:33' },
            { id: '9bZkp7q19f0', title: 'PSY - GANGNAM STYLE(강남스타일) M/V', thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg', channelName: 'Officialpsy', views: '5B views', uploadedAt: '11 years ago', duration: '4:12' }
          ]);
          console.warn("No items returned from search/trending, using fallback");
        }
      } catch (error) {
        console.error("Failed to fetch videos:", error);
        // Even on error, show the fallback so the user sees SOMETHING
        setVideos([
          { id: 'kJQP7kiw5Fk', title: 'Connection Error? Try these classics:', thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg', channelName: 'System', views: 'Check Connection', uploadedAt: 'Error', duration: '4:42' },
          { id: 'dQw4w9WgXcQ', title: 'Rick Astley (Fallback)', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', channelName: 'Official', views: '1.5B', uploadedAt: 'Error', duration: '3:33' }
        ]);
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

