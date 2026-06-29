/**
 * Login.jsx
 * Tela de autenticação e-mail + senha via Firebase Auth.
 */

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

// Mapeia os códigos de erro do Firebase para mensagens em português
const MENSAGENS_ERRO = {
  'auth/invalid-credential':     'E-mail ou senha incorretos.',
  'auth/user-not-found':         'Nenhuma conta encontrada com este e-mail.',
  'auth/wrong-password':         'Senha incorreta. Tente novamente.',
  'auth/invalid-email':          'Formato de e-mail inválido.',
  'auth/user-disabled':          'Esta conta foi desativada. Contate o administrador.',
  'auth/too-many-requests':      'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet e tente novamente.',
};

function mensagemDeErro(code) {
  return MENSAGENS_ERRO[code] ?? 'Erro ao entrar. Tente novamente.';
}

export default function Login() {
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro]         = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      // onAuthStateChanged no App.jsx detecta o login e troca a tela automaticamente
    } catch (err) {
      setErro(mensagemDeErro(err.code));
    } finally {
      setCarregando(false);
    }
  }

  const inputCls =
    'w-full border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-[15px] ' +
    'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ' +
    'bg-gray-50 transition placeholder:text-gray-300';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Topo azul com logo/marca */}
      <div className="bg-blue-700 px-6 pt-16 pb-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mb-4">
          {/* Substitua pela logo real da Equitec */}
          <span className="text-blue-700 font-black text-2xl tracking-tight">EQ</span>
        </div>
        <h1 className="text-white text-2xl font-bold tracking-tight">Equitec</h1>
        <p className="text-blue-300 text-sm mt-1">Agenda de Visitas</p>
      </div>

      {/* Card de login */}
      <div className="flex-1 px-5 -mt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-gray-800 text-lg font-bold mb-1">Entrar</h2>
          <p className="text-gray-400 text-sm mb-6">Use seu e-mail e senha cadastrados.</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                E-mail
              </label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={inputCls}
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  className={`${inputCls} pr-12`}
                />
                {/* Botão mostrar/ocultar senha */}
                <button
                  type="button"
                  onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 transition"
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? (
                    // olho fechado
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7a9.77 9.77 0 012.168-3.568M6.343 6.343A9.956 9.956 0 0112 5c5 0 9 4 9 7a9.77 9.77 0 01-2.343 3.657M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" />
                    </svg>
                  ) : (
                    // olho aberto
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {erro}
              </div>
            )}

            {/* Botão entrar */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-base shadow-md transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {carregando ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-gray-300 mt-6">
          Problemas de acesso? Contate o administrador.
        </p>
      </div>
    </div>
  );
}
