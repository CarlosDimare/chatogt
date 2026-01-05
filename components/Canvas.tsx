
import React, { useState, useEffect, useMemo } from 'react';
import { FileEntry } from '../types';

interface CanvasProps {
  initialFiles: FileEntry[];
  onClose: () => void;
  onFilesChange?: (files: FileEntry[]) => void;
}

const Canvas: React.FC<CanvasProps> = ({ initialFiles, onClose, onFilesChange }) => {
  const [files, setFiles] = useState<FileEntry[]>(initialFiles);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [view, setView] = useState<'preview' | 'code' | 'terminal'>('preview');
  const [showExplorer, setShowExplorer] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['$ Entorno ChatOGT listo', '$ Compilación incremental activada']);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  const activeFile = files[activeFileIndex] || files[0];

  const handleCodeChange = (newContent: string) => {
    const newFiles = [...files];
    if (newFiles[activeFileIndex]) {
      newFiles[activeFileIndex].content = newContent;
      setFiles(newFiles);
      if (onFilesChange) onFilesChange(newFiles);
    }
  };

  const previewUrl = useMemo(() => {
    const htmlFile = files.find(f => f.name.endsWith('.html')) || files[0];
    if (!htmlFile) return '';

    const allCss = files.filter(f => f.name.endsWith('.css')).map(f => f.content).join('\n');
    const allJs = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts')).map(f => f.content).join('\n');

    let finalContent = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>${allCss}</style>
        </head>
        <body>
          ${htmlFile.content}
          <script>${allJs}</script>
        </body>
      </html>`;

    const blob = new Blob([finalContent], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [files]);

  return (
    <div className="flex flex-col w-full h-full bg-[#1e1e1e] overflow-hidden animate-in slide-in-from-right duration-300">
      {/* IDE Header */}
      <div className="h-12 bg-[#252526] flex items-center justify-between px-4 border-b border-[#333] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowExplorer(!showExplorer)} className="p-1.5 text-[#888] hover:bg-[#333] rounded">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
          <div className="flex items-center gap-1 bg-[#1a1a1a] p-1 rounded-lg border border-[#333]">
            {(['preview', 'code', 'terminal'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-tighter transition-all ${view === v ? 'bg-[#cc0000] text-white' : 'text-[#888] hover:text-[#ccc]'}`}
              >
                {v === 'preview' ? 'Lienzo' : v === 'code' ? 'Editor' : 'Consola'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setView('preview'); setTerminalOutput(p => [...p, '$ Recargando vista previa...']); }} className="px-3 py-1 bg-[#cc0000] text-white text-[10px] font-bold rounded flex items-center gap-2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            RUN
          </button>
          <button onClick={onClose} className="p-1.5 text-[#888] hover:bg-red-500/10 hover:text-red-400 rounded transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Explorer */}
        {showExplorer && (
          <div className="w-56 bg-[#252526] border-r border-[#333] flex flex-col overflow-y-auto">
            <div className="p-3 text-[10px] font-bold text-[#888] uppercase tracking-widest border-b border-[#333]">Explorador</div>
            {files.map((f, i) => (
              <button
                key={f.name}
                onClick={() => { setActiveFileIndex(i); setView('code'); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${activeFileIndex === i ? 'bg-[#37373d] text-white' : 'text-[#888] hover:bg-[#2a2d2e] hover:text-[#ccc]'}`}
              >
                <span className="opacity-70 text-xs">📄</span>
                <span className="truncate flex-1">{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Content View */}
        <div className="flex-1 relative bg-white">
          {view === 'preview' && (
            <div className="w-full h-full flex flex-col">
              <div className="bg-[#f0f0f0] border-b border-[#ddd] p-1.5 flex items-center gap-2">
                <div className="flex-1 bg-white border border-[#ddd] rounded px-3 py-1 text-[10px] text-[#888] truncate select-none">
                  http://chatogt-localhost:3000/{activeFile?.name}
                </div>
              </div>
              <iframe src={previewUrl} className="flex-1 border-none bg-white" sandbox="allow-scripts" />
            </div>
          )}
          {view === 'code' && (
            <textarea
              value={activeFile?.content || ''}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full p-6 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm outline-none resize-none leading-relaxed"
              spellCheck={false}
              autoFocus
            />
          )}
          {view === 'terminal' && (
            <div className="w-full h-full bg-[#000] p-6 font-mono text-xs overflow-y-auto space-y-1">
              {terminalOutput.map((line, i) => (
                <div key={i} className={line.startsWith('$') ? 'text-green-500' : 'text-blue-300'}>{line}</div>
              ))}
              <div className="flex gap-2 text-white">
                <span className="text-green-500 font-bold">➜</span>
                <span className="animate-pulse w-2 h-4 bg-white/50"></span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* IDE Footer */}
      <div className="h-6 bg-[#cc0000] flex items-center justify-between px-3 text-[9px] text-white font-bold uppercase tracking-widest">
        <div className="flex gap-4">
          <span>{files.length} archivos</span>
          <span>UTF-8</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          ChatOGT Runtime
        </div>
      </div>
    </div>
  );
};

export default Canvas;
