import React from 'react';
import {
  Pencil, Trash2, Copy, CreditCard, Stamp,
  ChevronUp, ChevronDown, User,
} from 'lucide-react';
import type { PhotoEntry } from '../types';

interface Props {
  queue: PhotoEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (fromIdx: number, toIdx: number) => void;
  dark: boolean;
}

export const PhotoQueue: React.FC<Props> = ({
  queue, activeId, onSelect, onDelete, onDuplicate, onMove, dark,
}) => {
  const card   = dark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200';
  const lbl    = dark ? 'text-slate-200' : 'text-gray-800';
  const sub    = dark ? 'text-slate-400' : 'text-gray-500';
  const total  = queue.reduce((s, e) => s + e.copies, 0);

  if (queue.length === 0) {
    return (
      <div className={`rounded-xl border p-4 shadow-sm ${card}`}>
        <h3 className={`font-semibold mb-2 ${lbl}`}>Photo Queue</h3>
        <p className={`text-xs text-center py-4 ${sub}`}>No photos added yet</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border shadow-sm ${card}`}>
      <div className={`px-4 py-3 flex items-center justify-between border-b ${dark ? 'border-slate-600' : 'border-gray-200'}`}>
        <h3 className={`font-semibold ${lbl}`}>Photo Queue</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium`}>
          {total} copies • {queue.length} photo{queue.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="divide-y divide-slate-700/30 max-h-72 overflow-y-auto">
        {queue.map((entry, idx) => {
          const isActive = entry.id === activeId;
          const rowBg    = isActive
            ? (dark ? 'bg-blue-900/30' : 'bg-blue-50')
            : (dark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50');

          return (
            <div
              key={entry.id}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition ${rowBg}`}
              onClick={() => onSelect(entry.id)}
            >
              {/* Thumbnail */}
              <div className="w-10 h-12 rounded overflow-hidden flex-shrink-0 border border-slate-600">
                <img
                  src={entry.croppedUrl}
                  alt={entry.name || 'photo'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className={`flex items-center gap-1 text-xs font-medium truncate ${lbl}`}>
                  <User size={10} className="flex-shrink-0" />
                  <span className="truncate">{entry.name || `Photo ${idx + 1}`}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {entry.photoType === 'passport'
                    ? <CreditCard size={10} className="text-blue-400 flex-shrink-0" />
                    : <Stamp size={10} className="text-purple-400 flex-shrink-0" />
                  }
                  <span className={`text-xs ${sub}`}>
                    {entry.photoType === 'passport' ? 'Passport' : 'Stamp'} · ×{entry.copies}
                  </span>
                  {isActive && (
                    <span className="text-xs px-1 py-0.5 rounded bg-blue-500/30 text-blue-400 font-medium">editing</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onMove(idx, Math.max(0, idx - 1))}
                  disabled={idx === 0}
                  className={`w-6 h-6 rounded flex items-center justify-center transition disabled:opacity-20
                    ${dark ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-200 text-gray-500'}`}
                  title="Move up"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={() => onMove(idx, Math.min(queue.length - 1, idx + 1))}
                  disabled={idx === queue.length - 1}
                  className={`w-6 h-6 rounded flex items-center justify-center transition disabled:opacity-20
                    ${dark ? 'hover:bg-slate-600 text-slate-300' : 'hover:bg-gray-200 text-gray-500'}`}
                  title="Move down"
                >
                  <ChevronDown size={12} />
                </button>
                <button
                  onClick={() => onSelect(entry.id)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition
                    ${dark ? 'hover:bg-blue-700/50 text-blue-400' : 'hover:bg-blue-50 text-blue-500'}`}
                  title="Edit"
                >
                  <Pencil size={11} />
                </button>
                <button
                  onClick={() => onDuplicate(entry.id)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition
                    ${dark ? 'hover:bg-green-700/50 text-green-400' : 'hover:bg-green-50 text-green-600'}`}
                  title="Duplicate"
                >
                  <Copy size={11} />
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className={`w-6 h-6 rounded flex items-center justify-center transition
                    ${dark ? 'hover:bg-red-700/50 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
