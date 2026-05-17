import { Search, Menu, Video, Bell, User, Mic, Music, ArrowLeft, X, Terminal } from 'lucide-react';
import React, { useState } from 'react';
import { logger } from '../lib/logger';

export default function Header({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsMobileSearchOpen(false);
    }
  };

  const copySessionLog = () => {
    const text = logger.getFullLog();
    navigator.clipboard.writeText(text).then(() => {
      alert("System Logs copied!");
    });
  };

  if (isMobileSearchOpen) {
    return (
      <header className="fixed top-0 left-0 right-0 h-14 bg-red-600 flex items-center px-2 z-[110] shadow-lg animate-in fade-in duration-200">
        <button 
          onClick={() => setIsMobileSearchOpen(false)}
          className="p-2 hover:bg-black/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <form onSubmit={handleSearch} className="flex-1 px-1">
          <input 
            type="text" 
            autoFocus
            placeholder="Search..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-white w-full outline-none text-base placeholder-white/60 py-2 font-bold"
          />
        </form>
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="p-2 hover:bg-black/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        )}
        <button 
          onClick={() => handleSearch()}
          className="p-2 hover:bg-black/10 rounded-full transition-colors"
        >
          <Search className="w-6 h-6 text-white" />
        </button>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#e62117] flex items-center justify-between px-3 sm:px-4 z-50 shadow-xl pt-safe border-b border-black/10">
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <button 
          onClick={copySessionLog}
          className="p-2 hover:bg-black/10 rounded-full transition-colors"
          title="Copy System Logs"
        >
          <Terminal className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform" onClick={() => window.location.reload()}>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
             <Music className="w-6 h-6 text-[#e62117] fill-[#e62117]" />
          </div>
          <span className="text-white font-black tracking-tighter text-xl md:text-2xl uppercase italic drop-shadow-sm">Pipe</span>
        </div>
      </div>

      <div className="flex-1 max-w-[600px] flex justify-end md:justify-center px-2">
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 items-center bg-white/10 rounded px-4 py-1.5 focus-within:bg-white/20 transition-all group">
          <input 
            type="text" 
            placeholder="Search YouTube..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-white w-full outline-none text-sm placeholder-white/50 font-bold"
          />
          <button type="submit" className="p-1 text-white/70 hover:text-white transition-colors">
             <Search className="w-5 h-5" />
          </button>
        </form>
        
        <button 
          onClick={() => setIsMobileSearchOpen(true)}
          className="md:hidden p-2.5 hover:bg-black/10 rounded-full transition-colors"
        >
          <Search className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button className="p-2.5 hover:bg-black/10 rounded-full transition-colors hidden sm:block">
          <Bell className="w-6 h-6 text-white" />
        </button>
        <button className="p-1 hover:bg-black/10 rounded-full transition-all active:scale-95">
          <div className="w-8 h-8 bg-white text-red-600 rounded-full flex items-center justify-center text-[10px] font-black shadow-lg uppercase">
            NP
          </div>
        </button>
      </div>
    </header>
  );
}
