import { Search, Menu, Video, Bell, User, Mic, Music, ArrowLeft, X } from 'lucide-react';
import React, { useState } from 'react';

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

  if (isMobileSearchOpen) {
    return (
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f] flex items-center px-2 z-[110] border-b border-white/10 animate-in fade-in duration-200">
        <button 
          onClick={() => setIsMobileSearchOpen(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <form onSubmit={handleSearch} className="flex-1 px-1">
          <input 
            type="text" 
            autoFocus
            placeholder="Search Songpipe..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-white w-full outline-none text-base placeholder-[#888888] py-2"
          />
        </form>
        {query && (
          <button 
            onClick={() => setQuery('')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#aaa]" />
          </button>
        )}
        <button 
          onClick={() => handleSearch()}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <Search className="w-6 h-6 text-white" />
        </button>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f]/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 z-50 border-b border-white/5 pt-safe">
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors lg:hidden">
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity" onClick={() => window.location.reload()}>
          <div className="w-8 h-8 md:w-9 md:h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/20">
             <Music className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-white font-bold tracking-tighter text-lg md:text-xl ml-1 hidden xs:block">Songpipe</span>
        </div>
      </div>

      <div className="flex-1 max-w-[600px] flex justify-end md:justify-center px-2">
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 items-center bg-[#121212] border border-white/10 rounded-full px-4 py-1.5 focus-within:border-red-600/50 transition-colors group">
          <input 
            type="text" 
            placeholder="Search songs or artists..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-white w-full outline-none text-sm sm:text-base placeholder-[#888888]"
          />
          <button type="submit" className="p-1 hover:text-white group-focus-within:text-red-500 transition-colors">
             <Search className="w-5 h-5" />
          </button>
        </form>
        
        <button 
          onClick={() => setIsMobileSearchOpen(true)}
          className="md:hidden p-2.5 hover:bg-white/10 rounded-full transition-colors"
        >
          <Search className="w-6 h-6 text-white" />
        </button>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button className="p-2.5 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
          <Bell className="w-6 h-6 text-white" />
        </button>
        <button className="p-1 hover:bg-white/10 rounded-full transition-all active:scale-95">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">
            APK
          </div>
        </button>
      </div>
    </header>
  );
}
