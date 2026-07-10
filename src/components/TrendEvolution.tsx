import React, { useState } from 'react';
import { History, ArrowRight, Wand2, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { csrfFetch } from '../utils/security.ts';

export function TrendEvolution() {
  const [selectedEra, setSelectedEra] = useState('90s');
  const [modernTwist, setModernTwist] = useState('techwear');
  const [isEvolving, setIsEvolving] = useState(false);
  const [evolvedImage, setEvolvedImage] = useState<string | null>(null);
  const [historicalContext, setHistoricalContext] = useState<string | null>(null);
  const [evolveError, setEvolveError] = useState<string | null>(null);

  const handleEvolve = async () => {
    setIsEvolving(true);
    setEvolvedImage(null);
    setHistoricalContext(null);
    setEvolveError(null);
    try {
      const eraLabel = eras.find(e => e.id === selectedEra)?.label;
      const twistLabel = twists.find(e => e.id === modernTwist)?.label;
      
      const response = await csrfFetch('/api/evolve-trend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ era: eraLabel, twist: twistLabel }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to evolve image');
      }
      
      setEvolvedImage(data.imageUrl);
      setHistoricalContext(data.historicalContext);
    } catch (error) {
      console.error(error);
      setEvolveError('Error evolving trend. Check console for details.');
    } finally {
      setIsEvolving(false);
    }
  };

  const eras = [
    { id: '20s', label: '1920s Flapper' },
    { id: '60s', label: '1960s Mod' },
    { id: '70s', label: '1970s Disco' },
    { id: '90s', label: '1990s Grunge' },
  ];

  const twists = [
    { id: 'techwear', label: 'Cyber Techwear' },
    { id: 'sustainable', label: 'Sustainable Organic' },
    { id: 'minimalist', label: 'Extreme Minimalism' },
    { id: 'avantgarde', label: 'Avant-Garde Silhouette' },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100 p-6 md:p-8 flex flex-col bg-white overflow-y-auto shrink-0 md:shrink-1 h-1/2 md:h-full">
        <div className="mb-6 md:mb-10">
          <h2 className="font-display text-2xl md:text-3xl mb-1 md:mb-2 text-gray-900 flex items-center gap-2 md:gap-3">
            <History className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
            Vault & Evolution
          </h2>
          <p className="text-gray-500 font-sans text-xs md:text-sm">Resurrect historical trends and cross-pollinate them with modern aesthetics.</p>
        </div>

        <div className="space-y-6 md:space-y-10 min-h-min">
          <div>
            <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 md:mb-4">1. Select Historical Era</h3>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {eras.map(era => (
                <button
                  key={era.id}
                  onClick={() => setSelectedEra(era.id)}
                  className={`p-3 md:p-4 rounded-lg md:rounded-xl text-left transition-all ${
                    selectedEra === era.id 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="block font-medium text-xs md:text-sm">{era.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center">
             <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
               <ArrowRight className="w-3 h-3 md:w-4 md:h-4" />
             </div>
          </div>

          <div>
            <h3 className="text-[10px] md:text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3 md:mb-4">2. Apply Modern Twist</h3>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {twists.map(twist => (
                <button
                  key={twist.id}
                  onClick={() => setModernTwist(twist.id)}
                  className={`p-3 md:p-4 rounded-lg md:rounded-xl text-left transition-all ${
                    modernTwist === twist.id 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="block font-medium text-xs md:text-sm">{twist.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {evolveError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex justify-between items-center">
            <span>{evolveError}</span>
            <button onClick={() => setEvolveError(null)} className="font-bold text-red-500 hover:text-red-700">Dismiss</button>
          </div>
        )}

        <button
          onClick={handleEvolve}
          disabled={isEvolving}
          className="mt-6 md:mt-12 w-full bg-gray-900 text-white rounded-xl py-3 md:py-4 font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isEvolving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
              <Wand2 className="w-4 h-4" />
            </motion.div>
          ) : <Wand2 className="w-4 h-4" />}
          {isEvolving ? 'Synthesizing...' : 'Evolve Trend'}
        </button>
      </div>

      <div className="w-full md:w-1/2 bg-gray-50 p-6 md:p-8 flex items-center justify-center relative overflow-y-auto h-1/2 md:h-full">
         {isEvolving ? (
           <motion.div className="text-center w-full max-w-sm my-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="aspect-[3/4] w-full bg-white rounded-2xl mx-auto overflow-hidden shadow-sm border border-gray-100 flex flex-col p-4 animate-pulse mb-6">
                <div className="w-full h-4/5 bg-gray-100 rounded-xl mb-4" />
                <div className="w-3/4 h-3 bg-gray-100 rounded mb-2 mx-auto" />
                <div className="w-1/2 h-2 bg-gray-100 rounded mx-auto" />
              </div>
             <p className="text-gray-500 text-xs md:text-sm tracking-widest uppercase mb-2">Cross-pollinating eras...</p>
             <p className="text-blue-500 text-[10px] md:text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 opacity-80">
                <Search className="w-3 h-3 animate-pulse" /> Archival Image Search via SerpAPI
             </p>
           </motion.div>
         ) : evolvedImage ? (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm md:max-w-md my-auto flex flex-col items-center">
             <div className="aspect-[3/4] w-full rounded-2xl bg-white md:shadow-xl overflow-hidden p-1.5 md:p-2">
                <img src={evolvedImage} alt="Evolved Design" className="w-full h-full object-cover rounded-xl" />
             </div>
             <div className="w-full mt-4 md:mt-6 bg-white p-3 md:p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-center w-full">
                   <span className="text-xs md:text-sm font-semibold text-gray-600 px-2 py-1 bg-gray-100 rounded">Era: {eras.find(e => e.id === selectedEra)?.label}</span>
                   <ArrowRight className="w-4 h-4 text-gray-300" />
                   <span className="text-xs md:text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">Twist: {twists.find(e => e.id === modernTwist)?.label}</span>
                </div>
                {historicalContext && (
                   <div className="mt-2 text-xs text-gray-500 border-t border-gray-100 pt-3 leading-relaxed">
                      <span className="font-semibold text-gray-700 block mb-1">Archival Context Injected:</span>
                      {historicalContext}
                   </div>
                )}
             </div>
           </motion.div>
         ) : (
           <div className="text-center opacity-50">
             <History className="w-8 h-8 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 text-gray-400" />
             <p className="font-display italic text-base md:text-lg text-gray-600">Select parameters to begin evolution</p>
           </div>
         )}
      </div>
    </div>
  );
}
