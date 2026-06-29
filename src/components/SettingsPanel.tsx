import React from 'react';
import { Settings, Scissors, SquareDashedBottom, FileText } from 'lucide-react';
import type { SheetSettings, BorderType, BackgroundColor, PaperPresetKey } from '../types';
import { PAPER_PRESETS } from '../types';

interface Props {
  settings: SheetSettings;
  onChange: (s: Partial<SheetSettings>) => void;
  /** per-photo border passed separately */
  activeBorder: BorderType;
  onBorderChange: (b: BorderType) => void;
  dark: boolean;
}

export const SettingsPanel: React.FC<Props> = ({
  settings, onChange, activeBorder, onBorderChange, dark,
}) => {
  const card    = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const lbl     = dark ? 'text-slate-200' : 'text-gray-800';
  const sub     = dark ? 'text-slate-400' : 'text-gray-500';
  const base    = 'text-xs px-2.5 py-1.5 rounded-md border font-medium transition';
  const act     = 'bg-blue-500 text-white border-blue-500';
  const inact   = dark
    ? 'bg-slate-700 border-slate-500 text-slate-300 hover:border-blue-400'
    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300';
  const btn     = (on: boolean) => `${base} ${on ? act : inact}`;

  const BORDERS: { v: BorderType; l: string }[] = [
    { v: 'none', l: 'None' }, { v: 'thin', l: 'Thin' }, { v: 'thick', l: 'Thick' },
  ];
  const BGS: { v: BackgroundColor; l: string; color: string }[] = [
    { v: 'white',     l: 'White',      color: '#ffffff' },
    { v: 'lightgray', l: 'Gray',       color: '#dcdcdc' },
    { v: 'custom',    l: 'Custom',     color: settings.customColor },
  ];
  const PAPERS = Object.values(PAPER_PRESETS);

  return (
    <div className={`rounded-xl border p-4 shadow-sm space-y-4 ${card}`}>
      <h3 className={`font-semibold flex items-center gap-2 ${lbl}`}>
        <Settings size={16}/> Sheet Settings
      </h3>

      {/* Paper size */}
      <div>
        <p className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${sub}`}>
          <FileText size={12}/> Paper Size
        </p>
        <div className="flex gap-2">
          {PAPERS.map(p => (
            <button key={p.key} onClick={() => onChange({ activePaper: p.key as PaperPresetKey })}
              className={btn(settings.activePaper === p.key)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cut marks */}
      <div>
        <p className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${sub}`}>
          <Scissors size={12}/> Cut Marks
        </p>
        <div className="flex gap-2">
          <button onClick={() => onChange({ showCutMarks: true  })} className={btn(settings.showCutMarks)}>Show</button>
          <button onClick={() => onChange({ showCutMarks: false })} className={btn(!settings.showCutMarks)}>Hide</button>
        </div>
      </div>

      {/* Border (per active photo) */}
      <div>
        <p className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${sub}`}>
          <SquareDashedBottom size={12}/> Border (active photo)
        </p>
        <div className="flex gap-2">
          {BORDERS.map(b => (
            <button key={b.v} onClick={() => onBorderChange(b.v)} className={btn(activeBorder === b.v)}>
              {b.l}
            </button>
          ))}
        </div>
      </div>

      {/* Background */}
      <div>
        <p className={`text-xs font-medium mb-1.5 ${sub}`}>Background</p>
        <div className="flex gap-2 flex-wrap">
          {BGS.map(bg => (
            <button key={bg.v} onClick={() => onChange({ backgroundColor: bg.v })}
              className={`flex items-center gap-1.5 ${btn(settings.backgroundColor === bg.v)}`}>
              <span className="w-3 h-3 rounded-sm border border-slate-400" style={{ background: bg.color }}/>
              {bg.l}
            </button>
          ))}
        </div>
        {settings.backgroundColor === 'custom' && (
          <input type="color" value={settings.customColor}
            onChange={e => onChange({ customColor: e.target.value })}
            className="mt-2 w-full h-8 rounded cursor-pointer border-0" />
        )}
      </div>
    </div>
  );
};
