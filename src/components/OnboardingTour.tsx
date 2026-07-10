import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, X, Eye, Compass, History, User } from 'lucide-react';
import { TabType } from '../types';

interface OnboardingTourProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onClose: () => void;
}

interface TourStep {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  tab: TabType;
  targetSelector?: string;
  highlightText: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Couture AI Atelier",
    description: "Your elite generative fashion workbench is initialized. Let's take a quick 4-step walk-through to maximize your high-fashion design pipeline.",
    icon: Sparkles,
    tab: "studio",
    highlightText: "Atelier Workbench"
  },
  {
    title: "The AI Fashion Studio",
    description: "This is where your moodboards become high-fidelity visuals. Type a luxury fashion description, customize raw fabrics, select color palettes, and generate production-ready sketches instantly.",
    icon: Eye,
    tab: "studio",
    highlightText: "Generative Canvas"
  },
  {
    title: "Trend Radar Intelligence",
    description: "Scan real-time global search trends powered by SerpAPI and Gemini. Uncover emerging street styles, viral materials, and instantly inject them into your active canvas.",
    icon: Compass,
    tab: "trends",
    highlightText: "Social Trend Listening"
  },
  {
    title: "Era Trend Evolution",
    description: "Morph vintage design DNA from the '70s, '90s, or Y2K with modern twists like cyberpunk or eco-futurism to create avant-garde archival mutations.",
    icon: History,
    tab: "evolution",
    highlightText: "Nostalgic Mutation Engine"
  },
  {
    title: "Atelier Settings & Curated Avatars",
    description: "Select high-fashion curated avatars, set your professional identity parameters, and tune the prompt model to prioritize your preferred design aesthetics.",
    icon: User,
    tab: "profile",
    highlightText: "Professional Workspace Settings"
  }
];

export function OnboardingTour({ activeTab, setActiveTab, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setActiveTab(TOUR_STEPS[nextStep].tab);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setActiveTab(TOUR_STEPS[prevStep].tab);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('couture-onboarding-tour-completed', 'true');
    onClose();
  };

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none flex items-end md:items-center justify-center p-4 md:p-6 bg-black/30 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="pointer-events-auto w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col focus-visible:outline-none"
          role="dialog"
          aria-modal="true"
          id="onboarding-tour-popup"
        >
          {/* Header Progress bar */}
          <div className="h-1.5 w-full bg-gray-100 flex">
            {TOUR_STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`h-full flex-1 transition-all duration-500 ${
                  idx <= currentStep ? 'bg-gray-900' : 'bg-gray-100'
                }`}
              />
            ))}
          </div>

          <div className="p-6 md:p-8 relative">
            {/* Close Button */}
            <button
              onClick={handleComplete}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-all cursor-pointer"
              aria-label="Skip onboarding tour"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="inline-flex items-center justify-center p-3.5 bg-gray-900 text-white rounded-2xl mb-6 shadow-md shadow-gray-900/10">
              <StepIcon className="w-6 h-6" />
            </div>

            {/* Badge / Active Section indicator */}
            <div className="mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                Workspace Focus: {step.highlightText}
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="font-display text-xl md:text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
              {step.title}
            </h3>
            <p className="text-gray-500 font-sans text-xs md:text-sm leading-relaxed mb-8">
              {step.description}
            </p>

            {/* Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              {/* Left action or back */}
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  Skip Tour
                </button>
              )}

              {/* Progress counter & Next */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-gray-400">
                  {currentStep + 1} / {TOUR_STEPS.length}
                </span>

                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'} 
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
