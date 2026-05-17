import { Music, Video, Download, X, MoreHorizontal, Link, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExtractionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  videoInfo: any;
}

export default function ExtractionDialog({ isOpen, onClose, videoInfo }: ExtractionDialogProps) {
  if (!isOpen) return null;

  const audioFormats = (videoInfo?.formats?.audio || []).sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
  const videoFormats = (videoInfo?.formats?.video || []).sort((a: any, b: any) => (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple notification
    const btn = document.activeElement;
    if (btn) btn.innerHTML = "COPIED!";
    setTimeout(() => { if (btn) btn.innerHTML = "COPY LINK"; }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-opacity">
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="w-full max-w-md bg-[#121212] rounded-t-[40px] sm:rounded-[32px] shadow-2xl overflow-hidden border border-white/5"
        >
          <div className="p-1 w-full flex justify-center mt-2 sm:hidden">
             <div className="w-12 h-1.5 bg-white/10 rounded-full" />
          </div>

          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-extrabold text-xl tracking-tight flex items-center gap-2">
              <Download className="w-5 h-5 text-red-500" /> SONG EXTRACTOR
            </h2>
            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-90">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar pb-10">
            <div className="flex gap-5 items-center bg-white/5 p-4 rounded-[28px] border border-white/5">
               <div className="relative w-20 h-20 shrink-0">
                 <img 
                   src={videoInfo.thumbnails?.[0]?.url} 
                   className="w-full h-full object-cover rounded-2xl shadow-xl border border-white/10"
                   alt=""
                 />
                 <div className="absolute -bottom-1 -right-1 bg-red-600 rounded-full p-1.5 shadow-lg">
                    <Music className="w-3 h-3 text-white" />
                 </div>
               </div>
               <div className="flex flex-col min-w-0">
                 <h3 className="font-black text-sm line-clamp-2 leading-[1.3] text-white/90">{videoInfo.title}</h3>
                 <p className="text-xs text-[#aaa] mt-1.5 font-bold uppercase tracking-wider">{videoInfo.author?.name}</p>
               </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2 text-[#aaa]">
                    <Music className="w-4 h-4 text-red-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Audio Streams</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {audioFormats.map((f: any, i: number) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between p-4 bg-[#1a1a1a] hover:bg-[#252525] rounded-[24px] border border-white/5 transition-all"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-white">{f.quality}</span>
                        <span className="text-[10px] text-[#555] font-black uppercase tracking-tighter">
                          {f.container?.split(';')?.[0]?.split('/')?.[1] || 'm4a'} • {Math.round((f.bitrate || 0) / 1000)}kbps
                        </span>
                      </div>
                      <div className="flex gap-2">
                         <a 
                           href={f.proxyUrl || f.url} 
                           target="_blank"
                           className="bg-white text-black px-5 py-2.5 rounded-full text-[10px] font-black shadow-lg shadow-white/5 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                         >
                            <Play className="w-3 h-3 fill-black" /> OPEN
                         </a>
                         <button 
                           onClick={() => copyToClipboard(f.url)}
                           className="p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                         >
                            <Link className="w-4 h-4 text-white/30" />
                         </button>
                      </div>
                    </div>
                  ))}
                  {audioFormats.length === 0 && <p className="text-xs text-[#555] text-center py-4 bg-white/5 rounded-2xl">High quality audio extraction failed.</p>}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2 text-[#aaa]">
                    <Video className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Video Streams</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {videoFormats.slice(0, 3).map((f: any, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-[#1a1a1a] hover:bg-[#252525] rounded-[24px] border border-white/5 transition-all"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-white">{f.quality}</span>
                        <span className="text-[10px] text-[#555] font-black uppercase">
                          {f.container?.split(';')?.[0]?.split('/')?.[1] || 'mp4'}
                        </span>
                      </div>
                      <a 
                        href={f.proxyUrl || f.url} 
                        target="_blank"
                        className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-[10px] font-black transition-all flex items-center gap-2 border border-white/10"
                      >
                         <Play className="w-3 h-3" /> STREAM
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
