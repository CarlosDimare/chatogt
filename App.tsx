
import React, { useState, useEffect } from 'react';
import { ModelType, ChatMessage, AppState, FileEntry } from './types';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import LiveVoice from './components/LiveVoice';
import Canvas from './components/Canvas';
import CustomInstructionsModal from './components/CustomInstructionsModal';
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'chatogt_v3_sessions';
const INSTR_KEY = 'chatogt_system_instr';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentChatId: null,
    sessions: [],
    isLoading: false,
    isSidebarOpen: window.innerWidth > 1024,
    isThinkingMode: false,
    isVoiceActive: false,
    useSearch: true,
    useMaps: false,
    isCodiMode: false,
    imageSize: '1K',
    systemInstruction: localStorage.getItem(INSTR_KEY) || `Asistente con perspectiva de clase y humor de guionista de Les Luthiers. Respuestas minimalistas, breves y directas. Sé mordaz pero educado. Ve al punto sin preámbulos. No uses saludos ni despedidas innecesarias.`,
    canvasFiles: null,
    isCanvasOpen: false
  });

  const [isInstrModalOpen, setIsInstrModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, sessions: parsed }));
      } catch (e) {
        console.error("Error cargando historial", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.sessions));
  }, [state.sessions]);

  const applyCanvasCommands = (text: string, currentFiles: FileEntry[] | null): FileEntry[] => {
    let files = currentFiles ? [...currentFiles] : [];
    const createRegex = /\[CREAR:\s*(.*?)\]\n([\s\S]*?)(?=\n\[|$)/g;
    let createMatch;
    while ((createMatch = createRegex.exec(text)) !== null) {
      const path = createMatch[1].trim();
      const content = createMatch[2].trim();
      const ext = path.split('.').pop() || 'text';
      const index = files.findIndex(f => f.name === path);
      if (index !== -1) files[index] = { name: path, content, language: ext };
      else files.push({ name: path, content, language: ext });
    }
    const editRegex = /\[EDITAR:\s*(.*?)\]\n\[LÍNEAS:\s*(\d+)-(\d+)\]\n([\s\S]*?)\n---\n([\s\S]*?)(?=\n\[|$)/g;
    let editMatch;
    while ((editMatch = editRegex.exec(text)) !== null) {
      const path = editMatch[1].trim();
      const start = parseInt(editMatch[2]) - 1;
      const end = parseInt(editMatch[3]);
      const newContent = editMatch[5].trim();
      const fileIndex = files.findIndex(f => f.name === path);
      if (fileIndex !== -1) {
        const lines = files[fileIndex].content.split('\n');
        lines.splice(start, end - start, newContent);
        files[fileIndex].content = lines.join('\n');
      }
    }
    if (files.length === 0) {
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      let blockMatch;
      let counts = { html: 0, css: 0, js: 0 };
      while ((blockMatch = codeBlockRegex.exec(text)) !== null) {
        const lang = (blockMatch[1] || 'text').toLowerCase();
        const code = blockMatch[2].trim();
        let name = '';
        if (lang === 'html') name = counts.html === 0 ? 'index.html' : `index${counts.html}.html`, counts.html++;
        else if (lang === 'css') name = counts.css === 0 ? 'styles.css' : `styles${counts.css}.css`, counts.css++;
        else if (['javascript', 'js', 'typescript', 'ts'].includes(lang)) name = counts.js === 0 ? 'main.js' : `script${counts.js}.js`, counts.js++;
        else name = `file-${files.length + 1}.${lang}`;
        files.push({ name, content: code, language: lang });
      }
    }
    return files;
  };

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!text && (!files || files.length === 0)) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user', content: text, type: 'text', timestamp: Date.now()
    };

    const chatId = state.currentChatId || Date.now().toString();
    setState(prev => {
      let sessions = [...prev.sessions];
      if (!prev.currentChatId) {
        sessions = [{ id: chatId, title: text.slice(0, 40).trim() || "Nueva Conversación", messages: [userMsg], updatedAt: Date.now() }, ...sessions];
      } else {
        sessions = sessions.map(s => s.id === chatId ? { ...s, messages: [...s.messages, userMsg], updatedAt: Date.now() } : s);
      }
      return { ...prev, currentChatId: chatId, sessions, isLoading: true };
    });

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let modelName: string = state.isThinkingMode ? ModelType.PRO : ModelType.FLASH;
      
      const keywords = ['dibuja', 'imagen', 'crea una imagen', 'genera una imagen', 'image'];
      const isImgReq = keywords.some(k => text.toLowerCase().includes(k));
      if (isImgReq) modelName = 'gemini-2.5-flash-image';

      let dynamicInstruction = state.isCodiMode 
        ? `Eres un Programador Senior de élite. TU ÚNICA FUNCIÓN ES CODIFICAR. 
           NO conversas, NO saludas, NO explicas, NO incluyas fuentes ni humor.
           Responde ÚNICAMENTE con bloques de código o comandos de Canvas [CREAR:...] o [EDITAR:...]. 
           Si te piden algo que no es código, simplemente ignóralo o responde con el código necesario para implementarlo.`
        : state.systemInstruction;

      if (state.canvasFiles) {
        const filesContext = state.canvasFiles.map(f => `ARCHIVO: ${f.name}\nCONTENIDO:\n${f.content}`).join('\n\n---\n\n');
        dynamicInstruction += `\n\nCONTEXTO ACTUAL DEL PROYECTO (LIENZO):\n${filesContext}`;
      }

      const config: any = { systemInstruction: dynamicInstruction };
      if (state.isThinkingMode && !isImgReq) config.thinkingConfig = { thinkingBudget: 16000 };
      if (state.useSearch && !isImgReq && !state.isCodiMode) config.tools = [{ googleSearch: {} }];

      const parts: any[] = [{ text }];
      if (files && files.length > 0) {
        for (const file of files) {
          const reader = new FileReader();
          const base64Data = await new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
          });
          parts.push({ inlineData: { data: base64Data, mimeType: file.type } });
        }
      }

      const response = await ai.models.generateContent({ model: modelName, contents: { parts }, config });
      let assistantText = response.text || '';
      let assistantImageUrl = '';
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) assistantImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', content: assistantText, imageUrl: assistantImageUrl,
        type: assistantImageUrl ? 'image' : 'text', timestamp: Date.now(),
        groundingLinks: !state.isCodiMode ? response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => 
          c.web ? { title: c.web.title, uri: c.web.uri } : null
        ).filter(Boolean) as any : []
      };

      setState(prev => {
        const updatedSessions = prev.sessions.map(s => s.id === chatId ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() } : s);
        const newCanvasFiles = applyCanvasCommands(assistantText, prev.canvasFiles);
        return {
          ...prev,
          isLoading: false,
          sessions: updatedSessions,
          canvasFiles: newCanvasFiles.length > 0 ? newCanvasFiles : prev.canvasFiles,
          isCanvasOpen: newCanvasFiles.length > 0 ? true : prev.isCanvasOpen
        };
      });
    } catch (error) {
      console.error("AI Error:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const currentSession = state.sessions.find(s => s.id === state.currentChatId);

  return (
    <div className="flex h-screen bg-[#212121] overflow-hidden text-[#ececec] font-sans w-full">
      <Sidebar 
        isOpen={state.isSidebarOpen} 
        onToggle={() => setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }))}
        sessions={state.sessions}
        currentChatId={state.currentChatId}
        onSelectChat={(id) => setState(prev => ({ ...prev, currentChatId: id, isCanvasOpen: false }))}
        onNewChat={() => setState(prev => ({ ...prev, currentChatId: null, isCanvasOpen: false, canvasFiles: null }))}
        onDeleteChat={(id) => setState(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id), currentChatId: prev.currentChatId === id ? null : prev.currentChatId }))}
        onOpenInstructions={() => setIsInstrModalOpen(true)}
        config={{
          isThinkingMode: state.isThinkingMode, setThinkingMode: (val) => setState(prev => ({ ...prev, isThinkingMode: val })),
          useSearch: state.useSearch, setUseSearch: (val) => setState(prev => ({ ...prev, useSearch: val })),
          useMaps: state.useMaps, setUseMaps: (val) => setState(prev => ({ ...prev, useMaps: val }))
        }}
      />
      <main className="flex-1 flex flex-row relative h-full w-full overflow-hidden">
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${state.isCanvasOpen ? 'hidden lg:flex' : 'flex'}`}>
          {state.isVoiceActive ? (
            <LiveVoice onClose={() => setState(prev => ({ ...prev, isVoiceActive: false }))} canvasFiles={state.canvasFiles} />
          ) : (
            <ChatArea 
              messages={currentSession?.messages || []} 
              onSendMessage={handleSendMessage}
              isLoading={state.isLoading}
              isSidebarOpen={state.isSidebarOpen}
              onToggleSidebar={() => setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }))}
              onVoiceToggle={() => setState(prev => ({ ...prev, isVoiceActive: true }))}
              onPreviewCode={(files) => setState(prev => ({ ...prev, canvasFiles: files, isCanvasOpen: true }))}
              isCodiMode={state.isCodiMode}
              onCodiToggle={() => setState(prev => ({ ...prev, isCodiMode: !prev.isCodiMode }))}
            />
          )}
        </div>
        {state.isCanvasOpen && state.canvasFiles && (
          <div className="absolute inset-0 lg:relative lg:flex lg:flex-[1.2] h-full z-[80] lg:z-auto bg-[#212121] border-l border-[#333]">
            <Canvas initialFiles={state.canvasFiles} onFilesChange={(updatedFiles) => setState(prev => ({ ...prev, canvasFiles: updatedFiles }))} onClose={() => setState(prev => ({ ...prev, isCanvasOpen: false }))} />
          </div>
        )}
      </main>
      {isInstrModalOpen && <CustomInstructionsModal instruction={state.systemInstruction} onSave={(val) => { setState(prev => ({ ...prev, systemInstruction: val })); localStorage.setItem(INSTR_KEY, val); setIsInstrModalOpen(false); }} onClose={() => setIsInstrModalOpen(false)} />}
    </div>
  );
};

export default App;
