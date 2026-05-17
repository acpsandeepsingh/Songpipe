interface VideoCardProps {
  key?: any;
  video: {
    id: number;
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
  return (
    <div 
      className="flex flex-col gap-3 group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-[#272727]">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[12px] font-medium text-white">
          {video.duration}
        </div>
      </div>
      
      <div className="flex gap-3 pr-4">
        <div className="shrink-0">
          <img 
            src={video.channelAvatar} 
            alt={video.channelName}
            className="w-9 h-9 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-white font-medium leading-tight line-clamp-2 text-[16px]">
            {video.title}
          </h3>
          <div className="flex flex-col text-[#aaaaaa] text-[14px]">
            <span className="hover:text-white transition-colors">{video.channelName}</span>
            <div className="flex items-center after:content-['•'] after:mx-1 after:text-[10px]">
              <span>{video.views} views</span>
              <span className="ml-1">{video.uploadedAt}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
