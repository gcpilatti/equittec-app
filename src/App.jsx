import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './Login';
import Agenda from './Agenda';
import ListaVisitas from './ListaVisitas';
import ClientesComVisitas from './ClientesComVisitas';
import FormularioVisita from './FormularioVisita';

function IcAgenda({ ativo }) {
  return (
    <svg className={`w-5 h-5 ${ativo ? 'text-brand' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function IcVisitas({ ativo }) {
  return (
    <svg className={`w-5 h-5 ${ativo ? 'text-brand' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6m-3-3v6" />
    </svg>
  );
}
function IcClientes({ ativo }) {
  return (
    <svg className={`w-5 h-5 ${ativo ? 'text-brand' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function App() {
  const [usuario, setUsuario]         = useState(null);
  const [verificando, setVerificando] = useState(true);
  const [aba, setAba]                 = useState('visitas');
  const [telaForm, setTelaForm]       = useState(null); // null | 'nova' | { ...visitaObj }

  useEffect(() => {
    const cancelar = onAuthStateChanged(auth, user => {
      setUsuario(user ?? false);
      setVerificando(false);
    });
    return cancelar;
  }, []);

  if (verificando) {
    return (
      <div className="min-h-screen bg-brand flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow">
            <span className="text-brand font-black text-2xl">EQ</span>
          </div>
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!usuario) return <Login />;

  if (telaForm) {
    return (
      <FormularioVisita
        visitaExistente={telaForm === 'nova' ? null : telaForm}
        onVoltar={() => setTelaForm(null)}
        usuarioEmail={usuario.email}
        usuarioId={usuario.uid}
      />
    );
  }

  const TABS = [
    { id: 'agenda',   label: 'AGENDA',              Ic: IcAgenda },
    { id: 'visitas',  label: 'VISITAS',              Ic: IcVisitas },
    { id: 'clientes', label: 'CLIENTES COM VISITAS', Ic: IcClientes },
  ];

  return (
    <div className="relative pb-16">
      {aba === 'agenda'   && <Agenda />}
      {aba === 'visitas'  && <ListaVisitas onEditar={v => setTelaForm(v)} />}
      {aba === 'clientes' && <ClientesComVisitas />}

      {/* FAB */}
      <button
        onClick={() => setTelaForm('nova')}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-brand hover:bg-brand-dark active:scale-95 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
        aria-label="Nova Visita"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Barra inferior */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex items-stretch">
          {TABS.map(({ id, label, Ic }, idx) => (
            <button key={id} type="button" onClick={() => setAba(id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-colors
                ${aba === id ? 'text-brand' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Ic ativo={aba === id} />
              <span className={`text-[9px] font-bold uppercase tracking-wide leading-none text-center
                ${aba === id ? 'text-brand' : 'text-gray-400'}`}>
                {label}
              </span>
              {aba === id && (
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-brand rounded-b-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sair */}
      <button onClick={() => signOut(auth)}
        className="fixed top-12 right-3 z-50 text-[10px] font-bold text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-lg px-2 py-1 transition">
        Sair
      </button>
    </div>
  );
}
