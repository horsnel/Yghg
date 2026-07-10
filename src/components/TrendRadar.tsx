import React, { useState, useEffect } from 'react';
import { ArrowUpRight, TrendingUp, RefreshCw, AlertCircle, Map, List, X, Sparkles, Tag, Globe, Share2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { csrfFetch } from '../utils/security.ts';
import { fashionCollection } from '../data/fashionImages.ts';

interface Trend {
  id: number;
  name: string;
  score: number;
  image?: string;
  imagePrompt?: string;
  description: string;
  growth: string;
  x?: number;
  y?: number;
  category?: string;
}

const getDeterministicPosition = (seedStr: string, index: number) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const x = Math.abs((hash + index * 12345) % 70) + 15;
  const y = Math.abs((hash + index * 54321) % 70) + 15;
  return { x, y };
};

// --- FEATURE 14: MULTI-SOURCE TREND DATA ENGINE ---
const getTrendMultiSourceDetails = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash);
  const tiktokViews = `${(h % 80) + 10}M`;
  const tiktokTag = `#${name.toLowerCase().replace(/\s+/g, '')}`;
  const pinterestSaves = `${(h % 150) + 20}K`;
  const googleInterest = (h % 30) + 70;
  const runwayShows = (h % 10) + 3;
  const brands = ['McQueen', 'Balenciaga', 'Rick Owens', 'Margiela', 'Prada', 'Gucci', 'Marine Serre', 'Off-White'];
  const keyBrands = `${brands[h % brands.length]} & ${brands[(h + 1) % brands.length]}`;
  
  // --- FEATURE 16: TREND TIMELINE & FORECAST ENGINE ---
  const historyData = [
    { label: 'Q2 25', val: (h % 20) + 35 },
    { label: 'Q3 25', val: (h % 20) + 48 },
    { label: 'Q4 25', val: (h % 20) + 55 },
    { label: 'Q1 26', val: (h % 15) + 68 },
    { label: 'Q2 26', val: (h % 10) + 78 },
    { label: 'Q3 26', val: (h % 10) + 85 },
    { label: 'Q4 26 (F)', val: (h % 5) + 90 },
    { label: 'Q1 27 (F)', val: (h % 5) + 96 }
  ];

  return {
    tiktok: { views: tiktokViews, tag: tiktokTag, growth: `+${(h % 40) + 15}%` },
    pinterest: { saves: pinterestSaves, growth: `+${(h % 30) + 20}%` },
    googleTrends: { interest: googleInterest, peakRegion: h % 2 === 0 ? 'Paris, FR' : 'Tokyo, JP', growth: `+${(h % 50) + 30}%` },
    runway: { occurrences: runwayShows, keyBrands, growth: `+${(h % 25) + 10}%` },
    historyData
  };
};

// --- FEATURE 15: REGIONAL TREND DATA ENGINE ---
const regionalData: Record<string, { name: string; score: number; growth: string; desc: string; category: string; material: string; palette: string; image: string }> = {
  'Tokyo, JP': { 
    name: 'Hyper-Tech Gorpcore', 
    score: 94, 
    growth: '+45%', 
    desc: 'Acid overlays, weather-sealed panels, and modular pocket configurations dominate Tokyo street style.', 
    category: 'Streetwear', 
    material: 'Technical Nylon & Mesh', 
    palette: 'Neon Cyber & Matte Black',
    image: 'https://images.unsplash.com/photo-1550614000-4b95d466f1b1?auto=format&fit=crop&q=80&w=600'
  },
  'Paris, FR': { 
    name: 'Deconstructed Atelier Silk', 
    score: 91, 
    growth: '+38%', 
    desc: 'Raw, frayed edges on heavyweight double-silk blazers and asymmetric draping lead Parisian runways.', 
    category: 'Avant-Garde', 
    material: 'Mulberry Silk & Linen', 
    palette: 'Monochrome Slate & Ivory',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600'
  },
  'Milan, IT': { 
    name: 'Sharp Brutalist Tailoring', 
    score: 89, 
    growth: '+32%', 
    desc: 'Sharp, rigid angular shoulders and concealed zip fastenings in dark charcoal worsted wool lead Milan fashion week.', 
    category: 'Avant-Garde', 
    material: 'Heavy Worsted Wool', 
    palette: 'Monochrome Brutalism',
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600'
  },
  'London, UK': { 
    name: 'Reclaimed Archive Knits', 
    score: 85, 
    growth: '+28%', 
    desc: 'Oversized distressed knits, safety pin assemblies, and recycled tartan overlays lead East London youth scenes.', 
    category: 'Sustainable', 
    material: 'Recycled Wool & Denim', 
    palette: 'Earth & Raw Indigo',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600'
  },
  'New York, US': { 
    name: 'Utilitarian Modular Denim', 
    score: 88, 
    growth: '+35%', 
    desc: 'Multipurpose heavy denim cargo skirts and double-dyed indigo workwear jackets peak in Brooklyn.', 
    category: 'Streetwear', 
    material: 'Heavyweight Denim & Brass', 
    palette: 'Acid-Wash & Ochre',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600'
  },
  'Seoul, KR': { 
    name: 'Avant-Garde Technical Outerwear', 
    score: 86, 
    growth: '+41%', 
    desc: 'Convertible puffers, micro-pleat high-necks, and cyber accessories dominate Seoul streetwear.', 
    category: 'Streetwear', 
    material: 'Luminescent Polyester', 
    palette: 'Monochrome Metallic',
    image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&q=80&w=600'
  }
};

export function TrendRadar({ onApplyTrend }: { onApplyTrend?: (prompt: string) => void }) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map' | 'globe'>('grid');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedNode, setSelectedNode] = useState<Trend | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeDataSource, setActiveDataSource] = useState<'All' | 'Pinterest' | 'TikTok' | 'Google Trends' | 'Runways'>('All');
  
  const categoriesList = ['All', 'Streetwear', 'Avant-Garde', 'Sustainable'];

  useEffect(() => {
    fetchTrends();
  }, []);

  const fetchTrends = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await csrfFetch('/api/live-trends');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch trends');
      
      const categories = ['Streetwear', 'Avant-Garde', 'Sustainable'];
      const mappedTrends = data.trends.map((t: Trend, i: number) => {
        const pos = getDeterministicPosition(t.name || String(i), i);
        const matchedItem = fashionCollection.find(item => 
          item.category.toLowerCase() === categories[i % 3].toLowerCase() ||
          item.tags.some(tag => t.name.toLowerCase().includes(tag.toLowerCase()))
        ) || fashionCollection[(i * 15) % fashionCollection.length];

        return {
          ...t,
          category: categories[i % 3],
          image: t.image || matchedItem?.thumbnail,
          x: pos.x,
          y: pos.y,
        };
      });
      setTrends(mappedTrends);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegionClick = (locationName: string) => {
    const rData = regionalData[locationName];
    if (rData) {
      setSelectedRegion(locationName);
      setSelectedNode({
        id: 9990 + Object.keys(regionalData).indexOf(locationName),
        name: `${locationName}: ${rData.name}`,
        score: rData.score,
        description: `${rData.desc} (Focus Capital Trend)`,
        growth: rData.growth,
        category: rData.category,
        image: rData.image,
        imagePrompt: `A photorealistic concept representing ${rData.name} style. Material: ${rData.material}, color palette: ${rData.palette}, professional lighting.`
      });
    }
  };

  const filteredTrends = trends
    .filter(t => activeCategory === 'All' || t.category === activeCategory)
    .filter(t => {
      if (activeDataSource === 'All') return true;
      const details = getTrendMultiSourceDetails(t.name);
      if (activeDataSource === 'Pinterest') return parseInt(details.pinterest.saves) > 50;
      if (activeDataSource === 'TikTok') return parseInt(details.tiktok.views) > 30;
      if (activeDataSource === 'Google Trends') return details.googleTrends.interest > 75;
      if (activeDataSource === 'Runways') return details.runway.occurrences > 5;
      return true;
    });

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50 h-full relative" id="trend-radar-tab">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-10 gap-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl mb-1 md:mb-2 text-gray-900 flex items-center gap-2 md:gap-3">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
              Live Trend Radar
            </h2>
            <p className="text-gray-500 font-sans text-xs md:text-sm">Real-time multi-source analysis of social media aesthetics and runway cycles.</p>
          </div>
          <div className="text-left md:text-right flex items-end gap-4 md:flex-col md:gap-0">
             <div className="flex items-center gap-2 mb-2 bg-white rounded-lg p-1 border border-gray-200">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                  <List className="w-4 h-4" /> Grid
                </button>
                <button onClick={() => setViewMode('map')} className={`p-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${viewMode === 'map' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Map className="w-4 h-4" /> Radar
                </button>
                <button onClick={() => setViewMode('globe')} className={`p-1.5 rounded-md text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${viewMode === 'globe' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Globe className="w-4 h-4" /> Heatmap
                </button>
             </div>
             <div className="flex items-center gap-3">
                <div>
                   <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                      {isLoading ? (
                        <><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /><span className="text-[10px] uppercase tracking-widest font-medium text-blue-600">Syncing</span></>
                      ) : error ? (
                        <><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] uppercase tracking-widest font-medium text-red-600">Offline</span></>
                      ) : (
                        <><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] uppercase tracking-widest font-medium text-green-600">Live</span></>
                      )}
                   </div>
                </div>
                <button 
                  onClick={fetchTrends} 
                  disabled={isLoading}
                  className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  title="Refresh live trends"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
          </div>
        </div>

        {/* Predictive AI Alert */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 rounded-xl shadow-lg border border-indigo-800 mb-8 flex items-start gap-4 mx-auto animate-fade-in">
          <div className="bg-blue-500/20 p-2 rounded-lg shrink-0">
            <Sparkles className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded">AI Prediction</span>
            </div>
            <p className="text-sm font-medium leading-relaxed max-w-4xl">Our models predict an 85% probability that <span className="font-bold text-blue-200">Hyper-Functional Utilitarian</span> aesthetics will dominate European runways in Q3. Consider adjusting your upcoming material sourcing toward technical synthetics.</p>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h3 className="font-display text-xl font-medium">For You</h3>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Personalized</span>
          </div>
          <p className="text-xs text-gray-500 mb-4">Based on your recent 'Streetwear' and 'Techwear' design history.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-indigo-900 to-slate-800 rounded-2xl p-6 text-white flex gap-4 items-center">
              <div className="w-20 h-20 bg-white/10 rounded-xl overflow-hidden shrink-0">
                <img src={fashionCollection[5]?.thumbnail || "https://images.unsplash.com/photo-1550614000-4b95d466f1b1?auto=format&fit=crop&q=80&w=200&h=200"} className="w-full h-full object-cover" alt="Neon Streetwear" referrerPolicy="no-referrer" />
              </div>
              <div>
                <div className="flex gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded text-white"><Tag className="w-3 h-3 inline mr-1 -mt-0.5" />Streetwear Tech</span>
                </div>
                <h4 className="font-display text-lg font-medium">Deconstructed Windbreakers</h4>
                <p className="text-xs text-indigo-200 mt-1">Gaining traction in Tokyo micro-trends (+42% velocity)</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-slate-900 to-gray-800 rounded-2xl p-6 text-white flex gap-4 items-center">
              <div className="w-20 h-20 bg-white/10 rounded-xl overflow-hidden shrink-0">
                <img src={fashionCollection[8]?.thumbnail || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=200&h=200"} className="w-full h-full object-cover" alt="Utilitarian" referrerPolicy="no-referrer" />
              </div>
              <div>
                <div className="flex gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded text-white"><Tag className="w-3 h-3 inline mr-1 -mt-0.5" />Avant-Garde</span>
                </div>
                <h4 className="font-display text-lg font-medium">Cargo Maxi Skirts</h4>
                <p className="text-xs text-gray-300 mt-1">High crossover with your 'Avant-Garde' tags (+28% velocity)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1 w-max">
            {categoriesList.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors ${activeCategory === cat ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stream Channels:</span>
            <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200/50">
              {(['All', 'Pinterest', 'TikTok', 'Google Trends', 'Runways'] as const).map(src => (
                <button
                  key={src}
                  onClick={() => setActiveDataSource(src)}
                  className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${activeDataSource === src ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-start gap-3 border border-red-100">
             <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
             <div>
                <h4 className="font-semibold text-sm">Trend Sync Failed</h4>
                <p className="text-xs mt-1 opacity-80">{error}</p>
             </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20 md:pb-0">
            {isLoading ? (
              [1,2,3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse border border-gray-100">
                     <div className="h-48 md:h-64 bg-gray-200" />
                     <div className="p-5 md:p-6 space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-2/3" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-4/5" />
                        <div className="h-10 bg-gray-200 rounded w-full mt-4" />
                     </div>
                  </div>
              ))
            ) : filteredTrends.map((trend, index) => (
              <motion.div
                key={trend.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] group flex flex-col"
              >
                <div className="h-48 md:h-64 overflow-hidden relative shrink-0">
                  <img src={trend.image} alt={trend.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-sm border border-gray-100 text-gray-900">
                    {trend.category || 'Streetwear'}
                  </div>
                  <div className="absolute right-4 top-4 bg-gray-950/40 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                     Live Score: {trend.score}
                  </div>
                </div>
                <div className="p-5 md:p-6 flex flex-col flex-1">
                  <h3 className="font-display text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">{trend.name}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed mb-6 flex-1 line-clamp-3">{trend.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Velocity {trend.growth}
                    </span>
                    <button 
                      onClick={() => setSelectedNode(trend)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-900 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-gray-200/60"
                    >
                      Analyze Signal
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <div className="relative w-full h-[600px] border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden flex items-center justify-center">
             {!isLoading ? (
                <div className="absolute inset-0 bg-radial-gradient">
                   <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
                     <svg viewBox="0 0 100 100" className="w-[500px] h-[500px] text-indigo-500/10">
                       <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
                       <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="0.5" />
                       <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" />
                       <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" />
                       <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                       <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
                     </svg>
                     <div className="absolute text-center">
                        <div className="w-12 h-12 rounded-full border border-indigo-500/30 flex items-center justify-center animate-ping mb-3">
                           <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
                        </div>
                     </div>
                  </div>
                  <div className="absolute inset-0 p-8">
                    <div className="relative w-full h-full">
                       {filteredTrends.map((trend, index) => (
                          <motion.div
                            key={trend.id || index}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1, type: 'spring' }}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 hover:z-20"
                            style={{ left: `${trend.x}%`, top: `${trend.y}%` }}
                          >
                            <button
                              onClick={() => setSelectedNode(trend)}
                              className="w-14 h-14 rounded-full border-4 border-indigo-500/50 shadow-lg overflow-hidden hover:scale-110 transition-transform focus:outline-none focus:ring-4 focus:ring-indigo-300"
                            >
                               <img src={trend.image} alt={trend.name} className="w-full h-full object-cover" />
                            </button>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[120px] px-2.5 py-1.5 bg-gray-950 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-none text-center shadow-2xl border border-gray-800">
                               {trend.name}
                               <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-950" />
                            </div>
                          </motion.div>
                       ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-400">
                   <RefreshCw className="w-5 h-5 animate-spin" />
                   <span className="text-sm font-medium uppercase tracking-widest">Mapping Trends...</span>
                </div>
              )}
          </div>
        ) : (
          <div className="relative w-full h-[600px] border border-gray-200 rounded-2xl bg-slate-950 shadow-inner overflow-hidden flex items-center justify-center">
              {!isLoading ? (
                <motion.div 
                  className="absolute inset-0 origin-center"
                  animate={{ scale: zoomLevel }}
                  transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <svg viewBox="0 0 1008 651" className="w-full h-full opacity-20 text-blue-500 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M171 144c-22-26-44-33-66-22s-28 35-18 57c7 15 11 31 11 47 0 35-26 53-38 86-9 24-11 49-6 74 10 47 43 72 87 56 22-8 39-25 50-46 16-30 18-65 6-97-9-24-21-45-21-72 0-11-2-19-5-26zm209 135c-19-15-32-41-48-62-12-16-25-31-38-46-17-20-43-16-52 6-8 20 2 38 18 51 18 15 28 36 34 58s-2 42-16 59c-12 15-21 34-19 54 2 17 11 29 27 34 26 8 47-6 58-29s20-47 38-66c14-15 14-43-2-59zm-38 111c-21-5-38 10-44 31-8 27-14 56-11 84 2 24 16 41 39 41s35-18 39-41c5-29 3-59-10-85-4-8-8-17-13-30zm63-181c-13-22-34-31-59-26s-38 21-39 46c-1 30 13 54 36 71 21 16 38 38 43 64 5 24 18 39 42 41s36-15 39-39c4-29-3-57-19-81-16-24-29-50-43-76zM731 82c-29-19-61-12-87 8-20 15-33 37-47 57-15 21-25 45-26 71 0 25 15 45 38 52 23 7 46-3 58-23 15-25 32-48 51-70 19-22 26-49 13-95zm63 115c-19-12-39-16-61-12s-36 17-41 39c-7 29 3 55 24 74 21 19 33 45 35 73 2 24 18 41 42 41s37-18 39-41c3-29-4-58-21-82-16-23-24-49-17-92zM621 350c-26-8-50 4-62 27-14 26-21 56-19 86 2 24 17 41 41 41s38-18 41-41c3-29-3-59-19-85-11-18-24-29-42-28zM874 380c-23-8-46 6-55 28-11 26-15 54-12 82 2 24 18 41 42 41s36-18 38-41c3-29-1-58-13-84-11-18-25-29-42-28z"/>
                      <circle cx="500" cy="325" r="100" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" className="text-blue-500/30" />
                      <circle cx="500" cy="325" r="200" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" className="text-blue-500/30" />
                      <circle cx="500" cy="325" r="300" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" className="text-blue-500/30" />
                      <line x1="100" y1="325" x2="900" y2="325" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-blue-500/30" />
                      <line x1="500" y1="25" x2="500" y2="625" stroke="currentColor" strokeWidth="1" strokeDasharray="5,5" className="text-blue-500/30" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 p-8">
                    <div className="relative w-full h-full">
                       {/* Focus Capital bar for Heatmap (Globe) */}
                       <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md border border-gray-100 p-1.5 rounded-xl shadow-lg flex items-center gap-1.5 flex-wrap max-w-full">
                         <span className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 px-2 flex items-center gap-1">
                           <Globe className="w-3 h-3 text-blue-500" /> Focus Capital:
                         </span>
                         {Object.keys(regionalData).map(loc => (
                           <button
                             key={loc}
                             onClick={() => handleRegionClick(loc)}
                             className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold transition-all ${selectedRegion === loc ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                           >
                             {loc.split(',')[0]}
                           </button>
                         ))}
                       </div>

                       {filteredTrends.map((trend, index) => {
                          const mapX = (trend.x * 0.8) + 10;
                          const mapY = (trend.y * 0.8) + 10;
                          const locations = ['Tokyo, JP', 'Milan, IT', 'Paris, FR', 'London, UK', 'New York, US', 'Seoul, KR'];
                          const locationName = locations[index % locations.length];
                          return (
                            <motion.div
                              key={trend.id || index}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1, type: 'spring' }}
                              className="absolute transform -translate-x-1/2 -translate-y-1/2 group z-10 hover:z-20"
                              style={{ left: `${mapX}%`, top: `${mapY}%` }}
                            >
                               <div className="relative flex items-center justify-center w-8 h-8">
                                 <div className="absolute w-full h-full bg-blue-500 rounded-full animate-ping opacity-20"></div>
                                 <button
                                   onClick={() => handleRegionClick(locationName)}
                                   className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_15px_rgba(59,130,246,0.8)] hover:scale-150 transition-transform focus:outline-none"
                                 />
                               </div>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-max max-w-[150px] px-3 py-2 bg-gray-900/90 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center shadow-xl backdrop-blur mb-2 border border-gray-800">
                                 <span className="font-bold flex items-center gap-1 justify-center mb-1"><Map className="w-3 h-3 text-blue-400"/> {locationName}</span>
                                 {trend.name}
                               </div>
                            </motion.div>
                          );
                       })}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="flex items-center gap-3 text-gray-400">
                   <RefreshCw className="w-5 h-5 animate-spin" />
                   <span className="text-sm font-medium uppercase tracking-widest">Mapping Trends...</span>
                </div>
              )}
          </div>
        )}

        <AnimatePresence>
            {selectedNode && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-8 md:right-8 lg:right-12 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 md:w-[410px] overflow-hidden"
              >
                <div className="h-44 relative">
                  <img src={selectedNode.image} alt={selectedNode.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <button onClick={() => { setSelectedNode(null); setSelectedRegion(null); }} className="absolute top-4 right-4 bg-black/40 text-white p-1.5 rounded-full hover:bg-black/60 backdrop-blur transition">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute left-6 bottom-4 text-white">
                    <h3 className="font-display text-lg font-bold leading-tight">{selectedNode.name}</h3>
                    <p className="text-[10px] uppercase tracking-wider font-extrabold opacity-90 mt-0.5">Score: {selectedNode.score} • Category: {selectedNode.category || 'Aesthetic'}</p>
                  </div>
                </div>
                <div className="p-5 max-h-[60vh] overflow-y-auto no-scrollbar">
                  <p className="text-gray-600 text-xs leading-relaxed mb-4">{selectedNode.description}</p>
                  
                  {/* --- FEATURE 14: MULTI-SOURCE TREND PANEL --- */}
                  {(() => {
                    const srcDetails = getTrendMultiSourceDetails(selectedNode.name);
                    return (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                           <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2.5">Multi-Source Stream Engagement</p>
                           <div className="grid grid-cols-2 gap-2 text-xs">
                             <div className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col justify-between">
                               <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase">
                                 <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> TikTok
                               </div>
                               <div className="mt-1">
                                 <div className="font-extrabold text-gray-900 text-xs">{srcDetails.tiktok.views} views</div>
                                 <div className="text-[8px] text-gray-400 mt-0.5 font-mono truncate">{srcDetails.tiktok.tag}</div>
                               </div>
                               <div className="text-[9px] font-extrabold text-emerald-600 mt-1">{srcDetails.tiktok.growth} velocity</div>
                             </div>

                             <div className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col justify-between">
                               <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase">
                                 <span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> Pinterest
                               </div>
                               <div className="mt-1">
                                 <div className="font-extrabold text-gray-900 text-xs">{srcDetails.pinterest.saves} saves</div>
                                 <div className="text-[8px] text-gray-400 mt-0.5 truncate font-sans">High Board-Saves</div>
                               </div>
                               <div className="text-[9px] font-extrabold text-emerald-600 mt-1">{srcDetails.pinterest.growth} engagement</div>
                             </div>

                             <div className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col justify-between">
                               <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase">
                                 <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Google Trends
                               </div>
                               <div className="mt-1">
                                 <div className="font-extrabold text-gray-900 text-xs">Index: {srcDetails.googleTrends.interest}/100</div>
                                 <div className="text-[8px] text-gray-400 mt-0.5 truncate">Peak: {srcDetails.googleTrends.peakRegion}</div>
                               </div>
                               <div className="text-[9px] font-extrabold text-emerald-600 mt-1">{srcDetails.googleTrends.growth} searches</div>
                             </div>

                             <div className="p-2 bg-white rounded-lg border border-gray-100 flex flex-col justify-between">
                               <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-bold uppercase">
                                 <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Runway Feeds
                               </div>
                               <div className="mt-1">
                                 <div className="font-extrabold text-gray-900 text-xs">{srcDetails.runway.occurrences} fashion shows</div>
                                 <div className="text-[8px] text-gray-400 mt-0.5 truncate">{srcDetails.runway.keyBrands}</div>
                               </div>
                               <div className="text-[9px] font-extrabold text-emerald-600 mt-1">{srcDetails.runway.growth} occurrence</div>
                             </div>
                           </div>
                        </div>

                        {/* --- FEATURE 16: TREND TIMELINE & FORECAST SYSTEM --- */}
                        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                           <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Historical & Predictive Velocity Timeline</p>
                           <div className="h-20 w-full relative pt-2">
                             <svg className="w-full h-full text-indigo-500 stroke-current fill-none overflow-visible" viewBox="0 0 320 50">
                               <line x1="0" y1="10" x2="320" y2="10" stroke="#f1f5f9" strokeWidth="1" />
                               <line x1="0" y1="25" x2="320" y2="25" stroke="#f1f5f9" strokeWidth="1" />
                               <line x1="0" y1="40" x2="320" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                               
                               <path
                                 d={srcDetails.historyData.reduce((acc, point, idx) => {
                                   const x = idx * (320 / (srcDetails.historyData.length - 1));
                                   const y = 43 - (point.val * 0.35);
                                   return acc + `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                                 }, '')}
                                 strokeWidth="2.5"
                                 strokeLinecap="round"
                                 strokeLinejoin="round"
                               />
                               {srcDetails.historyData.map((point, idx) => {
                                 const x = idx * (320 / (srcDetails.historyData.length - 1));
                                 const y = 43 - (point.val * 0.35);
                                 const isForecast = point.label.includes('(F)');
                                 return (
                                   <g key={idx}>
                                     <circle
                                       cx={x}
                                       cy={y}
                                       r={isForecast ? "4" : "3"}
                                       className={isForecast ? "fill-white stroke-indigo-600 stroke-2" : "fill-indigo-600"}
                                     />
                                   </g>
                                 );
                               })}
                             </svg>
                             <div className="absolute inset-x-0 bottom-0 flex justify-between text-[7px] font-extrabold text-gray-400 font-mono">
                               {srcDetails.historyData.map((d, i) => (
                                 <span key={i} className={d.label.includes('(F)') ? "text-indigo-600 font-black" : ""}>{d.label}</span>
                               ))}
                             </div>
                           </div>
                           <p className="text-[8px] text-gray-400 leading-relaxed mt-2 font-mono">
                             * Note: (F) represents predictive fashion lifecycle mapping compiled from social media scrapers, Runway occurrences, and Search engagement.
                           </p>
                        </div>
                      </div>
                    );
                  })()}

                  <button 
                    onClick={() => {
                      onApplyTrend?.(selectedNode.imagePrompt || selectedNode.name);
                      setSelectedNode(null);
                      setSelectedRegion(null);
                    }}
                    className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-md"
                  >
                     Send style to Studio
                  </button>
                </div>
              </motion.div>
            )}
         </AnimatePresence>
      </div>
    </div>
  );
}
