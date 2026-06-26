import React from 'react';
import { CreditCard, Stamp } from 'lucide-react';
import type { PhotoType } from '../types';
import { PHOTO_SIZES } from '../types';

interface Props {
  value: PhotoType;
  onChange: (t: PhotoType) => void;
  dark: boolean;
}

const OPTIONS: { type: PhotoType; icon: React.ReactNode; desc: string }[] = [
  { type: 'passport', icon: <CreditCard size={18} />, desc: '35 × 45 mm' },
  { type: 'stamp',    icon: <Stamp size={18} />,      desc: '25 × 35 mm' },
];

export const PhotoTypeSelector: React.FC<Props> = ({ value, onChange, dark }) => {
  const card  = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const label = dark ? 'text-slate-200' : 'text-gray-800';

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${card}`}>
      <h3 className={`font-semibold mb-3 ${label}`}>Photo Type</h3>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => {
          const active = value === o.type;
          return (
            <button
              key={o.type}
              onClick={() => onChange(o.type)}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-sm font-medium
                ${active
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : dark
                    ? 'border-slate-600 text-slate-300 hover:border-slate-400'
                    : 'border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
            >
              {o.icon}
              <span>{PHOTO_SIZES[o.type].label.split(' ')[0]}</span>
              <span className="text-xs opacity-70">{o.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
