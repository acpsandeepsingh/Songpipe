import { Home, Compass, PlaySquare, Clock, Music } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f]/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around h-14 z-[60] lg:hidden pb-safe px-2">
      <button className="flex flex-col items-center gap-1 text-red-600 transition-colors flex-1">
        <Home className="w-5 h-5 fill-red-600" />
        <span className="text-[10px] font-bold">Home</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-[#aaa] hover:text-white transition-colors flex-1">
        <Music className="w-5 h-5" />
        <span className="text-[10px] font-medium">Songs</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-[#aaa] hover:text-white transition-colors flex-1">
        <PlaySquare className="w-5 h-5" />
        <span className="text-[10px] font-medium">Library</span>
      </button>
      <button className="flex flex-col items-center gap-1 text-[#aaa] hover:text-white transition-colors flex-1">
        <Clock className="w-5 h-5" />
        <span className="text-[10px] font-medium">History</span>
      </button>
    </nav>
  );
}
