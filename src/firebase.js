import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            "AIzaSyC3Z6PQczeQAIhOibJWy6v7u__3nUs8tQs",
  authDomain:        "equiteec.firebaseapp.com",
  projectId:         "equiteec",
  storageBucket:     "equiteec.firebasestorage.app",
  messagingSenderId: "488180822373",
  appId:             "1:488180822373:web:5c8de0095059bf6375718c",
  measurementId:     "G-6E6HK9QJQV",
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
