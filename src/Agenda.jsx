import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from './firebase';

function formatarData(valor) {
  if (!valor) return '';
  if (typeof valor === 'string' && valor.includes('-')) {
    const [y, m, d] = valor.split('-');
    return `${d}/${m}/${y}`;
  }
  return '';
}

function diasRestantes(dataStr) {
  if (!dataStr) return null;
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  const data = new Date(dataStr + 'T00:00:00');
  return Math.round((data - hoje) / (1000 * 60 * 60 * 24));
}

function BadgeDias({ dias }) {
  if (dias === null) return null;
  if (dias < 0)  return <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Atrasado {Math.abs(dias)}d</span>;
  if (dias === 0) return <span className="text-[10px] font-bold text-brand-dark bg-brand/20 px-2 py-0.5 rounded-full">Hoje</span>;
  if (dias <= 7)  return <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">Em {dias}d</span>;
  return <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Em {dias}d</span>;
}

export default function Agenda() {
  const [contatos, setContatos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const hoje = new Date().toISOString().split('T')[0];
        const q = query(collection(db, 'visitas'), where('proximoContato', '>=', hoje), orderBy('proximoContato', 'asc'));
        const snap = await getDocs(q);
        setContatos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {
        try {
          const q = query(collection(db, 'visitas'), orderBy('proximoContato', 'asc'));
          const snap = await getDocs(q);
          setContatos(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(v => v.proximoContato));
        } catch (err) { console.error(err); }
      } finally { setCarregando(false); }
    }
    carregar();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="bg-brand px-3 pt-10 pb-2 flex items-center gap-2 shadow">
        <button className="p-2 text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div className="w-7 h-7 bg-white rounded flex items-center justify-center mr-1">
          <span className="text-brand font-black text-xs">EQ</span>
        </div>
        <span className="text-white font-bold text-base flex-1 tracking-wide">AGENDA</span>
      </div>

      <div className="flex-1 px-3 py-3 space-y-2">
        {carregando && (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!carregando && contatos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">Nenhum contato agendado</p>
          </div>
        )}

        {contatos.map(v => {
          const dias = diasRestantes(v.proximoContato);
          return (
            <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-gray-900 text-sm">{v.clienteNome || '—'}</p>
                <p className="text-gray-500 text-xs shrink-0 font-medium">{formatarData(v.proximoContato)}</p>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <BadgeDias dias={dias} />
                {v.vendedorNome && <span className="text-[11px] text-gray-400">{v.vendedorNome}</span>}
              </div>
              {v.obsProximoContato && (
                <p className="text-brand-dark text-sm mt-1.5 line-clamp-2">{v.obsProximoContato}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
