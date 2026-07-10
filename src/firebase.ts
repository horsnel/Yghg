import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  deleteDoc, 
  serverTimestamp, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Test Connection
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('Could not reach Cloud Firestore backend'))) {
      console.warn("Firebase configuration check: Client is currently operating in offline mode. Local persistence and offline cache are active.");
    } else {
      console.warn("Initial Firebase test connection completed (could be ignored if DB empty).", error);
    }
  }
}

// Automatically test connection on boot
testConnection();

// Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Client-side rate limiting for database protection ---
const firestoreRateLimitStore: Record<string, { count: number; resetTime: number }> = {};

export function checkFirestoreRateLimit(operation: string, maxPerMin: number = 20): void {
  const now = Date.now();
  const key = `${operation}`;
  const record = firestoreRateLimitStore[key];

  if (!record || now > record.resetTime) {
    firestoreRateLimitStore[key] = {
      count: 1,
      resetTime: now + 60000 // 1 minute
    };
    return;
  }

  if (record.count >= maxPerMin) {
    throw new Error(`Rate limit exceeded for "${operation}". Please slow down and try again.`);
  }

  record.count += 1;
}

// --- CRUD Operations for Saved Designs ---

export interface SaveDesignInput {
  id: string;
  prompt: string;
  material: string;
  palette: string;
  imageUrl: string;
  tags?: string[];
  coutureId?: string;
}

export async function saveUserDesign(design: SaveDesignInput) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be signed in to save designs.");
  checkFirestoreRateLimit('save_design', 10);
  const path = `designs/${design.id}`;
  try {
    await setDoc(doc(db, 'designs', design.id), {
      ...design,
      userId: user.uid,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserDesigns() {
  const user = auth.currentUser;
  if (!user) return [];
  const path = 'designs';
  try {
    const q = query(
      collection(db, 'designs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        prompt: data.prompt || '',
        material: data.material || '',
        palette: data.palette || '',
        imageUrl: data.imageUrl || '',
        tags: data.tags || [],
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function deleteUserDesign(designId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be signed in to delete a design.");
  checkFirestoreRateLimit('delete_design', 15);
  const path = `designs/${designId}`;
  try {
    await deleteDoc(doc(db, 'designs', designId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- CRUD Operations for User Profile ---

export async function createUserProfile(fullName: string, email: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found.");
  checkFirestoreRateLimit('create_profile', 5);
  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid,
      fullName,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateUserProfileOnboarding(role: string, workplaceType: string, aesthetics: string[]) {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found.");
  checkFirestoreRateLimit('update_profile', 10);
  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      role,
      workplaceType,
      aesthetics,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile() {
  const user = auth.currentUser;
  if (!user) return null;
  const path = `users/${user.uid}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', user.uid));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function updateUserProfile(data: { fullName?: string; avatarId?: string; role?: string; workplaceType?: string; aesthetics?: string[] }) {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user found.");
  checkFirestoreRateLimit('update_profile', 15);
  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- CRUD Operations for Favorites ---

export interface FavoriteInput {
  designId: string;
  title: string;
  prompt: string;
  material: string;
  palette: string;
  imageUrl: string;
  authorName: string;
  authorEmail: string;
}

export async function toggleFavorite(design: FavoriteInput, isFavorited: boolean) {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be signed in to favorite designs.");
  const docId = `${user.uid}_${design.designId}`;
  const path = `favorites/${docId}`;
  
  checkFirestoreRateLimit('toggle_favorite', 30);
  
  try {
    if (isFavorited) {
      await setDoc(doc(db, 'favorites', docId), {
        id: docId,
        userId: user.uid,
        designId: design.designId,
        title: design.title,
        prompt: design.prompt,
        material: design.material,
        palette: design.palette,
        imageUrl: design.imageUrl,
        authorName: design.authorName,
        authorEmail: design.authorEmail,
        createdAt: serverTimestamp()
      });
    } else {
      await deleteDoc(doc(db, 'favorites', docId));
    }
  } catch (error) {
    handleFirestoreError(error, isFavorited ? OperationType.WRITE : OperationType.DELETE, path);
  }
}

export async function getUserFavorites() {
  const user = auth.currentUser;
  if (!user) return [];
  const path = 'favorites';
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: data.designId, // Return the community design ID for easy matching
        favoriteId: doc.id,
        title: data.title || '',
        prompt: data.prompt || '',
        material: data.material || '',
        palette: data.palette || '',
        imageUrl: data.imageUrl || '',
        authorName: data.authorName || '',
        authorEmail: data.authorEmail || '',
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

