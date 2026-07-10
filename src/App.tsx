import React, { useState, lazy, Suspense, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/Sidebar';
import { WelcomePage } from './components/WelcomePage';
import { Login, Signup, EmailVerified, Onboarding } from './components/AuthPages';
import { OnboardingTour } from './components/OnboardingTour';
import { TabType } from './types';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useSEO } from './utils/seo';

// Lazy load tab components for chunking / code splitting (under 1.5MB target bundle)
const Studio = lazy(() => import('./components/Studio').then(m => ({ default: m.Studio })));
const TrendRadar = lazy(() => import('./components/TrendRadar').then(m => ({ default: m.TrendRadar })));
const TrendEvolution = lazy(() => import('./components/TrendEvolution').then(m => ({ default: m.TrendEvolution })));
const Analytics = lazy(() => import('./components/Analytics').then(m => ({ default: m.Analytics })));
const HistoryTab = lazy(() => import('./components/HistoryTab').then(m => ({ default: m.HistoryTab })));
const VersionCompare = lazy(() => import('./components/VersionCompare').then(m => ({ default: m.VersionCompare })));

const AboutUs = lazy(() => import('./components/MarketingPages').then(m => ({ default: m.AboutUs })));
const ContactUs = lazy(() => import('./components/MarketingPages').then(m => ({ default: m.ContactUs })));
const Vision = lazy(() => import('./components/MarketingPages').then(m => ({ default: m.Vision })));
const Careers = lazy(() => import('./components/MarketingPages').then(m => ({ default: m.Careers })));
const Legal = lazy(() => import('./components/MarketingPages').then(m => ({ default: m.Legal })));
const Changelog = lazy(() => import('./components/MarketingPages').then(m => ({ default: m.Changelog })));
const Company = lazy(() => import('./components/MarketingPages').then(m => ({ default: m.Company })));
const UserProfilePage = lazy(() => import('./components/UserProfilePage').then(m => ({ default: m.UserProfilePage })));
const CommunityGalleryPage = lazy(() => import('./components/CommunityGalleryPage').then(m => ({ default: m.CommunityGalleryPage })));

const TabLoadingFallback = () => (
  <div className="flex-1 flex flex-col items-center justify-center bg-white p-8 h-full w-full">
    <div className="w-8 h-8 border-2 border-gray-950 border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-mono tracking-widest text-gray-400 uppercase animate-pulse">Loading Atelier...</p>
  </div>
);

export default function App() {
  const [sessionState, setSessionState] = useState<'welcome' | 'auth' | 'app'>('welcome');
  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showTour, setShowTour] = useState(() => {
    return localStorage.getItem('couture-onboarding-tour-completed') !== 'true';
  });
  
  // Theme & Accessibility States
  const [isDark, setIsDark] = useState(() => localStorage.getItem('couture-dark-mode') === 'true');
  const [isHighContrast, setIsHighContrast] = useState(() => localStorage.getItem('couture-high-contrast') === 'true');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('couture-dark-mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('couture-dark-mode', 'false');
    }
  }, [isDark]);

  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
      localStorage.setItem('couture-high-contrast', 'true');
    } else {
      document.documentElement.classList.remove('high-contrast');
      localStorage.setItem('couture-high-contrast', 'false');
    }
  }, [isHighContrast]);

  // Dynamically manage SEO and title meta tags based on active workspace view
  useSEO(activeTab);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setSessionState('app');
        // Redirect to Studio if they were previously in authentication tabs
        if (['login', 'signup', 'email-verified'].includes(activeTab)) {
          setActiveTab('studio');
        }
      } else {
        setSessionState('welcome');
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [activeTab]);

  const [cookieConsent, setCookieConsent] = useState(() => {
    return localStorage.getItem('cookie-consent-couture') === 'granted';
  });
  const [showCookieBanner, setShowCookieBanner] = useState(() => {
    return localStorage.getItem('cookie-consent-couture') === null;
  });

  const handleAcceptCookies = () => {
    localStorage.setItem('cookie-consent-couture', 'granted');
    setCookieConsent(true);
    setShowCookieBanner(false);
  };

  const handleDeclineCookies = () => {
    localStorage.setItem('cookie-consent-couture', 'declined');
    setCookieConsent(false);
    setShowCookieBanner(false);
  };

  const [studioInitialState, setStudioInitialState] = useState<{prompt: string, material: string, palette: string} | null>(null);

  const handleRedo = (prompt: string, material: string, palette: string) => {
    setStudioInitialState({ prompt, material, palette });
    setActiveTab('studio');
  };

  const handleDeriveDesign = (prompt: string, material: string, palette: string, imageUrl: string) => {
    setStudioInitialState({ prompt, material, palette });
    setActiveTab('studio');
  };

  const handleApplyTrend = (prompt: string) => {
    setStudioInitialState({ prompt, material: 'Silk & Satin', palette: 'Monochrome Brutalism' });
    setActiveTab('studio');
  };

  const finishAuth = () => {
    setSessionState('app');
    setActiveTab('studio');
  };

  if (authLoading) {
    return <TabLoadingFallback />;
  }

  if (sessionState === 'welcome') {
    return <WelcomePage 
      onLogin={() => { setSessionState('auth'); setActiveTab('login'); }} 
      onSignup={() => { setSessionState('auth'); setActiveTab('signup'); }} 
    />;
  }

  if (sessionState === 'auth') {
    return (
      <div className="min-h-[100dvh] flex bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden selection:bg-gray-200 selection:text-gray-900">
        {activeTab === 'login' && <Login setActiveTab={setActiveTab} onFinish={finishAuth} />}
        {activeTab === 'signup' && <Signup setActiveTab={setActiveTab} />}
        {activeTab === 'email-verified' && <EmailVerified setActiveTab={setActiveTab} />}
        {activeTab === 'onboarding' && <Onboarding setActiveTab={setActiveTab} onFinish={finishAuth} />}
        {['login', 'signup', 'email-verified', 'onboarding'].includes(activeTab) === false && <Login setActiveTab={setActiveTab} onFinish={finishAuth} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse md:flex-row h-[100dvh] bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans antialiased overflow-hidden selection:bg-gray-200 selection:text-gray-900">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
      />
      <main className="flex-1 flex flex-col relative z-0 bg-white md:shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] overflow-hidden">
        <Suspense fallback={<TabLoadingFallback />}>
          {activeTab === 'studio' && <Studio initialState={studioInitialState} />}
          {activeTab === 'gallery' && <CommunityGalleryPage onDeriveDesign={handleDeriveDesign} />}
          {activeTab === 'compare' && <VersionCompare onRedo={handleRedo} />}
          {activeTab === 'trends' && <TrendRadar onApplyTrend={handleApplyTrend} />}
          {activeTab === 'evolution' && <TrendEvolution />}
          {activeTab === 'analytics' && <Analytics setActiveTab={setActiveTab} />}
          {activeTab === 'history' && <HistoryTab onRedo={handleRedo} setActiveTab={setActiveTab} />}
          {activeTab === 'profile' && <UserProfilePage />}
          {activeTab === 'about' && <AboutUs />}
          {activeTab === 'contact' && <ContactUs />}
          {activeTab === 'vision' && <Vision />}
          {activeTab === 'careers' && <Careers />}
          {activeTab === 'legal' && <Legal />}
          {activeTab === 'changelog' && <Changelog />}
          {activeTab === 'company' && <Company />}
          {!['studio', 'gallery', 'compare', 'trends', 'evolution', 'analytics', 'history', 'profile', 'about', 'contact', 'vision', 'careers', 'legal', 'changelog', 'company'].includes(activeTab) && (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8 h-full w-full">
              <div className="text-6xl font-display font-bold text-gray-200 mb-4 select-none">404</div>
              <h2 className="text-xl font-display font-medium text-gray-900 mb-2">Atelier Page Not Found</h2>
              <p className="text-gray-500 text-sm max-w-sm text-center mb-6">The design collections or workspace you are trying to access does not exist or has been archived.</p>
              <button 
                onClick={() => setActiveTab('studio')}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Return to Studio
              </button>
            </div>
          )}
        </Suspense>
      </main>

      {/* Cookie Consent Banner */}
      <AnimatePresence>
        {showCookieBanner && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-50 bg-gray-900 border border-gray-800 text-white rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
          >
            <div>
              <h4 className="font-display font-medium text-sm text-gray-100 mb-1">Cookie & Privacy Consent</h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                Couture AI uses cookies to optimize your studio experience, analyze traffic patterns, and securely persist your generative brand designs. By accepting, you consent to our GDPR-compliant cookie usage.
              </p>
            </div>
            <div className="flex justify-end gap-3 text-xs font-semibold">
              <button 
                onClick={handleDeclineCookies}
                className="px-4 py-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer text-gray-300"
              >
                Decline
              </button>
              <button 
                onClick={handleAcceptCookies}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-xl transition-colors cursor-pointer"
              >
                Accept All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Tour Overlay */}
      {sessionState === 'app' && showTour && (
        <OnboardingTour 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
