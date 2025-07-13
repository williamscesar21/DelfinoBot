import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

/* --- Configuración de tu proyecto --- */
const firebaseConfig = {
  apiKey:            "AIzaSyC--pekUEdWrJZa1ZeBBw1A8x3x2zT7KmY",
  authDomain:        "apichatgptdelfino.firebaseapp.com",
  projectId:         "apichatgptdelfino",
  storageBucket:     "apichatgptdelfino.appspot.com",
  messagingSenderId: "653571693154",
  appId:             "1:653571693154:web:a992c732196b1a0a998f3b",
  measurementId:     "G-6DXN5MSGZG",
};

export const app   = initializeApp(firebaseConfig);
export const auth  = getAuth(app);
export const db    = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

/* --- Analytics (opcional) --- */
isSupported().then((ok) => ok && getAnalytics(app));
