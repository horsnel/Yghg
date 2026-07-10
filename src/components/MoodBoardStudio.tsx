import React, { useState, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Paintbrush, StickyNote, Plus, Trash2, ArrowRight, Upload } from 'lucide-react';
import { motion } from 'motion/react';

interface MoodBoardItem {
  id: string;
  type: 'note' | 'color' | 'image' | 'text';
  content: string;
  title?: string;
  color?: string; // Hex or style preset
  x: number; // Percent position on board
  y: number;
}

interface MoodBoardStudioProps {
  onGenerateFromMoodBoard: (prompt: string, material: string, palette: string) => void;
}

export function MoodBoardStudio({ onGenerateFromMoodBoard }: MoodBoardStudioProps) {
  const [items, setItems] = useState<MoodBoardItem[]>([
    { id: '1', type: 'note', content: 'Asymmetric pleating & draping', color: '#FEF3C7', x: 15, y: 20 },
    { id: '2', type: 'color', content: '#78716C', title: 'Warm Stone', color: '#78716C', x: 45, y: 15 },
    { id: '3', type: 'color', content: '#D6CFC7', title: 'Alabaster Silk', color: '#D6CFC7', x: 60, y: 15 },
    { id: '4', type: 'note', content: 'Cyberpunk modular straps & utility hardware', color: '#E0F2FE', x: 30, y: 65 },
    { id: '5', type: 'text', content: 'Mood: Brutalist Neo-Romanticism', x: 10, y: 50 },
  ]);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragStartOffset = useRef({ x: 0, y: 0 });
  const boardRef = useRef<HTMLDivElement | null>(null);

  // Color Extractor States
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [extractionImage, setExtractionImage] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);

  // Create controls
  const [noteText, setNoteText] = useState('');
  const [customColor, setCustomColor] = useState('#6366F1');
  const [customText, setCustomText] = useState('');

  // Handle Dragging
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    setActiveDragId(id);
    const item = items.find(it => it.id === id);
    if (!item || !boardRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = boardRef.current.getBoundingClientRect();

    const currentPxX = (item.x / 100) * rect.width;
    const currentPxY = (item.y / 100) * rect.height;

    dragStartOffset.current = {
      x: clientX - rect.left - currentPxX,
      y: clientY - rect.top - currentPxY,
    };
  };

  const handleDragMove = (e: any) => {
    if (!activeDragId || !boardRef.current) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const rect = boardRef.current.getBoundingClientRect();
    
    let xPx = clientX - rect.left - dragStartOffset.current.x;
    let yPx = clientY - rect.top - dragStartOffset.current.y;

    let xPct = (xPx / rect.width) * 100;
    let yPct = (yPx / rect.height) * 100;

    // Bounds limit 0-90%
    xPct = Math.min(Math.max(xPct, 1), 88);
    yPct = Math.min(Math.max(yPct, 1), 88);

    setItems(prev => prev.map(item => item.id === activeDragId ? { ...item, x: xPct, y: yPct } : item));
  };

  const handleDragEnd = () => {
    setActiveDragId(null);
  };

  React.useEffect(() => {
    if (activeDragId) {
      const moveHandler = (e: MouseEvent | TouchEvent) => handleDragMove(e);
      const endHandler = () => handleDragEnd();

      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', endHandler);
      window.addEventListener('touchmove', moveHandler);
      window.addEventListener('touchend', endHandler);

      return () => {
        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', endHandler);
        window.removeEventListener('touchmove', moveHandler);
        window.removeEventListener('touchend', endHandler);
      };
    }
  }, [activeDragId]);

  // Palette Extraction Logic
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setExtractionImage(src);
      extractPaletteFromImage(src);
    };
    reader.readAsDataURL(file);
  };

  const extractPaletteFromImage = (imageSrc: string) => {
    setExtracting(true);
    // Real client-side color extraction using HTML5 Canvas
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);

      const imgData = ctx.getImageData(0, 0, 50, 50).data;
      const colors: { [key: string]: number } = {};

      // Sample pixels
      for (let i = 0; i < imgData.length; i += 16) {
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        
        // Exclude extreme whites/blacks to get true pigments
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        if (brightness > 20 && brightness < 235) {
          colors[hex] = (colors[hex] || 0) + 1;
        }
      }

      const sortedColors = Object.keys(colors).sort((a, b) => colors[b] - colors[a]).slice(0, 5);
      
      // Fallback if empty
      if (sortedColors.length === 0) {
        sortedColors.push("#E2E8F0", "#CBD5E1", "#94A3B8", "#64748B", "#475569");
      }

      setExtractedColors(sortedColors);
      setExtracting(false);
    };
  };

  const applyExtractedColorToBoard = (hex: string) => {
    const id = 'item_' + Date.now() + Math.random().toString(36).substring(2, 5);
    const newItem: MoodBoardItem = {
      id,
      type: 'color',
      content: hex,
      title: 'Sampled Hue',
      color: hex,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
    };
    setItems([...items, newItem]);
  };

  // Add Item controls
  const addStickyNote = () => {
    if (!noteText.trim()) return;
    const id = 'item_' + Date.now();
    const colors = ['#FEF3C7', '#FCE7F3', '#E0F2FE', '#D1FAE5', '#F3F4F6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newItem: MoodBoardItem = {
      id,
      type: 'note',
      content: noteText,
      color: randomColor,
      x: 20 + Math.random() * 40,
      y: 20 + Math.random() * 40,
    };
    setItems([...items, newItem]);
    setNoteText('');
  };

  const addColorSwatch = () => {
    const id = 'item_' + Date.now();
    const newItem: MoodBoardItem = {
      id,
      type: 'color',
      content: customColor,
      title: 'Custom Palette',
      color: customColor,
      x: 20 + Math.random() * 40,
      y: 20 + Math.random() * 40,
    };
    setItems([...items, newItem]);
  };

  const addTextBox = () => {
    if (!customText.trim()) return;
    const id = 'item_' + Date.now();
    const newItem: MoodBoardItem = {
      id,
      type: 'text',
      content: customText,
      x: 20 + Math.random() * 40,
      y: 20 + Math.random() * 40,
    };
    setItems([...items, newItem]);
    setCustomText('');
  };

  const removeItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems(items.filter(it => it.id !== id));
  };

  // Compile mood board elements into Studio Generator inputs
  const compileMoodBoard = () => {
    const notes = items.filter(it => it.type === 'note' || it.type === 'text').map(it => it.content).join(', ');
    const colorsHex = items.filter(it => it.type === 'color').map(it => it.content).join(' & ');
    
    // Synthesize design prompt parameters
    const prompt = `A luxury designer collection concept incorporating: ${notes}. Styled elegantly in high fashion catalogue format.`;
    const material = "Organic Silk Gazar & Structured Crepe";
    const palette = colorsHex || "Earthy Brutal Slate & Charcoal Gray";

    onGenerateFromMoodBoard(prompt, material, palette);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 text-left max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 mb-8 gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Paintbrush className="w-6 h-6 text-indigo-600" />
            Atelier Mood Board Builder
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-medium">Design collage, color extraction, and quick prompt compiling</p>
        </div>

        <button
          onClick={compileMoodBoard}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Compile & Create Design
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Control Panel: Toolbox & Color Extraction */}
        <div className="space-y-6">
          
          {/* Tool 1: Add Sticky Notes */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <StickyNote className="w-4 h-4 text-amber-500" /> Add Design Note
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Flared drapery, asymmetric..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStickyNote()}
                className="flex-1 text-xs px-2.5 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-900"
              />
              <button
                onClick={addStickyNote}
                className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tool 2: Color Chips */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Paintbrush className="w-4 h-4 text-emerald-500" /> Add Color Chip
            </h3>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-10 h-8 rounded border border-gray-200 cursor-pointer p-0"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="flex-1 text-xs font-mono px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none"
              />
              <button
                onClick={addColorSwatch}
                className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tool 3: Color Palette Extractor */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-indigo-500" /> Color Extractor
            </h3>
            
            <label className="border border-dashed border-gray-300 hover:border-gray-900 bg-white p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all">
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed">Upload Inspiration Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {extractionImage && (
              <div className="mt-4 space-y-3">
                <div className="aspect-[3/2] rounded-lg overflow-hidden border border-gray-100 bg-white p-1">
                  <img src={extractionImage} alt="Inspiration source" className="w-full h-full object-cover rounded" />
                </div>
                
                {extracting ? (
                  <p className="text-[10px] text-gray-400 animate-pulse uppercase tracking-wider font-semibold">Sampling pigments...</p>
                ) : (
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Extracted Hues (Click to add):</p>
                    <div className="flex gap-1.5">
                      {extractedColors.map((hex) => (
                        <button
                          key={hex}
                          onClick={() => applyExtractedColorToBoard(hex)}
                          className="w-7 h-7 rounded-full border border-gray-200 shadow-sm hover:scale-110 transition-transform cursor-pointer"
                          style={{ backgroundColor: hex }}
                          title={`Add ${hex} to canvas`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Canvas Area */}
        <div className="lg:col-span-3">
          <div className="mb-2 flex justify-between items-center px-1">
            <p className="text-xs text-gray-400 font-medium font-sans">
              Drag notes and swatches around to organize. Unused items can be deleted with the (X) button.
            </p>
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Atelier Canvas</span>
          </div>

          <div
            ref={boardRef}
            className="w-full h-[550px] bg-slate-50/50 rounded-2xl border-2 border-dashed border-gray-200 relative overflow-hidden select-none"
          >
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={(e) => handleDragStart(e, item.id)}
                onTouchStart={(e) => handleDragStart(e, item.id)}
                className={`cursor-grab active:cursor-grabbing select-none transition-shadow z-10`}
              >
                {/* Visual note render */}
                {item.type === 'note' && (
                  <div
                    style={{ backgroundColor: item.color }}
                    className="p-3.5 rounded-lg border border-black/5 shadow-md w-40 text-left relative group font-sans"
                  >
                    <p className="text-[11px] font-medium text-amber-950 leading-relaxed font-sans">{item.content}</p>
                    <button
                      onClick={(e) => removeItem(item.id, e)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-white/60 hover:bg-white rounded text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {/* Visual color swatch render */}
                {item.type === 'color' && (
                  <div className="bg-white p-1.5 rounded-xl border border-gray-200/60 shadow-lg w-28 text-left group relative">
                    <div
                      style={{ backgroundColor: item.color }}
                      className="w-full h-14 rounded-lg border border-black/5 mb-1.5 shadow-inner"
                    />
                    <div className="px-1">
                      <p className="text-[9px] font-bold text-gray-800 leading-tight uppercase truncate">{item.title}</p>
                      <p className="text-[8px] font-mono text-gray-400 mt-0.5">{item.content}</p>
                    </div>
                    <button
                      onClick={(e) => removeItem(item.id, e)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-0.5 bg-white/80 hover:bg-white rounded text-red-600 transition-opacity"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}

                {/* Plain text block */}
                {item.type === 'text' && (
                  <div className="bg-transparent border border-dashed border-gray-300 hover:border-gray-800 px-3 py-1.5 rounded-md text-left relative group">
                    <p className="text-xs font-semibold text-gray-700 font-sans">{item.content}</p>
                    <button
                      onClick={(e) => removeItem(item.id, e)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
