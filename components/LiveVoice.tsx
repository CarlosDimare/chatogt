
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { FileEntry } from '../types';

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const AppIcon = ({ size = 80, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10" fill="#cc0000" stroke="#000000" strokeWidth="2"/>
    <circle cx="12" cy="12" r="4" fill="#ffffff" />
    <path d="M12 10V14M10 12H14" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

interface LiveVoiceProps {
  onClose: () => void;
  canvasFiles?: FileEntry[] | null;
}

const LiveVoice: React.FC<LiveVoiceProps> = ({ onClose, canvasFiles }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Iniciando...');
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    let active = true;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const setupSession = async () => {
      try {
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = inputCtx;
        outputAudioContextRef.current = outputCtx;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        let dynamicInstruction = 'Asistente con humor de Les Luthiers minimalista y directo. Perspectiva de clase.';
        if (canvasFiles && canvasFiles.length > 0) {
          const context = canvasFiles.map(f => `${f.name}:\n${f.content.slice(0, 500)}...`).join('\n\n');
          dynamicInstruction += `\n\nCONTEXTO ACTUAL DEL LIENZO:\n${context}`;
        }
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          callbacks: {
            onopen: () => {
              if (!active) return;
              setStatus('Escuchando...');
              setIsActive(true);
              const source = inputCtx.createMediaStreamSource(stream);
              const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                const base64Data = encode(new Uint8Array(int16.buffer));
                sessionPromise.then(session => session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } }));
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputCtx.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (!active) return;
              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
              if (base64Audio) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
                const sourceNode = outputCtx.createBufferSource();
                sourceNode.buffer = audioBuffer;
                sourceNode.connect(outputCtx.destination);
                const startTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                sourceNode.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;
                sourcesRef.current.add(sourceNode);
                sourceNode.onended = () => sourcesRef.current.delete(sourceNode);
              }
              if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
            },
            onerror: (e) => setStatus('Error de conexión'),
            onclose: () => setIsActive(false)
          },
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
            systemInstruction: dynamicInstruction
          }
        });
      } catch (err) {
        setStatus('Permiso de micrófono denegado');
      }
    };
    setupSession();
    return () => { active = false; audioContextRef.current?.close(); outputAudioContextRef.current?.close(); };
  }, [canvasFiles]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#171717] relative animate-in zoom-in duration-300">
      <button onClick={onClose} className="absolute top-6 right-6 p-3 hover:bg-[#2f2f2f] rounded-full transition-colors text-[#b4b4b4]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
      <div className="flex flex-col items-center space-y-12">
        <div className={`w-48 h-48 rounded-full border-4 border-black flex items-center justify-center relative ${isActive ? 'animate-pulse' : ''} bg-white shadow-2xl overflow-hidden`}>
          <div className={`absolute inset-0 rounded-full border-2 border-black animate-ping opacity-25 ${isActive ? '' : 'hidden'}`}></div>
          <AppIcon size={100} />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{status}</h2>
          <p className="text-[#b4b4b4] font-medium">ChatOGT te escucha.</p>
        </div>
      </div>
    </div>
  );
};

export default LiveVoice;
