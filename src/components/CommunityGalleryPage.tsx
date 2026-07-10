import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, Tag, ShoppingCart, Sparkles, User, ArrowLeftRight, Check, 
  ChevronRight, ArrowUpRight, Share2, DollarSign, Info, ShieldCheck, X, FileText, ThumbsUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, getUserDesigns, toggleFavorite, getUserFavorites } from '../firebase';

interface Comment {
  id: string;
  authorName: string;
  authorEmail: string;
  text: string;
  created: string;
}

interface CommunityDesign {
  id: string;
  title: string;
  prompt: string;
  material: string;
  palette: string;
  imageUrl: string;
  authorName: string;
  authorEmail: string;
  authorAvatar: string;
  votes: number;
  comments: Comment[];
  isCommercial: boolean;
  price: number;
  isLicensed?: boolean;
}

interface CommunityGalleryPageProps {
  onDeriveDesign: (prompt: string, material: string, palette: string, imageUrl: string) => void;
}

export function CommunityGalleryPage({ onDeriveDesign }: CommunityGalleryPageProps) {
  const [designs, setDesigns] = useState<CommunityDesign[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active design detail view modal
  const [selectedDesign, setSelectedDesign] = useState<CommunityDesign | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  
  // Commercial checkout modal
  const [checkoutDesign, setCheckoutDesign] = useState<CommunityDesign | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  // Sharing active design state
  const [userSavedSketches, setUserSavedSketches] = useState<any[]>([]);
  const [selectedSketchToShare, setSelectedSketchToShare] = useState<string>('');
  const [shareTitle, setShareTitle] = useState('');
  const [shareIsCommercial, setShareIsCommercial] = useState(false);
  const [sharePrice, setSharePrice] = useState('49');
  const [sharingSuccessMsg, setSharingSuccessMsg] = useState('');

  // Favorites collection state
  const [favoritedIds, setFavoritedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // Fetch community stream
  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/community-gallery');
      if (res.ok) {
        const data = await res.json();
        setDesigns(data.gallery);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
    
    // Load current user's sketches so they can share one to community
    async function loadUserSketches() {
      try {
        const sketches = await getUserDesigns();
        if (sketches && sketches.length > 0) {
          setUserSavedSketches(sketches);
          setSelectedSketchToShare(sketches[0].id || '');
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadUserSketches();

    // Load current user's favorites from Firestore
    async function loadFavorites() {
      try {
        const favs = await getUserFavorites();
        if (favs) {
          setFavoritedIds(favs.map(f => f.id));
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadFavorites();
  }, []);

  // Vote
  const handleVote = async (e: React.MouseEvent, designId: string) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/community-gallery/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: designId })
      });
      if (res.ok) {
        const data = await res.json();
        // Update local items state
        setDesigns(prev => prev.map(d => d.id === designId ? { ...d, votes: d.votes + 1 } : d));
        if (selectedDesign && selectedDesign.id === designId) {
          setSelectedDesign(prev => prev ? { ...prev, votes: prev.votes + 1 } : null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async (e: React.MouseEvent, item: CommunityDesign) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in to favorite community designs.");
      return;
    }
    const isCurrentlyFavorited = favoritedIds.includes(item.id);
    const newFavorited = !isCurrentlyFavorited;
    
    // Optimistic UI update
    if (newFavorited) {
      setFavoritedIds(prev => [...prev, item.id]);
    } else {
      setFavoritedIds(prev => prev.filter(id => id !== item.id));
    }
    
    try {
      await toggleFavorite({
        designId: item.id,
        title: item.title,
        prompt: item.prompt,
        material: item.material,
        palette: item.palette,
        imageUrl: item.imageUrl,
        authorName: item.authorName,
        authorEmail: item.authorEmail
      }, newFavorited);
    } catch (err) {
      console.error("Failed to toggle favorite: ", err);
      // Revert on error
      if (newFavorited) {
        setFavoritedIds(prev => prev.filter(id => id !== item.id));
      } else {
        setFavoritedIds(prev => [...prev, item.id]);
      }
    }
  };

  // Comment submission
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesign || !newCommentText.trim()) return;
    
    try {
      const res = await fetch('/api/community-gallery/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: selectedDesign.id,
          text: newCommentText,
          authorName: auth.currentUser?.displayName || 'Anonymous Designer',
          authorEmail: auth.currentUser?.email || 'anon@couture.ai'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setDesigns(data.gallery);
        
        // Find updated design to refresh local details
        const updated = data.gallery.find((d: any) => d.id === selectedDesign.id);
        if (updated) {
          setSelectedDesign(updated);
        }
        setNewCommentText('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Share active sketch
  const handleShareSketch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSketchToShare) return;
    const sketch = userSavedSketches.find(s => s.id === selectedSketchToShare);
    if (!sketch) return;

    try {
      const res = await fetch('/api/community-gallery/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: shareTitle || 'Unfinished Runway Silhouette',
          prompt: sketch.prompt,
          material: sketch.material || 'Raw Cotton Denim',
          palette: sketch.palette || 'Monochrome Slate',
          imageUrl: sketch.imageUrl,
          authorName: auth.currentUser?.displayName || 'Atelier Designer',
          authorEmail: auth.currentUser?.email || 'designer@couture.ai',
          isCommercial: shareIsCommercial,
          price: shareIsCommercial ? Number(sharePrice) : 0
        })
      });

      if (res.ok) {
        const data = await res.json();
        setDesigns(data.gallery);
        setShareTitle('');
        setSharingSuccessMsg('Congratulations! Your design has been published to the global Atelier Community Stream.');
        setTimeout(() => setSharingSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Buy commercial license
  const handlePurchaseLicense = async () => {
    if (!checkoutDesign) return;
    setCheckingOut(true);
    setCheckoutSuccess(false);

    setTimeout(() => {
      setDesigns(prev => prev.map(d => d.id === checkoutDesign.id ? { ...d, isLicensed: true } : d));
      setCheckingOut(false);
      setCheckoutSuccess(true);
    }, 2000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/20 h-full">
      <div className="max-w-6xl mx-auto flex flex-col h-full">
        
        {/* Title Header */}
        <div className="mb-8 border-b border-gray-100 dark:border-gray-900 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl mb-1 text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Atelier Community & Marketplace
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm font-sans">
              Upvote avant-garde sketches, participate in comments, and buy licensing rights for high-resolution vectors.
            </p>
          </div>
          
          <button 
            onClick={fetchGallery}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Refresh Stream
          </button>
        </div>

        {/* Global Toast Success banner */}
        {sharingSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 mb-8 shadow-sm dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400"
          >
            <Check className="w-4 h-4 text-emerald-600 shrink-0" /> {sharingSuccessMsg}
          </motion.div>
        )}

        {/* TOP COMPONENT: PUBLISH YOUR WORK SECTION */}
        {userSavedSketches.length > 0 && (
          <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Publish My Design Sketch</h3>
            <p className="text-xs text-gray-400 mb-6">Choose one of your saved sketches in Couture AI and set its marketplace parameters to share with the world.</p>

            <form onSubmit={handleShareSketch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Select Sketchbook Design</label>
                <select
                  value={selectedSketchToShare}
                  onChange={(e) => setSelectedSketchToShare(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg outline-none text-gray-900 dark:text-white"
                >
                  {userSavedSketches.map(s => (
                    <option key={s.id} value={s.id}>{s.prompt.substring(0, 35)}...</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Collection Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neo-Gothic Draped Tulle"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg outline-none text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1.5">Licensing Model</label>
                <div className="flex gap-2">
                  <select
                    value={shareIsCommercial ? 'commercial' : 'free'}
                    onChange={(e) => setShareIsCommercial(e.target.value === 'commercial')}
                    className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg outline-none text-gray-900 dark:text-white"
                  >
                    <option value="free">Creative Commons (Free)</option>
                    <option value="commercial">Commercial Premium</option>
                  </select>
                  {shareIsCommercial && (
                    <input
                      type="number"
                      value={sharePrice}
                      onChange={(e) => setSharePrice(e.target.value)}
                      className="w-16 text-xs px-2 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg outline-none text-gray-900 dark:text-white text-center font-semibold"
                    />
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Publish to Gallery
              </button>
            </form>
          </div>
        )}

        {/* Navigation Tabs for All vs Favorites */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-8 gap-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
              activeTab === 'all' 
                ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            All Community Designs
            {activeTab === 'all' && (
              <motion.div 
                layoutId="activeTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'favorites' 
                ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-rose-500 text-rose-500' : ''}`} />
            My Favorites ({favoritedIds.length})
            {activeTab === 'favorites' && (
              <motion.div 
                layoutId="activeTabUnderline" 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400"
              />
            )}
          </button>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-mono tracking-widest text-gray-400 uppercase animate-pulse">Syncing Community Sourcing Streams...</p>
          </div>
        ) : activeTab === 'favorites' && designs.filter(d => favoritedIds.includes(d.id)).length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-xs">
            <Heart className="w-12 h-12 text-rose-300 dark:text-rose-700 mx-auto mb-4 animate-pulse" />
            <h4 className="font-display font-bold text-gray-800 dark:text-gray-200 text-base mb-1">No favorited designs yet</h4>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-sm mx-auto leading-relaxed">
              When browsing the Atelier Community stream, tap the heart icon on any design to save it to your personal favorites collection in Firestore.
            </p>
            <button
              onClick={() => setActiveTab('all')}
              className="mt-5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Browse Gallery
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {designs
              .filter(d => activeTab === 'all' || favoritedIds.includes(d.id))
              .map((item) => {
                const isFavorited = favoritedIds.includes(item.id);
                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedDesign(item)}
                    className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:border-indigo-100 dark:hover:border-indigo-900 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col relative"
                  >
                    {/* Visual sketch container */}
                    <div className="aspect-[3/4] overflow-hidden relative bg-gray-50">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Licensing stamp in corner */}
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        {item.isCommercial ? (
                          <span className="px-2.5 py-1 bg-indigo-600/90 backdrop-blur-md text-white font-bold text-[8px] uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-0.5">
                            <DollarSign className="w-2.5 h-2.5" /> ${item.price} License
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-600/90 backdrop-blur-md text-white font-bold text-[8px] uppercase tracking-wider rounded-lg shadow-sm">
                            Open-Source CC
                          </span>
                        )}
                        {item.isLicensed && (
                          <span className="px-2.5 py-1 bg-amber-500 text-gray-950 font-bold text-[8px] uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> Licensed
                          </span>
                        )}
                      </div>

                      {/* Favorite Heart Button top-right */}
                      <button
                        onClick={(e) => handleToggleFavorite(e, item)}
                        className="absolute top-3 right-3 p-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-md hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-10 cursor-pointer"
                        title={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
                      >
                        <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-gray-400 dark:text-gray-500 hover:text-rose-500'}`} />
                      </button>

                      {/* Quick-action Upvote bottom-right */}
                      <button
                        onClick={(e) => handleVote(e, item.id)}
                        className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-gray-800 rounded-full shadow-md text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                        title="Upvote this runway outline"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-indigo-500" /> {item.votes}
                      </button>
                    </div>

                    {/* Content description */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <img 
                            src={item.authorAvatar} 
                            alt={item.authorName} 
                            className="w-5 h-5 rounded-full object-cover border border-gray-200"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] text-gray-400 font-medium">{item.authorName}</span>
                        </div>

                        <h4 className="font-display font-medium text-sm text-gray-900 dark:text-white line-clamp-1 mb-1">{item.title}</h4>
                        <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2">{item.prompt}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5 text-indigo-400" /> {item.votes} Upvotes
                        </span>
                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> {item.comments.length} Specs
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

      </div>

      {/* DYNAMIC MODAL 1: SPECIFICATIONS & COMMUNITY COMMENTS FEED */}
      <AnimatePresence>
        {selectedDesign && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-gray-100 dark:border-gray-800 relative"
            >
              <button
                onClick={() => setSelectedDesign(null)}
                className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-gray-800/80 hover:bg-white text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full shadow z-10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Left Side: Large Image + Action buttons */}
              <div className="md:w-1/2 bg-gray-50 dark:bg-black/20 flex flex-col justify-between p-6 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-md max-h-[50vh] md:max-h-none mb-6">
                  <img src={selectedDesign.imageUrl} alt={selectedDesign.title} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2.5">
                    {/* Derive workflow copy */}
                    <button
                      onClick={() => {
                        onDeriveDesign(selectedDesign.prompt, selectedDesign.material, selectedDesign.palette, selectedDesign.imageUrl);
                        setSelectedDesign(null);
                      }}
                      className="flex-1 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                    >
                      <ArrowLeftRight className="w-4 h-4" /> Derive prompt to Studio
                    </button>

                    <button
                      onClick={(e) => handleToggleFavorite(e, selectedDesign)}
                      className={`px-4 py-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                        favoritedIds.includes(selectedDesign.id)
                          ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400'
                          : 'bg-white border-gray-200 text-gray-500 hover:text-rose-500 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
                      }`}
                      title={favoritedIds.includes(selectedDesign.id) ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart className={`w-4 h-4 ${favoritedIds.includes(selectedDesign.id) ? 'fill-rose-500' : ''}`} />
                    </button>

                    {selectedDesign.isCommercial && !selectedDesign.isLicensed && (
                      <button
                        onClick={() => {
                          setCheckoutDesign(selectedDesign);
                          setCheckoutSuccess(false);
                        }}
                        className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingCart className="w-4 h-4" /> Buy License
                      </button>
                    )}
                  </div>
                  
                  {selectedDesign.isLicensed && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-400 font-semibold">
                      <ShieldCheck className="w-4 h-4" /> You hold commercial clearance rights for this pattern outline.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Prompts details and comments list */}
              <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between h-[40vh] md:h-auto overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-xl font-bold text-gray-900 dark:text-white">{selectedDesign.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <img src={selectedDesign.authorAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                      <span className="text-xs text-gray-400">Published by <strong className="text-gray-700 dark:text-gray-300 font-semibold">{selectedDesign.authorName}</strong></span>
                    </div>
                  </div>

                  {/* Active specifications card */}
                  <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Designer Prompt Token</span>
                      <p className="text-xs text-gray-800 dark:text-gray-200 mt-1 select-all">{selectedDesign.prompt}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Material Fabric</span>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{selectedDesign.material}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Color Palette</span>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{selectedDesign.palette}</p>
                      </div>
                    </div>
                  </div>

                  {/* Comments lists */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Technical Spec Comments ({selectedDesign.comments.length})
                    </h4>

                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {selectedDesign.comments.map(c => (
                        <div key={c.id} className="p-3 bg-gray-50/50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-800/50 rounded-xl text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white">{c.authorName}</span>
                            <span className="text-[9px] text-gray-400">{c.created}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit new comment */}
                <form onSubmit={handleCommentSubmit} className="pt-4 border-t border-gray-100 dark:border-gray-800 mt-6 flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Provide technical feedback or notes..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl text-xs focus:outline-none text-gray-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs uppercase tracking-wider rounded-xl cursor-pointer dark:bg-white dark:text-gray-900"
                  >
                    Post Spec
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DYNAMIC MODAL 2: MARKETPLACE COMMERCIAL CHECKOUT AND DOWNLOADS */}
      <AnimatePresence>
        {checkoutDesign && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setCheckoutDesign(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-lg text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
                <ShoppingCart className="w-4 h-4" /> Atelier Commercial License checkout
              </div>

              {checkoutSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-gray-900 dark:text-white text-base">Clearance Rights Unlocked!</h4>
                    <p className="text-xs text-gray-400 mt-1">Couture licensing contract #CC-8422-93 has been signed and added to your wallet.</p>
                  </div>

                  <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-3 text-left">
                    <FileText className="w-8 h-8 text-indigo-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">Pattern blueprints and 4K vectors</div>
                      <div className="text-[10px] text-gray-400">PDF, CAD-ready DXF, and PNG layouts available.</div>
                    </div>
                    <button className="px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg text-[9px] font-bold uppercase tracking-wider ml-auto cursor-pointer">
                      Get PDF
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutDesign(null);
                      if (selectedDesign) {
                        setSelectedDesign(prev => prev ? { ...prev, isLicensed: true } : null);
                      }
                    }}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex gap-3">
                    <img src={checkoutDesign.imageUrl} className="w-16 h-20 object-cover rounded-xl border border-gray-200" />
                    <div>
                      <h4 className="font-display font-bold text-xs text-gray-900 dark:text-white">{checkoutDesign.title}</h4>
                      <p className="text-[10px] text-gray-400 line-clamp-2 mt-1">{checkoutDesign.prompt}</p>
                      <div className="text-indigo-600 dark:text-indigo-400 font-display font-semibold text-sm mt-1.5">${checkoutDesign.price} USD</div>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-center gap-2 text-gray-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      Unlimited commercial reproduction clearances.
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                      High-resolution Vector & CAD layouts included.
                    </div>
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center justify-between">
                    <span className="text-xs text-gray-400">Total charge:</span>
                    <span className="text-xl font-display font-bold text-gray-900 dark:text-white">${checkoutDesign.price}.00</span>
                  </div>

                  <button
                    disabled={checkingOut}
                    onClick={handlePurchaseLicense}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl cursor-pointer disabled:bg-indigo-400"
                  >
                    {checkingOut ? 'Processing secured order...' : 'Authorize Couture Checkout'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
