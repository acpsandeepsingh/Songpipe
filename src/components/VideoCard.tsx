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
  const channelAvatar = video.channelAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${video.channelName || 'YT'}`;

  return (
    <div 
      className="flex flex-col gap-2 group cursor-pointer active:bg-white/5 transition-colors"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-[#272727] sm:rounded-xl">
        <img 
          src={thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://picsum.photos/seed/error/640/360';
          }}
        />
        <div className="absolute bottom-2 right-2 bg-black/90 px-1.5 py-0.5 rounded text-[11px] font-bold text-white">
          {video.duration || '0:00'}
        </div>
      </div>
      
      <div className="flex gap-3 px-3 pb-4 sm:px-0">
        <div className="shrink-0 mt-1">
          <img 
            src={channelAvatar} 
            alt={video.channelName}
            className="w-10 h-10 rounded-full object-cover border border-white/5 bg-[#222]"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
          <h3 className="text-white font-medium leading-tight line-clamp-2 text-[15px] tracking-tight">
            {video.title || 'Untitled Video'}
          </h3>
          <div className="flex items-center text-[#aaaaaa] text-[13px] gap-1 overflow-hidden whitespace-nowrap">
            <span className="truncate">{video.channelName || 'Unknown Channel'}</span>
            <span className="shrink-0">·</span>
            <span className="shrink-0">{video.views || '0 views'}</span>
            <span className="shrink-0">·</span>
            <span className="shrink-0">{video.uploadedAt || 'Recently'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
