
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onOpenInstructions: () => void;
  config: {
    isThinkingMode: boolean;
    setThinkingMode: (val: boolean) => void;
    useSearch: boolean;
    setUseSearch: (val: boolean) => void;
    useMaps: boolean;
    setUseMaps: (val: boolean) => void;
  }
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  sessions,
  currentChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onOpenInstructions,
  config
}) => {
  const groupSessions = () => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const groups: { [key: string]: ChatSession[] } = { 'Hoy': [], 'Ayer': [], 'Siete días anteriores': [], 'Anteriores': [] };

    sessions.forEach(s => {
      const diff = now - s.updatedAt;
      if (diff < day) groups['Hoy'].push(s);
      else if (diff < 2 * day) groups['Ayer'].push(s);
      else if (diff < 7 * day) groups['Siete días anteriores'].push(s);
      else groups['Anteriores'].push(s);
    });
    return groups;
  };

  const grouped = groupSessions();

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/60 z-[90] lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={onToggle}
      />
      
      <div className={`fixed lg:relative z-[100] w-[280px] h-full bg-[#171717] transition-transform duration-300 ease-in-out flex flex-col border-r border-[#2f2f2f] ${isOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-[280px]'}`}>
        <div className="flex items-center justify-between p-3 mb-2">
          <button 
            onClick={onNewChat}
            className="flex-1 flex items-center gap-3 p-2 hover:bg-[#2f2f2f] rounded-xl transition-colors group border border-[#3f3f3f]"
          >
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <span className="text-sm font-semibold">Nuevo chat</span>
          </button>
          <button onClick={onToggle} className="p-2 ml-2 hover:bg-[#2f2f2f] rounded-xl text-[#b4b4b4]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          {Object.entries(grouped).map(([label, items]) => items.length > 0 && (
            <div key={label} className="mt-4">
              <div className="text-[11px] font-bold text-[#676767] px-3 py-2 uppercase tracking-tight">{label}</div>
              <div className="space-y-0.5">
                {items.map(s => (
                  <div 
                    key={s.id}
                    onClick={() => onSelectChat(s.id)}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer text-sm transition-all ${currentChatId === s.id ? 'bg-[#2f2f2f] text-white shadow-sm' : 'hover:bg-[#2f2f2f]'}`}
                  >
                    <span className="flex-1 truncate pr-8">{s.title || "Nuevo Chat"}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteChat(s.id); }}
                      className="absolute right-3 opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto p-3 border-t border-[#2f2f2f] space-y-2">
           <div className="bg-[#212121] rounded-xl p-3 mb-4 space-y-3 shadow-inner border border-[#2f2f2f]">
              <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-medium text-[#b4b4b4] group-hover:text-white transition-colors">Pensamiento Profundo</span>
                  <input type="checkbox" checked={config.isThinkingMode} onChange={(e) => config.setThinkingMode(e.target.checked)} className="w-4 h-4 accent-[#cc0000]" />
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs font-medium text-[#b4b4b4] group-hover:text-white transition-colors">Búsqueda Google</span>
                  <input type="checkbox" checked={config.useSearch} onChange={(e) => config.setUseSearch(e.target.checked)} className="w-4 h-4 accent-[#cc0000]" />
              </label>
           </div>
          <button 
            onClick={onOpenInstructions}
            className="w-full flex items-center gap-3 p-3 text-sm hover:bg-[#2f2f2f] rounded-xl transition-colors font-medium border border-transparent hover:border-[#3f3f3f]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Personalizar ChatOGT
          </button>
          
          <div className="p-3 text-[10px] text-[#676767] font-bold uppercase tracking-widest text-center">
            Libre de Suscripciones
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
