import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export default function ClientesComVisitas() {
  const [clientes, setClientes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function carregar() {
      try {
        const snap = await getDocs(
          query(collection(db, 'visitas'), orderBy('clienteNome', 'asc'))
        );

        const mapa = {};
        snap.docs.forEach(d => {
          const v = d.data();
          const nome = v.clienteNome || '(sem nome)';
          if (!mapa[nome]) {
            mapa[nome] = { nome, total: 0, ultimaVisita: '', vendedor: v.vendedorNome || '' };
          }
          mapa[nome].total++;
          if (!mapa[nome].ultimaVisita || v.dataVisita > mapa[nome].ultimaVisita) {
            mapa[nome].ultimaVisita = v.dataVisita;
            mapa[nome].vendedor    = v.vendedorNome || mapa[nome].vendedor;
          }
        });

        setClientes(Object.values(mapa).sort((a, b) => a.nome.localeCompare(b.nome)));
      } catch (err) {
        console.error(err);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  function formatarData(str) {
    if (!str || !str.includes('-')) return '';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  }

  const filtrados = busca.trim().length >= 2
    ? clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))
    : clientes;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="bg-orange-500 px-3 pt-10 pb-2 flex items-center gap-2 shadow">
        <button className="p-2 text-white">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="w-7 h-7 bg-white rounded flex items-center justify-center mr-1">
          <span className="text-orange-500 font-black text-xs">EQ</span>
        </div>
        <span className="text-white font-bold text-base flex-1 tracking-wide">CLIENTES COM VISITAS</span>
      </div>

      <div className="bg-white px-3 py-2 border-b border-gray-200">
        <input type="search" placeholder="Buscar cliente..."
          value={busca} onChange={e => setBusca(e.target.value)}
          className="w-full bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400" />
      </div>

      <div className="flex-1 bg-white divide-y divide-gray-100">
        {carregando && (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!carregando && filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-300 gap-2">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm">Nenhum cliente encontrado</p>
          </div>
        )}

        {filtrados.map(c => (
          <div key={c.nome} className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <span className="text-orange-600 font-bold text-xs">{c.nome.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{c.nome}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {c.total} visita{c.total !== 1 ? 's' : ''}
                {c.ultimaVisita ? ` · Última: ${formatarData(c.ultimaVisita)}` : ''}
              </p>
              {c.vendedor && <p className="text-[11px] text-orange-500">{c.vendedor}</p>}
            </div>
            <div className="text-right shrink-0">
              <span className="text-lg font-black text-orange-500">{c.total}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
