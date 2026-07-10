import React, { useState, useMemo, useEffect } from 'react';
import { History, RotateCcw, Tag, Search, X, Trash2, Sparkles, ArrowRight, Folder, FolderPlus, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getUserDesigns, deleteUserDesign } from '../firebase';
import { TabType } from '../types';

function getTagsFromRequirements(prompt: string, material: string): string[] {
  const text = `${prompt} ${material}`.toLowerCase();
  const tags: string[] = [];
  
  if (text.includes('street') || text.includes('hoodie') || text.includes('sneaker') || text.includes('oversized')) tags.push('Streetwear');
  if (text.includes('avant') || text.includes('garde') || text.includes('asymmetrical') || text.includes('unconventional')) tags.push('Avant-Garde');
  if (text.includes('sustainable') || text.includes('recycle') || text.includes('organic') || text.includes('eco')) tags.push('Sustainable');
  if (text.includes('minimal') || text.includes('clean') || text.includes('simple') || text.includes('slip')) tags.push('Minimalist');
  if (text.includes('tech') || text.includes('utility') || text.includes('strap') || text.includes('cargo') || text.includes('gabardine')) tags.push('Techwear');
  
  if (tags.length === 0) tags.push('Contemporary');
  return tags;
}

function formatTimeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return 'Just now';
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } catch (e) {
    return 'Recent';
  }
}

export function HistoryTab({ onRedo, setActiveTab }: { onRedo: (prompt: string, material: string, palette: string) => void; setActiveTab?: (tab: TabType) => void }) {
  const [designs, setDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(['blue velvet textures', 'avant-garde', 'neon streetwear']);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  // --- DESIGN COLLECTIONS SYSTEM ---
  const [collections, setCollections] = useState<string[]>(() => {
    const saved = localStorage.getItem('couture_collections');
    return saved ? JSON.parse(saved) : ['All Sketches', 'Paris Autumn 2026', 'Cyberpunk Athleisure', 'Minimalist Linen'];
  });
  const [activeCollection, setActiveCollection] = useState<string>('All Sketches');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [designCollectionsMap, setDesignCollectionsMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('couture_design_collections_map');
    return saved ? JSON.parse(saved) : {};
  });

  const saveCollections = (cols: string[]) => {
    localStorage.setItem('couture_collections', JSON.stringify(cols));
  };

  const saveDesignCollectionsMap = (map: Record<string, string>) => {
    localStorage.setItem('couture_design_collections_map', JSON.stringify(map));
  };

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim() || collections.includes(newCollectionName.trim())) return;
    const updated = [...collections, newCollectionName.trim()];
    setCollections(updated);
    saveCollections(updated);
    setNewCollectionName('');
    setShowAddCollection(false);
  };

  const handleAssignCollection = (designId: string, colName: string) => {
    const updated = { ...designCollectionsMap, [designId]: colName };
    setDesignCollectionsMap(updated);
    saveDesignCollectionsMap(updated);
  };

  useEffect(() => {
    async function loadDesigns() {
      try {
        setLoading(true);
        const liveDesigns = await getUserDesigns();
        setDesigns(liveDesigns || []);
      } catch (err) {
        console.error("Failed to load user designs from Firestore:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDesigns();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim() !== '') {
      if (!recentSearches.includes(searchQuery.trim())) {
        setRecentSearches(prev => [searchQuery.trim(), ...prev].slice(0, 5));
      }
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this design from history?")) {
      try {
        if (!id.startsWith('mock')) {
          await deleteUserDesign(id);
        }
        setDesigns(prev => prev.filter(d => d.id !== id));
      } catch (err) {
        console.error("Failed to delete design from Firestore:", err);
      }
    }
  };

  const history = useMemo(() => {
    return designs.map(item => ({
      ...item,
      date: formatTimeAgo(item.createdAt),
      tags: getTagsFromRequirements(item.prompt, item.material)
    }));
  }, [designs]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tags.add('All');
    history.forEach(item => item.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [history]);

  const filteredHistory = history.filter(item => {
    const matchesTag = activeTag === 'All' || item.tags.includes(activeTag);
    const matchesCollection = activeCollection === 'All Sketches' || designCollectionsMap[item.id] === activeCollection;
    const matchesSearch = item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.material.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.palette.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesCollection && matchesSearch;
  });

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50 h-full print-container">
      <div className="max-w-6xl mx-auto flex flex-col h-full">
        
        {/* Printable-only elegant header */}
        <div className="print-only-header">
          <h1 className="font-display text-3xl font-bold tracking-tight text-gray-900">Couture AI Atelier</h1>
          <p className="text-xs font-mono text-gray-500 mt-1">Design History & Archive — Generated on {new Date().toLocaleDateString()}</p>
        </div>

        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-8 md:mb-12 gap-6 print:mb-6">
          <div className="print:block">
            <h2 className="font-display text-2xl md:text-3xl mb-1 md:mb-2 text-gray-900 dark:text-white flex items-center gap-2 md:gap-3">
              <History className="w-6 h-6 md:w-8 md:h-8 text-gray-400 dark:text-gray-500 no-print" />
              Atelier History
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-sans text-xs md:text-sm no-print">Review past generations organized by style categories.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 no-print items-center w-full sm:w-auto">
            <div className="flex flex-col gap-2 relative z-10 w-full sm:w-auto">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Semantic Search (e.g. 'blue velvet')..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              {recentSearches.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-gray-400">Recent Searches:</span>
                  {recentSearches.map((search, i) => (
                    <button 
                      key={i} 
                      onClick={() => setSearchQuery(search)}
                      className="text-[10px] font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full px-2 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 self-start sm:self-auto shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${
                  viewMode === 'grid' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${
                  viewMode === 'timeline' 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' 
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                Timeline
              </button>
            </div>

            <div className="flex bg-white dark:bg-gray-900 mx-auto sm:mx-0 border border-gray-200 dark:border-gray-800 rounded-lg p-1 overflow-x-auto max-w-full hide-scrollbar self-start shadow-xs">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTag === tag ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {tag !== 'All' && <Tag className="w-3 h-3" />} {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DESIGN COLLECTIONS / FOLDERS ROW */}
        <div className="mb-8 border-b border-gray-200/60 pb-6 no-print">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-gray-500" /> Active Design Collections
            </h3>
            
            {!showAddCollection ? (
              <button
                onClick={() => setShowAddCollection(true)}
                className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" /> Create Collection
              </button>
            ) : (
              <form onSubmit={handleCreateCollection} className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder="Collection Name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-none"
                />
                <button type="submit" className="p-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setShowAddCollection(false)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            {collections.map(col => {
              const active = activeCollection === col;
              // Count designs in this collection
              const count = col === 'All Sketches' 
                ? history.length 
                : history.filter(h => designCollectionsMap[h.id] === col).length;

              return (
                <button
                  key={col}
                  onClick={() => setActiveCollection(col)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                    active
                      ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Folder className={`w-3.5 h-3.5 ${active ? 'text-gray-100' : 'text-gray-400'}`} />
                  <span>{col}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${active ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-8 h-8 border-2 border-gray-950 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[11px] font-mono tracking-widest text-gray-400 uppercase animate-pulse">Retrieving history from database...</p>
          </div>
        ) : designs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-4 text-center bg-white border border-gray-100 rounded-3xl shadow-sm max-w-2xl mx-auto w-full my-6">
            <div className="relative mb-8 w-44 h-44 flex items-center justify-center">
              {/* Outer decorative ring */}
              <div className="absolute inset-0 bg-gray-50/50 rounded-full scale-95 animate-pulse" />
              <div className="absolute w-36 h-36 border border-dashed border-gray-200 rounded-full animate-spin [animation-duration:50s]" />
              
              {/* Premium wireframe mannequin/sketch SVG */}
              <svg className="w-20 h-20 text-gray-400 z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v2m-3 3h6m-5.5 2h5m-4 3h3m-1.5 3v3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6a3 3 0 013-3 3 3 0 013 3c0 1.5-.5 3-1.5 4.5l-.5.75c-1 1.5-1 3.5 0 5l.5.75c1 1.5 1.5 3 1.5 4.5H7c0-1.5.5-3 1.5-4.5l.5-.75c1-1.5 1-3.5 0-5l-.5-.75C7.5 9 7 7.5 7 6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 21h6" />
              </svg>

              {/* Float sparkles & tape measure deco */}
              <div className="absolute top-3 left-4 p-2 bg-yellow-50 text-yellow-600 rounded-xl shadow-xs border border-yellow-100 animate-bounce [animation-duration:3s]">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="absolute bottom-6 right-2 p-2 bg-gray-900 text-white rounded-xl shadow-xs border border-gray-800 animate-bounce [animation-duration:4.5s]">
                <History className="w-3.5 h-3.5" />
              </div>
            </div>

            <h3 className="font-display text-xl font-bold text-gray-900 mb-2">Atelier Vault is Empty</h3>
            <p className="text-gray-500 font-sans text-xs md:text-sm max-w-sm leading-relaxed mb-8">
              Every high-fashion digital collection starts with a single stroke of imagination. Access our computational studio to materialize your first generation.
            </p>
            <button
              onClick={() => setActiveTab && setActiveTab('studio')}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
            >
              Begin Your First Design
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No designs found</h3>
            <p className="text-sm text-gray-500">We couldn't find any designs matching your search criteria.</p>
            <button 
              onClick={() => { setSearchQuery(''); setActiveTag('All'); }}
              className="mt-6 text-sm font-semibold text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Clear Search
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col group relative"
                >
                  <div 
                    onClick={() => setSelectedPreview(item.imageUrl)}
                    className="aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-950 relative cursor-zoom-in"
                  >
                    <img src={item.imageUrl} alt={item.prompt} referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center opacity-0 hover:opacity-100 duration-300">
                      <span className="text-white text-[10px] font-semibold tracking-wider uppercase bg-gray-900/80 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                        <Search className="w-3 h-3" /> Quick Preview
                      </span>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-3 py-1 text-[10px] items-center gap-1 font-bold uppercase tracking-wider rounded-lg shadow-sm flex flex-col items-end">
                      <span className="text-gray-900 dark:text-white">{item.date}</span>
                    </div>
                    <div className="absolute top-4 left-4 flex flex-col items-start gap-1">
                      {item.tags.map(t => (
                        <span key={t} className="bg-gray-900/80 backdrop-blur-sm text-white px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded shadow-sm border border-white/10">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-5 md:p-6 flex flex-col flex-1">
                    <p className="text-gray-800 dark:text-gray-200 text-sm font-medium leading-relaxed mb-4 line-clamp-3">{item.prompt}</p>
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className="px-2 py-1 bg-gray-50 dark:bg-gray-850 text-gray-500 dark:text-gray-400 rounded text-[10px] uppercase font-semibold border border-gray-100 dark:border-gray-800">{item.material}</span>
                      <span className="px-2 py-1 bg-gray-50 dark:bg-gray-850 text-gray-500 dark:text-gray-400 rounded text-[10px] uppercase font-semibold border border-gray-100 dark:border-gray-800">{item.palette}</span>
                    </div>

                    {/* Collection Assignment Dropdown */}
                    <div className="flex items-center gap-1.5 mb-6 text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 rounded-lg p-2">
                      <Folder className="w-3.5 h-3.5 text-gray-400" />
                      <select
                        value={designCollectionsMap[item.id] || 'All Sketches'}
                        onChange={(e) => handleAssignCollection(item.id, e.target.value)}
                        className="bg-transparent border-none text-[11px] font-medium text-gray-700 dark:text-gray-300 focus:ring-0 focus:outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white w-full"
                      >
                        <option value="All Sketches">📁 Unassigned Sketches</option>
                        {collections.filter(c => c !== 'All Sketches').map(c => (
                          <option key={c} value={c}>📁 {c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2 mt-auto no-print">
                      <button
                        onClick={() => onRedo(item.prompt, item.material, item.palette)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl text-xs md:text-sm font-medium uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" /> Redo in Studio
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-3 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 rounded-xl transition-colors cursor-pointer"
                        title="Delete Design"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* TIMELINE VIEW (CHRONOLOGICAL PREV ITERATIONS CONNECTED BY FRAMER-MOTION) */
          <div className="relative border-l border-gray-200 dark:border-gray-800 ml-4 md:ml-8 pl-6 md:pl-10 space-y-12 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="relative group flex flex-col md:flex-row gap-6 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all"
                >
                  {/* Glowing Timeline Connector Pin */}
                  <div className="absolute -left-[31px] md:-left-[47px] top-8 w-4 h-4 bg-white dark:bg-gray-900 border-2 border-indigo-600 dark:border-indigo-400 rounded-full flex items-center justify-center transition-all group-hover:scale-125 z-10">
                    <div className="w-1.5 h-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-ping" />
                  </div>

                  {/* Left Side: Thumbnail Preview */}
                  <div 
                    onClick={() => setSelectedPreview(item.imageUrl)}
                    className="w-full md:w-44 aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 shrink-0 cursor-zoom-in relative group/thumb shadow-sm"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 duration-300">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Right Side: Details & Actions */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Meta info header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map(t => (
                            <span key={t} className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest rounded border border-indigo-100/30">
                              {t}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                          {item.date}
                        </span>
                      </div>

                      {/* Prompt and description */}
                      <h4 className="font-sans font-medium text-sm text-gray-850 dark:text-gray-200 leading-relaxed mb-4">
                        {item.prompt}
                      </h4>

                      {/* Specifications */}
                      <div className="flex gap-2 flex-wrap mb-4">
                        <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 rounded text-[10px] uppercase font-semibold border border-gray-100 dark:border-gray-800">
                          {item.material}
                        </span>
                        <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 rounded text-[10px] uppercase font-semibold border border-gray-100 dark:border-gray-800">
                          {item.palette}
                        </span>
                      </div>

                      {/* Collection Assignment Selector */}
                      <div className="flex items-center gap-1.5 mb-6 text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/10 rounded-lg p-2 max-w-sm">
                        <Folder className="w-3.5 h-3.5 text-gray-400" />
                        <select
                          value={designCollectionsMap[item.id] || 'All Sketches'}
                          onChange={(e) => handleAssignCollection(item.id, e.target.value)}
                          className="bg-transparent border-none text-[11px] font-medium text-gray-700 dark:text-gray-300 focus:ring-0 focus:outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white w-full"
                        >
                          <option value="All Sketches">📁 Unassigned Sketches</option>
                          {collections.filter(c => c !== 'All Sketches').map(c => (
                            <option key={c} value={c}>📁 {c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-2 no-print">
                      <button
                        onClick={() => onRedo(item.prompt, item.material, item.palette)}
                        className="flex-1 max-w-xs flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Redo in Studio
                      </button>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 rounded-xl transition-colors cursor-pointer"
                        title="Delete Design"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Quick Preview Overlay */}
      <AnimatePresence>
        {selectedPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPreview(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-zoom-out"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl max-w-xl w-full mx-4 aspect-[4/5] md:aspect-[3/4]"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={selectedPreview} alt="Quick Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedPreview(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
