/**
 * App.jsx
 *
 * Gerencia o estado de autenticação globalmente.
 * onAuthStateChanged é o ponto central: quando o Firebase detecta
 * login ou logout, a tela muda automaticamente.
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import Login from './Login';
import FormularioVisita from './FormularioVisita';

export default function App() {
  // null  → ainda verificando (splash inicial)
  // false → não autenticado → exibe Login
  // obj   → usuário autenticado → exibe o app
  const [usuario, setUsuario] = useState(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    // onAuthStateChanged persiste a sessão no dispositivo automaticamente.
    // Mesmo offline, o Firebase lembra do último login via token local.
    const cancelar = onAuthStateChanged(auth, user => {
      setUsuario(user ?? false);
      setVerificando(false);
    });

    return cancelar; // limpa o listener ao desmontar
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  }

  // Splash de verificação inicial
  if (verificando) {
    return (
      <div className="min-h-screen bg-blue-700 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md">
            <span className="text-blue-700 font-black text-2xl">EQ</span>
          </div>
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Não autenticado → tela de login
  if (!usuario) {
    return <Login />;
  }

  // Autenticado → app principal com botão de logout no topo
  return (
    <div className="relative">
      {/* Barra de usuário / logout — fica sobre o header fixo do formulário */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between shadow-lg">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Conectado como</span>
          <span className="text-xs font-semibold text-gray-700 truncate max-w-[200px]">
            {usuario.email}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 rounded-xl px-4 py-2 transition"
        >
          Sair
        </button>
      </div>

      {/* Conteúdo principal — padding-bottom para não sobrepor a barra de logout */}
      <div className="pb-16">
        <FormularioVisita usuarioEmail={usuario.email} usuarioId={usuario.uid} />
      </div>
    </div>
  );
}
