
import React, { useState } from 'react';

interface CustomInstructionsModalProps {
  instruction: string;
  onSave: (val: string) => void;
  onClose: () => void;
}

const CustomInstructionsModal: React.FC<CustomInstructionsModalProps> = ({ instruction, onSave, onClose }) => {
  const [value, setValue] = useState(instruction);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#2f2f2f] w-full max-w-xl rounded-3xl p-6 md:p-8 border border-[#3f3f3f] shadow-2xl animate-in fade-in zoom-in duration-200">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Instrucciones personalizadas</h2>
        <p className="text-sm text-[#b4b4b4] mb-6">¿Qué te gustaría que ChatOGT supiera sobre ti para darte mejores respuestas?</p>
        
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full h-48 bg-[#171717] border border-[#3f3f3f] rounded-xl p-4 text-sm focus:ring-1 focus:ring-[#10a37f] outline-none resize-none transition-all mb-6"
          placeholder="Ej: Soy un desarrollador senior, prefiero respuestas técnicas y detalladas..."
        />

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl hover:bg-[#3f3f3f] transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSave(value)}
            className="px-5 py-2.5 bg-[#10a37f] hover:bg-[#0e8c6d] text-white rounded-xl transition-colors text-sm font-semibold"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomInstructionsModal;
