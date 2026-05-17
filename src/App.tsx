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
import Library from './components/Library';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedVideo(null);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedVideo(null);
    window.scrollTo({ top: 0 });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <VideoGrid onVideoSelect={setSelectedVideo} searchQuery={searchQuery} />;
      case 'library':
        return <Library />;
      default:
        return <VideoGrid onVideoSelect={setSelectedVideo} searchQuery={searchQuery} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white selection:bg-red-500/30 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!selectedVideo && (
          <motion.div
            key="home-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Header onSearch={handleSearch} />
            <div className="flex pt-14">
              <Sidebar />
              <main className="flex-1 lg:ml-60 px-0 sm:px-4 pb-14 lg:pb-0">
                {renderContent()}
              </main>
            </div>
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.div>
        )}

        {selectedVideo && (
          <motion.div
            key="player-screen"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#0f0f0f] overflow-y-auto no-scrollbar pb-safe"
          >
            <div className="sticky top-0 bg-[#0f0f0f]/90 backdrop-blur-md z-50 flex items-center h-14 px-4 border-b border-white/5">
              <button 
                onClick={handleBack}
                className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="ml-2 font-bold truncate pr-4 text-sm">
                Playing now
              </div>
            </div>

            <div className="max-w-[1280px] mx-auto px-0 sm:px-4">
              <div className="flex flex-col lg:flex-row gap-6 pt-0 sm:pt-4">
                <VideoPlayer video={selectedVideo} />
                
                <div className="lg:w-[400px] flex flex-col gap-4 px-4 lg:px-0 pb-20">
                  <h3 className="font-bold text-lg mt-4 lg:mt-0">Recommended</h3>
                  <div className="flex flex-col gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div key={i} className="flex gap-3 cursor-pointer group active:bg-white/5 p-1 rounded-lg">
                        <div className="w-36 h-20 bg-[#272727] rounded-lg overflow-hidden shrink-0 relative">
                          <img src={`https://picsum.photos/seed/${i + 40}/320/180`} className="w-full h-full object-cover" alt="" />
                          <div className="absolute bottom-1 right-1 bg-black/80 px-1 rounded text-[10px] font-bold">12:35</div>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-2 leading-tight tracking-tight">Great recommendation for you video number {i}</h4>
                          <span className="text-[12px] text-[#aaa]">Channel Name</span>
                          <div className="text-[11px] text-[#aaa]">1.2M views • 2y ago</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

