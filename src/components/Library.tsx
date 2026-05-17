import { useEffect, useState } from 'react';
import { History, Bookmark, Music2, ListMusic, PlayCircle } from 'lucide-react';

export default function Library({ onVideoSelect }: { onVideoSelect: (v: any) => void }) {
  const [history, setHistory] = useState<any[]>([]);
  const [topSongs, setTopSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load history
    const savedHistory = JSON.parse(localStorage.getItem('history') || '[]');
    setHistory(savedHistory);

    // Fetch Top 50
    async function fetchTop() {
      try {
        const res = await fetch('/api/search?q=top 50 songs today');
        const data = await res.json();
        setTopSongs(data.items?.slice(0, 50) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTop();
  }, []);

  return (
    <div className="flex flex-col p-4 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-24">
      <h1 className="text-2xl font-bold mb-6">Library</h1>
      
      <div className="grid grid-cols-2 gap-4 mb-10">
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
          <h2 className="font-bold text-lg">Watch History</h2>
          {history.length > 0 && (
            <button onClick={() => { localStorage.removeItem('history'); setHistory([]); }} className="text-red-500 text-sm font-bold active:scale-95 transition-transform">Clear all</button>
          )}
        </div>
        {history.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {history.map((video, i) => (
              <div 
                key={`${video.id}-${i}`} 
                className="flex flex-col gap-2 min-w-[160px] shrink-0 active:scale-95 transition-transform cursor-pointer group"
                onClick={() => onVideoSelect(video)}
              >
                <div className="aspect-video bg-[#272727] rounded-xl flex items-center justify-center relative shadow-xl overflow-hidden border border-white/5">
                   <img src={video.thumbnail} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                   <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-black backdrop-blur-sm border border-white/10">{video.duration}</div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-10 h-10 text-white fill-red-600/20" />
                   </div>
                </div>
                <h4 className="text-sm font-bold line-clamp-1 tracking-tight pr-2">{video.title}</h4>
                <p className="text-[11px] text-[#aaa] font-medium">{video.channelName}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-3">
             <History className="w-10 h-10 text-white/20" />
             <p className="text-sm text-[#888] font-medium max-w-[200px]">Songs you watch will appear here for quick access</p>
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Weekly Top 50</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">TRENDING</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
            ))
          ) : (
            topSongs.map((song, i) => (
              <button 
                key={`${song.id}-${i}`} 
                onClick={() => onVideoSelect(song)}
                className="flex items-center gap-4 w-full p-2.5 hover:bg-white/5 rounded-2xl transition-all text-left group active:bg-white/10"
              >
                <div className="relative w-16 h-16 bg-[#272727] rounded-xl overflow-hidden shrink-0 shadow-lg group-hover:shadow-red-600/10 transition-shadow">
                   <img src={song.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="w-7 h-7 text-white" />
                   </div>
                   <div className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-black px-1.5 rounded-sm shadow-md">#{i + 1}</div>
                </div>
                <div className="flex flex-col flex-1 min-w-0 pr-4">
                   <span className="font-bold text-sm truncate group-hover:text-red-400 transition-colors">{song.title}</span>
                   <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#aaa] truncate font-medium">{song.channelName}</span>
                      <span className="w-1 h-1 bg-[#444] rounded-full" />
                      <span className="text-[11px] text-[#aaa] font-medium">{song.views}</span>
                   </div>
                </div>
                <div className="text-xs font-black text-[#555] group-hover:text-red-500 transition-colors font-mono">
                   {song.duration}
                </div>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
