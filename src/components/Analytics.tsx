import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, Users, Eye, ArrowUpRight, Zap, Lightbulb, Activity, CheckCircle2, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { getUserDesigns } from '../firebase';
import { TabType } from '../types';

const timelineData: Record<string, { month: string, "Y2K Aesthetic": number, Techwear: number, "Minimalist Chic": number }[]> = {
  'Q1 2026': [
    { month: 'Jan', "Y2K Aesthetic": 40, "Techwear": 24, "Minimalist Chic": 74 },
    { month: 'Feb', "Y2K Aesthetic": 55, "Techwear": 28, "Minimalist Chic": 70 },
    { month: 'Mar', "Y2K Aesthetic": 60, "Techwear": 35, "Minimalist Chic": 65 },
  ],
  'Q2 2026': [
    { month: 'Apr', "Y2K Aesthetic": 85, "Techwear": 42, "Minimalist Chic": 62 },
    { month: 'May', "Y2K Aesthetic": 95, "Techwear": 55, "Minimalist Chic": 58 },
    { month: 'Jun', "Y2K Aesthetic": 110, "Techwear": 80, "Minimalist Chic": 55 },
  ],
  'Last 30 Days': [
    { month: 'Week 1', "Y2K Aesthetic": 90, "Techwear": 60, "Minimalist Chic": 50 },
    { month: 'Week 2', "Y2K Aesthetic": 95, "Techwear": 65, "Minimalist Chic": 45 },
    { month: 'Week 3', "Y2K Aesthetic": 105, "Techwear": 70, "Minimalist Chic": 40 },
    { month: 'Week 4', "Y2K Aesthetic": 115, "Techwear": 85, "Minimalist Chic": 35 },
  ],
  'Last 7 Days': [
    { month: 'Mon', "Y2K Aesthetic": 100, "Techwear": 75, "Minimalist Chic": 30 },
    { month: 'Tue', "Y2K Aesthetic": 102, "Techwear": 78, "Minimalist Chic": 28 },
    { month: 'Wed', "Y2K Aesthetic": 105, "Techwear": 80, "Minimalist Chic": 27 },
    { month: 'Thu', "Y2K Aesthetic": 108, "Techwear": 82, "Minimalist Chic": 25 },
    { month: 'Fri', "Y2K Aesthetic": 112, "Techwear": 85, "Minimalist Chic": 24 },
    { month: 'Sat', "Y2K Aesthetic": 118, "Techwear": 90, "Minimalist Chic": 22 },
    { month: 'Sun', "Y2K Aesthetic": 120, "Techwear": 95, "Minimalist Chic": 20 },
  ]
};

const mockKeywordData = [
  { keyword: 'Silver Hardware', searches: 45000 },
  { keyword: 'Asymmetrical Hemline', searches: 38000 },
  { keyword: 'Translucent Fabrics', searches: 62000 },
  { keyword: 'Oversized Blazer', searches: 85000 },
];

const efficiencyTips = [
  "Your minimalist palettes are under-performing against current 'Neon Cyber' trajectory.",
  "Consider merging traditional tailoring with technical materials for a 15% predicted engagement boost.",
  "Streetwear details on formal silhouettes show an active upwards trend this quarter.",
  "Your last 3 designs align strongly with Avant-Garde trends; lean further into asymmetry."
];

const generateCustomData = (start: string, end: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startM = start ? new Date(start).getMonth() : 0;
  const endM = end ? new Date(end).getMonth() : 11;
  const data = [];
  
  const actualStart = startM <= endM ? startM : endM;
  const actualEnd = startM <= endM ? endM : startM;
  
  for (let i = actualStart; i <= actualEnd; i++) {
    const seed = i * 15 + start.length;
    data.push({
      month: months[i % 12],
      "Y2K Aesthetic": Math.abs((seed * 31) % 80) + 40,
      "Techwear": Math.abs((seed * 47) % 70) + 20,
      "Minimalist Chic": Math.abs((seed * 67) % 60) + 30
    });
  }
  if (data.length === 0) {
    data.push({ month: 'Custom', "Y2K Aesthetic": 60, "Techwear": 40, "Minimalist Chic": 50 });
  }
  return data;
};

export function Analytics({ setActiveTab }: { setActiveTab?: (tab: TabType) => void }) {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rangeType, setRangeType] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<string>('Q2 2026');
  const [startDate, setStartDate] = useState<string>('2026-04-01');
  const [endDate, setEndDate] = useState<string>('2026-06-30');
  const [keywordData, setKeywordData] = useState(mockKeywordData);
  const [efficiencyScore, setEfficiencyScore] = useState(84);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const liveDesigns = await getUserDesigns();
        setDesigns(liveDesigns || []);
      } catch (err) {
        console.error("Failed to load designs for Analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const chartData = useMemo(() => {
    if (rangeType === 'preset') {
      return timelineData[selectedPreset] || timelineData['Q2 2026'];
    } else {
      return generateCustomData(startDate, endDate);
    }
  }, [rangeType, selectedPreset, startDate, endDate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSuggestion((prev) => (prev + 1) % efficiencyTips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { id: 1, label: 'Trend Accuracy', value: '94.2%', icon: TrendingUp, change: '+2.1%', up: true },
    { id: 2, label: 'Generations', value: '1,204', icon: Eye, change: '+12%', up: true },
    { id: 3, label: 'User Adoption', value: '8.4k', icon: Users, change: '+5.4%', up: true },
    { id: 4, label: 'Design Efficiency', value: `${efficiencyScore}/100`, icon: Activity, change: '+5', up: true },
  ];

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50 h-full">
      <div className="max-w-6xl mx-auto flex flex-col h-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 gap-6">
          <div>
            <h2 className="font-display text-2xl md:text-3xl mb-1 md:mb-2 text-gray-900 flex items-center gap-2 md:gap-3">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
              Platform Analytics
            </h2>
            <p className="text-gray-500 font-sans text-xs md:text-sm">Comprehensive breakdown of your generative studio metrics.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-8 h-8 border-2 border-gray-950 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[11px] font-mono tracking-widest text-gray-400 uppercase animate-pulse">Computing metrics from design repository...</p>
          </div>
        ) : designs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-gray-100 rounded-3xl shadow-sm max-w-2xl mx-auto w-full my-6">
            <div className="relative mb-8 w-44 h-44 flex items-center justify-center">
              {/* Outer decorative ring */}
              <div className="absolute inset-0 bg-gray-50/50 rounded-full scale-95 animate-pulse" />
              <div className="absolute w-36 h-36 border border-dashed border-gray-200 rounded-full animate-spin [animation-duration:60s]" />
              
              {/* Analytics growth / bento grid representation SVG */}
              <svg className="w-20 h-20 text-gray-400 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.25">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M9 3v18M15 3v18" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 16 3-3 3 2 6-6" />
                <circle cx="18" cy="9" r="1" fill="currentColor" />
              </svg>

              {/* Float trend badge & spark lines */}
              <div className="absolute top-3 right-4 p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-xs border border-emerald-100 animate-bounce [animation-duration:3.5s]">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="absolute bottom-6 left-2 p-2 bg-gray-900 text-white rounded-xl shadow-xs border border-gray-800 animate-bounce [animation-duration:5s]">
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Metrics Calibration Pending</h3>
            <p className="text-gray-500 font-sans text-xs md:text-sm max-w-sm leading-relaxed mb-8">
              We require active telemetry data to compile your fashion studio's trend accuracy scores, search term growth charts, and workflow efficiency.
            </p>
            <button
              onClick={() => setActiveTab && setActiveTab('studio')}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              Begin Your First Design
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            {/* Date Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">Filter Analysis Range</p>
                  <p className="text-[10px] text-gray-400">Select pre-computed segments or set a custom interval</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-1">
                  <button 
                    onClick={() => setRangeType('preset')}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${rangeType === 'preset' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Presets
                  </button>
                  <button 
                    onClick={() => setRangeType('custom')}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${rangeType === 'custom' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Custom Range
                  </button>
                </div>
                
                {rangeType === 'preset' ? (
                  <select 
                    value={selectedPreset}
                    onChange={(e) => setSelectedPreset(e.target.value)}
                    className="appearance-none bg-white border border-gray-200 text-gray-900 text-xs font-semibold rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-gray-900 shadow-sm cursor-pointer"
                  >
                    <option value="Q2 2026">Q2 2026 (Apr - Jun)</option>
                    <option value="Q1 2026">Q1 2026 (Jan - Mar)</option>
                    <option value="Last 30 Days">Last 30 Days (Weekly)</option>
                    <option value="Last 7 Days">Last 7 Days (Daily)</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-white border border-gray-200 text-gray-900 text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900 shadow-sm"
                    />
                    <span className="text-xs text-gray-400">to</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white border border-gray-200 text-gray-900 text-xs font-semibold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-900 shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {metrics.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden"
                >
                  {m.label === 'Design Efficiency' && (
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full opacity-10 blur-xl"></div>
                  )}
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className={`p-2 rounded-lg ${m.label === 'Design Efficiency' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>
                      <m.icon className="w-5 h-5" />
                    </div>
                    <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${m.label === 'Design Efficiency' ? 'text-emerald-700 bg-emerald-100' : 'text-green-600 bg-green-50'}`}>
                      {m.change} <ArrowUpRight className="w-3 h-3" />
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1 relative z-10">{m.label}</p>
                  <h3 className="font-display text-2xl md:text-3xl font-medium relative z-10">{m.value}</h3>
                </motion.div>
              ))}
            </div>

            {/* Smart Suggestion Engine */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 md:p-8 shadow-lg mb-8 flex flex-col md:flex-row items-center gap-6 text-white"
            >
              <div className="flex-shrink-0 p-4 bg-white/10 rounded-2xl backdrop-blur-md">
                <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400/20" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">Smart Suggestion Engine</span>
                  <span className="text-[10px] font-medium text-gray-400">updating dynamically</span>
                </div>
                <div className="h-12 relative overflow-hidden flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeSuggestion}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      className="text-sm md:text-base font-medium text-gray-200 leading-relaxed max-w-2xl absolute"
                    >
                      "{efficiencyTips[activeSuggestion]}"
                    </motion.p>
                  </AnimatePresence>
                </div>
                <div className="flex gap-2 mt-2">
                   {efficiencyTips.map((_, i) => (
                     <button key={i} onClick={() => setActiveSuggestion(i)} className={`w-1.5 h-1.5 justify-center rounded-full transition-colors ${i === activeSuggestion ? 'bg-white' : 'bg-white/20'}`} />
                   ))}
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl border border-white/10 w-full md:w-48">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 mb-2 text-center">Score Delta</span>
                <div className="font-display text-4xl text-emerald-400 font-medium tracking-tight mb-1">+12%</div>
                <span className="text-xs text-gray-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Optimal Alignment</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                 <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h3 className="font-display font-medium text-lg">Interactive Trend Growth</h3>
                    <div className="text-xs font-mono font-medium text-gray-400 uppercase tracking-wider bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      {rangeType === 'preset' ? selectedPreset : `${startDate} to ${endDate}`}
                    </div>
                 </div>
                 <div className="flex-1 w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                       <defs>
                         <linearGradient id="colorY2k" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                         </linearGradient>
                         <linearGradient id="colorTechwear" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                         </linearGradient>
                         <linearGradient id="colorMinimalist" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#64748b" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                       <Tooltip 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                         labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                       />
                       <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                       <Area type="monotone" dataKey="Y2K Aesthetic" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorY2k)" />
                       <Area type="monotone" dataKey="Techwear" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTechwear)" />
                       <Area type="monotone" dataKey="Minimalist Chic" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorMinimalist)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
               </motion.div>
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                 <h3 className="font-display font-medium text-lg mb-6">Keyword Search Volume</h3>
                 <div className="flex-1 w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={keywordData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                       <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                       <YAxis dataKey="keyword" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} width={120} />
                       <Tooltip
                         cursor={{ fill: '#f8fafc' }}
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                       />
                       <Bar dataKey="searches" fill="#1e293b" radius={[0, 4, 4, 0]} barSize={24} />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </motion.div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
