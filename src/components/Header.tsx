import { Search, Menu, Video, Bell, User, Mic, Music } from 'lucide-react';
import React, { useState } from 'react';

export default function Header({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f]/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-4 z-50 border-b border-white/5">
      <div className="flex items-center gap-1 sm:gap-4 shrink-0">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors lg:hidden">
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => window.location.reload()}>
          <Music className="w-8 h-8 text-red-600 fill-red-600" />
          <span className="text-white font-bold tracking-tighter text-xl hidden sm:block">Songpipe</span>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex-1 max-w-[600px] mx-2 sm:mx-8">
        <div className="flex items-center bg-[#121212] border border-white/10 rounded-full px-4 py-1.5 focus-within:border-red-600/50 transition-colors">
          <input 
            type="text" 
            placeholder="Search songs or artists..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-white w-full outline-none text-sm sm:text-base placeholder-[#888888]"
          />
          <button type="submit" className="p-1">
             <Search className="w-5 h-5 text-[#888888]" />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-1 shrink-0">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
          <Bell className="w-6 h-6 text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
          <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
            S
          </div>
        </button>
      </div>
    </header>
  );
}
