import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

// Dynamic Domain Detection logic
const getDynamicAuthDomain = () => {
  const host = window.location.hostname;
  // Do not mutate if running locally or in standard preview environments
  if (host === 'localhost' || host.includes('run.app')) {
    return "web-zinc-65422.firebaseapp.com";
  }
  return host; 
};

const firebaseConfig = {
  apiKey: "AIzaSyAi67bcyqBpJDq8y4Jucb6ReKzK51URbMg",
  authDomain: getDynamicAuthDomain(),
  projectId: "web-zinc-65422",
  storageBucket: "web-zinc-65422.firebasestorage.app",
  messagingSenderId: "389317986974",
  appId: "1:389317986974:web:eb5bf69b3cc165f6ac898f",
  measurementId: "G-NZE8P7TZ19"
};

// Initialize Firebase App, Auth, and Firestore
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Helper to register lead via Email/Password and save to Firestore
export const registerLead = async (email: string, password: string, businessName: string, niche: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "leads", user.uid), {
    email,
    businessName,
    niche,
    createdAt: serverTimestamp()
  });

  return user;
};

// Sync Google Auth User to Firestore if they don't exist
export const syncGoogleLead = async (user: any) => {
  const userDocRef = doc(db, "leads", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      email: user.email,
      businessName: user.displayName || 'My Business',
      niche: 'Unspecified',
      createdAt: serverTimestamp()
    });
  }
};

// Sign in with Email / Password
export const signInUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logoutUser = () => signOut(auth);

// Get User Profile
export const getUserProfile = async (uid: string) => {
  const userDocRef = doc(db, "leads", uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return userDoc.data();
  }
  return null;
};

// Update User Profile
export const updateUserProfile = async (uid: string, data: any) => {
  const userDocRef = doc(db, "leads", uid);
  await setDoc(userDocRef, data, { merge: true });
};
