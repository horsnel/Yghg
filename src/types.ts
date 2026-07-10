export type TabType = 'studio' | 'gallery' | 'trends' | 'evolution' | 'analytics' | 'history' | 'compare' | 'about' | 'contact' | 'vision' | 'legal' | 'changelog' | 'careers' | 'company' | 'login' | 'signup' | 'email-verified' | 'onboarding' | 'profile';

export interface Trend {
  id: string;
  name: string;
  description: string;
  score: number;
  imageUrl: string;
}

export interface DesignHistory {
  id: string;
  prompt: string;
  imageUrl: string;
  date: string;
}

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  role?: string;
  workplaceType?: string;
  aesthetics?: string[];
  avatarId?: string;
  createdAt: string; // ISO date-time string
  updatedAt: string; // ISO date-time string
}

export interface UserDesign {
  id: string;
  userId: string;
  prompt: string;
  material: string;
  palette: string;
  imageUrl: string;
  tags?: string[];
  createdAt: string; // ISO date-time string
}
