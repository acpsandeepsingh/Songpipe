import { Music, Video, Download, X } from 'lucide-react';

interface ExtractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoInfo: any;
}

export default function ExtractionDialog({ isOpen, onClose, videoInfo }: ExtractionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-[#212121] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-white/5 animate-in slide-in-from-bottom duration-300">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-lg">Extract Media</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="flex gap-4">
             <img 
               src={videoInfo.thumbnails?.[0]?.url} 
               className="w-24 h-16 object-cover rounded-lg shadow-lg"
               alt=""
             />
             <div className="flex-1 min-w-0">
               <h3 className="font-bold text-sm line-clamp-2 leading-tight">{videoInfo.title}</h3>
               <p className="text-xs text-[#aaa] mt-1">{videoInfo.author?.name}</p>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-3 text-[#aaa]">
                <Music className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Audio Tracks</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {videoInfo.formats.audio.length > 0 ? (
                  videoInfo.formats.audio.slice(0, 4).map((f: any, i: number) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      download
                      className="flex items-center justify-between p-3 bg-white/5 hover:bg-red-600/20 active:bg-red-600 rounded-xl border border-white/5 transition-all group"
                      onClick={(e) => {
                         // In a real APK with capacitor, we could use a custom download plugin
                         // For web, this opens the direct stream
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{f.quality}</span>
                        <span className="text-[10px] text-[#aaa] group-hover:text-red-200 uppercase">{f.container.split('/')[1] || 'm4a'}</span>
                      </div>
                      <Download className="w-5 h-5 text-red-500 group-hover:text-white" />
                    </a>
                  ))
                ) : (
                   <p className="text-xs text-[#666]">No direct audio streams available</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3 text-[#aaa]">
                <Video className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Video Tracks</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {videoInfo.formats.video.length > 0 ? (
                  videoInfo.formats.video.slice(0, 4).map((f: any, i: number) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{f.qualityLabel}</span>
                        <span className="text-[10px] text-[#aaa] uppercase">{f.container.split('/')[1] || 'mp4'}</span>
                      </div>
                      <Download className="w-5 h-5 text-white/40 group-hover:text-white" />
                    </a>
                  ))
                ) : (
                   <p className="text-xs text-[#666]">No direct video streams available</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-[#1a1a1a] text-[10px] text-[#666] italic text-center">
          Downloads might open in a new tab if high-bitrate direct extraction is throttled.
        </div>
      </div>
    </div>
  );
}
