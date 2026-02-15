
import React from 'react';
import { TempUnit, WindUnit } from '../types';

interface UnitToggleProps {
  tempUnit: TempUnit;
  windUnit: WindUnit;
  onTempToggle: (unit: TempUnit) => void;
  onWindToggle: (unit: WindUnit) => void;
}

const UnitToggle: React.FC<UnitToggleProps> = ({ tempUnit, windUnit, onTempToggle, onWindToggle }) => {
  return (
    <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
      <div className="flex bg-black/20 rounded-xl p-1">
        <button
          onClick={() => onTempToggle('C')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            tempUnit === 'C' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/40 hover:text-white/70'
          }`}
        >
          °C
        </button>
        <button
          onClick={() => onTempToggle('F')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            tempUnit === 'F' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/40 hover:text-white/70'
          }`}
        >
          °F
        </button>
      </div>

      <div className="flex bg-black/20 rounded-xl p-1">
        <button
          onClick={() => onWindToggle('kmh')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            windUnit === 'kmh' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/40 hover:text-white/70'
          }`}
        >
          km/h
        </button>
        <button
          onClick={() => onWindToggle('mph')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            windUnit === 'mph' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/40 hover:text-white/70'
          }`}
        >
          mph
        </button>
      </div>
    </div>
  );
};

export default UnitToggle;
