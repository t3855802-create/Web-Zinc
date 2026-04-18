import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAi67bcyqBpJDq8y4Jucb6ReKzK51URbMg",
  authDomain: "web-zinc-65422.firebaseapp.com",
  projectId: "web-zinc-65422",
  storageBucket: "web-zinc-65422.firebasestorage.app",
  messagingSenderId: "389317986974",
  appId: "1:389317986974:web:eb5bf69b3cc165f6ac898f",
  measurementId: "G-NZE8P7TZ19"
};

// Initialize Firebase App, Auth, and Firestore (Singleton pattern)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// 2. Set Session Persistence
setPersistence(auth, browserLocalPersistence)
  .catch((err) => console.error("Firebase persistence setup failed:", err));

// Verify auth domain in console for debugging
console.log("Current Auth Domain:", (auth as any).config?.authDomain || firebaseConfig.authDomain);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// A helper network timeout wrapping function (10-second default limit)
const withTimeout = <T>(promise: Promise<T>, ms: number = 10000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("auth/network-request-failed"));
    }, ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// Helper to register lead via Email/Password and save to Firestore with Retry Protocol
export const registerLead = async (email: string, password: string, businessName: string, niche: string, retries = 3) => {
  let lastErr;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const userCredential = await withTimeout(createUserWithEmailAndPassword(auth, email, password));
      const user = userCredential.user;

      await withTimeout(setDoc(doc(db, "leads", user.uid), {
        email,
        businessName,
        niche,
        createdAt: serverTimestamp()
      }));

      return user;
    } catch (err: any) {
      lastErr = err;
      // If it's a structural email error rather than a timeout/network hang, immediately abort and throw
      if (!err.message.includes("network-request-failed") && err.code !== "auth/network-request-failed") {
        throw err;
      }
      console.warn(`[Network Retry]: Attempt ${attempt} failed for registerLead...`);
      if (attempt < retries) {
        await new Promise(res => setTimeout(res, 1500)); // wait briefly between retries
      }
    }
  }
  throw lastErr;
};

// Sync Google Auth User to Firestore if they don't exist
export const syncGoogleLead = async (user: any) => {
  try {
    const userDocRef = doc(db, "leads", user.uid);
    const userDoc = await withTimeout(getDoc(userDocRef));

    if (!userDoc.exists()) {
      await withTimeout(setDoc(userDocRef, {
        email: user.email,
        businessName: user.displayName || 'My Business',
        niche: 'Unspecified',
        createdAt: serverTimestamp()
      }));
    }
  } catch (err) {
    console.error("Google Sync Timeout/Failure:", err);
    throw err;
  }
};

// Sign in with Email / Password
export const signInUser = async (email: string, password: string) => {
  const userCredential = await withTimeout(signInWithEmailAndPassword(auth, email, password));
  return userCredential.user;
};

export const logoutUser = () => signOut(auth);

// Get User Profile
export const getUserProfile = async (uid: string) => {
  const userDocRef = doc(db, "leads", uid);
  const userDoc = await withTimeout(getDoc(userDocRef));
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
};

// Update User Profile
export const updateUserProfile = async (uid: string, data: any) => {
  const userDocRef = doc(db, "leads", uid);
  await withTimeout(setDoc(userDocRef, data, { merge: true }));
};
