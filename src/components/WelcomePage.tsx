import React, { useState, useEffect, useRef } from 'react';
import { Crown, ArrowRight, PenTool, TrendingUp, History, Wand2, Star, Sparkles, X, Heart, Eye } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { fashionCollection } from '../data/fashionImages.ts';

gsap.registerPlugin(ScrollTrigger);

interface WelcomePageProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function WelcomePage({ onLogin, onSignup }: WelcomePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useGSAP(() => {
    const sketches = gsap.utils.toArray('.reveal-sketch');
    sketches.forEach((sketch: any) => {
      const img = sketch.querySelector('img');
      const innerContent = sketch.querySelector('.inner-content');
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sketch,
          start: 'top 85%',
          end: 'top 30%',
          scrub: 1.5,
        }
      });
      
      tl.fromTo(sketch, 
        { clipPath: 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' },
        { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'power2.inOut' }
      );
      
      if (img) {
         tl.fromTo(img, 
           { scale: 1.2, filter: 'grayscale(100%)' },
           { scale: 1, filter: 'grayscale(0%)', duration: 1 },
           0 // Start at the same time
         );
      }
      
      if (innerContent) {
        tl.fromTo(innerContent,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1 },
          0.2
        );
      }
    });
  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="min-h-[100dvh] bg-white text-gray-900 font-sans selection:bg-gray-200 selection:text-gray-900 overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 p-4 md:p-6 md:px-12 flex justify-between items-center z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-gray-900" />
          <span className="font-display text-lg font-semibold tracking-wide">Couture AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="text-gray-600 font-medium text-xs md:text-sm hover:text-gray-900 transition-colors"
          >
            Log In
          </button>
          <button
            onClick={onSignup}
            className="bg-gray-900 text-white px-5 py-2 md:px-6 md:py-2.5 rounded-full font-medium text-xs md:text-sm hover:bg-gray-800 transition-colors shadow-sm"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] pt-24 md:pt-32 pb-12 md:pb-20 flex flex-col justify-center items-center px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center w-full gap-12 md:gap-8">
          {/* Left: Copy */}
          <div className="w-full md:w-1/2 z-10 md:pr-12 mt-12 md:mt-0 order-2 md:order-1 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100/80 text-gray-600 text-[10px] md:text-xs font-semibold uppercase tracking-widest mb-6 md:mb-8 border border-gray-200/50">
                <Star className="w-3 h-3" /> Built for the Avant-Garde
              </div>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight mb-4 md:mb-6">
                The <span className="italic text-gray-400">future</span> of<br />fashion design.
              </h1>
              <p className="text-gray-500 text-base md:text-xl leading-relaxed max-w-md mx-auto md:mx-0 mb-8 md:mb-10 font-light">
                Transform ideas into haute couture in seconds. An intelligent studio for generative sketching, trend forecasting, and boundless creativity.
              </p>
              <button
                onClick={onLogin}
                className="group relative inline-flex items-center justify-center bg-gray-900 text-white px-6 py-3.5 md:px-8 md:py-4 rounded-full font-medium text-sm md:text-base tracking-wide overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-900/20"
              >
                <span className="relative z-10 flex items-center gap-2 md:gap-3">
                  Start Designing <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </span>
              </button>
            </motion.div>
          </div>

          {/* Right: Dynamic Sketch Animation */}
          <div className="w-full md:w-1/2 relative h-[50vh] md:h-[80vh] flex items-center justify-center order-1 md:order-2">
             <SketchToRealAnimation />
          </div>
        </div>
      </section>

      {/* Features Marquee */}
      <div className="border-y border-gray-100 bg-gray-50 py-4 md:py-6 overflow-hidden flex whitespace-nowrap">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex gap-8 md:gap-12 items-center px-6"
        >
          {Array(4).fill([
            "GENERATIVE SKETCHING", "TREND FORECASTING", "HISTORICAL EVOLUTION", "MATERIAL SYNTHESIS", "RAPID ITERATION"
          ]).flat().map((text, i) => (
             <div key={i} className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs font-semibold uppercase tracking-widest text-gray-400">
               <Sparkles className="w-3 h-3" /> {text}
             </div>
          ))}
        </motion.div>
      </div>

      <section className="py-20 md:py-32 px-6 md:px-12 max-w-7xl mx-auto space-y-24 md:space-y-32">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-display text-3xl md:text-5xl mb-6">Trusted by the best</h2>
          <p className="text-gray-500 text-base md:text-lg">From solo creators to global fashion houses, the industry is building with Couture AI.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { quote: "Couture AI has completely changed how we prototype. We've cut our sampling costs by 40% and improved our iteration speed tenfold.", author: "Elena V.", role: "Creative Director" },
            { quote: "The Trend Radar allows us to validate our collections against real-time global aesthetics. It is an indispensable tool for our brand.", author: "James T.", role: "Lead Designer" },
            { quote: "Being able to type a concept and see a photorealistic render in seconds is nothing short of magic. It's the future.", author: "Sarah M.", role: "Independent Creator" }
          ].map((item, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
              <Star className="w-8 h-8 text-gray-200 absolute top-6 right-6" />
              <p className="text-gray-700 leading-relaxed mb-6 italic">"{item.quote}"</p>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{item.author}</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest">{item.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* The Atelier Lookbook Section */}
        <section className="py-12 border-t border-gray-100">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Curated Collection
              </div>
              <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-gray-900">
                The Atelier Lookbook
              </h2>
              <p className="text-gray-500 text-sm md:text-base mt-2 max-w-xl">
                Explore a live archive of over 100 photorealistic concepts, patterns, and textiles generated by Couture AI.
              </p>
            </div>
          </div>

          <AtelierLookbookGallery />
        </section>

        {/* Feature 1 */}
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="w-full md:w-1/2">
            <div 
              className="reveal-sketch aspect-[4/5] md:aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 relative shadow-2xl"
            >
              <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800&h=1000" alt="Generative Design" className="w-full h-full object-cover" />
              <div className="inner-content absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="inner-content absolute bottom-6 left-6 right-6 p-4 md:p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-white/20 p-1.5 rounded-lg"><Wand2 className="w-4 h-4" /></div>
                  <span className="text-sm font-medium">Prompt-to-Couture</span>
                </div>
                <p className="text-xs text-white/80 leading-relaxed max-w-xs">"A minimalist silk slip dress with asymmetrical hemline and silver hardware..."</p>
              </div>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-6 leading-tight">Generative <br className="hidden md:block" />Studio</h2>
            <p className="text-gray-500 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
              Don't let technical skills limit your imagination. Describe your vision, set the materials, and let our AI render photorealistic concepts in seconds. Iterate faster than ever before.
            </p>
            <ul className="space-y-3 md:space-y-4">
              {['Photorealistic rendering', 'Customizable material styles', 'Advanced color palette matching'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 text-sm md:text-base">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <PenTool className="w-3 h-3 text-gray-900" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="flex flex-col md:flex-row-reverse items-center gap-10 md:gap-16">
          <div className="w-full md:w-1/2">
            <div 
              className="reveal-sketch aspect-square rounded-3xl overflow-hidden bg-gray-100 relative shadow-2xl p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center transform"
            >
               <div className="w-full h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-5 md:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                      <h3 className="font-display text-xl md:text-2xl">Trend Match</h3>
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2.5 py-1 rounded-full">+98%</span>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '98%' }} transition={{ duration: 1, delay: 0.2 }} className="h-full bg-gray-900" /></div>
                      <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '85%' }} transition={{ duration: 1, delay: 0.4 }} className="h-full bg-gray-400" /></div>
                      <div className="h-1.5 md:h-2 bg-gray-100 rounded-full overflow-hidden"><motion.div initial={{ width: 0 }} whileInView={{ width: '60%' }} transition={{ duration: 1, delay: 0.6 }} className="h-full bg-gray-200" /></div>
                    </div>
                  </div>
                  <div className="mt-6 md:mt-8 grid grid-cols-2 gap-3 md:gap-4">
                     <div className="inner-content h-20 md:h-24 bg-gray-100 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&q=80)`}} />
                     <div className="inner-content h-20 md:h-24 bg-gray-100 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1485230405346-71acb9518d9c?auto=format&fit=crop&q=80)`}} />
                  </div>
               </div>
            </div>
          </div>
          <div className="w-full md:w-1/2">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-4 md:mb-6 leading-tight">Radar & <br className="hidden md:block"/>Forecasting</h2>
            <p className="text-gray-500 text-base md:text-lg mb-6 md:mb-8 leading-relaxed">
              Stay ahead of the curve. Our AI analyzes global aesthetics, runway shows, and street style in real-time to surface micro-trends before they hit the mainstream.
            </p>
             <ul className="space-y-3 md:space-y-4">
              {['Real-time aesthetic analysis', 'Confidence scoring', 'Direct-to-studio integration'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 text-sm md:text-base">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-3 h-3 text-gray-900" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-6 md:px-12 bg-gray-900 text-white text-center rounded-t-[2.5rem] md:rounded-t-[4rem] mt-12 md:mt-20">
         <motion.div 
           initial={{ opacity: 0, y: 30 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="max-w-3xl mx-auto"
         >
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">Ready to shape the<br className="hidden md:block"/> future of fashion?</h2>
            <p className="text-gray-400 text-base md:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Join the avant-garde of designers using Couture AI to push the boundaries of what's possible in the digital atelier.
            </p>
            <button
              onClick={onLogin}
              className="group relative inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 md:px-10 md:py-5 rounded-full font-medium text-sm md:text-base tracking-wide overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-2xl"
            >
              Enter the Atelier <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 md:ml-3 transition-transform group-hover:translate-x-1" />
            </button>
         </motion.div>
      </section>
    </div>
  );
}

// Sub-component for dynamic sketch animation
function SketchToRealAnimation() {
  const [phase, setPhase] = useState<'sketching' | 'real'>('sketching');

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(p => p === 'sketching' ? 'real' : 'sketching');
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-[280px] sm:max-w-xs md:max-w-sm aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-gray-50 transform md:rotate-2">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDAgbCA0MCAwIGwgMCA0MCBtIC00MCAtNDAgbCAwIDQwIGwgNDAgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZWVlIi8+Cjwvc3ZnPg==')] opacity-50" />

      <AnimatePresence mode="popLayout">
        {phase === 'sketching' ? (
          <motion.div
            key="sketch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center p-6 md:p-8"
          >
             {/* Animated SVG Sketch */}
             <svg viewBox="0 0 100 200" className="w-full h-full stroke-gray-900 stroke-[1.5] fill-transparent stroke-linecap-round stroke-linejoin-round">
                {/* Torso/Neck */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  d="M40 20 C 50 10, 60 10, 60 20 C 65 30, 65 40, 60 45 C 50 50, 40 50, 35 45 C 30 40, 30 30, 40 20 Z"
                />
                {/* Waist */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.4, ease: "easeInOut" }}
                  d="M35 45 Q 25 60 20 80 Q 50 85 80 80 Q 75 60 60 45"
                />
                {/* Skirt Base */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                  d="M20 80 Q 10 120 15 180 L 85 180 Q 90 120 80 80"
                />
                {/* Folds/Details */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 1.5, ease: "easeInOut" }}
                  d="M40 82 Q 45 130 40 180 M 60 82 Q 55 130 60 180 M 20 80 L 80 80 M 25 100 L 75 100 M 20 140 L 80 140"
                />
                {/* Scribbles */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 2, ease: "linear" }}
                  className="stroke-gray-400 stroke-1"
                  d="M10 20 L 30 15 M 15 30 L 30 35 M 70 20 L 90 25 L 85 40"
                />
             </svg>
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-6 flex items-center gap-2 text-[10px] md:text-xs font-mono text-gray-500 bg-white/80 px-3 py-1.5 rounded-full shadow-sm">
               <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>_</motion.span>
               Generating concepts...
             </div>
          </motion.div>
        ) : (
          <motion.div
            key="real"
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0"
          >
             <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800&h=1200" alt="Generated Fashion" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent flex flex-col justify-end p-5 md:p-6">
                 <h4 className="text-white font-display text-lg md:text-xl mb-1">Look 01: Silk & Shadows</h4>
                 <p className="text-white/80 text-[10px] md:text-xs font-medium uppercase tracking-widest flex items-center gap-1.5">
                   <Sparkles className="w-3 h-3 text-white" /> AI Generated Prototype
                 </p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Elements (Desktop only) */}
      <motion.div 
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-8 top-1/4 bg-white p-2 md:p-3 rounded-xl shadow-xl border border-gray-100 hidden lg:block z-10"
      >
        <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-lg bg-[url('https://images.unsplash.com/photo-1502163140606-888448ae8cfe?auto=format&fit=crop&q=80')] bg-cover mb-2" />
        <div className="h-1 md:h-1.5 w-6 md:w-8 bg-gray-200 rounded-full" />
      </motion.div>

      <motion.div 
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -left-6 bottom-1/4 bg-white p-3 md:p-4 rounded-xl shadow-xl border border-gray-100 hidden lg:block z-10"
      >
        <div className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-gray-500 mb-0.5 md:mb-1">Material selected</div>
        <div className="font-display text-sm md:text-base">Silk Crepe De Chine</div>
      </motion.div>
    </div>
  )
}

function AtelierLookbookGallery() {
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [likedItems, setLikedItems] = useState<string[]>([]);

  const categories = ['All', 'Avant-Garde', 'Streetwear', 'Minimalist', 'Vintage', 'Formal', 'Bohemian', 'Eco-Luxury'];

  const handleToggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedItems.includes(id)) {
      setLikedItems(prev => prev.filter(item => item !== id));
    } else {
      setLikedItems(prev => [...prev, id]);
    }
  };

  const filteredCollection = fashionCollection.filter(item => {
    const matchesCategory = activeTab === 'All' || item.category === activeTab;
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.palette.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Take up to visibleCount
  const visibleItems = filteredCollection.slice(0, visibleCount);

  return (
    <div className="w-full">
      {/* Filters and Search controls */}
      <div className="flex flex-col gap-6 mb-10">
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveTab(cat);
                setVisibleCount(12); // reset visibility
              }}
              className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all border ${
                activeTab === cat 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-sm' 
                  : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative max-w-md w-full">
          <input
            type="text"
            placeholder="Search prompt, fabric or style tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all text-sm"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {visibleItems.map((item, index) => {
            const isLiked = likedItems.includes(item.id);
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: (index % 12) * 0.05 }}
                onClick={() => setSelectedItem(item)}
                className="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer"
              >
                <div className="aspect-[4/5] bg-gray-50 overflow-hidden relative">
                  <img 
                    src={item.thumbnail} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Category overlay */}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] uppercase font-bold tracking-wider text-gray-700 border border-white/20">
                    {item.category}
                  </span>

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-4">
                    <span className="text-white text-xs font-semibold flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1.5 rounded-xl border border-white/10">
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </span>
                    <button
                      onClick={(e) => handleToggleLike(item.id, e)}
                      className={`p-2 rounded-xl border backdrop-blur-sm transition-all ${
                        isLiked 
                          ? 'bg-red-500 border-red-500 text-white' 
                          : 'bg-white/25 border-white/20 text-white hover:bg-white/40'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
                    </button>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h4 className="font-display font-medium text-gray-900 group-hover:text-indigo-600 transition-colors text-base whitespace-nowrap overflow-hidden text-ellipsis">
                      {item.name}
                    </h4>
                    <span className="text-[10px] font-mono text-gray-400 shrink-0">
                      #{item.id}
                    </span>
                  </div>

                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                    "{item.prompt}"
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-50">
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-md">
                      {item.material}
                    </span>
                    <span className="bg-gray-50 text-gray-500 text-[10px] font-medium px-2 py-0.5 rounded-md">
                      {item.palette}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* No results state */}
      {filteredCollection.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-display font-medium text-lg text-gray-700 mb-1">No Designs Found</h3>
          <p className="text-gray-400 text-sm">We couldn't find any designs matching "{searchQuery}" in this category.</p>
        </div>
      )}

      {/* Load More buttons */}
      {filteredCollection.length > visibleCount && (
        <div className="text-center mt-12">
          <button
            onClick={() => setVisibleCount(prev => Math.min(prev + 12, filteredCollection.length))}
            className="px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow-lg shadow-gray-900/10 cursor-pointer"
          >
            Show More Sophisticated Designs ({filteredCollection.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, y: 25, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 25, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative z-10 border border-gray-100 flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left Column: Image */}
              <div className="w-full md:w-1/2 bg-gray-50 relative aspect-[4/5] md:aspect-auto">
                <img 
                  src={selectedItem.thumbnail} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider text-gray-800 shadow-sm border border-white/20">
                  {selectedItem.category}
                </span>
              </div>

              {/* Right Column: Copy & Prompts */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      AI Generated Design Preset
                    </span>
                    <button 
                      onClick={() => setSelectedItem(null)}
                      className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="font-display font-semibold text-2xl text-gray-900 mb-2">
                    {selectedItem.name}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mb-6">
                    <span>Look ID: {selectedItem.id}</span>
                    <span>•</span>
                    <span>Created {selectedItem.createdAt}</span>
                    <span>•</span>
                    <span>Used {selectedItem.usageCount} times</span>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        GENERATIVE AI PROMPT
                      </span>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-gray-700 text-xs leading-relaxed italic relative group/prompt">
                        "{selectedItem.prompt}"
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                          MATERIAL SELECTION
                        </span>
                        <div className="bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100 text-xs font-medium text-gray-800">
                          {selectedItem.material}
                        </div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                          COLOR PALETTE
                        </span>
                        <div className="bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100 text-xs font-medium text-gray-800">
                          {selectedItem.palette}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                        TAGS
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedItem.tags.map((tag: string) => (
                          <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-lg">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      const scrollTarget = document.querySelector('nav');
                      if (scrollTarget) scrollTarget.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 py-3.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors text-center cursor-pointer"
                  >
                    Load in Dynamic Studio
                  </button>
                  <button
                    onClick={(e) => handleToggleLike(selectedItem.id, e)}
                    className={`px-4 rounded-xl border flex items-center justify-center transition-colors ${
                      likedItems.includes(selectedItem.id)
                        ? 'bg-red-50 border-red-200 text-red-500'
                        : 'bg-white border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedItems.includes(selectedItem.id) ? 'fill-red-500' : ''}`} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

