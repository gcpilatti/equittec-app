import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

const MENSAGENS_ERRO = {
  'auth/invalid-credential':     'E-mail ou senha incorretos.',
  'auth/user-not-found':         'Nenhuma conta encontrada com este e-mail.',
  'auth/wrong-password':         'Senha incorreta. Tente novamente.',
  'auth/invalid-email':          'Formato de e-mail inválido.',
  'auth/user-disabled':          'Esta conta foi desativada. Contate o administrador.',
  'auth/too-many-requests':      'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Sem conexão. Verifique sua internet e tente novamente.',
};

export default function Login() {
  const [email, setEmail]             = useState('');
  const [senha, setSenha]             = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando]   = useState(false);
  const [erro, setErro]               = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
    } catch (err) {
      setErro(MENSAGENS_ERRO[err.code] ?? 'Erro ao entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-4 py-3 text-gray-800 text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent ' +
    'bg-white transition placeholder:text-gray-300';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="bg-brand px-6 pt-20 pb-12 flex flex-col items-center">
        <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow mb-4">
          <span className="text-brand font-black text-2xl tracking-tight">EQ</span>
        </div>
        <h1 className="text-white text-2xl font-bold">Equitec</h1>
        <p className="text-white/70 text-sm mt-1">Agenda de Visitas</p>
      </div>

      <div className="flex-1 px-5 -mt-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-gray-800 text-lg font-bold mb-1">Entrar</h2>
          <p className="text-gray-400 text-sm mb-5">Use seu e-mail e senha cadastrados.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">E-mail</label>
              <input type="email" inputMode="email" autoComplete="email" autoCapitalize="none"
                placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                required className={inputCls} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Senha</label>
              <div className="relative">
                <input type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password"
                  placeholder="••••••••" value={senha} onChange={e => setSenha(e.target.value)}
                  required className={`${inputCls} pr-12`} />
                <button type="button" onClick={() => setMostrarSenha(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {mostrarSenha
                    ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9-4-9-7a9.77 9.77 0 012.168-3.568M6.343 6.343A9.956 9.956 0 0112 5c5 0 9 4 9 7a9.77 9.77 0 01-2.343 3.657M15 12a3 3 0 11-6 0 3 3 0 016 0zM3 3l18 18" /></svg>
                    : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>
            </div>

            {erro && (
              <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{erro}</div>
            )}

            <button type="submit" disabled={carregando}
              className="w-full bg-brand hover:bg-brand-dark active:scale-[0.98] text-white font-bold py-3.5 rounded-xl text-sm shadow transition-all disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {carregando
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Entrando...</>
                : 'Entrar'}
            </button>
          </form>
        </div>
        <p className="text-center text-[11px] text-gray-300 mt-5">Problemas de acesso? Contate o administrador.</p>
      </div>
    </div>
  );
}
