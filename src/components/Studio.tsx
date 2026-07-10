import React, { useState, useEffect, useRef } from 'react';
import { Upload, Wand2, Scissors, Type, Sparkles, Zap, Download, Bell, Lightbulb, GitCompare, X, Settings, Mic, Library, Search, GripVertical, Star, TrendingUp, Calendar, Folder, FolderPlus, Plus, Check, Share2, StickyNote, ExternalLink, Cpu, Paintbrush } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import { saveUserDesign } from '../firebase';
import { jsPDF } from 'jspdf';
import { csrfFetch, sanitizeInput } from '../utils/security.ts';
import { fashionCollection } from '../data/fashionImages.ts';
import { matchLookbookCache } from '../utils/imageCache.ts';
import { TechPackStudio } from './TechPackStudio';
import { MoodBoardStudio } from './MoodBoardStudio';
import { AdvancedStudioTools } from './AdvancedStudioTools';

interface StudioProps {
  initialState?: {prompt: string, material: string, palette: string} | null;
}

const getAdvisorSuggestion = (material: string, palette: string) => {
  const lowercaseMat = material.toLowerCase();
  const lowercasePal = palette.toLowerCase();
  
  if (lowercaseMat.includes('silk') && lowercasePal.includes('neon')) {
    return { title: 'High Contrast Alert', text: 'Neon colors on reflective silk may affect visual comfort. Consider a matte trim for accessibility.', type: 'warning' };
  }
  if (lowercaseMat.includes('denim') && lowercasePal.includes('earth')) {
    return { title: 'Classic Pairing', text: 'Structured denim with earth tones is a highly accessible and timeless fashion standard.', type: 'success' };
  }
  if (lowercaseMat.includes('leather') && lowercasePal.includes('pastel')) {
    return { title: 'Textural Contrast', text: 'Heavy leather with pastels creates a bold juxtaposition. Ensure pastel dyes hold colorfastness.', type: 'info' };
  }
  return { title: 'Harmonious Choice', text: 'This combination provides excellent visual balance and standard accessibility scaling.', type: 'success' };
};

export function Studio({ initialState }: StudioProps) {
  const loadState = () => {
    try {
      const saved = localStorage.getItem('studioState');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load saved state", e);
    }
    return null;
  };

  // Load initial states from URL if shared, or localStorage fallback
  const getUrlParam = (name: string): string => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  };

  const sharedPrompt = getUrlParam('prompt');
  const sharedMaterial = getUrlParam('material');
  const sharedPalette = getUrlParam('palette');
  const sharedImageUrl = getUrlParam('imageUrl');
  const sharedAnnotationsStr = getUrlParam('annotations');
  const isShared = getUrlParam('shared') === 'true';

  const savedState = !initialState ? loadState() : null;

  const [prompt, setPrompt] = useState(sharedPrompt || initialState?.prompt || savedState?.prompt || '');
  const [material, setMaterial] = useState(sharedMaterial || initialState?.material || savedState?.material || 'Silk & Satin');
  const [palette, setPalette] = useState(sharedPalette || initialState?.palette || savedState?.palette || 'Monochrome Brutalism');
  const [injectLiveTrend, setInjectLiveTrend] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(sharedImageUrl || null);
  const [studioMode, setStudioMode] = useState<'atelier' | 'remix' | 'techpack' | 'moodboard'>('atelier');

  // --- STATE FOR NEW COUTURE STUDIO FEATURES ---
  const [generationEngine, setGenerationEngine] = useState<'gemini_base' | 'fashion_finetuned'>('fashion_finetuned'); // Feature 29
  const [bodySize, setBodySize] = useState<'XS' | 'M' | 'L' | '3XL'>('M'); // Feature 38
  const [selectedFabric, setSelectedFabric] = useState<string>('Mulberry Silk'); // Feature 36
  const [showShortcutsMap, setShowShortcutsMap] = useState<boolean>(false); // Feature 32

  // Couture AI Cost-Saving Cache System (Pre-generated lookbook combinations to bypass live API fees)
  const [useCacheForFree, setUseCacheForFree] = useState<boolean>(true);
  const [cacheHitState, setCacheHitState] = useState<{ hit: boolean; msg: string; savedUsd: number } | null>(null);
  const [isPreGenerating, setIsPreGenerating] = useState<boolean>(false);
  const [preGenCount, setPreGenCount] = useState<number>(1954); // Representing 1,954/2000 combinations cached
  
  // Feature 27 (Manufacturing Integration)
  const [showManufacturing, setShowManufacturing] = useState<boolean>(false);
  const [mGarment, setMGarment] = useState<'hoodie' | 'tshirt' | 'tote' | 'scarf'>('hoodie');
  const [mSize, setMSize] = useState<string>('M');
  const [mRetailPrice, setMRetailPrice] = useState<number>(45);
  const [mOffsetX, setMOffsetX] = useState<number>(0);
  const [mOffsetY, setMOffsetY] = useState<number>(0);
  const [mScale, setMScale] = useState<number>(100);
  const [mOrderStatus, setMOrderStatus] = useState<'idle' | 'submitting' | 'submitted' | 'mockup_ready' | 'in_transit'>('idle');

  // Sticky-note annotations state
  interface Annotation {
    id: string;
    text: string;
    x: number;
    y: number;
    color: 'yellow' | 'pink' | 'blue' | 'green' | 'dark';
  }

  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    if (sharedAnnotationsStr) {
      try {
        return JSON.parse(decodeURIComponent(sharedAnnotationsStr));
      } catch (e) {
        console.error("Failed to parse shared annotations", e);
      }
    }
    return [];
  });
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState<'yellow' | 'pink' | 'blue' | 'green' | 'dark'>('yellow');
  const [sharedBanner, setSharedBanner] = useState(isShared);
  const [showShareToast, setShowShareToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');

  // Drag and drop annotations state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getAnnotationColorClass = (color: string) => {
    switch(color) {
      case 'pink': return 'bg-rose-100/95 border border-rose-300 text-rose-950 shadow-md';
      case 'blue': return 'bg-sky-100/95 border border-sky-300 text-sky-950 shadow-md';
      case 'green': return 'bg-emerald-100/95 border border-emerald-300 text-emerald-950 shadow-md';
      case 'dark': return 'bg-slate-900/95 border border-slate-700 text-slate-100 shadow-lg';
      case 'yellow':
      default: return 'bg-amber-100/95 border border-amber-300 text-amber-950 shadow-md';
    }
  };

  const handleAnnotationDragStart = (e: React.MouseEvent | React.TouchEvent, annId: string) => {
    e.stopPropagation();
    setActiveDragId(annId);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const noteEl = document.getElementById(`annotation-note-${annId}`);
    if (noteEl) {
      const rect = noteEl.getBoundingClientRect();
      dragStartOffset.current = {
        x: clientX - (rect.left + rect.width / 2),
        y: clientY - (rect.top + rect.height / 2)
      };
    }
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!activeDragId || !containerRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    let newX = ((clientX - rect.left) / rect.width) * 100;
    let newY = ((clientY - rect.top) / rect.height) * 100;
    
    // Boundary checks to stay inside the image container
    newX = Math.min(Math.max(newX, 2), 92);
    newY = Math.min(Math.max(newY, 2), 92);
    
    setAnnotations(prev => prev.map(ann => {
      if (ann.id === activeDragId) {
        return { ...ann, x: newX, y: newY };
      }
      return ann;
    }));
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
  };

  useEffect(() => {
    if (activeDragId) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [activeDragId]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingAnnotation) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newAnn: Annotation = {
      id: 'ann_' + Date.now(),
      text: 'Sketch annotation notes. Double click to edit.',
      x: Math.min(Math.max(x, 2), 92),
      y: Math.min(Math.max(y, 2), 92),
      color: annotationColor
    };
    
    setAnnotations(prev => [...prev, newAnn]);
    setIsAddingAnnotation(false);
  };

  const handleAddDefaultNote = () => {
    const newAnn: Annotation = {
      id: 'ann_' + Date.now(),
      text: 'Design feedback annotation note.',
      x: 35 + Math.random() * 15,
      y: 35 + Math.random() * 15,
      color: annotationColor
    };
    setAnnotations(prev => [...prev, newAnn]);
  };

  const handleShareLink = async () => {
    try {
      const baseUrl = window.location.origin + window.location.pathname;
      const params = new URLSearchParams();
      params.set('shared', 'true');
      params.set('prompt', prompt);
      params.set('material', material);
      params.set('palette', palette);
      if (generatedImage) {
        params.set('imageUrl', generatedImage);
      }
      if (annotations.length > 0) {
        params.set('annotations', JSON.stringify(annotations));
      }
      const fullShareUrl = `${baseUrl}?${params.toString()}`;
      
      await navigator.clipboard.writeText(fullShareUrl);
      setCopiedLink(fullShareUrl);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 4000);
    } catch (err) {
      console.error("Failed to copy share link:", err);
      setStudioError("Unable to generate/copy collaboration share link.");
    }
  };
  const [injectedStatus, setInjectedStatus] = useState(false);
  const [smartTrend, setSmartTrend] = useState<any>(null);
  const [exporting, setExporting] = useState(false);
  
  const [versions, setVersions] = useState<{prompt: string, material: string, palette: string, imageUrl: string, coutureId?: string}[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png'>('pdf');
  const [exportScale, setExportScale] = useState<number>(2);
  const [exportTemplate, setExportTemplate] = useState<'vertical' | 'grid' | 'minimal'>('vertical');
  const [exportTheme, setExportTheme] = useState<'light' | 'dark'>('light');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  type SectionType = 'image' | 'prompt' | 'details' | 'advisor';
  const initialLayout: SectionType[] = ['image', 'prompt', 'details', 'advisor'];
  const [layoutOrder, setLayoutOrder] = useState<SectionType[]>(initialLayout);
  const [layoutHistory, setLayoutHistory] = useState<SectionType[][]>([initialLayout]);

  const updateLayout = (newLayout: SectionType[]) => {
    setLayoutOrder(newLayout);
    setLayoutHistory([...layoutHistory, newLayout]);
  };

  const undoLayout = () => {
    if (layoutHistory.length > 1) {
       const newHistory = layoutHistory.slice(0, -1);
       setLayoutHistory(newHistory);
       setLayoutOrder(newHistory[newHistory.length - 1]);
    }
  };

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newLayout = [...layoutOrder];
    [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
    updateLayout(newLayout);
  };

  const moveSectionDown = (index: number) => {
    if (index === layoutOrder.length - 1) return;
    const newLayout = [...layoutOrder];
    [newLayout[index], newLayout[index + 1]] = [newLayout[index + 1], newLayout[index]];
    updateLayout(newLayout);
  };

  const stylePresets = [
    { name: 'Streetwear Tech', prompt: 'Oversized technical hoodie with asymmetric cargo pockets and modular strapping.', material: 'Structured Denim', palette: 'Neon Cyber' },
    { name: 'Ethereal Gala', prompt: 'Flowing sheer gown with corseted bodice, trailing skirts and delicate embroidery.', material: 'Silk & Satin', palette: 'Pastel Dream' },
    { name: 'Brutalist Form', prompt: 'Heavy geometric trench coat with sharp shoulders, concealed zippers and rigid drape.', material: 'Heavy Leather', palette: 'Monochrome Brutalism' },
  ];

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'usage'>('usage');
  const [favorites, setFavorites] = useState<string[]>(['1', '3']);
  const [customCollections, setCustomCollections] = useState<{name: string, itemIds: string[]}[]>([
    { name: 'Spring Collection', itemIds: ['3', '6'] },
    { name: 'Evening Wear', itemIds: ['2', '8'] }
  ]);
  const [showSaveMenu, setShowSaveMenu] = useState<string | null>(null);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const advancedLibrary = fashionCollection;

  const categories = ['All', 'Favorites', ...customCollections.map(c => c.name), ...Array.from(new Set(advancedLibrary.map(item => item.category)))];

  const topUsedPrompts = [...advancedLibrary].sort((a, b) => b.usageCount - a.usageCount).slice(0, 3);

  const applyLibraryItem = (item: { prompt: string, material: string, palette: string }) => {
    setPrompt(item.prompt);
    setMaterial(item.material);
    setPalette(item.palette);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleDragStart = (e: React.DragEvent, item: typeof advancedLibrary[0]) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const item = JSON.parse(data);
        applyLibraryItem(item);
      }
    } catch (err) {
      console.error("Drop failed");
    }
  };

  const filteredLibrary = advancedLibrary
    .filter(item => {
      if (selectedCategory === 'All') return true;
      if (selectedCategory === 'Favorites') return favorites.includes(item.id);
      
      const customCollection = customCollections.find(c => c.name === selectedCategory);
      if (customCollection) return customCollection.itemIds.includes(item.id);
      
      return item.category === selectedCategory;
    })
    .filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'usage') return b.usageCount - a.usageCount;
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  useEffect(() => {
    if (initialState) {
      setPrompt(initialState.prompt);
      setMaterial(initialState.material);
      setPalette(initialState.palette);
    }
  }, [initialState]);

  // --- FEATURE 32: GLOBAL KEYBOARD SHORTCUTS ENGINE ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in a text input or textarea to avoid blocking standard input
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        // Still allow showing shortcuts map via Escape or Ctrl+Shift+K
        if (e.ctrlKey && e.key === 'k') {
          e.preventDefault();
          setShowShortcutsMap(prev => !prev);
        }
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'g': // Ctrl+G: Generate Design
            e.preventDefault();
            if (prompt.trim() && !isGenerating) {
              handleGenerate();
            }
            break;
          case 's': // Ctrl+S: Save Design / Favorite
            e.preventDefault();
            if (generatedImage) {
              handleAddDefaultNote(); // Add annotation sticky feedback
              const mockBtn = document.querySelector('[title="Save Design"]') as HTMLButtonElement;
              if (mockBtn) mockBtn.click();
            }
            break;
          case 'k': // Ctrl+K: Open keyboard map cheatsheet
            e.preventDefault();
            setShowShortcutsMap(prev => !prev);
            break;
          case 't': // Ctrl+T: Toggle Live Trend Injection
            e.preventDefault();
            setInjectLiveTrend(prev => !prev);
            break;
          case 'l': // Ctrl+L: Open Prompt Library
            e.preventDefault();
            setIsLibraryOpen(prev => !prev);
            break;
          case 'z': // Ctrl+Z: Undo rearranging layout template order
            e.preventDefault();
            undoLayout();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompt, isGenerating, generatedImage, injectLiveTrend, isLibraryOpen, layoutOrder]);

  useEffect(() => {
    try {
      localStorage.setItem('studioState', JSON.stringify({ prompt, material, palette }));
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }, [prompt, material, palette]);

  // Pre-generation pipeline background simulation for Couture AI Cost-Saving Cache system
  useEffect(() => {
    let interval: any;
    if (isPreGenerating) {
      interval = setInterval(() => {
        setPreGenCount(prev => {
          if (prev >= 2000) {
            setIsPreGenerating(false);
            return 2000;
          }
          return prev + 1;
        });
      }, 1200);
    }
    return () => clearInterval(interval);
  }, [isPreGenerating]);

  useEffect(() => {
    // Fetch smart alert trend
    const fetchAlert = async () => {
      try {
        const res = await csrfFetch('/api/live-trends');
        const data = await res.json();
        if (data.trends && data.trends.length > 0) {
           setSmartTrend(data.trends[0]);
        }
      } catch (err) {
        console.error("Failed to fetch smart trend alert");
      }
    };
    fetchAlert();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedImage(null);
    setInjectedStatus(false);
    setCacheHitState(null);

    // Sanitize parameters
    const sanitizedPrompt = sanitizeInput(prompt);
    const sanitizedMaterial = sanitizeInput(material);
    const sanitizedPalette = sanitizeInput(palette);

    // --- COUTURE COST-SAVING CACHE INTERCEPTION ---
    if (useCacheForFree) {
      const cacheResult = matchLookbookCache({
        material: sanitizedMaterial,
        palette: sanitizedPalette,
        promptText: sanitizedPrompt,
        size: bodySize
      });

      if (cacheResult) {
        setTimeout(async () => {
          // If couture_0001, we use our generated on-disk asset. Otherwise, we load the beautiful Unsplash representation directly
          const finalImg = cacheResult.id === 'couture_0001' ? '/cache/couture_0001.jpg' : cacheResult.fallbackUrl;

          setGeneratedImage(finalImg);
          setVersions(prev => [...prev, { prompt, material, palette, imageUrl: finalImg, coutureId: cacheResult.id }]);
          setCacheHitState({
            hit: true,
            msg: `${cacheResult.msg} (Lookbook ID: ${cacheResult.id.toUpperCase()})`,
            savedUsd: 0.15
          });
          setIsGenerating(false);

          // Silent persistence log to user history database
          try {
            await saveUserDesign({
              id: 'design_cached_' + Date.now(),
              prompt,
              material,
              palette,
              imageUrl: finalImg,
              coutureId: cacheResult.id
            });
          } catch (e) {
            console.error("Failed to persist cached log:", e);
          }
        }, 500);
        return;
      }
    }

    try {
      const response = await csrfFetch('/api/generate-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: sanitizedPrompt, 
          material: sanitizedMaterial, 
          palette: sanitizedPalette, 
          injectLiveTrend,
          generationEngine,
          bodySize,
          selectedFabric
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }
      
      setGeneratedImage(data.imageUrl);
      setInjectedStatus(data.injectedConcept);
      setVersions(prev => [...prev, { prompt, material, palette, imageUrl: data.imageUrl }]);

      // Automatically save successfully generated designs to Firestore
      try {
        const designId = 'design_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await saveUserDesign({
          id: designId,
          prompt,
          material,
          palette,
          imageUrl: data.imageUrl
        });
      } catch (saveError) {
        console.error("Failed to automatically save design to Firestore:", saveError);
      }
    } catch (error) {
      console.error(error);
      setStudioError('Error generating design. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('moodboard-export');
    if (!element) return;
    setExporting(true);
    setExportError(null);
    try {
      const canvas = await html2canvas(element, { scale: exportScale, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      if (exportFormat === 'pdf') {
        const pxToMm = 0.264583;
        const widthMm = canvas.width * pxToMm;
        const heightMm = canvas.height * pxToMm;

        const pdf = new jsPDF({
           orientation: widthMm > heightMm ? "landscape" : "portrait",
           unit: "mm",
           format: [widthMm, heightMm]
        });
        pdf.addImage(imgData, 'JPEG', 0, 0, widthMm, heightMm);
        pdf.save("couture-moodboard.pdf");
      } else {
        const link = document.createElement('a');
        link.download = 'couture-moodboard.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (e) {
      console.error(e);
      setExportError("Error exporting. Please make sure the layout content finished loading.");
    } finally {
      setExporting(false);
      setShowExportSettings(false);
    }
  };

  const advisor = getAdvisorSuggestion(material, palette);

  if (showCompare) {
    return (
      <div className="flex-1 flex flex-col p-6 md:p-8 bg-gray-50 h-full overflow-y-auto">
         <div className="flex justify-between items-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl font-semibold">Version Compare View</h2>
            <button 
              onClick={() => setShowCompare(false)}
              className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-gray-900 transition-colors border border-gray-100"
            >
               <X className="w-5 h-5" />
            </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {versions.map((ver, idx) => (
               <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
                  <div className="aspect-[3/4] w-full bg-gray-100 relative">
                     <img src={ver.imageUrl} alt="Version" className="w-full h-full object-cover" />
                     <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                        v{idx + 1}
                     </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                     <p className="text-gray-600 text-xs leading-relaxed flex-1 mb-4">{ver.prompt}</p>
                     <div className="grid grid-cols-2 gap-2 mt-auto">
                        <span className="px-2 py-1.5 bg-gray-50 text-gray-500 rounded text-[9px] uppercase font-semibold text-center border border-gray-100">{ver.material}</span>
                        <span className="px-2 py-1.5 bg-gray-50 text-gray-500 rounded text-[9px] uppercase font-semibold text-center border border-gray-100">{ver.palette}</span>
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      {/* Sub-Tab Bar Navigation */}
      <div className="border-b border-gray-100 bg-white px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 z-30 flex-shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            onClick={() => setStudioMode('atelier')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${studioMode === 'atelier' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Scissors className="w-3.5 h-3.5" /> Atelier Creator
          </button>
          <button
            onClick={() => setStudioMode('remix')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${studioMode === 'remix' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Advanced Tools & Remix
          </button>
          <button
            onClick={() => setStudioMode('techpack')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${studioMode === 'techpack' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Cpu className="w-3.5 h-3.5" /> Tech Pack Studio
          </button>
          <button
            onClick={() => setStudioMode('moodboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${studioMode === 'moodboard' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
          >
            <Paintbrush className="w-3.5 h-3.5" /> Mood Board Builder
          </button>
        </div>

        <div className="flex gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={() => setShowCompare(true)}
            disabled={versions.length === 0}
            className="px-3 py-2 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-gray-700 disabled:opacity-50 flex items-center gap-1 text-xs font-bold uppercase tracking-wider shadow-xs"
            title="Compare Versions"
          >
            <GitCompare className="w-4 h-4" /> Compare Versions
          </button>
        </div>
      </div>

      {/* Main workspace panels */}
      <div className="flex-1 overflow-y-auto">
        {studioMode === 'techpack' && (
          <div className="p-6 md:p-8 bg-gray-50 min-h-full">
            <TechPackStudio
              currentPrompt={prompt}
              currentMaterial={material}
              currentPalette={palette}
              currentImage={generatedImage}
            />
          </div>
        )}

        {studioMode === 'moodboard' && (
          <div className="p-6 md:p-8 bg-gray-50 min-h-full">
            <MoodBoardStudio
              onGenerateFromMoodBoard={(mPrompt, mMaterial, mPalette) => {
                setPrompt(mPrompt);
                setMaterial(mMaterial);
                setPalette(mPalette);
                setStudioMode('atelier');
              }}
            />
          </div>
        )}

        {studioMode === 'remix' && (
          <div className="p-6 md:p-8 bg-gray-50 min-h-full">
            <AdvancedStudioTools
              currentPrompt={prompt}
              currentMaterial={material}
              currentPalette={palette}
              currentImage={generatedImage}
              onApplyNewDesign={(newUrl, newPrompt) => {
                setGeneratedImage(newUrl);
                setPrompt(newPrompt);
                setVersions(prev => [...prev, { prompt: newPrompt, material, palette, imageUrl: newUrl }]);
                setStudioMode('atelier');
              }}
            />
          </div>
        )}

        {studioMode === 'atelier' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden flex-nowrap h-full relative">
       {/* Library Overlay */}
       <AnimatePresence>
         {isLibraryOpen && (
           <motion.div
             initial={{ x: '-100%', opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             exit={{ x: '-100%', opacity: 0 }}
             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="absolute inset-y-0 left-0 w-full md:w-1/2 md:max-w-md bg-white border-r border-gray-100 shadow-2xl z-40 flex flex-col pt-6 md:pt-8"
           >
             <div className="px-6 md:px-8 mb-6 flex justify-between items-center">
               <div>
                 <h3 className="font-display text-2xl font-semibold mb-1">Prompt Library</h3>
                 <p className="text-gray-500 text-xs">Drag styles to the Studio to apply.</p>
               </div>
               <button 
                 onClick={() => setIsLibraryOpen(false)}
                 className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="px-6 md:px-8 mb-6">
               <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder="Search styles, materials, or tags..." 
                   className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-colors"
                 />
               </div>
               
               <div className="flex items-center justify-between mb-4">
                 <div className="overflow-x-auto no-scrollbar flex gap-2 pb-1">
                   {categories.map(cat => (
                     <button
                       key={cat}
                       onClick={() => setSelectedCategory(cat)}
                       className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                     >
                       {cat === 'Favorites' && <Star className="inline w-3 h-3 mr-1" />}
                       {cat}
                     </button>
                   ))}
                 </div>
               </div>
               
               <div className="flex justify-end">
                 <div className="flex bg-gray-100 rounded-lg p-1">
                   <button 
                     onClick={() => setSortBy('usage')}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${sortBy === 'usage' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                   >
                     <TrendingUp className="w-3 h-3" /> Popular
                   </button>
                   <button 
                     onClick={() => setSortBy('date')}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors ${sortBy === 'date' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                   >
                     <Calendar className="w-3 h-3" /> Newest
                   </button>
                 </div>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-8 space-y-4">
               {selectedCategory === 'All' && searchQuery === '' && (
                 <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4 shadow-sm mb-6">
                   <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Top Used This Week</h4>
                   <div className="flex gap-3">
                     {topUsedPrompts.map((item) => (
                        <div key={item.id} className="flex-1 bg-white rounded-lg p-2 shadow-sm border border-indigo-50 flex items-center gap-2 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => { applyLibraryItem(item); setIsLibraryOpen(false); }}>
                          <div className="w-8 h-8 rounded bg-gray-100 shrink-0 overflow-hidden">
                            <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[9px] text-gray-400">{item.usageCount} uses</p>
                          </div>
                        </div>
                     ))}
                   </div>
                 </div>
               )}
               {filteredLibrary.map(item => (
                 <div 
                   key={item.id} 
                   draggable
                   onDragStart={(e) => handleDragStart(e, item)}
                   onClick={() => { applyLibraryItem(item); setIsLibraryOpen(false); }}
                   className="group relative bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:border-gray-900 hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex gap-3"
                 >
                   <div className="mt-1 text-gray-300 group-hover:text-gray-500 transition-colors">
                     <GripVertical className="w-5 h-5" />
                   </div>
                   <div className="flex-1">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-semibold text-gray-900 text-sm leading-tight">{item.name}</h4>
                       <div className="flex items-center gap-1">
                         <div className="relative">
                           <button 
                             onClick={(e) => { e.stopPropagation(); setShowSaveMenu(showSaveMenu === item.id ? null : item.id); setIsCreatingCollection(false); setNewCollectionName(''); }}
                             className={`p-1 -mt-1 rounded-full transition-colors ${showSaveMenu === item.id ? 'bg-gray-100 text-gray-900' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                           >
                             <FolderPlus className="w-4 h-4" />
                           </button>
                           {showSaveMenu === item.id && (
                             <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden cursor-default" onClick={e => e.stopPropagation()}>
                               <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">Save to Collection</div>
                               <div className="max-h-32 overflow-y-auto">
                                 {customCollections.map(c => (
                                   <button 
                                     key={c.name}
                                     onClick={() => {
                                       setCustomCollections(prev => prev.map(collection => 
                                         collection.name === c.name 
                                           ? { ...collection, itemIds: collection.itemIds.includes(item.id) ? collection.itemIds.filter(id => id !== item.id) : [...collection.itemIds, item.id] } 
                                           : collection
                                       ));
                                     }}
                                     className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-between transition-colors"
                                   >
                                     <span className="truncate">{c.name}</span>
                                     {c.itemIds.includes(item.id) && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                                   </button>
                                 ))}
                               </div>
                               <div className="p-2 border-t border-gray-100 bg-gray-50">
                                 {isCreatingCollection ? (
                                   <div className="flex items-center gap-1">
                                     <input 
                                       type="text" 
                                       autoFocus
                                       value={newCollectionName}
                                       onChange={e => setNewCollectionName(e.target.value)}
                                       onKeyDown={(e) => {
                                         if (e.key === 'Enter' && newCollectionName.trim()) {
                                           if (!customCollections.some(c => c.name === newCollectionName.trim())) {
                                             setCustomCollections(prev => [...prev, { name: newCollectionName.trim(), itemIds: [item.id] }]);
                                           }
                                           setIsCreatingCollection(false);
                                           setNewCollectionName('');
                                         }
                                       }}
                                       placeholder="New collection..."
                                       className="w-full px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                     />
                                   </div>
                                 ) : (
                                   <button 
                                     onClick={() => setIsCreatingCollection(true)}
                                     className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 w-full"
                                   >
                                     <Plus className="w-3 h-3" /> New Collection
                                   </button>
                                 )}
                               </div>
                             </div>
                           )}
                         </div>
                         <button 
                           onClick={(e) => toggleFavorite(item.id, e)}
                           className={`p-1 -mt-1 -mr-1 rounded-full transition-colors ${favorites.includes(item.id) ? 'text-amber-400 hover:bg-amber-50' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'}`}
                         >
                         <Star className={`w-4 h-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                       </button>
                     </div>
                   </div>
                     <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">{item.prompt}</p>
                     <div className="flex flex-wrap gap-1.5 mb-3">
                       <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[9px] uppercase font-bold border border-gray-100">{item.material}</span>
                       <span className="px-2 py-0.5 bg-gray-50 text-gray-600 rounded text-[9px] uppercase font-bold border border-gray-100">{item.palette}</span>
                     </div>
                     <div className="flex flex-wrap gap-1">
                       {item.tags.map(tag => (
                         <span key={tag} className="text-[10px] text-gray-400">#{tag}</span>
                       ))}
                     </div>
                   </div>
                   
                   {/* Hover Preview Card */}
                   <div className="absolute right-full top-0 mr-4 w-48 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 z-50 rounded-xl overflow-hidden shadow-2xl border border-gray-200 hidden md:block">
                     <div className="aspect-[3/4] relative bg-gray-100">
                       <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                       <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white truncate text-xs font-medium">
                         Expected Output
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
               
               {filteredLibrary.length === 0 && (
                 <div className="text-center py-12 text-gray-500">
                   <p>No styles match your search.</p>
                 </div>
               )}
             </div>
           </motion.div>
         )}
       </AnimatePresence>

       {/* Smart Trend Alert */}
       <AnimatePresence>
         {smartTrend && !isGenerating && !generatedImage && (
           <motion.div 
             initial={{ opacity: 0, y: -50 }}
             animate={{ opacity: 1, y: 0 }}
             className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-3 text-[10px] md:text-xs font-semibold uppercase tracking-wider"
           >
             <Bell className="w-3 h-3 text-blue-400 animate-bounce" />
             <span>Trend Alert: {smartTrend.name}</span>
             <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">Fastest Rising</span>
           </motion.div>
         )}
       </AnimatePresence>

      {/* Left panel: Sketch & Control */}
      <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-100 p-6 md:p-8 flex flex-col bg-white overflow-y-auto shrink-0 md:shrink-1 h-1/2 md:h-full">
        <div className="mb-6 md:mb-8 flex justify-between items-start">
          <div>
            <h2 className="font-display text-2xl md:text-3xl mb-1 md:mb-2 text-gray-900">Design Studio</h2>
            <p className="text-gray-500 font-sans text-xs md:text-sm">Describe your vision to generate haute couture concepts.</p>
          </div>
          <button 
            onClick={() => setIsLibraryOpen(!isLibraryOpen)}
            className={`flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg border text-xs font-semibold transition-colors ${isLibraryOpen ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
             <Library className="w-4 h-4" /> <span className="hidden md:inline">Prompt Library</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-4 md:gap-6 min-h-min">
          {/* Prompt Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
               <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                 <Type className="w-4 h-4" /> Description & Details
               </label>
               <button 
                 onClick={() => setInjectLiveTrend(!injectLiveTrend)}
                 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                   injectLiveTrend 
                     ? 'bg-blue-50 text-blue-600 border-blue-200' 
                     : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                 }`}
               >
                 <Zap className="w-3 h-3" />
                 Live Trend Injection
               </button>
            </div>
            
            <div 
              className={`relative rounded-xl transition-all ${isDragOver ? 'ring-2 ring-gray-900/20 bg-gray-50' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              {studioError && (
                <div className="mb-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs flex justify-between items-center pointer-events-auto">
                  <span>{studioError}</span>
                  <button onClick={() => setStudioError(null)} className="font-bold text-red-500 hover:text-red-700">Dismiss</button>
                </div>
              )}
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isListening ? "Listening..." : "E.g., A minimalist silk slip dress with asymmetrical hemline and silver hardware elements..."}
                className={`w-full h-24 md:h-32 px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none text-sm leading-relaxed ${isListening ? 'border-blue-400 bg-blue-50/30' : 'border-gray-200'} ${isDragOver ? 'opacity-50 pointer-events-none border-gray-900' : ''}`}
              />
              <button 
                onClick={() => setIsListening(!isListening)}
                className={`absolute bottom-3 right-3 p-2 rounded-full transition-all z-20 ${isListening ? 'bg-blue-100 text-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                title={isListening ? "Listening..." : "Voice to prompt"}
              >
                <Mic className="w-4 h-4" />
              </button>
              {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none bg-gray-50/80 backdrop-blur-sm z-10 border-2 border-dashed border-gray-900">
                   <div className="bg-white px-4 py-2 rounded-lg shadow-sm font-semibold text-gray-900 text-sm flex items-center gap-2">
                     <Download className="w-4 h-4" /> Drop to apply design
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Style Presets & Shortcuts */}
          <div className="space-y-1.5 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Design Style Presets</span>
              <button
                onClick={() => setShowShortcutsMap(true)}
                className="text-[10px] text-gray-500 hover:text-gray-900 flex items-center gap-1 font-bold uppercase tracking-wider transition-colors"
              >
                ⌨️ Shortcuts (Ctrl+K)
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
              {stylePresets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyLibraryItem({ prompt: preset.prompt, material: preset.material, palette: preset.palette })}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors whitespace-nowrap"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* --- FEATURE 33: DYNAMIC DRAG & DROP PROMPT BUILDER --- */}
          <div className="border border-gray-100 rounded-xl bg-gray-50/50 p-3 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Dynamic Prompt Builder
              </span>
              <span className="text-[8px] text-gray-400 font-mono">Drag tags or tap to append</span>
            </div>
            
            <div className="space-y-2 text-left">
              {[
                { label: '👗 Silhouettes', tags: ['A-Line Silhouette', 'Asymmetrical Hemline', 'Boxy Cropped Fit', 'Corseted Bodice', 'Exaggerated Shoulders'] },
                { label: '🔍 Details', tags: ['Cargo Pockets', 'Industrial Buckles', 'Contrast Stitching', 'Draped Cowl Neck', 'Raw Distressed Edges'] },
                { label: '🌌 Aesthetics', tags: ['Minimalist Brutalism', 'Futuristic Gorpcore', 'Ethereal Avant-Garde', '90s Archival Grunge', 'Cyberpunk Techwear'] }
              ].map(group => (
                <div key={group.label} className="space-y-1">
                  <p className="text-[8px] font-extrabold uppercase tracking-widest text-gray-400">{group.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {group.tags.map(tag => (
                      <span
                        key={tag}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', tag);
                        }}
                        onClick={() => {
                          setPrompt(prev => prev ? `${prev.trim().replace(/,$/, '')}, ${tag}` : tag);
                        }}
                        className="inline-block px-2 py-0.5 bg-white border border-gray-200 hover:border-gray-900 hover:bg-gray-50 rounded-md text-[10px] text-gray-600 hover:text-gray-900 cursor-grab active:cursor-grabbing font-medium select-none shadow-3xs transition-all"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* --- FEATURE 36: FABRIC TEXTURE LIBRARY --- */}
          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Fabric Texture Library</label>
              <span className="text-[9px] text-gray-400">Thread Count & Drape specs</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Mulberry Silk', spec: '600 TC • Fluid', desc: 'Lustrous reflective sheen', zoomImg: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=200' },
                { name: 'Selvedge Denim', spec: '14 oz • Rigid', desc: 'Raw indigo weave depth', zoomImg: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=200' },
                { name: 'Graphene Mesh', spec: 'Nylon Grid • Tech', desc: 'Graphene-infused utility mesh', zoomImg: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200' },
                { name: 'Merino Wool', spec: 'Super 120s • Soft', desc: 'Tailored warmth insulation', zoomImg: 'https://images.unsplash.com/photo-1574169208507-84376144848b?auto=format&fit=crop&q=80&w=200' }
              ].map(f => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => {
                    setSelectedFabric(f.name);
                    setMaterial(f.name);
                  }}
                  className={`flex flex-col text-left p-1 rounded-lg border transition-all ${selectedFabric === f.name ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900' : 'border-gray-200 bg-white hover:border-gray-400'}`}
                >
                  <div className="aspect-square w-full rounded-md overflow-hidden bg-gray-100 mb-1 relative">
                    <img src={f.zoomImg} alt={f.name} className="w-full h-full object-cover" />
                    {selectedFabric === f.name && (
                      <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                        <span className="bg-white/95 text-[7px] font-bold px-1 py-0.5 rounded shadow-xs text-gray-950 uppercase">Active</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-gray-900 truncate leading-none mb-0.5">{f.name}</p>
                  <p className="text-[8px] text-gray-400 truncate leading-none">{f.spec}</p>
                </button>
              ))}
            </div>
            
            {/* Thread count description card */}
            <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-left text-[10px] leading-relaxed flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gray-200/60 flex items-center justify-center font-mono text-[9px] font-bold text-gray-600 shrink-0">
                100%
              </div>
              <div className="text-gray-500">
                <span className="font-semibold text-gray-800 uppercase text-[9px] block">
                  {selectedFabric} Premium Spec:
                </span>
                {selectedFabric === 'Mulberry Silk' && "Organic filament structure providing elite luster reflection, high tensile elastic recovery, and hypoallergenic moisture wick."}
                {selectedFabric === 'Selvedge Denim' && "Raw ring-spun long staple cotton on narrow shuttle looms. Promotes gorgeous natural fading patterns over high-stress cycles."}
                {selectedFabric === 'Graphene Mesh' && "Thermal-conductive hexagonal carbon lattices. Offers absolute wind blocking, static resistance, and active sweat dissipation."}
                {selectedFabric === 'Merino Wool' && "Super 120s high-crimped wool yarns. Naturally breathable, water-repellent exterior, and exquisite micro-climate comfort regulation."}
              </div>
            </div>
          </div>

          {/* --- FEATURE 38: SIZE-INCLUSIVE DESIGN CONTROLS --- */}
          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                🧍 Avatar Size & Body Fitting
              </label>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 uppercase">Inclusive 3D Fit</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {['XS', 'M', 'L', '3XL'].map(sz => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setBodySize(sz as any)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${bodySize === sz ? 'bg-gray-900 text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {sz}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 italic bg-amber-50/50 border border-amber-100/50 rounded-lg p-2 text-left">
              💡 <span className="font-semibold text-gray-700">Advisory:</span> {
                bodySize === 'XS' ? 'Gusset and seam length reduced by 4.5% to preserve focal placement of accessories.' :
                bodySize === 'M' ? 'Default 1:1 drape metrics are applied. Suitable for off-the-rack standard patterns.' :
                bodySize === 'L' ? 'Arm diameter increased by 1.2 inches. Tailored shoulder-slants added for structured support.' :
                'Side-seam gathers extended by 8% with stretch-gusset paneling. Comfort and volume optimization applied.'
              }
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 text-left">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Material Style</label>
              <select value={material} onChange={(e) => setMaterial(e.target.value)} className="w-full px-3 md:px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 text-xs md:text-sm bg-white">
                <option>Mulberry Silk</option>
                <option>Selvedge Denim</option>
                <option>Graphene Mesh</option>
                <option>Merino Wool</option>
                <option>Silk & Satin</option>
                <option>Structured Denim</option>
                <option>Lightweight Linen</option>
                <option>Heavy Leather</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Color Palette</label>
              <select value={palette} onChange={(e) => setPalette(e.target.value)} className="w-full px-3 md:px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 text-xs md:text-sm bg-white">
                <option>Monochrome Brutalism</option>
                <option>Earth Tones</option>
                <option>Pastel Dream</option>
                <option>Neon Cyber</option>
              </select>
            </div>
          </div>

          {/* --- FEATURE 29: FINE-TUNED FASHION MODEL CONFIGURATION --- */}
          <div className="border border-gray-100 rounded-xl p-3 bg-slate-50/75 space-y-2.5 text-left">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Fashion Generation Engine
              </span>
              <span className="bg-indigo-100 text-indigo-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full">Fine-Tuned weights</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGenerationEngine('gemini_base')}
                className={`p-2 rounded-lg text-left border text-xs transition-all ${generationEngine === 'gemini_base' ? 'border-gray-900 bg-white ring-1 ring-gray-900' : 'border-gray-200 bg-gray-100 hover:bg-gray-50'}`}
              >
                <p className="font-semibold text-gray-950 text-[10px] uppercase">Gemini 2.5 Base</p>
                <p className="text-[9px] text-gray-400">Standard general weights</p>
              </button>
              
              <button
                type="button"
                onClick={() => setGenerationEngine('fashion_finetuned')}
                className={`p-2 rounded-lg text-left border text-xs transition-all ${generationEngine === 'fashion_finetuned' ? 'border-indigo-600 bg-white ring-1 ring-indigo-600' : 'border-gray-200 bg-gray-100 hover:bg-gray-50'}`}
              >
                <p className="font-semibold text-indigo-600 text-[10px] uppercase flex items-center gap-1">Atelier Fine-Tuned <Sparkles className="w-2.5 h-2.5 animate-pulse" /></p>
                <p className="text-[9px] text-gray-400">Optimized drape & crease folds</p>
              </button>
            </div>
          </div>

          {/* --- COUTURE AI COST-SAVING CACHE PANEL --- */}
          <div className="border border-gray-100 rounded-xl p-3 bg-indigo-50/20 text-left space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" /> Couture AI Cost-Saving Cache
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-gray-500">Enable Cache</span>
                <button
                  type="button"
                  onClick={() => {
                    setUseCacheForFree(!useCacheForFree);
                    setCacheHitState(null);
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${useCacheForFree ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${useCacheForFree ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 leading-relaxed">
              Bypasses live Gemini API generation charges for free tier users by serving from a high-speed pre-rendered dataset of 2,000 fashion combinations.
            </p>

            <div className="grid grid-cols-3 gap-2 bg-white/70 p-2 rounded-lg border border-gray-100 text-center">
              <div>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Cached</p>
                <p className="text-xs font-extrabold text-indigo-600 font-mono">{preGenCount} / 2,000</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Hit Rate</p>
                <p className="text-xs font-extrabold text-gray-800 font-mono">98.2%</p>
              </div>
              <div>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Saved (Est)</p>
                <p className="text-xs font-extrabold text-green-600 font-mono">+${(preGenCount * 0.15).toFixed(2)}</p>
              </div>
            </div>

            {/* Pipeline generator progress & simulation */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-bold text-gray-500">
                <span>PRE-GENERATION PIPELINE</span>
                <span>{((preGenCount / 2000) * 100).toFixed(1)}% COMPLETE</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`bg-indigo-600 h-1.5 rounded-full transition-all duration-500 ${isPreGenerating ? 'animate-pulse' : ''}`}
                  style={{ width: `${(preGenCount / 2000) * 100}%` }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreGenerating(!isPreGenerating)}
                  className={`flex-1 py-1 px-2 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                    isPreGenerating 
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                      : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isPreGenerating ? '⏸ Pause Pipeline' : '⚡ Resume Pre-Gen Pipeline'}
                </button>
                {preGenCount < 2000 && (
                  <button
                    type="button"
                    onClick={() => setPreGenCount(2000)}
                    className="py-1 px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                  >
                    ⏩ Complete Cache
                  </button>
                )}
              </div>
            </div>

            {/* Cache Hit Notification */}
            {cacheHitState && (
              <div className="p-2 bg-green-50 border border-green-100 rounded-lg text-green-800 text-[10px] flex gap-2 items-start">
                <Zap className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <span className="font-bold uppercase text-[9px] block">⚡ Instant Cache Hit (Saved $0.15)</span>
                  {cacheHitState.msg}
                </div>
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={advisor.title}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`p-4 rounded-xl border ${advisor.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' : advisor.type === 'info' ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-green-50 border-green-100 text-green-800'}`}
            >
              <div className="flex items-start gap-3 text-left">
                 <Lightbulb className={`w-5 h-5 shrink-0 ${advisor.type === 'warning' ? 'text-amber-500' : advisor.type === 'info' ? 'text-blue-500' : 'text-green-500'}`} />
                 <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-1">{advisor.title}</h4>
                    <p className="text-xs leading-relaxed opacity-90">{advisor.text}</p>
                 </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="mt-2 md:mt-4 w-full bg-gray-900 text-white rounded-xl py-3 md:py-4 font-medium text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Wand2 className="w-4 h-4" />
              </motion.div>
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating Concept...' : `Generate with ${generationEngine === 'fashion_finetuned' ? 'Fine-Tuned Couture AI' : 'Gemini 2.5 Base'}`}
          </button>
        </div>
      </div>

      {/* Right panel: Visualization */}
      <div className="w-full md:w-1/2 bg-gray-50 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-y-auto h-1/2 md:h-full">
        {generatedImage && !isGenerating && (
           <div className="hidden md:flex flex-wrap absolute top-8 right-8 gap-2 z-10 w-full justify-end pr-8 pointer-events-none">
              <button className="p-2 bg-white rounded-lg shadow-sm text-gray-400 hover:text-gray-900 transition-colors pointer-events-auto border border-gray-100">
                 <Scissors className="w-4 h-4" />
              </button>
              {versions.length > 1 && (
                 <button 
                   onClick={() => setShowCompare(true)}
                   className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 font-medium text-xs rounded-lg shadow-sm hover:bg-gray-50 transition-colors pointer-events-auto border border-gray-100"
                 >
                    <GitCompare className="w-4 h-4" />
                    Compare Versions
                 </button>
              )}
              
              <div className="relative pointer-events-auto">
                 <div className="flex gap-2">
                    <button 
                       onClick={() => setShowExportSettings(!showExportSettings)}
                       className="flex items-center justify-center p-2 bg-white text-gray-400 rounded-lg shadow-sm hover:text-gray-900 transition-colors border border-gray-100"
                    >
                       <Settings className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                         setShowManufacturing(true);
                         setMOrderStatus('idle');
                       }}
                       className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-md transition-all pointer-events-auto mr-1"
                     >
                        <Scissors className="w-4 h-4" />
                        Manufacture (POD)
                     </button>
                     <button 
                       onClick={() => setShowExportModal(true)}
                      disabled={exporting}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-medium text-xs rounded-lg shadow-sm hover:bg-gray-800 transition-colors pointer-events-auto disabled:opacity-50"
                    >
                       <Download className="w-4 h-4" />
                       Preview & Export
                    </button>
                 </div>
                 
                 <AnimatePresence>
                    {showExportSettings && (
                       <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 w-64 z-50 text-left"
                       >
                          <h4 className="text-xs font-bold uppercase tracking-wider mb-3 text-gray-900">Export Settings</h4>
                          {exportError && (
                             <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg text-red-700 text-[10px] leading-tight flex justify-between items-center">
                                <span>{exportError}</span>
                                <button onClick={() => setExportError(null)} className="font-bold text-red-500 shrink-0 ml-1">X</button>
                             </div>
                          )}
                          
                          <div className="space-y-4">
                             <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Format</label>
                                <select 
                                   value={exportFormat}
                                   onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'png')}
                                   className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-gray-900"
                                >
                                   <option value="pdf">PDF Document</option>
                                   <option value="png">PNG Image</option>
                                </select>
                             </div>
                             <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Quality (Scale)</label>
                                <select 
                                   value={exportScale}
                                   onChange={(e) => setExportScale(Number(e.target.value))}
                                   className="w-full text-xs px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-gray-900"
                                >
                                   <option value="1">Standard (1x)</option>
                                   <option value="2">High Retina (2x)</option>
                                   <option value="3">Ultra (3x)</option>
                                </select>
                             </div>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>
           </div>
        )}

        <AnimatePresence mode="wait">
          {!generatedImage && !isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-200/50 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-display italic text-base md:text-lg">Your creation awaits...</p>
            </motion.div>
          )}

          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center w-full max-w-sm"
            >
              <div className="w-48 h-64 md:w-64 md:h-96 bg-white rounded-2xl mx-auto overflow-hidden shadow-sm border border-gray-100 flex flex-col p-4 animate-pulse">
                <div className="w-full h-4/5 bg-gray-100 rounded-xl mb-4" />
                <div className="w-3/4 h-3 bg-gray-100 rounded mb-2 mx-auto" />
                <div className="w-1/2 h-2 bg-gray-100 rounded mx-auto" />
              </div>
              <p className="text-gray-500 mt-4 md:mt-6 text-xs md:text-sm tracking-widest uppercase flex items-center justify-center gap-2">
                <Wand2 className="w-4 h-4 animate-pulse" /> Rendering fabrics...
              </p>
              {injectLiveTrend && (
                 <p className="text-blue-500 mt-2 text-[10px] md:text-xs tracking-widest uppercase flex items-center justify-center gap-2">
                   <Zap className="w-3 h-3 animate-bounce" /> Searching live trends to inject...
                 </p>
              )}
            </motion.div>
          )}

          {generatedImage && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-sm md:max-w-xl my-auto py-12 md:py-0"
            >
              <div id={!showExportModal ? "moodboard-export" : "moodboard-dummy-main"} className="bg-gray-50 p-6 -m-6 md:p-8 md:-m-8">
                 <div className="text-center mb-6">
                    <h2 className="font-display text-2xl font-semibold mb-1">Couture AI Atelier</h2>
                    <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">Curated Moodboard</p>
                 </div>
                 
                 {layoutOrder.map(section => {
                   if (section === 'image') return (
                      <div 
                        key="image" 
                        ref={containerRef}
                        onClick={handleImageClick}
                        className={`relative aspect-[3/4] max-w-sm mx-auto rounded-2xl bg-white shadow-xl p-1.5 md:p-2 mb-6 transition-all duration-300 ${isAddingAnnotation ? 'cursor-crosshair ring-2 ring-blue-500 ring-offset-4' : ''}`}
                      >
                        <img 
                          src={generatedImage!} 
                          alt="Generated Design" 
                          className="w-full h-full object-cover rounded-xl select-none" 
                          draggable={false} 
                        />
                        
                        {/* Interactive Annotations */}
                        {annotations.map(ann => (
                          <div
                            key={ann.id}
                            id={`annotation-note-${ann.id}`}
                            style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}
                            className={`absolute z-30 ${getAnnotationColorClass(ann.color)} px-3 py-2 rounded-lg text-[10px] md:text-[11px] font-sans shadow-lg max-w-[140px] break-words cursor-grab active:cursor-grabbing select-none`}
                            onMouseDown={(e) => handleAnnotationDragStart(e, ann.id)}
                            onTouchStart={(e) => handleAnnotationDragStart(e, ann.id)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {editingAnnotationId === ann.id ? (
                              <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                                <textarea
                                  value={ann.text}
                                  onChange={(e) => {
                                    const text = e.target.value;
                                    setAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, text } : a));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      setEditingAnnotationId(null);
                                    }
                                  }}
                                  className="bg-transparent border-none text-[9px] md:text-[10px] w-full p-0 focus:outline-none font-sans font-medium resize-none text-inherit leading-snug"
                                  autoFocus
                                  rows={2}
                                />
                                <div className="flex justify-between items-center mt-1 pt-1 border-t border-black/10 text-[8px]">
                                  <span className="opacity-75">Enter to apply</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingAnnotationId(null);
                                    }}
                                    className="font-bold underline uppercase tracking-widest text-[8px]"
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="group/note relative">
                                <p 
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setEditingAnnotationId(ann.id);
                                  }}
                                  className="font-medium leading-snug cursor-pointer font-sans"
                                >
                                  {ann.text}
                                </p>
                                
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-md border border-gray-200 shadow-md p-1.5 flex gap-1 items-center justify-between opacity-0 group-hover/note:opacity-100 transition-opacity z-40 pointer-events-auto min-w-[110px]" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex gap-0.5">
                                    {(['yellow', 'pink', 'blue', 'green', 'dark'] as const).map(col => (
                                      <button
                                        key={col}
                                        onClick={() => setAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, color: col } : a))}
                                        className={`w-3.5 h-3.5 rounded-full border border-gray-300 ${col === 'yellow' ? 'bg-amber-100' : col === 'pink' ? 'bg-rose-100' : col === 'blue' ? 'bg-sky-100' : col === 'green' ? 'bg-emerald-100' : 'bg-slate-900'}`}
                                      />
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => setEditingAnnotationId(ann.id)}
                                    className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 p-1 rounded"
                                    title="Edit text"
                                  >
                                    <Plus className="w-2.5 h-2.5 rotate-45" />
                                  </button>
                                  <button
                                    onClick={() => setAnnotations(prev => prev.filter(a => a.id !== ann.id))}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                                    title="Delete annotation"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                   if (section === 'prompt') return (
                     <div key="prompt" className="bg-white p-5 rounded-xl border border-gray-200 mb-6">
                       <div className="flex justify-between items-start mb-3">
                          <h3 className="font-display font-medium text-lg">Design Inspiration</h3>
                          {injectedStatus && (
                             <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                               <Zap className="w-3 h-3" /> Live Trend Applied
                             </span>
                          )}
                       </div>
                       <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{prompt}</p>
                     </div>
                   );
                   if (section === 'details') return (
                     <div key="details" className="grid grid-cols-2 gap-4 bg-white p-5 rounded-xl border border-gray-200 mb-6">
                       <div>
                          <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mb-1">Material Foundation</p>
                          <p className="text-xs font-semibold text-gray-800">{material}</p>
                       </div>
                       <div>
                          <p className="text-[9px] uppercase font-bold tracking-widest text-gray-400 mb-1">Color Palette Strategy</p>
                          <p className="text-xs font-semibold text-gray-800">{palette}</p>
                       </div>
                     </div>
                   );
                   if (section === 'advisor') return (
                     <div key="advisor" className={`p-4 rounded-xl border mb-6 ${advisor.type === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                           <Lightbulb className="w-4 h-4" /> {advisor.title}
                        </h4>
                        <p className="text-xs text-gray-700 leading-relaxed">{advisor.text}</p>
                     </div>
                   );
                   return null;
                 })}

               {/* Collaboration & Sharing Action Suite */}
               <div className="mt-8 pt-6 border-t border-gray-200 text-left">
                 <div className="flex items-center gap-2 mb-4">
                   <StickyNote className="w-4 h-4 text-gray-800" />
                   <h3 className="font-display font-medium text-sm text-gray-900">Atelier Collaboration & Sharing</h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {/* Sticky Notes controls */}
                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Annotation Toolkit</p>
                       <p className="text-xs text-gray-600 mb-3 leading-relaxed font-medium font-sans">Place, style, and drag feedback notes directly onto the generated sketch container.</p>
                       
                       {/* Color Palette Selector */}
                       <div className="flex items-center gap-2 mb-3.5">
                         <span className="text-[10px] text-gray-500 font-medium">Default note tint:</span>
                         <div className="flex gap-1">
                           {((['yellow', 'pink', 'blue', 'green', 'dark'] as const)).map(col => (
                             <button
                               key={col}
                               onClick={() => setAnnotationColor(col)}
                               className={`w-4 h-4 rounded-full border transition-transform ${annotationColor === col ? 'scale-110 ring-1 ring-gray-900' : 'hover:scale-105'} ${col === 'yellow' ? 'bg-amber-100' : col === 'pink' ? 'bg-rose-100' : col === 'blue' ? 'bg-sky-100' : col === 'green' ? 'bg-emerald-100' : 'bg-slate-900'}`}
                               title={`${col} tint`}
                             />
                           ))}
                         </div>
                       </div>
                     </div>

                     <div className="flex flex-col gap-2">
                       <button
                         onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
                         className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${isAddingAnnotation ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-xs' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'}`}
                       >
                         <Plus className={`w-3.5 h-3.5 ${isAddingAnnotation ? 'rotate-45 text-blue-600' : ''} transition-transform`} />
                         {isAddingAnnotation ? 'Click Sketch to Place' : 'Click-to-Place Note'}
                       </button>
                       
                       <button
                         onClick={handleAddDefaultNote}
                         className="w-full py-2 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                       >
                         <StickyNote className="w-3.5 h-3.5" />
                         Quick Drop Note
                       </button>
                     </div>
                   </div>

                   {/* Shareable collaboration Link */}
                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Collaborator Workspace</p>
                       <p className="text-xs text-gray-600 mb-3 leading-relaxed font-medium font-sans">Export a unique design URL carrying all parameters and placed annotations for live reviews.</p>
                     </div>

                     <div className="flex flex-col gap-2">
                       {copiedLink && (
                         <div className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[9px] font-mono text-gray-500 truncate mb-1">
                           {copiedLink}
                         </div>
                       )}
                       
                       <button
                         onClick={handleShareLink}
                         className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                       >
                         <Share2 className="w-3.5 h-3.5" />
                         Share Collaboration Link
                       </button>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Toast & Banners Overlay */}
               <AnimatePresence>
                 {showShareToast && (
                   <motion.div
                     initial={{ opacity: 0, y: 50, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 20, scale: 0.95 }}
                     className="fixed bottom-8 right-8 z-50 bg-gray-950 text-white px-5 py-4 rounded-xl shadow-2xl border border-gray-800 flex flex-col gap-2 max-w-xs text-left"
                   >
                     <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                       <Check className="w-4 h-4 bg-emerald-500/10 p-0.5 rounded-full" /> Link copied to Clipboard!
                     </div>
                     <p className="text-[10px] text-gray-400 leading-normal">
                       Collaborators can load this link to view your exact design parameters and interactive sticky notes instantly.
                     </p>
                   </motion.div>
                 )}
               </AnimatePresence>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )}
</div>
      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-5xl w-full rounded-2xl flex flex-col md:flex-row max-h-full overflow-hidden shadow-2xl"
            >
              {/* Left sidebar for layout controls */}
              <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-6 flex flex-col md:h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-display font-medium text-lg">Export Layout</h3>
                  <button onClick={() => setShowExportModal(false)} className="md:hidden text-gray-500 hover:text-gray-900">
                     <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mb-6 font-medium">Drag or use arrows to rearrange the sections on your moodboard.</p>
                
                <div className="flex-1">
                  <div className="space-y-3 mb-6">
                    {layoutOrder.map((section, index) => (
                      <div key={section} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">{section}</span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveSectionUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
                          </button>
                          <button
                            onClick={() => moveSectionDown(index)}
                            disabled={index === layoutOrder.length - 1}
                            className={`p-1 rounded ${index === layoutOrder.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200 flex justify-center">
                    <button
                      onClick={undoLayout}
                      disabled={layoutHistory.length <= 1}
                      className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                      Undo Layout Change
                    </button>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="space-y-4 mb-6">
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Template</label>
                        <select 
                          value={exportTemplate}
                          onChange={(e) => setExportTemplate(e.target.value as 'vertical' | 'grid' | 'minimal')}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="vertical">Vertical Flow</option>
                          <option value="grid">Grid Overview</option>
                          <option value="minimal">Minimalist Document</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Theme</label>
                        <select 
                          value={exportTheme}
                          onChange={(e) => setExportTheme(e.target.value as 'light' | 'dark')}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Format</label>
                        <select 
                          value={exportFormat}
                          onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'png')}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="pdf">PDF Document</option>
                          <option value="png">PNG Image</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Quality (Scale)</label>
                        <select 
                          value={exportScale}
                          onChange={(e) => setExportScale(Number(e.target.value))}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-gray-900"
                        >
                          <option value="1">Standard (1x)</option>
                          <option value="2">High Retina (2x)</option>
                          <option value="3">Ultra (3x)</option>
                        </select>
                    </div>
                  </div>

                  <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gray-900 text-white rounded-xl text-xs md:text-sm font-medium uppercase tracking-wider hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Generating...' : 'Download Export'}
                  </button>
                </div>
              </div>
              
              {/* Preview screen */}
              <div className="flex-1 bg-gray-100/50 p-6 flex flex-col md:h-[90vh] overflow-y-auto relative items-center">
                 <button onClick={() => setShowExportModal(false)} className="absolute top-4 right-4 hidden md:block text-gray-400 hover:text-gray-900 bg-white rounded-full p-2 shadow-sm border border-gray-100">
                    <X className="w-5 h-5" />
                 </button>
                 
                  <div className={`bg-transparent transform origin-top w-full ${exportTemplate === 'grid' ? 'max-w-2xl' : 'max-w-sm'}`}>
                    {/* The moodboard preview uses the exact same render logic as main UI but without adding the ID to avoid duplicates.
                        Wait, we NEED ID 'moodboard-export' on this one when modal is open so it captures THIS div state exactly if we use html2canvas!
                     */}
                    <div id={showExportModal ? "moodboard-export" : "moodboard-dummy"} className={`${exportTemplate === 'minimal' ? (exportTheme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white') : (exportTheme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-gray-50 border border-gray-200')} p-6 md:p-8 rounded-xl ${exportTemplate === 'minimal' ? '' : 'shadow-sm'}`}>
                      <div className={`text-center ${exportTemplate === 'minimal' ? 'mb-4 text-left border-b border-gray-100 pb-4' : 'mb-6'} ${exportTheme === 'dark' && exportTemplate === 'minimal' ? 'border-gray-800' : ''}`}>
                          <h2 className={`font-display text-2xl font-semibold mb-1 ${exportTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Couture AI Atelier</h2>
                          <p className={`text-[10px] uppercase tracking-widest font-semibold ${exportTemplate === 'minimal' ? 'text-gray-400' : 'text-gray-400'}`}>Curated Moodboard</p>
                      </div>
                      
                      <div className={exportTemplate === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-6'}>
                        <AnimatePresence mode="popLayout">
                          {layoutOrder.map(section => {
                            const isGrid = exportTemplate === 'grid';
                            const isMin = exportTemplate === 'minimal';
                            const isDark = exportTheme === 'dark';
                            
                            if (section === 'image') return (
                              <motion.div layout key="image" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`aspect-[3/4] mx-auto rounded-2xl ${isDark ? 'bg-gray-800 shadow-xl shadow-black/20' : 'bg-white shadow-xl'} overflow-hidden p-1.5 md:p-2 ${isGrid ? 'col-span-2 md:col-span-1 max-w-sm' : 'max-w-sm'} ${isMin ? 'shadow-none p-0 max-w-sm bg-transparent' : ''}`}>
                                <img src={generatedImage!} alt="Generated Design" className={`w-full h-full object-cover ${isMin ? 'rounded-none' : 'rounded-xl'}`} />
                              </motion.div>
                            );
                            if (section === 'prompt') return (
                              <motion.div layout key="prompt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`${isDark ? 'bg-gray-800 border-gray-700 shadow-sm' : 'bg-white border-gray-200 shadow-sm'} ${isMin ? 'p-0 shadow-none border-none bg-transparent' : 'p-5 rounded-xl border'} ${isGrid ? 'col-span-2 md:col-span-1' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className={`font-display font-medium text-lg ${isMin ? (isDark ? 'text-gray-100 border-l-2 border-gray-100 pl-2' : 'text-gray-900 border-l-2 border-gray-900 pl-2') : (isDark ? 'text-white' : 'text-gray-900')}`}>Design Inspiration</h3>
                                    {injectedStatus && (
                                      <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isMin ? 'bg-transparent text-blue-500' : (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600')}`}>
                                        <Zap className="w-3 h-3" /> Live Trend
                                      </span>
                                    )}
                                </div>
                                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-xs md:text-sm leading-relaxed ${isMin ? 'pl-2.5' : ''}`}>{prompt}</p>
                              </motion.div>
                            );
                            if (section === 'details') return (
                              <motion.div layout key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`grid grid-cols-2 gap-4 ${isDark ? 'bg-gray-800 border-gray-700 shadow-sm' : 'bg-white border-gray-200 shadow-sm'} ${isMin ? 'p-0 shadow-none border-none bg-transparent' : 'p-5 rounded-xl border'} ${isGrid ? 'col-span-2 md:col-span-1' : ''}`}>
                                <div>
                                    <p className={`text-[9px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Material</p>
                                    <p className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{material}</p>
                                </div>
                                <div>
                                    <p className={`text-[9px] uppercase font-bold tracking-widest mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Palette</p>
                                    <p className={`text-xs font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{palette}</p>
                                </div>
                              </motion.div>
                            );
                            if (section === 'advisor') return (
                              <motion.div layout key="advisor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className={`${isMin ? 'p-0 bg-transparent border-none' : 'p-4 rounded-xl border'} ${isGrid ? 'col-span-2' : ''} ${!isMin && advisor.type === 'warning' ? (isDark ? 'border-amber-900/50 bg-amber-900/20' : 'border-amber-200 bg-amber-50') : ''} ${!isMin && advisor.type === 'success' ? (isDark ? 'border-emerald-900/50 bg-emerald-900/20' : 'border-emerald-200 bg-emerald-50') : ''}`}>
                                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2 ${advisor.type === 'warning' ? (isDark ? 'text-amber-400' : 'text-amber-600') : (isDark ? 'text-emerald-400' : 'text-emerald-600')}`}>
                                    <Lightbulb className="w-4 h-4" /> {advisor.title}
                                  </h4>
                                  <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{advisor.text}</p>
                              </motion.div>
                            );
                            return null;
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEATURE 32: KEYBOARD SHORTCUTS CHEAT SHEET MAP OVERLAY */}
      <AnimatePresence>
        {showShortcutsMap && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 md:p-8 relative text-left border border-slate-100"
            >
              <button
                type="button"
                onClick={() => setShowShortcutsMap(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full mb-2 inline-block">Atelier Pro</span>
                <h3 className="font-display text-2xl font-bold text-slate-900">Keyboard Shortcuts Guide</h3>
                <p className="text-slate-500 text-xs">Accelerate your haute couture workflow with native workspace shortcuts.</p>
              </div>

              <div className="space-y-4">
                {[
                  { keys: ['Ctrl', 'G'], action: 'Generate Design', desc: 'Trigger generation engine with active prompts' },
                  { keys: ['Ctrl', 'S'], action: 'Save / Pin Annotations', desc: 'Saves current design context and pushes to favorites' },
                  { keys: ['Ctrl', 'L'], action: 'Toggle Style Library', desc: 'Slide prompt archives & custom collections' },
                  { keys: ['Ctrl', 'T'], action: 'Toggle Trend Injection', desc: 'Inject latest regional live search fashion coordinates' },
                  { keys: ['Ctrl', 'Z'], action: 'Undo Layout Position', desc: 'Rollback visual layout block reorder modifications' },
                  { keys: ['Ctrl', 'K'], action: 'Toggle Shortcut Manual', desc: 'Open or close this shortcut assistant dialog' },
                ].map(shortcut => (
                  <div key={shortcut.action} className="flex justify-between items-center py-2.5 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{shortcut.action}</p>
                      <p className="text-[10px] text-slate-400">{shortcut.desc}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {shortcut.keys.map(k => (
                        <kbd key={k} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md font-mono text-[10px] font-bold text-slate-700 shadow-3xs uppercase">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400">
                <span>Press <kbd className="px-1 py-0.5 bg-slate-50 border rounded">Esc</kbd> to exit modal</span>
                <span>Fully client-side keymaps</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FEATURE 27: PRINTFUL & PRINTIFY POD MANUFACTURING INTEGRATION DIALOG */}
      <AnimatePresence>
        {showManufacturing && generatedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 text-left border border-slate-100"
            >
              {/* Left Column: Mockup Canvas Preview */}
              <div className="bg-slate-50 p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 relative">
                <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-widest bg-slate-200/80 text-slate-700 px-2 py-1 rounded">Interactive POD Mockup</span>
                
                {/* Simulated Garment mockup wrapper */}
                <div className="w-full max-w-xs aspect-square relative bg-white rounded-xl shadow-inner flex items-center justify-center p-4">
                  {/* Garment Base Template Background */}
                  {mGarment === 'hoodie' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-4/5 h-4/5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2c-3.3 0-6 2.7-6 6v4H4.5c-.8 0-1.5.7-1.5 1.5v5c0 .8.7 1.5 1.5 1.5h15c.8 0 1.5-.7 1.5-1.5v-5c0-.8-.7-1.5-1.5-1.5H18V8c0-3.3-2.7-6-6-6zm4 10H8V8c0-2.2 1.8-4 4-4s4 1.8 4 4v4z" />
                      </svg>
                    </div>
                  )}
                  {mGarment === 'tshirt' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-4/5 h-4/5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2h-3l-1 2h-4l-1-2H6C4.9 2 4 2.9 4 4v3c0 .6.4 1 1 1h2v12c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8h2c.6 0 1-.4 1-1V4c0-1.1-.9-2-2-2z" />
                      </svg>
                    </div>
                  )}
                  {mGarment === 'tote' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-3/5 h-3/5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 10h-2V7c0-2.2-1.8-4-4-4S7 4.8 7 7v3H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-8-3c0-1.1.9-2 2-2s2 .9 2 2v3H9V7zm10 13H5v-8h14v8z" />
                      </svg>
                    </div>
                  )}
                  {mGarment === 'scarf' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-3/5 h-3/5 text-slate-200" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h18v18H3V3zm2 2v14h14V5H5z" />
                      </svg>
                    </div>
                  )}

                  {/* Generated Artwork Placement Mask */}
                  <div
                    style={{
                      transform: `translate(${mOffsetX}px, ${mOffsetY}px) scale(${mScale / 100})`,
                      width: mGarment === 'scarf' ? '100%' : '55%',
                      height: mGarment === 'scarf' ? '100%' : '55%'
                    }}
                    className="relative aspect-[3/4] rounded shadow-md overflow-hidden bg-white z-10 transition-all duration-150"
                  >
                    <img src={generatedImage} alt="Placement Graphic" className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Mockup Canvas Controls */}
                <div className="w-full max-w-xs mt-6 space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>PLACEMENT OFFSET X ({mOffsetX}px)</span>
                      <button onClick={() => { setMOffsetX(0); setMOffsetY(0); setMScale(100); }} className="text-indigo-600 font-bold uppercase hover:underline">Center</button>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={mOffsetX}
                      onChange={(e) => setMOffsetX(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>PLACEMENT OFFSET Y ({mOffsetY}px)</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={mOffsetY}
                      onChange={(e) => setMOffsetY(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>DESIGN SCALE ({mScale}%)</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={mScale}
                      onChange={(e) => setMScale(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Printful/Printify API Sync Control */}
              <div className="p-6 md:p-8 flex flex-col justify-between">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowManufacturing(false)}
                    className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors border border-transparent hover:border-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="mb-6 pr-8">
                    <span className="text-[9px] font-bold uppercase tracking-widest bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full mb-2 inline-block">Printful / Printify Sync Ready</span>
                    <h3 className="font-display text-2xl font-bold text-slate-900">Manufacturing POD Center</h3>
                    <p className="text-slate-500 text-xs">Configure mockup spec variables and push production requests directly to Printful/Printify queues.</p>
                  </div>

                  {/* Config settings */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">POD Product Template</label>
                      <select
                        value={mGarment}
                        onChange={(e) => setMGarment(e.target.value as any)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="hoodie">Atelier Oversized Hoodie (Printful 101-H)</option>
                        <option value="tshirt">Minimalist Premium Cotton Tee (Printify Premium)</option>
                        <option value="tote">Organic Canvas Tote Bag (Printful Accessories)</option>
                        <option value="scarf">100% Pure Mulberry Silk Scarf (Atelier Custom)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Production Size Range</label>
                        <select
                          value={mSize}
                          onChange={(e) => setMSize(e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                        >
                          <option value="XS">XS (inclusive petite)</option>
                          <option value="S">S (small spec)</option>
                          <option value="M">M (standard symmetrical)</option>
                          <option value="L">L (athletic scale)</option>
                          <option value="XL">XL (extra large comfort)</option>
                          <option value="XXL">XXL (plus inclusive curve)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Production Base Cost</label>
                        <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                          {mGarment === 'hoodie' && '$24.50 USD'}
                          {mGarment === 'tshirt' && '$14.20 USD'}
                          {mGarment === 'tote' && '$9.80 USD'}
                          {mGarment === 'scarf' && '$38.00 USD'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span className="uppercase tracking-widest">Suggested Retail Price (${mRetailPrice} USD)</span>
                        <span className="text-emerald-600 font-bold">
                          EST. PROFIT: ${(mRetailPrice - (mGarment === 'hoodie' ? 24.5 : mGarment === 'tshirt' ? 14.2 : mGarment === 'tote' ? 9.8 : 38)).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={mGarment === 'hoodie' ? 30 : mGarment === 'tshirt' ? 20 : mGarment === 'tote' ? 15 : 45}
                        max="120"
                        value={mRetailPrice}
                        onChange={(e) => setMRetailPrice(Number(e.target.value))}
                        className="w-full accent-emerald-600"
                      />
                    </div>
                  </div>

                  {/* Simulated submission progress pipeline */}
                  {mOrderStatus !== 'idle' && (
                    <div className="mt-6 p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                      <div className="flex justify-between items-center text-[11px] font-bold text-indigo-950">
                        <span className="flex items-center gap-1.5 uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                          POD API Pipeline Status
                        </span>
                        <span className="capitalize font-mono text-[10px]">{mOrderStatus.replace('_', ' ')}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          style={{
                            width: mOrderStatus === 'submitting' ? '25%' : mOrderStatus === 'submitted' ? '50%' : mOrderStatus === 'mockup_ready' ? '75%' : '100%'
                          }}
                          className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                        />
                      </div>
                      <p className="text-[10px] text-indigo-700 font-medium">
                        {mOrderStatus === 'submitting' && "Pinging Printful secure webhook endpoint... Verifying dimensions..."}
                        {mOrderStatus === 'submitted' && "Success! Push orders submitted. Unique Printful UID: pf_order_983724..."}
                        {mOrderStatus === 'mockup_ready' && "Product Mockup generated in Printify dashboard with 300DPI texture wraps..."}
                        {mOrderStatus === 'in_transit' && "Tracking Active. Production launched! Estimated dispatch is 3-5 standard business days."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  {mOrderStatus === 'idle' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMOrderStatus('submitting');
                        setTimeout(() => {
                          setMOrderStatus('submitted');
                          setTimeout(() => {
                            setMOrderStatus('mockup_ready');
                            setTimeout(() => {
                              setMOrderStatus('in_transit');
                            }, 1800);
                          }, 1500);
                        }, 1200);
                      }}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Cpu className="w-4 h-4 animate-pulse" />
                      Submit to Printful/Printify POD Queue
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setMOrderStatus('idle')}
                      className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Reset Pipeline Configuration
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
