import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const config = {
  apiKey: 'AIzaSyAbvy5lC1yczSa8HMmicpEYFFZz0tbHZ5s',
  authDomain: 'reviewsandmarketing.com',
  projectId: 'reviewpilot2',
  storageBucket: 'reviewpilot2.firebasestorage.app',
  messagingSenderId: '577051575061',
  appId: '1:577051575061:web:16dfd593d88bbdc5351f1c',
  measurementId: 'G-JZ78N8KWSY',
};

const app = getApps().length ? getApps()[0]! : initializeApp(config);
export const clientAuth = getAuth(app);
export { app };
