import React from 'react';
import { Settings, Scissors, SquareDashedBottom } from 'lucide-react';
import type { PhotoSettings, BorderType, BackgroundColor } from '../types';

interface Props {
  settings: PhotoSettings;
  onChange: (s: Partial<PhotoSettings>) => void;
  dark: boolean;
}

export const SettingsPanel: React.FC<Props> = ({ settings, onChange, dark }) => {
  const card    = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const label   = dark ? 'text-slate-200' : 'text-gray-800';
  const sub     = dark ? 'text-slate-400' : 'text-gray-500';
  const btnBase = 'text-xs px-3 py-1.5 rounded-md border font-medium transition';
  const active  = 'bg-blue-500 text-white border-blue-500';
  const inactive = dark
    ? 'bg-slate-700 border-slate-500 text-slate-300 hover:border-blue-400'
    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300';

  const btn = (isActive: boolean) => `${btnBase} ${isActive ? active : inactive}`;

  const BORDERS: { v: BorderType; l: string }[] = [
    { v: 'none',  l: 'None'  },
    { v: 'thin',  l: 'Thin'  },
    { v: 'thick', l: 'Thick' },
  ];

  const BGS: { v: BackgroundColor; l: string; color: string }[] = [
    { v: 'white',     l: 'White',      color: '#ffffff' },
    { v: 'lightgray', l: 'Light Gray', color: '#dcdcdc' },
    { v: 'custom',    l: 'Custom',     color: settings.customColor },
  ];

  return (
    <div className={`rounded-xl border p-4 shadow-sm space-y-4 ${card}`}>
      <h3 className={`font-semibold flex items-center gap-2 ${label}`}>
        <Settings size={16} /> Settings
      </h3>

      {/* Cut Marks */}
      <div>
        <p className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${sub}`}>
          <Scissors size={12} /> Cut Marks
        </p>
        <div className="flex gap-2">
          <button onClick={() => onChange({ showCutMarks: true  })} className={btn(settings.showCutMarks)}>Show</button>
          <button onClick={() => onChange({ showCutMarks: false })} className={btn(!settings.showCutMarks)}>Hide</button>
        </div>
      </div>

      {/* Border */}
      <div>
        <p className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${sub}`}>
          <SquareDashedBottom size={12} /> Photo Border
        </p>
        <div className="flex gap-2">
          {BORDERS.map((b) => (
            <button key={b.v} onClick={() => onChange({ border: b.v })} className={btn(settings.border === b.v)}>
              {b.l}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <p className={`text-xs font-medium mb-1.5 ${sub}`}>Background Color</p>
        <div className="flex gap-2 flex-wrap">
          {BGS.map((bg) => (
            <button
              key={bg.v}
              onClick={() => onChange({ backgroundColor: bg.v })}
              className={`flex items-center gap-1.5 ${btn(settings.backgroundColor === bg.v)}`}
            >
              <span
                className="w-3 h-3 rounded-sm border border-slate-400"
                style={{ backgroundColor: bg.color }}
              />
              {bg.l}
            </button>
          ))}
        </div>
        {settings.backgroundColor === 'custom' && (
          <input
            type="color"
            value={settings.customColor}
            onChange={(e) => onChange({ customColor: e.target.value })}
            className="mt-2 w-full h-8 rounded cursor-pointer border-0"
          />
        )}
      </div>
    </div>
  );
};
