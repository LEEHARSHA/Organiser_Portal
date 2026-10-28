import { getApps, initializeApp } from "@firebase/app";
import { getAuth } from "@firebase/auth";

const EXPECTED_FIREBASE_PROJECT_ID = "sellerportal-2786c";
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function firebaseConfigError() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) return `Missing Firebase configuration: ${missing.join(", ")}`;
  if (firebaseConfig.projectId !== EXPECTED_FIREBASE_PROJECT_ID) {
    return `Firebase project ID must be ${EXPECTED_FIREBASE_PROJECT_ID}.`;
  }
  return null;
}

export function getCommunityAuth() {
  const error = firebaseConfigError();
  if (error) throw new Error(error);
  const appName = "fitness-species-community";
  const existing = getApps().find((app) => app.name === appName);
  return getAuth(existing || initializeApp(firebaseConfig, appName));
}
