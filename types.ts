
export enum ModelType {
  PRO = 'gemini-3-pro-preview',
  FLASH = 'gemini-3-flash-preview',
  FLASH_LITE = 'gemini-flash-lite-latest',
  IMAGE = 'gemini-3-pro-image-preview',
  LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025',
  TTS = 'gemini-2.5-flash-preview-tts',
  MAPS = 'gemini-2.5-flash'
}

export interface FileEntry {
  name: string;
  content: string;
  language: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'thinking';
  timestamp: number;
  imageUrl?: string;
  audioUrl?: string;
  thinking?: string;
  groundingLinks?: { title: string; uri: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface AppState {
  currentChatId: string | null;
  sessions: ChatSession[];
  isLoading: boolean;
  isSidebarOpen: boolean;
  isThinkingMode: boolean;
  isVoiceActive: boolean;
  useSearch: boolean;
  useMaps: boolean;
  isCodiMode: boolean;
  imageSize: '1K' | '2K' | '4K';
  systemInstruction: string;
  canvasFiles: FileEntry[] | null;
  isCanvasOpen: boolean;
}
