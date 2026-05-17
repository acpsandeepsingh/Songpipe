import { Home, PlaySquare, Clock, Music } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around h-14 z-[60] lg:hidden pb-safe px-2">
      <button 
        onClick={() => onTabChange('home')}
        className={`flex flex-col items-center gap-1 transition-colors flex-1 ${activeTab === 'home' ? 'text-red-500' : 'text-[#aaa]'}`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'fill-red-500' : ''}`} />
        <span className="text-[10px] font-bold">Home</span>
      </button>
      <button 
        onClick={() => onTabChange('songs')}
        className={`flex flex-col items-center gap-1 transition-colors flex-1 ${activeTab === 'songs' ? 'text-red-500' : 'text-[#aaa]'}`}
      >
        <Music className={`w-5 h-5 ${activeTab === 'songs' ? 'fill-red-500' : ''}`} />
        <span className="text-[10px] font-medium">Songs</span>
      </button>
      <button 
        onClick={() => onTabChange('library')}
        className={`flex flex-col items-center gap-1 transition-colors flex-1 ${activeTab === 'library' ? 'text-red-500' : 'text-[#aaa]'}`}
      >
        <PlaySquare className={`w-5 h-5 ${activeTab === 'library' ? 'fill-red-500' : ''}`} />
        <span className="text-[10px] font-medium">Library</span>
      </button>
      <button 
        onClick={() => onTabChange('history')}
        className={`flex flex-col items-center gap-1 transition-colors flex-1 ${activeTab === 'history' ? 'text-red-500' : 'text-[#aaa]'}`}
      >
        <Clock className={`w-5 h-5 ${activeTab === 'history' ? 'fill-red-500' : ''}`} />
        <span className="text-[10px] font-medium">History</span>
      </button>
    </nav>
  );
}
