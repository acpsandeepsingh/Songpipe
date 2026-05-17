const categories = [
  "All", "Music", "Trending", "Today's Top", "Pop", "Gaming", "Live", "Mixes", "Chill", "New"
];

export default function CategoryBar({ 
  activeCategory, 
  onCategorySelect 
}: { 
  activeCategory: string, 
  onCategorySelect: (cat: string) => void 
}) {
  return (
    <div className="sticky top-14 bg-[#0f0f0f] z-40 py-3 px-4 flex gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
      {categories.map((cat) => (
        <button 
          key={cat}
          onClick={() => onCategorySelect(cat)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
            activeCategory === cat ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
