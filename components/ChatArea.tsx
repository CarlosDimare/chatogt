
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileEntry } from '../types';
import MessageItem from './MessageItem';

interface ChatAreaProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, files?: File[]) => void;
  isLoading: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onVoiceToggle: () => void;
  onPreviewCode: (files: FileEntry[]) => void;
  isCodiMode: boolean;
  onCodiToggle: () => void;
}

// Icono circular rojo, negro y blanco
const AppIcon = ({ size = 40, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#cc0000" stroke="#000000" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" fill="#ffffff" />
    <path d="M12 10V14M10 12H14" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, onSendMessage, isLoading, isSidebarOpen, onToggleSidebar, onVoiceToggle, onPreviewCode, isCodiMode, onCodiToggle
}) => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputText.trim() && files.length === 0) || isLoading) return;
    onSendMessage(inputText, files);
    setInputText('');
    setFiles([]);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#212121] relative w-full overflow-hidden">
      <header className="flex items-center justify-between h-[60px] px-4 bg-[#212121]/95 border-b border-[#2f2f2f] z-40">
        <div className="flex items-center gap-3">
          <button onClick={onToggleSidebar} className="p-2 hover:bg-[#2f2f2f] rounded-xl text-[#b4b4b4] transition-colors"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg></button>
          <div className="flex items-center gap-2"><span className="font-bold text-lg">ChatOGT</span></div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onVoiceToggle} className="p-2 hover:bg-[#2f2f2f] rounded-xl text-[#ff3333] transition-colors"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg></button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-4 space-y-4 scroll-smooth custom-scrollbar w-full">
        <div className="max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-6 shadow-2xl border-2 border-black animate-in zoom-in duration-500 overflow-hidden">
                <AppIcon size={48} />
              </div>
              <h2 className="text-3xl font-bold mb-4 tracking-tight">ChatOGT Pro</h2>
              <p className="text-[#b4b4b4] text-sm max-w-sm mx-auto">Asistente minimalista con perspectiva de clase.</p>
            </div>
          ) : (
            messages.map((msg) => <MessageItem key={msg.id} message={msg} onPreviewCode={onPreviewCode} />)
          )}
          {isLoading && (
            <div className="w-full flex gap-4 py-6">
               <div className="w-9 h-9 rounded-full bg-white border border-black flex items-center justify-center animate-pulse flex-shrink-0 overflow-hidden">
                  <AppIcon size={20} />
               </div>
               <div className="flex-1 space-y-3 pt-2">
                  <div className="h-2 bg-[#2f2f2f] rounded w-full animate-pulse"></div>
                  <div className="h-2 bg-[#2f2f2f] rounded w-4/5 animate-pulse"></div>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto z-40">
        <div className="relative bg-[#2f2f2f] border border-[#3f3f3f] rounded-[28px] shadow-2xl focus-within:border-[#5f5f5f] transition-all p-2 px-4">
          <form onSubmit={handleSubmit} className="flex flex-col">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.innerWidth > 768) { e.preventDefault(); handleSubmit(); } }}
              placeholder={isCodiMode ? "Pide código a Codi..." : "Habla con ChatOGT..."}
              className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-1 max-h-[200px] text-base leading-relaxed scrollbar-hide"
              rows={1}
            />
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 hover:bg-[#3f3f3f] rounded-full text-[#b4b4b4] transition-colors" title="Adjuntar archivos">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </button>
                <button 
                  type="button" 
                  onClick={onCodiToggle} 
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${isCodiMode ? 'bg-[#cc0000] text-white border-white' : 'text-[#888] border-[#3f3f3f] hover:bg-[#3f3f3f]'}`}
                  title="Modo Codi (Programador Senior)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                  Codi
                </button>
                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} />
                {files.length > 0 && <span className="text-[10px] bg-[#cc0000] px-2 py-0.5 rounded-full text-white ml-2 font-bold">{files.length}</span>}
              </div>
              <button 
                type="submit" 
                disabled={isLoading || (!inputText.trim() && files.length === 0)}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${isLoading || (!inputText.trim() && files.length === 0) ? 'bg-[#4f4f4f] text-[#212121]' : 'bg-white text-black hover:bg-red-50 active:scale-95'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
              </button>
            </div>
          </form>
        </div>
        <p className="text-[10px] text-[#676767] text-center mt-3 tracking-wide font-medium uppercase">
          {isCodiMode ? "CODI ACTIVE: Senior Code Mode." : "ChatOGT: Humor minimalista."}
        </p>
      </div>
    </div>
  );
};

export default ChatArea;
