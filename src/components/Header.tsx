import { Search, Menu, Video, Bell, User, Mic } from 'lucide-react';
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
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f] flex items-center justify-between px-4 z-50">
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block">
          <Menu className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-1 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="w-8 h-6 bg-red-600 rounded-lg flex items-center justify-center">
             <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[7px] border-l-white border-b-[4px] border-b-transparent ml-0.5"></div>
          </div>
          <span className="text-white font-bold tracking-tighter text-xl">NewPipe</span>
        </div>
      </div>

      <div className="flex-1 max-w-[720px] hidden md:flex items-center gap-4 ml-10">
        <form onSubmit={handleSearch} className="flex flex-1 items-center">
          <div className="flex flex-1 items-center bg-[#121212] border border-[#303030] rounded-l-full px-4 py-1.5 focus-within:border-blue-500 ml-4 group">
            <Search className="w-5 h-5 text-[#888888] mr-2 hidden focus-within:block" />
            <input 
              type="text" 
              placeholder="Search" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-white w-full outline-none text-base placeholder-[#888888]"
            />
          </div>
          <button type="submit" className="bg-[#222222] border border-l-0 border-[#303030] rounded-r-full px-5 py-1.5 hover:bg-[#272727]">
            <Search className="w-5 h-5 text-white" />
          </button>
        </form>
        <button className="p-2.5 bg-[#181818] hover:bg-[#272727] rounded-full transition-colors">
          <Mic className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={() => {
            const q = prompt('Search NewPipe:');
            if (q) onSearch(q);
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden"
        >
            <Search className="w-6 h-6 text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block">
          <Video className="w-6 h-6 text-white" />
        </button>
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden md:block relative">
          <Bell className="w-6 h-6 text-white" />
          <span className="absolute top-1 right-1 bg-red-600 text-[10px] text-white px-1 rounded-full border-2 border-[#0f0f0f]">9+</span>
        </button>
        <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg">
            S
          </div>
        </button>
      </div>
    </header>
  );
}
