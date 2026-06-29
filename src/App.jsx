import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import FormularioVisita from './FormularioVisita';
import ListaVisitas from './ListaVisitas';

function IconNovaVisita({ ativo }) {
  return (
    <svg className={`w-5 h-5 ${ativo ? 'text-blue-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconHistorico({ ativo }) {
  return (
    <svg className={`w-5 h-5 ${ativo ? 'text-blue-700' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

export default function App() {
  const [usuario, setUsuario]     = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [aba, setAba]             = useState('nova'); // 'nova' | 'historico'

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, user => {
      setUsuario(user ?? false);
      setVerificando(false);
    });
    return cancelar;
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  }

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

  if (!usuario) {
    return <Login />;
  }

  return (
    <div className="relative">
      {/* Conteúdo principal */}
      <div className="pb-16">
        {aba === 'nova'      && <FormularioVisita usuarioEmail={usuario.email} usuarioId={usuario.uid} />}
        {aba === 'historico' && <ListaVisitas />}
      </div>

      {/* Barra de navegação inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
        <div className="flex items-stretch">

          {/* Aba Nova Visita */}
          <button
            type="button"
            onClick={() => setAba('nova')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors
              ${aba === 'nova' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <IconNovaVisita ativo={aba === 'nova'} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${aba === 'nova' ? 'text-blue-700' : 'text-gray-400'}`}>
              Nova Visita
            </span>
            {aba === 'nova' && <span className="absolute bottom-0 h-0.5 w-1/2 bg-blue-700 rounded-t-full left-0" />}
          </button>

          {/* Divisor + info usuário */}
          <div className="flex flex-col items-center justify-center px-3 border-x border-gray-100">
            <span className="text-[9px] text-gray-300 uppercase tracking-wide whitespace-nowrap">conectado</span>
            <span className="text-[10px] font-semibold text-gray-500 max-w-[120px] truncate">{usuario.email}</span>
          </div>

          {/* Aba Histórico */}
          <button
            type="button"
            onClick={() => setAba('historico')}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors
              ${aba === 'historico' ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <IconHistorico ativo={aba === 'historico'} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${aba === 'historico' ? 'text-blue-700' : 'text-gray-400'}`}>
              Histórico
            </span>
            {aba === 'historico' && <span className="absolute bottom-0 h-0.5 w-1/2 bg-blue-700 rounded-t-full right-0" />}
          </button>

        </div>

        {/* Botão sair discreto */}
        <button
          onClick={handleLogout}
          className="absolute top-2 right-[calc(50%-56px)] translate-x-full text-[9px] font-bold text-red-400 hover:text-red-600 px-2 py-1 transition hidden"
          aria-label="Sair"
        />
      </div>

      {/* Botão sair flutuante */}
      <button
        onClick={handleLogout}
        className="fixed top-3 right-4 z-50 text-[10px] font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg px-2.5 py-1 transition backdrop-blur-sm"
      >
        Sair
      </button>
    </div>
  );
}
