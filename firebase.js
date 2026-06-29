/**
 * firebase.js
 *
 * Configuração do Firebase v10 com persistência offline habilitada.
 *
 * persistentLocalCache (IndexedDB):
 *   - Armazena os documentos sincronizados no navegador/app.
 *   - getDocs() responde do cache sem acesso à internet.
 *   - addDoc() / updateDoc() são enfileirados localmente e enviados ao
 *     Firestore assim que a conexão for restaurada — automaticamente,
 *     sem nenhuma lógica extra nos componentes.
 *   - Compatível com PWA (service worker) e APK via CapacitorJS.
 */

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

// persistentMultipleTabManager permite que múltiplas abas/janelas do PWA
// compartilhem o mesmo cache IndexedDB com sincronização coordenada.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
