import { useEffect } from 'react';
import { TabType } from '../types';

interface SEOMetadata {
  title: string;
  description: string;
}

const SEO_MAP: Record<TabType, SEOMetadata> = {
  studio: {
    title: "AI Fashion Studio | Couture AI",
    description: "Generative fashion canvas for high-fidelity luxury garments, moodboards, and pattern sketching."
  },
  gallery: {
    title: "Community Design Hub & Marketplace | Couture AI",
    description: "Explore exquisite designer collections, trade community aesthetics, vote for digital art pieces, and secure brand-safe commercial licenses."
  },
  trends: {
    title: "Trend Radar Intelligence | Couture AI",
    description: "Scan global emerging streetwear styles, viral fabrics, and street culture predictions."
  },
  evolution: {
    title: "Trend Evolution & Archive | Couture AI",
    description: "Simulate runway transformations and nostalgic mutations of heritage designs."
  },
  analytics: {
    title: "Platform & Studio Analytics | Couture AI",
    description: "Deep analytics on trend accurate growth patterns, search volumes, and studio generation metrics."
  },
  history: {
    title: "Atelier Saved Designs Vault | Couture AI",
    description: "Your secure private catalog of custom generative fashion designs, sketches, and specifications."
  },
  compare: {
    title: "Version Design Compare | Couture AI",
    description: "Compare generative fashion iterations, material changes, and prompt modifications side-by-side."
  },
  profile: {
    title: "Atelier Settings & Preferences | Couture AI",
    description: "Customize your high-fashion designer avatar, set professional role preferences, and aesthetics."
  },
  about: {
    title: "About the Atelier | Couture AI",
    description: "Couture AI Atelier bridges computational neural networks with luxury heritage craftsmanship."
  },
  contact: {
    title: "Contact the Atelier | Couture AI",
    description: "Get in touch with Couture AI's creative laboratory and haute couture engineering support."
  },
  vision: {
    title: "Atelier Creative Vision | Couture AI",
    description: "Discover our manifesto on computational tailoring, algorithmic draping, and zero-waste sustainable production."
  },
  legal: {
    title: "Legal Terms & Privacy | Couture AI",
    description: "Security rules, double-blind encryption policies, and intellectual property terms of generative assets."
  },
  changelog: {
    title: "Atelier Product Changelog | Couture AI",
    description: "Track model updates, new fabric textures, and algorithmic precision enhancement releases."
  },
  careers: {
    title: "Careers & Creative Openings | Couture AI",
    description: "Join our interdisciplinary team of fashion technologists, machine learning engineers, and computational couturiers."
  },
  company: {
    title: "Company Heritage | Couture AI",
    description: "Couture AI is a creative machine intelligence laboratory empowering world-class haute couture."
  },
  login: {
    title: "Sign In | Couture AI Atelier",
    description: "Sign in to access your secure design vault, custom parameters, and AI fashion generators."
  },
  signup: {
    title: "Create Atelier Account | Couture AI",
    description: "Register to initialize your generative haute couture studio and scan premium trend networks."
  },
  'email-verified': {
    title: "Email Verified | Couture AI",
    description: "Your professional credential has been verified successfully. Welcome to the Atelier."
  },
  onboarding: {
    title: "Onboarding Studio Calibration | Couture AI",
    description: "Calibrate prompt engines, select target aesthetics, and design your professional identity."
  }
};

export function useSEO(activeTab: TabType) {
  useEffect(() => {
    const meta = SEO_MAP[activeTab];
    if (!meta) return;

    // 1. Update Document Title
    document.title = meta.title;

    // 2. Update Meta Description Tag
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', meta.description);

    // 3. Update OG (Open Graph) Title & Description for SEO preview consistency
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);

    let twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', meta.title);

    let twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', meta.description);

  }, [activeTab]);
}
