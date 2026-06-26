import React from 'react';
import { Minus, Plus, Copy } from 'lucide-react';

interface Props {
  value: number;
  onChange: (n: number) => void;
  dark: boolean;
}

const PRESETS = [4, 8, 12, 16, 20, 24];

export const CopyCountSelector: React.FC<Props> = ({ value, onChange, dark }) => {
  const card   = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const label  = dark ? 'text-slate-200' : 'text-gray-800';
  const input  = dark ? 'bg-slate-700 border-slate-500 text-white' : 'bg-gray-50 border-gray-300 text-gray-800';
  const preset = (active: boolean) =>
    active
      ? 'bg-blue-500 text-white border-blue-500'
      : dark
        ? 'bg-slate-700 border-slate-500 text-slate-300 hover:border-blue-400'
        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300';

  const clamp = (n: number) => Math.max(1, Math.min(500, n));

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${card}`}>
      <h3 className={`font-semibold mb-3 flex items-center gap-2 ${label}`}>
        <Copy size={16} /> Number of Copies
      </h3>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => onChange(clamp(value - 1))}
          className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition"
        >
          <Minus size={14} />
        </button>
        <input
          type="number"
          min={1}
          max={500}
          value={value}
          onChange={(e) => onChange(clamp(parseInt(e.target.value) || 1))}
          className={`w-20 text-center text-lg font-bold rounded-lg border px-2 py-1 ${input}`}
        />
        <button
          onClick={() => onChange(clamp(value + 1))}
          className="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-3 gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`text-xs py-1.5 rounded-md border font-medium transition ${preset(value === p)}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
};
