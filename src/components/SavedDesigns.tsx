import React, { useState } from 'react';
import { Grid, Download, Trash2, Copy, FileCode, CheckCircle2 } from 'lucide-react';
import { UserStats, SavedDesign } from '../types';

interface SavedDesignsProps {
  stats: UserStats;
  onUpdateStats: (stats: UserStats) => void;
  onBack: () => void;
}

export default function SavedDesigns({ stats, onUpdateStats, onBack }: SavedDesignsProps) {
  const [designs, setDesigns] = useState<SavedDesign[]>(stats.savedDesigns || [
    { id: 'd1', name: 'Corporate Business Card V2', type: 'Design', imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=300', updatedAt: '2 days ago' },
    { id: 'd2', name: 'AI generated event poster', type: 'AI Image', imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=300', updatedAt: '1 week ago' },
  ]);

  const handleDelete = (id: string) => {
    const updated = designs.filter(d => d.id !== id);
    setDesigns(updated);
    onUpdateStats({ ...stats, savedDesigns: updated });
    alert('Design removed from your assets library.');
  };

  const handleDuplicate = (d: SavedDesign) => {
    const newDesign = { ...d, id: 'd' + Date.now(), name: d.name + ' (Copy)', updatedAt: 'Just now' };
    const updated = [newDesign, ...designs];
    setDesigns(updated);
    onUpdateStats({ ...stats, savedDesigns: updated });
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      <button onClick={onBack} className="py-2.5 px-5 bg-neutral-900 hover:bg-[#FF4D00] text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md transition">
        ← Back to Profile
      </button>

      <div className="bg-white rounded-[32px] border border-zinc-200/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-zinc-150 pb-5">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <Grid className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-heavy text-slate-900 uppercase tracking-tight">Saved Design Assets</h3>
            <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">Manage AI generations & custom uploads</p>
          </div>
        </div>

        {designs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200 rounded-[24px]">
            <FileCode className="w-12 h-12 text-zinc-300 mb-3" />
            <p className="text-zinc-500 font-bold text-sm">No saved designs yet.</p>
            <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 mt-1">Start customizing products to save assets!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {designs.map((d) => (
              <div key={d.id} className="group border border-zinc-200 rounded-[24px] overflow-hidden bg-white hover:border-[#FF4D00]' hover:shadow-lg transition-all flex flex-col">
                <div className="relative aspect-auto bg-zinc-50 h-32 overflow-hidden border-b border-zinc-100">
                  <img src={d.imageUrl} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <span className="absolute top-2 left-2 bg-[#FF4D00] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md z-10">
                    {d.type}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="text-[11px] font-heavy text-slate-900 uppercase leading-snug line-clamp-2">{d.name}</h5>
                    <p className="text-[9px] font-mono text-zinc-400 mt-1">Edited {d.updatedAt}</p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-100">
                    <button onClick={() => alert('Opening vector studio...')} className="flex-1 py-1.5 bg-black text-white rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-[#FF4D00] transition cursor-pointer">
                      Edit
                    </button>
                    <button onClick={() => handleDuplicate(d)} className="p-1.5 text-zinc-400 hover:text-blue-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition cursor-pointer" title="Duplicate">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} className="p-1.5 text-zinc-400 hover:text-rose-500 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg transition cursor-pointer" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
