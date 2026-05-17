import { Home, Compass, PlaySquare, Clock, ThumbsUp, ChevronRight, History, Library, Settings, Flag, HelpCircle, MessageSquare } from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Compass, label: 'Shorts' },
  { icon: PlaySquare, label: 'Subscriptions' },
];

const libraryItems = [
  { icon: Library, label: 'Library' },
  { icon: History, label: 'History' },
  { icon: PlaySquare, label: 'Your videos' },
  { icon: Clock, label: 'Watch later' },
  { icon: ThumbsUp, label: 'Liked videos' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-60 bg-[#0f0f0f] hidden lg:block overflow-y-auto custom-scrollbar px-3 overflow-x-hidden pt-2">
      <div className="space-y-1 pb-4 border-b border-white/10">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-5 px-3 py-2 rounded-xl transition-colors hover:bg-white/10 ${
              item.active ? 'bg-white/10 font-medium' : ''
            }`}
          >
            <item.icon className="w-6 h-6 text-white" />
            <span className="text-white text-sm">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="pt-4 pb-4 border-b border-white/10">
        <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 group">
          <span className="text-white font-medium text-base">You</span>
          <ChevronRight className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <div className="space-y-1 mt-1">
          {libraryItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-5 px-3 py-2 rounded-xl transition-colors hover:bg-white/10"
            >
              <item.icon className="w-6 h-6 text-white" />
              <span className="text-white text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <div className="px-3 mb-2">
          <span className="text-white font-medium text-base">Explore</span>
        </div>
        <div className="space-y-1">
          <button className="w-full flex items-center gap-5 px-3 py-2 rounded-xl transition-colors hover:bg-white/10">
             <Compass className="w-6 h-6 text-white" />
             <span className="text-white text-sm">Trending</span>
          </button>
          {/* More explore items could go here */}
        </div>
      </div>

      <div className="pt-4 mt-auto opacity-60 text-[12px] px-3 font-medium text-[#aaa] space-y-4">
        <div className="flex flex-wrap gap-x-2">
          <span>About</span><span>Press</span><span>Copyright</span>
          <span>Contact us</span><span>Creators</span>
          <span>Advertise</span><span>Developers</span>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <span>Terms</span><span>Privacy</span><span>Policy & Safety</span>
          <span>How YouTube works</span>
          <span>Test new features</span>
        </div>
        <div className="pb-8">
           © 2024 Google LLC
        </div>
      </div>
    </aside>
  );
}
