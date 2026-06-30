import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, orderBy, limit, getDocs,
  startAfter, deleteDoc, doc,
} from 'firebase/firestore';
import { db } from './firebase';

const PAGE_SIZE = 30;

function formatarData(valor) {
  if (!valor) return '';
  if (typeof valor === 'string' && valor.includes('-')) {
    const [y, m, d] = valor.split('-');
    return `${d}/${m}/${y}`;
  }
  if (valor?.toDate) return valor.toDate().toLocaleDateString('pt-BR');
  return '';
}

export default function ListaVisitas({ onEditar }) {
  const [visitas, setVisitas]       = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca]           = useState('');
  const [ultimo, setUltimo]         = useState(null);
  const [temMais, setTemMais]       = useState(false);
  const [deletando, setDeletando]   = useState(null);
  const [confirmar, setConfirmar]   = useState(null);

  const carregar = useCallback(async (cursor = null) => {
    setCarregando(true);
    try {
      const q = cursor
        ? query(collection(db, 'visitas'), orderBy('dataVisita', 'desc'), startAfter(cursor), limit(PAGE_SIZE))
        : query(collection(db, 'visitas'), orderBy('dataVisita', 'desc'), limit(PAGE_SIZE));

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      setVisitas(prev => cursor ? [...prev, ...docs] : docs);
      setUltimo(snap.docs[snap.docs.length - 1] ?? null);
      setTemMais(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Erro ao carregar visitas:', err);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function handleDeletar(id) {
    setDeletando(id);
    try {
      await deleteDoc(doc(db, 'visitas', id));
      setVisitas(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error('Erro ao deletar:', err);
    } finally {
      setDeletando(null);
      setConfirmar(null);
    }
  }

  const visitasFiltradas = busca.trim().length >= 2
    ? visitas.filter(v =>
        v.clienteNome?.toLowerCase().includes(busca.toLowerCase()) ||
        String(v.clienteId ?? '').includes(busca)
      )
    : visitas;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">

      {/* Header */}
      <div className="bg-brand px-3 pt-10 pb-2 flex items-center gap-2 shadow">
        <button className="p-2 text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="w-7 h-7 bg-white rounded flex items-center justify-center mr-1">
          <span className="text-brand font-black text-xs">EQ</span>
        </div>
        <span className="text-white font-bold text-base flex-1 tracking-wide">VISITAS</span>
        <button onClick={() => carregar()} className="p-2 text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white px-3 py-2 border-b border-gray-200">
        <input
          type="search"
          placeholder="Buscar por cliente..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      {/* Lista como cards separados */}
      <div className="flex-1 px-3 py-3 space-y-2">

        {carregando && visitas.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!carregando && visitasFiltradas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Nenhuma visita encontrada</p>
          </div>
        )}

        {visitasFiltradas.map(v => (
          <div key={v.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3">

            {/* Linha 1: nome + data */}
            <div className="flex items-start justify-between gap-3">
              <p className="font-bold text-gray-900 text-sm leading-tight">{v.clienteNome || '—'}</p>
              <p className="text-gray-500 text-xs shrink-0 font-medium pt-0.5">{formatarData(v.dataVisita)}</p>
            </div>

            {/* Linha 2: obs / motivo */}
            {(v.obsVisita || v.motivoVisita) && (
              <p className="text-brand-dark text-sm mt-1 leading-snug line-clamp-2">
                {v.obsVisita || v.motivoVisita}
              </p>
            )}

            {/* Vendedor */}
            {v.vendedorNome && (
              <p className="text-gray-400 text-xs mt-1">{v.vendedorNome}</p>
            )}

            {/* Ações */}
            <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-gray-50">
              {confirmar === v.id ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Excluir?</span>
                  <button onClick={() => handleDeletar(v.id)} disabled={deletando === v.id}
                    className="text-xs text-white bg-red-500 rounded px-2 py-0.5 font-bold disabled:opacity-50">
                    {deletando === v.id ? '...' : 'Sim'}
                  </button>
                  <button onClick={() => setConfirmar(null)}
                    className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5">
                    Não
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={() => setConfirmar(v.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button onClick={() => onEditar(v)}
                    className="p-1.5 text-gray-300 hover:text-brand transition rounded-lg hover:bg-brand/10">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {temMais && !carregando && (
          <button onClick={() => carregar(ultimo)}
            className="w-full text-sm text-brand-dark font-semibold py-3 border border-brand/30 rounded-xl hover:bg-brand/5 transition bg-white">
            Carregar mais
          </button>
        )}

        {carregando && visitas.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
