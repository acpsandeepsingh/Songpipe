
import { useState, useEffect } from 'react';
import { Settings, Save, X, Globe, ClipboardList, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { logger } from '../lib/logger';

export default function ApiSettings({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [url, setUrl] = useState('');
  
  useEffect(() => {
    const saved = localStorage.getItem('VITE_API_URL') || '';
    setUrl(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem('VITE_API_URL', url);
    onClose();
    window.location.reload();
  };

  const copyStartupReport = async () => {
    await navigator.clipboard.writeText(logger.getStartupReport());
    alert('Startup diagnostic report copied.');
  };

  const copyErrorLog = async () => {
    await navigator.clipboard.writeText(logger.getErrorOnlyLog());
    alert('Runtime error log copied.');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm bg-[#1a1a1a] rounded-[32px] p-8 border border-white/10 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
              <Settings className="w-6 h-6 text-red-500" /> API CONFIG
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full">
              <X className="w-6 h-6 text-[#555]" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#555] ml-1">Backend Server URL</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-app.run.app"
                  className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-red-500/50 transition-colors"
                />
              </div>
              <p className="text-[10px] text-[#555] px-1 leading-relaxed">
                Enter your deployed backend URL to enable Android playback. You can find this in your AI Studio browser tab.
              </p>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" /> SAVE & RELOAD
            </button>

            <button
              onClick={copyStartupReport}
              className="w-full bg-[#2a2a2a] text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 border border-white/10"
            >
              <ClipboardList className="w-5 h-5" /> COPY STARTUP FILE/CHECK REPORT
            </button>

            <button
              onClick={copyErrorLog}
              className="w-full bg-[#2a2a2a] text-white py-4 rounded-2xl font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2 border border-red-500/40"
            >
              <AlertTriangle className="w-5 h-5 text-red-400" /> COPY CONSOLE ERROR LOG
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
