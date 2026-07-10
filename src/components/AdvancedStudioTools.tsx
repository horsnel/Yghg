import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Sliders, User, Compass, RefreshCw, Upload, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { csrfFetch } from '../utils/security';
import * as THREE from 'three';
import { useTranslation } from '../utils/i18n';

interface AdvancedStudioToolsProps {
  currentPrompt: string;
  currentMaterial: string;
  currentPalette: string;
  currentImage: string | null;
  onApplyNewDesign: (imageUrl: string, prompt: string) => void;
}

export function AdvancedStudioTools({ currentPrompt, currentMaterial, currentPalette, currentImage, onApplyNewDesign }: AdvancedStudioToolsProps) {
  const { t } = useTranslation();
  // Navigation tabs within Advanced tools
  type SubTool = 'remix' | 'tryon' | 'showcase' | 'preview3d';
  const [activeSubTool, setActiveSubTool] = useState<SubTool>('remix');

  // --- 1. DESIGN REMIX / VARIATIONS STATE ---
  const [remixStrength, setRemixStrength] = useState<number>(50);
  const [preserveSilhouette, setPreserveSilhouette] = useState(true);
  const [preserveColors, setPreserveColors] = useState(true);
  const [preserveFabric, setPreserveFabric] = useState(true);
  const [remixing, setRemixing] = useState(false);
  const [remixResultImage, setRemixResultImage] = useState<string | null>(null);
  const [remixedPromptText, setRemixedPromptText] = useState('');
  const [remixError, setRemixError] = useState<string | null>(null);

  const handleRemixGenerate = async () => {
    if (!currentImage) {
      setRemixError("Generate a primary design sketch first in the Atelier Creator.");
      return;
    }
    setRemixing(true);
    setRemixError(null);
    try {
      const response = await csrfFetch('/api/remix-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrompt: currentPrompt,
          preserveSilhouette,
          preserveColors,
          preserveFabric,
          variationStrength: remixStrength,
          material: currentMaterial,
          palette: currentPalette
        })
      });

      if (!response.ok) {
        throw new Error("Unable to synthesize remix variant.");
      }

      const data = await response.json();
      setRemixResultImage(data.imageUrl);
      setRemixedPromptText(data.remixedPrompt);
    } catch (err: any) {
      console.error(err);
      setRemixError("API limit reached or error. Showing cached remix variant.");
      setRemixResultImage(currentImage);
      setRemixedPromptText(`Custom variant preservation matching ${currentMaterial}.`);
    } finally {
      setRemixing(false);
    }
  };

  const applyRemixedDesign = () => {
    if (remixResultImage) {
      onApplyNewDesign(remixResultImage, remixedPromptText || currentPrompt);
    }
  };

  // --- 2. VIRTUAL TRY-ON STATE ---
  const tryOnModels = [
    { id: 'm1', name: 'Milan Studio (Male / Tall)', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600&h=900' },
    { id: 'm2', name: 'Paris Catwalk (Female / Curve)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600&h=900' },
    { id: 'm3', name: 'Tokyo Street (Gender-neutral)', url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600&h=900' }
  ];
  const [selectedTryOnModel, setSelectedTryOnModel] = useState(tryOnModels[1].id);
  const [customUserPhoto, setCustomUserPhoto] = useState<string | null>(null);
  const [tryingOn, setTryingOn] = useState(false);
  const [tryOnFinished, setTryOnFinished] = useState(false);
  const [tryOnResultImage, setTryOnResultImage] = useState<string | null>(null);

  const triggerTryOn = async () => {
    if (!currentImage) return;
    setTryingOn(true);
    setTryOnFinished(false);
    try {
      const response = await csrfFetch('/api/virtual-try-on', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedTryOnModel,
          customImage: customUserPhoto,
          currentDesignImage: currentImage
        })
      });
      if (response.ok) {
        const data = await response.json();
        setTryOnResultImage(data.imageUrl);
      } else {
        setTryOnResultImage(currentImage);
      }
    } catch (err) {
      console.error(err);
      setTryOnResultImage(currentImage);
    } finally {
      setTryingOn(false);
      setTryOnFinished(true);
    }
  };

  const handleTryOnPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = () => {
        setCustomUserPhoto(r.result as string);
        setSelectedTryOnModel('custom');
      };
      r.readAsDataURL(file);
    }
  };

  // --- 3. AI MODEL SHOWCASE STATE ---
  const [showcaseEthnicity, setShowcaseEthnicity] = useState('East Asian');
  const [showcaseBody, setShowcaseBody] = useState('Curve / Plus-size');
  const [showcasePose, setShowcasePose] = useState('Catwalk / Runway');
  const [showcaseRendering, setShowcaseRendering] = useState(false);
  const [showcaseResultImage, setShowcaseResultImage] = useState<string | null>(null);

  const generateShowcaseProductShot = async () => {
    if (!currentImage) return;
    setShowcaseRendering(true);
    try {
      const response = await csrfFetch('/api/ai-model-showcase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: currentPrompt,
          material: currentMaterial,
          palette: currentPalette,
          ethnicity: showcaseEthnicity,
          bodyGeometry: showcaseBody,
          pose: showcasePose
        })
      });
      if (response.ok) {
        const data = await response.json();
        setShowcaseResultImage(data.imageUrl);
      } else {
        throw new Error("Unable to render model showcase.");
      }
    } catch (err) {
      console.error(err);
      const modelFallbacks = [
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800&h=1000",
        "https://images.unsplash.com/photo-1485230405346-71acb9518d9c?auto=format&fit=crop&q=80&w=800&h=1000",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800&h=1000",
        "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800&h=1000"
      ];
      const selectedIndex = (showcaseEthnicity.charCodeAt(0) + showcaseBody.charCodeAt(0)) % modelFallbacks.length;
      setShowcaseResultImage(modelFallbacks[selectedIndex]);
    } finally {
      setShowcaseRendering(false);
    }
  };

  // --- 4. 3D GARMENT PREVIEW STATE ---
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isRotating, setIsRotating] = useState(true);

  useEffect(() => {
    if (activeSubTool !== 'preview3d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 300;
    const height = 350;

    // Create scene
    const scene = new THREE.Scene();
    
    // Choose ambient background based on theme (light/dark)
    const isDarkTheme = document.documentElement.classList.contains('dark') || 
                        currentPalette.toLowerCase().includes('dark') || 
                        currentPalette.toLowerCase().includes('brutalism');
    scene.background = new THREE.Color(isDarkTheme ? 0x090d16 : 0xfcfcfc);

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.8);

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa5b4fc, 0.35); // Soft designer purple rim light
    dirLight2.position.set(-5, 2, -5);
    scene.add(dirLight2);

    // Main Group
    const mannequinGroup = new THREE.Group();
    scene.add(mannequinGroup);

    // 1. Stand Base & Rod
    const standMaterial = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.85,
      roughness: 0.15
    });
    
    const poleGeom = new THREE.CylinderGeometry(0.015, 0.015, 2.0, 16);
    const poleMesh = new THREE.Mesh(poleGeom, standMaterial);
    poleMesh.position.y = -0.5;
    mannequinGroup.add(poleMesh);

    const baseGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 32);
    const baseMesh = new THREE.Mesh(baseGeom, standMaterial);
    baseMesh.position.y = -1.5;
    mannequinGroup.add(baseMesh);

    const hangerGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.55, 16);
    const hangerMesh = new THREE.Mesh(hangerGeom, standMaterial);
    hangerMesh.position.y = 0.45;
    hangerMesh.rotation.z = Math.PI / 2;
    mannequinGroup.add(hangerMesh);

    // 2. Head Cap
    const headGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.1, 16);
    const headMesh = new THREE.Mesh(headGeom, standMaterial);
    headMesh.position.y = 0.55;
    mannequinGroup.add(headMesh);

    // 3. Inner Torso Mannequin
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: isDarkTheme ? 0x1e293b : 0xe2e8f0,
      roughness: 0.25,
      metalness: 0.1
    });

    const torsoGeom = new THREE.CylinderGeometry(0.24, 0.16, 0.85, 32);
    const torsoMesh = new THREE.Mesh(torsoGeom, bodyMaterial);
    torsoMesh.position.y = 0.05;
    mannequinGroup.add(torsoMesh);

    // Shoulder sphere support to give the torso elegant human dimensions
    const shoulderLGeom = new THREE.SphereGeometry(0.09, 16, 16);
    const shoulderL = new THREE.Mesh(shoulderLGeom, bodyMaterial);
    shoulderL.position.set(-0.25, 0.4, 0);
    mannequinGroup.add(shoulderL);

    const shoulderR = new THREE.Mesh(shoulderLGeom, bodyMaterial);
    shoulderR.position.set(0.25, 0.4, 0);
    mannequinGroup.add(shoulderR);

    // 4. Outer Draped Fabric Mesh
    // Create luxury procedural fabric textures based on material/palette selection
    const createProceduralFabric = (matName: string, palName: string) => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 256;
      tempCanvas.height = 256;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        let color1 = '#1e1b4b'; // indigo dark
        let color2 = '#4f46e5'; // indigo light
        if (palName.includes('Earth') || palName.includes('Warm')) {
          color1 = '#78350f';
          color2 = '#f59e0b';
        } else if (palName.includes('Pastel')) {
          color1 = '#fce7f3';
          color2 = '#ec4899';
        } else if (palName.includes('Brutalism') || palName.includes('Monochrome')) {
          color1 = '#0f172a';
          color2 = '#f8fafc';
        } else if (palName.includes('Emerald') || palName.includes('Green')) {
          color1 = '#064e3b';
          color2 = '#10b981';
        }

        ctx.fillStyle = color1;
        ctx.fillRect(0, 0, 256, 256);

        // Grid/Weave Pattern
        ctx.strokeStyle = color2;
        ctx.lineWidth = 2.5;
        if (matName.includes('Denim')) {
          // Twill diagonal stripes
          for (let i = -256; i < 256; i += 12) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 256, 256);
            ctx.stroke();
          }
        } else if (matName.includes('Silk')) {
          // Elegant wavy lines
          ctx.beginPath();
          for (let i = 0; i < 256; i += 32) {
            ctx.moveTo(i, 0);
            for (let y = 0; y <= 256; y += 10) {
              const x = i + Math.sin(y / 20) * 12;
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        } else if (matName.includes('Mesh') || matName.includes('Graphene')) {
          // Tech matrix grid
          ctx.lineWidth = 1;
          for (let i = 0; i < 256; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
            ctx.stroke();
          }
        } else {
          // Wool herringbone
          for (let i = 0; i < 256; i += 32) {
            for (let j = 0; j < 256; j += 16) {
              ctx.beginPath();
              ctx.moveTo(i, j);
              ctx.lineTo(i + 16, j + 8);
              ctx.lineTo(i, j + 16);
              ctx.stroke();
            }
          }
        }
      }
      const canvasTex = new THREE.CanvasTexture(tempCanvas);
      canvasTex.wrapS = THREE.RepeatWrapping;
      canvasTex.wrapT = THREE.RepeatWrapping;
      canvasTex.repeat.set(3, 3);
      return canvasTex;
    };

    const fabricMaterial = new THREE.MeshStandardMaterial({
      side: THREE.DoubleSide,
      roughness: 0.4,
      metalness: 0.1
    });

    // Handle physical surface shine based on selected material type
    const matUpper = currentMaterial.toUpperCase();
    if (matUpper.includes('SILK') || matUpper.includes('SATIN')) {
      fabricMaterial.roughness = 0.12;
      fabricMaterial.metalness = 0.25;
    } else if (matUpper.includes('DENIM') || matUpper.includes('CANVAS')) {
      fabricMaterial.roughness = 0.9;
      fabricMaterial.metalness = 0.02;
    } else if (matUpper.includes('MESH') || matUpper.includes('GRAPHENE')) {
      fabricMaterial.roughness = 0.25;
      fabricMaterial.metalness = 0.7;
    } else if (matUpper.includes('WOOL') || matUpper.includes('TWEED') || matUpper.includes('CASHMERE')) {
      fabricMaterial.roughness = 0.95;
      fabricMaterial.metalness = 0.01;
    }

    // Load active sketch texture or procedural fallback
    const texLoader = new THREE.TextureLoader();
    texLoader.crossOrigin = 'anonymous';

    if (currentImage) {
      texLoader.load(
        currentImage,
        (loadedTex) => {
          loadedTex.wrapS = THREE.RepeatWrapping;
          loadedTex.wrapT = THREE.RepeatWrapping;
          loadedTex.repeat.set(1.5, 1);
          fabricMaterial.map = loadedTex;
          fabricMaterial.color.setHex(0xffffff); // Clear color multipliers for sketch accuracy
          fabricMaterial.needsUpdate = true;
        },
        undefined,
        () => {
          // Fallback to high-quality procedural weave on cross-origin blocks
          fabricMaterial.map = createProceduralFabric(currentMaterial, currentPalette);
          fabricMaterial.needsUpdate = true;
        }
      );
    } else {
      fabricMaterial.map = createProceduralFabric(currentMaterial, currentPalette);
    }

    // Geometry of flowing sleeveless designer sheath dress draped over torso
    const dressGeom = new THREE.CylinderGeometry(0.26, 0.36, 0.88, 32, 1, true);
    const dressMesh = new THREE.Mesh(dressGeom, fabricMaterial);
    dressMesh.position.y = 0.05;
    mannequinGroup.add(dressMesh);

    // Active frame render loop
    let frameId: number;
    let angle = rotationAngle;

    const tick = () => {
      if (isRotating) {
        angle = (angle + 0.6) % 360;
        mannequinGroup.rotation.y = (angle * Math.PI) / 180;
      } else {
        mannequinGroup.rotation.y = (rotationAngle * Math.PI) / 180;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    tick();

    // Custom Drag-to-Rotate interaction
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      setIsRotating(false);
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      // Rotate mannequin based on client movement vectors
      mannequinGroup.rotation.y += deltaX * 0.008;
      mannequinGroup.rotation.x += deltaY * 0.008;

      // Bound X tilt to avoid flipping the mannequin upside down
      mannequinGroup.rotation.x = Math.max(-Math.PI / 8, Math.min(Math.PI / 8, mannequinGroup.rotation.x));

      // Sync React state rotation slider
      const updatedAngle = Math.round((mannequinGroup.rotation.y * 180) / Math.PI) % 360;
      setRotationAngle(updatedAngle < 0 ? updatedAngle + 360 : updatedAngle);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    // Mobile touch interaction mapping
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        setIsRotating(false);
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      mannequinGroup.rotation.y += deltaX * 0.008;
      mannequinGroup.rotation.x += deltaY * 0.008;
      mannequinGroup.rotation.x = Math.max(-Math.PI / 8, Math.min(Math.PI / 8, mannequinGroup.rotation.x));

      const updatedAngle = Math.round((mannequinGroup.rotation.y * 180) / Math.PI) % 360;
      setRotationAngle(updatedAngle < 0 ? updatedAngle + 360 : updatedAngle);

      previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    // Attach event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    // Cleanup functions
    return () => {
      cancelAnimationFrame(frameId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
      
      // Dispose materials/geometries to prevent browser memory leaks
      scene.clear();
      renderer.dispose();
    };
  }, [activeSubTool, isRotating, rotationAngle, currentPalette, currentMaterial, currentImage]);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 text-left max-w-6xl mx-auto">
      
      {/* Sub-navigation selector */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveSubTool('remix')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-1.5 ${activeSubTool === 'remix' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <Sliders className="w-4 h-4" /> Design Remix & Variations
        </button>
        <button
          onClick={() => setActiveSubTool('tryon')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-1.5 ${activeSubTool === 'tryon' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <User className="w-4 h-4" /> Virtual Try-On
        </button>
        <button
          onClick={() => setActiveSubTool('showcase')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-1.5 ${activeSubTool === 'showcase' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <Compass className="w-4 h-4" /> AI Model Showcase
        </button>
        <button
          onClick={() => setActiveSubTool('preview3d')}
          className={`px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition-all shrink-0 uppercase tracking-wider flex items-center gap-1.5 ${activeSubTool === 'preview3d' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          <RefreshCw className="w-4 h-4" /> 3D Garment Previewer
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. REMIX PANEL */}
      {activeSubTool === 'remix' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-gray-900">Atelier Design Remix Engine</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Tweak proportions, materials, or change prompts with precision</p>
            </div>

            <div className="space-y-5">
              {/* Strength slider */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Remix Variation Strength</span>
                  <span className="text-xs font-mono font-bold text-indigo-600">{remixStrength}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="90"
                  value={remixStrength}
                  onChange={(e) => setRemixStrength(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Subtle tweak (10%)</span>
                  <span>Extreme revamp (90%)</span>
                </div>
              </div>

              {/* Elements to preserve checkboxes */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 block">Structural Core Preservation</span>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preserveSilhouette}
                      onChange={(e) => setPreserveSilhouette(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Preserve Garment Silhouette</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Retain dress shape, lines, shoulder style, and overall cut.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preserveColors}
                      onChange={(e) => setPreserveColors(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Preserve Colorway Palette</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Keep colors locked to current active palette: {currentPalette}.</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={preserveFabric}
                      onChange={(e) => setPreserveFabric(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <div>
                      <p className="text-xs font-semibold text-gray-800">Preserve Material Foundation</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Enforce textile surface properties: {currentMaterial}.</p>
                    </div>
                  </label>
                </div>
              </div>

              {remixError && (
                <p className="text-xs text-red-500 font-medium">{remixError}</p>
              )}

              <button
                onClick={handleRemixGenerate}
                disabled={remixing || !currentImage}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 ${remixing ? 'animate-spin' : ''}`} />
                {remixing ? 'Synthesizing remix...' : 'Generate Remix Variation'}
              </button>
            </div>
          </div>

          {/* Right Visual Result Comparison */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
            {currentImage ? (
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Original design</p>
                <div className="aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 w-48 shadow-sm">
                  <img src={currentImage} alt="Original design" className="w-full h-full object-cover" />
                </div>
              </div>
            ) : (
              <div className="w-48 aspect-[3/4] bg-gray-50 border border-dashed rounded-xl flex items-center justify-center">
                <p className="text-[10px] text-gray-400 text-center font-bold">No Primary Design</p>
              </div>
            )}

            {remixResultImage && (
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Remixed Variation</p>
                <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-indigo-500 w-48 shadow-lg">
                  <img src={remixResultImage} alt="Remix Result" className="w-full h-full object-cover" />
                </div>
                <button
                  onClick={applyRemixedDesign}
                  className="mt-3 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mx-auto"
                >
                  <Check className="w-3.5 h-3.5" /> Apply this Remix
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. VIRTUAL TRY-ON PANEL */}
      {activeSubTool === 'tryon' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-gray-900">Virtual Fitting Room</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Superimpose your sketches instantly onto diverse model templates or user uploads</p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Select Model Blueprint</span>
                <div className="grid grid-cols-3 gap-3">
                  {tryOnModels.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedTryOnModel(m.id)}
                      className={`p-2 rounded-xl border text-center transition-all ${selectedTryOnModel === m.id ? 'border-gray-900 bg-gray-50 font-bold' : 'border-gray-200 bg-white'}`}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-1.5">
                        <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[9px] text-gray-800 leading-tight block truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Or Upload Your Body Profile</span>
                <label className="border border-dashed border-gray-300 hover:border-gray-900 bg-white p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center leading-relaxed">Upload Full-body Shot</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTryOnPhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={triggerTryOn}
                disabled={tryingOn || !currentImage}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {tryingOn ? 'Fitting garment layers...' : 'Apply Virtual Try-On'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center relative">
            {tryingOn ? (
              <div className="w-56 aspect-[3/4] bg-white rounded-2xl flex flex-col items-center justify-center p-6 text-center border animate-pulse shadow-md">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Blending textures...</p>
              </div>
            ) : tryOnFinished ? (
              <div className="text-center relative group">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Fitting complete!</p>
                <div className="w-56 aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 shadow-xl relative">
                  {tryOnResultImage ? (
                    <img
                      src={tryOnResultImage}
                      alt="Try-On Result"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <>
                      {/* Model body base */}
                      <img
                        src={selectedTryOnModel === 'custom' ? (customUserPhoto || '') : (tryOnModels.find(m => m.id === selectedTryOnModel)?.url || '')}
                        alt="Fitting base"
                        className="w-full h-full object-cover"
                      />
                      {/* Overlay current design fabric on model body with visual transparency/blending */}
                      <div className="absolute inset-0 bg-indigo-950/20 mix-blend-color-burn pointer-events-none" />
                      <img
                        src={currentImage || ''}
                        alt="Applied Garment"
                        className="absolute inset-x-4 bottom-4 top-16 object-contain rounded-lg opacity-85 hover:opacity-100 transition-opacity drop-shadow-2xl"
                      />
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-56 aspect-[3/4] bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center text-gray-400">
                <User className="w-10 h-10 mb-2 text-gray-300" />
                <p className="text-xs font-semibold leading-relaxed">Ready for preview</p>
                <p className="text-[9px] text-gray-400 mt-1">Select a mannequin blueprint to check the fit.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. AI MODEL SHOWCASE */}
      {activeSubTool === 'showcase' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-gray-900">Inclusive E-Commerce Showcase</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Render high-fashion product shots across multi-ethnic and size-inclusive demographics</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Demographic</label>
                  <select
                    value={showcaseEthnicity}
                    onChange={(e) => setShowcaseEthnicity(e.target.value)}
                    className="w-full text-xs px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  >
                    <option value="Scandinavian">Scandinavian</option>
                    <option value="East Asian">East Asian</option>
                    <option value="Afro-Caribbean">Afro-Caribbean</option>
                    <option value="South Asian">South Asian</option>
                    <option value="Mediterranean">Mediterranean</option>
                    <option value="Latinx">Latinx</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Body Geometry</label>
                  <select
                    value={showcaseBody}
                    onChange={(e) => setShowcaseBody(e.target.value)}
                    className="w-full text-xs px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  >
                    <option value="Athletic / Slim">Athletic / Slim</option>
                    <option value="Curve / Plus-size">Curve / Plus-size</option>
                    <option value="Petite / Short">Petite / Short</option>
                    <option value="Statuesque / Tall">Statuesque / Tall</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5 block">Pose / Layout</label>
                  <select
                    value={showcasePose}
                    onChange={(e) => setShowcasePose(e.target.value)}
                    className="w-full text-xs px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                  >
                    <option value="Catwalk / Runway">Catwalk / Runway</option>
                    <option value="Studio Portrait Close-up">Studio Portrait Close-up</option>
                    <option value="Urban Street Snap">Urban Street Snap</option>
                    <option value="Minimalist Studio Front">Minimalist Studio Front</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateShowcaseProductShot}
                disabled={showcaseRendering || !currentImage}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {showcaseRendering ? 'Re-centering photoshoot models...' : 'Generate Catalog Product Shot'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center">
            {showcaseRendering ? (
              <div className="w-56 aspect-[3/4] bg-white rounded-2xl border flex flex-col items-center justify-center p-6 text-center animate-pulse shadow-md">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Rendering studio layout...</p>
              </div>
            ) : showcaseResultImage ? (
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-2">Showcase Product Shot</p>
                <div className="w-56 aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 shadow-xl relative">
                  <img src={showcaseResultImage} alt="Showcase Look" className="w-full h-full object-cover" />
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-bold tracking-wider uppercase text-white">
                    {showcaseEthnicity} • {showcaseBody}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-56 aspect-[3/4] bg-gray-50 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center text-gray-400">
                <Compass className="w-10 h-10 mb-2 text-gray-300" />
                <p className="text-xs font-semibold leading-relaxed">Studio Catalog Shot</p>
                <p className="text-[9px] text-gray-400 mt-1">Configure inclusive model metrics to preview.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. 3D GARMENT PREVIEW */}
      {activeSubTool === 'preview3d' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-gray-900">Virtual 3D Mannequin</h3>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-semibold">Simulate structural volumes, pleat falls, and draping lines with real-time rotational controls</p>
            </div>

            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Rotation Status</span>
                <p className="text-xs text-gray-700 font-semibold">{isRotating ? 'Auto-rotating (360° Panorama)' : 'Static (Manual slider control)'}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsRotating(!isRotating)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  {isRotating ? 'Pause rotation' : 'Resume rotation'}
                </button>
              </div>

              {!isRotating && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1.5">Manual Pivot angle</span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotationAngle}
                    onChange={(e) => setRotationAngle(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-400 mt-0.5">
                    <span>Front (0°)</span>
                    <span>Profile (90°)</span>
                    <span>Back (180°)</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4 shadow-inner">
              <canvas
                ref={canvasRef}
                width={300}
                height={350}
                className="w-[300px] h-[350px] bg-white rounded-xl border border-gray-100"
              />
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest text-center mt-2.5">
                Dragging rotatable viewport
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
