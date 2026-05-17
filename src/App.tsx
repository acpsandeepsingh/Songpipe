/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import VideoGrid from './components/VideoGrid';
import BottomNav from './components/BottomNav';
import VideoPlayer from './components/VideoPlayer';
import { ArrowLeft } from 'lucide-react';

export default function App() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedVideo(null); // Return to grid on search
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white selection:bg-red-500/30">
      <Header onSearch={handleSearch} />
      <div className="flex pt-14">
        {!selectedVideo && <Sidebar />}
        
        <main className={`flex-1 transition-all duration-300 ${!selectedVideo ? 'lg:ml-60' : 'max-w-[1280px] mx-auto'} px-4 pb-14 lg:pb-0`}>
          {selectedVideo ? (
            <div className="flex flex-col lg:flex-row gap-6 pt-6">
              <VideoPlayer video={selectedVideo} />
              
              <div className="lg:w-[400px] flex flex-col gap-4">
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="flex items-center gap-2 text-sm font-medium hover:text-red-500 transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Home
                </button>
                <div className="flex flex-col gap-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="flex gap-2 cursor-pointer group">
                      <div className="w-40 h-24 bg-[#272727] rounded-lg overflow-hidden shrink-0">
                        <img src={`https://picsum.photos/seed/${i + 40}/320/180`} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="text-sm font-bold line-clamp-2 group-hover:text-blue-400 transition-colors tracking-tight leading-tight">Up Next: Great Video Recommended For You {i}</h4>
                        <span className="text-xs text-[#aaa]">Channel Name</span>
                        <div className="text-xs text-[#aaa]">1.2M views • 2 years ago</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <VideoGrid onVideoSelect={setSelectedVideo} searchQuery={searchQuery} />
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

