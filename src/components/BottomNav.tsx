import { Home, Compass, PlusCircle, PlaySquare, Library } from 'lucide-react';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-12 bg-[#0f0f0f] border-t border-white/10 flex items-center justify-around z-50 lg:hidden">
      <button className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-white">
        <Home className="w-6 h-6" />
        <span className="text-[10px]">Home</span>
      </button>
      <button className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[#aaa] hover:text-white transition-colors">
        <Compass className="w-6 h-6" />
        <span className="text-[10px]">Shorts</span>
      </button>
      <button className="flex items-center justify-center flex-1 py-1">
        <PlusCircle className="w-9 h-9 text-white" strokeWidth={1.5} />
      </button>
      <button className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[#aaa] hover:text-white transition-colors">
        <PlaySquare className="w-6 h-6" />
        <span className="text-[10px]">Subscriptions</span>
      </button>
      <button className="flex flex-col items-center justify-center gap-1 flex-1 py-1 text-[#aaa] hover:text-white transition-colors">
        <Library className="w-6 h-6" />
        <span className="text-[10px]">You</span>
      </button>
    </nav>
  );
}
