import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/drive.file");

// In-memory cache for OAuth access token
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth listener
export const initAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else {
        // If logged in but token is not in cache (e.g. page refresh),
        // we ask user to click Sign In again to grab a fresh token.
        // That is the standard pop-up behavior to maintain token safety in-memory.
        onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;

    if (!token) {
      throw new Error("Failed to get Google OAuth access token.");
    }

    cachedAccessToken = token;
    return { user: result.user, accessToken: token };
  } catch (error) {
    console.error("Erro no login com Google:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get current token
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Log out
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
