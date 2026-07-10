import React, { useState, useEffect } from 'react';
import { GitCompare, ChevronDown, CheckCircle2, History, ArrowRightLeft, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserDesigns } from '../firebase';

const mockVersions = [
  {
    id: "v1",
    name: "Iteration 1 - Spring Collection",
    prompt: "A minimalist silk slip dress with asymmetrical hemline and silver hardware.",
    material: "Silk Crepe De Chine",
    palette: "Monochrome Brutalism",
    imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600&h=800",
  },
  {
    id: "v2",
    name: "Iteration 2 - Technical Look",
    prompt: "Oversized structured blazer with retro padding and utilitarian straps.",
    material: "Technical Gabardine",
    palette: "Neon Cyberpunk",
    imageUrl: "https://images.unsplash.com/photo-1502163140606-888448ae8cfe?auto=format&fit=crop&q=80&w=600&h=800",
  },
  {
    id: "v3",
    name: "Iteration 3 - Soft Minimal",
    prompt: "Layered translucent fabrics creating a soft ethereal silhouette, full body.",
    material: "Organza & Tulle",
    palette: "Ethereal Pastels",
    imageUrl: "https://images.unsplash.com/photo-1485230405346-71acb9518d9c?auto=format&fit=crop&q=80&w=600&h=800",
  }
];

export function VersionCompare({ onRedo }: { onRedo?: (prompt: string, material: string, palette: string) => void }) {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const list = await getUserDesigns();
        if (list && list.length > 0) {
          // Format them like our compare versions
          const formatted = list.map((d, index) => ({
            id: d.id,
            name: `v${list.length - index} - ${d.prompt.substring(0, 30)}...`,
            prompt: d.prompt,
            material: d.material,
            palette: d.palette,
            imageUrl: d.imageUrl,
            date: new Date(d.createdAt).toLocaleDateString()
          }));
          setDesigns(formatted);
        }
      } catch (err) {
        console.error("Error loading compare history:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeVersions = designs.length > 0 ? designs : mockVersions;

  const [leftId, setLeftId] = useState(() => activeVersions[0]?.id || 'v1');
  const [rightId, setRightId] = useState(() => activeVersions[1]?.id || 'v2');

  // Sync state if activeVersions list changes
  useEffect(() => {
    if (activeVersions.length > 0) {
      setLeftId(activeVersions[0].id);
      setRightId(activeVersions[1]?.id || activeVersions[0].id);
    }
  }, [designs]);
  
  const leftItem = activeVersions.find(v => v.id === leftId) || activeVersions[0];
  const rightItem = activeVersions.find(v => v.id === rightId) || activeVersions[1] || activeVersions[0];

  const materialDiff = leftItem?.material !== rightItem?.material;
  const paletteDiff = leftItem?.palette !== rightItem?.palette;

  const Selector = ({ currentId, onSelect, side }: { currentId: string, onSelect: (id: string) => void, side: 'left' | 'right' }) => (
    <div className="relative group/select w-full max-w-sm mx-auto mb-6">
      <select 
        value={currentId} 
        onChange={(e) => onSelect(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-200 text-gray-900 font-display font-semibold text-xs md:text-sm rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow cursor-pointer shadow-sm"
      >
        {activeVersions.map(v => (
          <option key={`${side}-${v.id}`} value={v.id}>{v.name}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover/select:text-gray-900 transition-colors" />
    </div>
  );

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50 h-full">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="mb-8 md:mb-10 text-center">
          <h2 className="font-display text-2xl md:text-3xl mb-2 text-gray-900 flex justify-center items-center gap-3">
            <GitCompare className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            Version Compare
          </h2>
          <p className="text-gray-500 font-sans text-xs md:text-sm">Compare two iterations side-by-side to highlight differences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 flex-1 relative">
          
          {/* Left Column */}
          <div className="flex flex-col">
            <Selector currentId={leftId} onSelect={setLeftId} side="left" />
            <motion.div 
              key={`left-${leftId}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center flex-1"
            >
              <div className="w-full aspect-[3/4] relative bg-gray-100">
                <img src={leftItem.imageUrl} alt={leftItem.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 w-full text-center">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">Properties</p>
                
                <div className="mb-4">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Material</span>
                  <div className={`px-4 py-2 rounded-lg text-sm font-medium ${materialDiff ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-gray-50 text-gray-700 border border-gray-100'}`}>
                    {leftItem.material}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Color Palette</span>
                  <div className={`px-4 py-2 rounded-lg text-sm font-medium ${paletteDiff ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-gray-50 text-gray-700 border border-gray-100'}`}>
                    {leftItem.palette}
                  </div>
                </div>

                <button
                  onClick={() => onRedo?.(leftItem.prompt, leftItem.material, leftItem.palette)}
                  className="mt-6 w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  Apply to Studio
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* Right Column */}
          <div className="flex flex-col">
            <Selector currentId={rightId} onSelect={setRightId} side="right" />
            <motion.div 
              key={`right-${rightId}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center flex-1"
            >
              <div className="w-full aspect-[3/4] relative bg-gray-100">
                <img src={rightItem.imageUrl} alt={rightItem.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 w-full text-center">
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-4">Properties</p>
                
                <div className="mb-4">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Material</span>
                  <div className={`relative px-4 py-2 rounded-lg text-sm font-medium ${materialDiff ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-gray-50 text-gray-700 border border-gray-100'}`}>
                    {rightItem.material}
                    {materialDiff && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span></span>}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Color Palette</span>
                  <div className={`relative px-4 py-2 rounded-lg text-sm font-medium ${paletteDiff ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-gray-50 text-gray-700 border border-gray-100'}`}>
                    {rightItem.palette}
                    {paletteDiff && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span></span>}
                  </div>
                </div>

                <button
                  onClick={() => onRedo?.(rightItem.prompt, rightItem.material, rightItem.palette)}
                  className="mt-6 w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  Apply to Studio
                </button>
              </div>
            </motion.div>
          </div>

        </div>

        {/* VERSION HISTORY CHRONOLOGY LOG & TIMELINE */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <History className="w-5 h-5 text-gray-500" />
            <h3 className="font-display font-bold text-sm text-gray-900 uppercase tracking-wider">Parameters Evolvement & Version History Log</h3>
          </div>

          <div className="space-y-4">
            {activeVersions.map((v, i) => {
              const isLeftActive = leftId === v.id;
              const isRightActive = rightId === v.id;

              return (
                <div key={v.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-200/50 transition-colors gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-gray-900 text-white rounded uppercase tracking-wider">
                        v{activeVersions.length - i}
                      </span>
                      {v.date && <span className="text-xs text-gray-400 font-medium">{v.date}</span>}
                    </div>
                    <p className="text-xs font-medium text-gray-800 leading-relaxed mb-2 line-clamp-2 md:line-clamp-1">{v.prompt}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded">
                        {v.material}
                      </span>
                      <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded">
                        {v.palette}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => setLeftId(v.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                        isLeftActive 
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                          : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {isLeftActive ? '← Active Left' : 'Compare Left'}
                    </button>
                    <button
                      onClick={() => setRightId(v.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border ${
                        isRightActive 
                          ? 'bg-purple-50 border-purple-200 text-purple-700 font-bold' 
                          : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {isRightActive ? 'Active Right →' : 'Compare Right'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
