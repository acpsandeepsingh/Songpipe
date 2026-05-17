import { History, Bookmark, Music2, ListMusic, PlayCircle } from 'lucide-react';

export default function Library() {
  return (
    <div className="flex flex-col p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h1 className="text-2xl font-bold mb-6">Library</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'History', icon: History, color: 'text-blue-400' },
          { label: 'Downloads', icon: Bookmark, color: 'text-green-400' },
          { label: 'Likeds', icon: Music2, color: 'text-red-400' },
          { label: 'Playlists', icon: ListMusic, color: 'text-purple-400' },
        ].map((item, i) => (
          <button key={i} className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 active:scale-95 transition-all border border-white/5">
            <item.icon className={`w-8 h-8 ${item.color} mb-2`} />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Recently Played</h2>
          <button className="text-red-500 text-sm font-bold">See all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
           {[1, 2, 3, 4, 5].map(i => (
             <div key={i} className="flex flex-col gap-2 min-w-[140px] shrink-0 active:opacity-60 transition-opacity">
                <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl flex items-center justify-center relative group">
                   <PlayCircle className="w-8 h-8 text-white/20 group-hover:text-red-500 transition-colors" />
                   <img src={`https://picsum.photos/seed/lib${i}/200/200`} className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-40" alt="" />
                </div>
                <h4 className="text-sm font-bold truncate">Recent Song {i}</h4>
                <p className="text-[11px] text-[#aaa]">Artist Name</p>
             </div>
           ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Your Playlists</h2>
          <button className="text-red-500 text-sm font-bold">New</button>
        </div>
        <div className="space-y-3">
           {[
             { name: 'Road Trip Beats', count: 42 },
             { name: 'Lo-fi Study', count: 120 },
             { name: 'Workout Power', count: 18 },
           ].map((playlist, i) => (
             <button key={i} className="flex items-center gap-4 w-full p-2 hover:bg-white/5 rounded-xl transition-colors text-left group">
                <div className="w-14 h-14 bg-[#272727] rounded-lg flex items-center justify-center">
                   <ListMusic className="w-6 h-6 text-[#aaa] group-hover:text-red-500 transition-colors" />
                </div>
                <div className="flex flex-col">
                   <span className="font-bold text-sm">{playlist.name}</span>
                   <span className="text-[11px] text-[#aaa]">{playlist.count} tracks</span>
                </div>
             </button>
           ))}
        </div>
      </section>
    </div>
  );
}
