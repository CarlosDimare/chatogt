
import React, { useEffect, useRef } from 'react';
import { ChatMessage, FileEntry } from '../types';

interface MessageItemProps {
  message: ChatMessage;
  onPreviewCode?: (files: FileEntry[]) => void;
}

const AppIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#cc0000" stroke="#000000" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" fill="#ffffff" />
    <path d="M12 10V14M10 12H14" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const formatInline = (text: string): React.ReactNode[] => {
  let parts: React.ReactNode[] = [text];
  parts = parts.flatMap(p => {
    if (typeof p !== 'string') return p;
    const split = p.split(/(\*\*.*?\*\*)/);
    return split.map((s, idx) => s.startsWith('**') && s.endsWith('**') ? <strong key={idx} className="font-bold text-white">{s.slice(2, -2)}</strong> : s);
  });
  parts = parts.flatMap(p => {
    if (typeof p !== 'string') return p;
    const split = p.split(/(\[.*?\]\(.*?\)|https?:\/\/[^\s\)]+|www\.[^\s\)]+)/g);
    return split.map((s, idx) => {
      let url = '', title = '';
      const mdMatch = s.match(/\[(.*?)\]\((.*?)\)/);
      if (mdMatch) { title = mdMatch[1]; url = mdMatch[2]; }
      else {
        const rawMatch = s.match(/(https?:\/\/[^\s\)]+|www\.[^\s\)]+)/);
        if (rawMatch) { url = rawMatch[0]; if (url.startsWith('www.')) url = 'https://' + url; title = rawMatch[0]; }
      }
      return url ? <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-red-400 hover:text-red-300 underline font-semibold transition-colors">{title}</a> : s;
    });
  });
  return parts;
};

const MarkdownText = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2"></div>;
        if (line.startsWith('###')) return <div key={i} className="text-lg font-bold text-red-500 mt-6 mb-2 uppercase tracking-wide">{formatInline(line.replace('###', ''))}</div>;
        if (line.startsWith('+ ') || line.startsWith('- ')) {
          const isAdd = line.startsWith('+ ');
          return <div key={i} className={`px-2 py-0.5 rounded font-mono text-sm ${isAdd ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{line}</div>;
        }
        const bullMatch = line.match(/^[\-\*]\s+(.*)/);
        if (bullMatch) return <div key={i} className="flex gap-3 pl-2 items-start"><span className="text-red-600 font-bold leading-none mt-1.5">•</span><div className="flex-1">{formatInline(bullMatch[1])}</div></div>;
        return <p key={i} className="leading-relaxed">{formatInline(line)}</p>;
      })}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message, onPreviewCode }) => {
  const isUser = message.role === 'user';
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageRef.current) {
      // @ts-ignore
      if (window.Prism) window.Prism.highlightAllUnder(messageRef.current);
    }
  }, [message.content]);

  const renderContent = (content: string) => {
    const parts = content.split(/```(\w+)?\n([\s\S]*?)```/);
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      if ((i - 1) % 3 === 0) continue;
      if ((i - 2) % 3 === 0) {
        const language = (parts[i-1] || 'code').toLowerCase();
        const code = parts[i].trim();
        result.push(
          <div key={i} className="my-6 rounded-2xl overflow-hidden border border-[#3f3f3f] bg-[#0d0d0d] shadow-xl w-full">
            <div className="bg-[#2f2f2f] px-4 py-2.5 text-[11px] font-bold text-[#b4b4b4] flex justify-between items-center border-b border-[#3f3f3f]">
              <span className="uppercase tracking-widest">{language}</span>
              <button onClick={() => navigator.clipboard.writeText(code)} className="hover:text-white transition-colors flex items-center gap-1">COPIAR</button>
            </div>
            <pre className={`language-${language} m-0 overflow-x-auto`}><code className={`language-${language}`}>{code}</code></pre>
          </div>
        );
      } else {
        if (parts[i]?.trim()) result.push(<MarkdownText key={i} text={parts[i]} />);
      }
    }
    return result;
  };

  return (
    <div ref={messageRef} className={`w-full py-6 flex ${isUser ? 'justify-end' : ''}`}>
      <div className={`flex gap-5 w-full ${isUser ? 'flex-row-reverse max-w-[85%]' : 'max-w-full'}`}>
        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center border-2 border-black shadow-lg overflow-hidden ${isUser ? 'bg-[#4f4f4f] border-[#5f5f5f]' : 'bg-white'}`}>
          {isUser ? <span className="text-xs font-bold text-white uppercase">YO</span> : <AppIcon size={20} />}
        </div>
        <div className={`flex-1 overflow-hidden min-w-0 ${isUser ? 'bg-[#2f2f2f] p-4 px-6 rounded-[22px] border border-[#3f3f3f]' : ''}`}>
          {!isUser && <div className="font-bold text-[13px] mb-2 text-[#b4b4b4] flex items-center gap-2"><span>ChatOGT AI</span></div>}
          <div className="text-[#ececec] text-[15px] md:text-[16px]">
            {message.imageUrl && <img src={message.imageUrl} className="mb-6 rounded-2xl border border-[#3f3f3f] max-w-lg" alt="AI" />}
            {renderContent(message.content)}
            
            {message.groundingLinks && message.groundingLinks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-[#3f3f3f] space-y-2">
                <div className="text-[10px] font-bold text-[#676767] uppercase tracking-widest">Fuentes</div>
                <div className="flex flex-wrap gap-2">
                  {message.groundingLinks.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-[#2f2f2f] hover:bg-[#3f3f3f] border border-[#3f3f3f] px-3 py-1.5 rounded-full text-red-400 transition-colors flex items-center gap-2"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
