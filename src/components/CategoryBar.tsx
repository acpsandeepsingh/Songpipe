const categories = [
  "All", "Music", "Gaming", "Live", "Mixes", "Coding", "React", "TypeScript", 
  "Podcasts", "Design", "Nature", "News", "Sports", "Learning"
];

export default function CategoryBar() {
  return (
    <div className="sticky top-14 bg-[#0f0f0f] z-40 py-3 px-4 flex gap-3 overflow-x-auto custom-scrollbar no-scrollbar whitespace-nowrap">
      {categories.map((cat, i) => (
        <button 
          key={cat}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            i === 0 ? 'bg-white text-black' : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
