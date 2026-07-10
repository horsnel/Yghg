import React from 'react';
import { Crown, PenTool, TrendingUp, History, Settings, BarChart3, RotateCcw, GitCompare, LogOut, Sun, Moon, Eye, EyeOff, Globe } from 'lucide-react';
import { TabType } from '../types';
import { motion } from 'motion/react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useTranslation } from '../utils/i18n';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isDark, onToggleTheme, isHighContrast, onToggleHighContrast }: SidebarProps) {
  const { t, currentLanguage, changeLanguage, languages } = useTranslation();

  const navItems = [
    { id: 'studio', label: t('design_studio'), icon: PenTool },
    { id: 'gallery', label: t('community_hub'), icon: Globe },
    { id: 'compare', label: t('compare'), icon: GitCompare },
    { id: 'trends', label: t('trend_radar'), icon: TrendingUp },
    { id: 'evolution', label: t('trend_evolution'), icon: History },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'history', label: t('history'), icon: RotateCcw },
    { id: 'profile', label: t('profile'), icon: Settings },
  ] as const;

  return (
    <div className="w-full md:w-64 border-t md:border-t-0 md:border-r border-gray-200 bg-white shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] md:shadow-sm flex md:flex-col h-auto md:h-full z-20 shrink-0 pb-safe pb-4 md:pb-0">
      <div className="hidden md:block p-6">
        <h1 className="font-display text-2xl font-semibold tracking-wide flex items-center gap-2">
          <Crown className="w-5 h-5 text-gray-800" />
          {t('couture_ai')}
        </h1>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-medium">{t('digital_atelier')}</p>
      </div>

      <nav className="flex-1 flex md:flex-col px-2 md:px-4 space-x-2 md:space-x-0 md:space-y-1 mt-0 md:mt-6 overflow-x-auto justify-around pt-2 md:pt-0" role="tablist" aria-label="Atelier Navigation Workspace">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            role="tab"
            aria-selected={activeTab === item.id}
            aria-label={`Navigate to ${item.label}`}
            className={`flex-1 md:w-full flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 px-2 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-sm font-medium transition-all duration-200 relative focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 dark:focus:ring-white ${
              activeTab === item.id
                ? 'text-gray-900 bg-gray-50 md:bg-gray-900 md:text-white shadow-none md:shadow-md'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className="w-5 h-5 md:w-4 md:h-4" aria-hidden="true" />
            <span className="text-center">{item.label}</span>
            {activeTab === item.id && (
              <motion.div
                layoutId="active-navIndicator"
                className="absolute top-0 md:top-auto left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 w-8 md:w-1 h-1 md:h-8 bg-gray-900 rounded-b-full md:rounded-b-none md:rounded-r-full"
                initial={false}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>

      <div className="hidden md:block p-4 border-t border-gray-100">
        {/* 150+ Language Selection dropdown */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span>Workspace Language</span>
          </div>
          <select
            value={currentLanguage}
            onChange={(e) => changeLanguage(e.target.value)}
            className="w-full text-xs px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-gray-400 font-medium text-gray-700 bg-white cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeName} ({lang.name})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button 
            onClick={onToggleTheme}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Switch theme (Light / Dark)"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
            <span className="text-[9px] font-bold uppercase tracking-wider">{isDark ? 'Light' : 'Dark'}</span>
          </button>
          <button 
            onClick={onToggleHighContrast}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Switch contrast mode"
          >
            {isHighContrast ? <EyeOff className="w-3.5 h-3.5 text-emerald-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
            <span className="text-[9px] font-bold uppercase tracking-wider">{isHighContrast ? 'Standard' : 'Contrast'}</span>
          </button>
        </div>
        <button 
          onClick={() => setActiveTab('profile')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'profile' ? 'text-gray-900 bg-gray-50 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
          }`}
        >
          <Settings className="w-4 h-4" />
          {t('profile')}
        </button>
        <button 
          onClick={() => signOut(auth)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50/50 rounded-lg transition-colors mt-1"
        >
          <LogOut className="w-4 h-4" />
          {t('sign_out')}
        </button>
        <div className="mt-4 px-4 flex flex-wrap gap-x-3 gap-y-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          <button onClick={() => setActiveTab('about')} className="hover:text-gray-900 transition-colors">{t('about')}</button>
          <button onClick={() => setActiveTab('vision')} className="hover:text-gray-900 transition-colors">{t('vision')}</button>
          <button onClick={() => setActiveTab('careers')} className="hover:text-gray-900 transition-colors">{t('careers')}</button>
          <button onClick={() => setActiveTab('contact')} className="hover:text-gray-900 transition-colors">{t('contact')}</button>
          <button onClick={() => setActiveTab('changelog')} className="hover:text-gray-900 transition-colors">{t('changelog')}</button>
          <button onClick={() => setActiveTab('legal')} className="hover:text-gray-900 transition-colors">{t('legal')}</button>
        </div>
      </div>
    </div>
  );
}

