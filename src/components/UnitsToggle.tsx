import React from 'react';

interface UnitsToggleProps {
  unit: 'metric' | 'imperial';
  onChange: (unit: 'metric' | 'imperial') => void;
}

export const UnitsToggle: React.FC<UnitsToggleProps> = ({ unit, onChange }) => {
  return (
    <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/10">
      <button
        onClick={() => onChange('metric')}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
          unit === 'metric' 
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
            : 'text-white/60 hover:text-white'
        }`}
      >
        °C
      </button>
      <button
        onClick={() => onChange('imperial')}
        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
          unit === 'imperial' 
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
            : 'text-white/60 hover:text-white'
        }`}
      >
        °F
      </button>
    </div>
  );
};
