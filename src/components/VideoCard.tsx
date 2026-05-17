interface VideoCardProps {
  key?: any;
  video: {
    id: string | number;
    title: string;
    thumbnail: string;
    channelName: string;
    channelAvatar: string;
    views: string;
    uploadedAt: string;
    duration: string;
  };
  onClick?: () => void;
}

export default function VideoCard({ video, onClick }: VideoCardProps) {
  const thumbnail = video.thumbnail || `https://picsum.photos/seed/${video.id}/640/360`;
  const channelAvatar = video.channelAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(video.channelName || 'YT')}`;

  return (
    <div 
      className="flex flex-row sm:flex-col gap-3 group cursor-pointer active:bg-white/5 transition-colors px-3 py-2 sm:px-0 sm:py-0"
      onClick={onClick}
    >
      <div className="relative w-[140px] h-[80px] sm:w-full sm:aspect-video overflow-hidden bg-[#272727] rounded-lg sm:rounded-xl shrink-0">
        <img 
          src={thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://picsum.photos/seed/error/640/360';
          }}
        />
        <div className="absolute bottom-1 right-1 bg-black/90 px-1 py-0.5 rounded text-[9px] sm:text-[11px] font-black text-white">
          {video.duration || '0:00'}
        </div>
      </div>
      
      <div className="flex gap-3 flex-1 min-w-0">
        <div className="shrink-0 mt-0.5 hidden sm:block">
          <img 
            src={channelAvatar} 
            alt={video.channelName}
            className="w-9 h-9 rounded-full object-cover border border-white/5 bg-[#222]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="text-white font-bold leading-snug line-clamp-2 text-sm sm:text-[15px] tracking-tight group-hover:text-red-500 transition-colors">
            {video.title || 'Untitled Video'}
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center text-[#aaaaaa] text-xs sm:text-[13px] sm:gap-1 mt-0.5 opacity-80">
            <span className="truncate max-w-[120px] font-medium">{video.channelName || 'Unknown Channel'}</span>
            <span className="hidden sm:inline">·</span>
            <div className="flex items-center gap-1">
              <span>{video.views || '0 views'}</span>
              <span>·</span>
              <span>{video.uploadedAt || 'Recently'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
