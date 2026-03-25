import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { getClientEnv } from "@/lib/env";

let firebaseApp: FirebaseApp | null = null;

export function getFirebaseClientApp() {
  if (firebaseApp) return firebaseApp;

  const config = getClientEnv();

  firebaseApp =
    getApps().find((app) => app.name === "[DEFAULT]") ??
    initializeApp({
      apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      appId: config.NEXT_PUBLIC_FIREBASE_APP_ID,
      messagingSenderId: config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      storageBucket: config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });

  // Initialize App Check only in the browser
  if (typeof window !== "undefined") {
    // If in development, set the debug token BEFORE initialization
    if (process.env.NODE_ENV === "development") {
      // @ts-ignore - Enable debug token logging in console
      self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    initializeAppCheck(firebaseApp, {
      provider: new ReCaptchaEnterpriseProvider("6Ld3GZgsAAAAAHc_AxAeIP9Y2x43HIYxvvKC60Pe"),
      isTokenAutoRefreshEnabled: true
    });
    console.info("✅ [FIREBASE] App Check initialized");
  }

  return firebaseApp;
}

export function getFirebaseClientAuth() {
  getFirebaseClientApp();
  return getAuth(getApp());
}
