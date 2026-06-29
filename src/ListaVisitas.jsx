import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const PAGE_SIZE = 20;

function formatarData(valor) {
  if (!valor) return '—';
  // campo dataVisita é string "YYYY-MM-DD"
  if (typeof valor === 'string' && valor.includes('-')) {
    const [y, m, d] = valor.split('-');
    return `${d}/${m}/${y}`;
  }
  // campo criadoEm é Timestamp do Firestore
  if (valor?.toDate) {
    return valor.toDate().toLocaleDateString('pt-BR');
  }
  return '—';
}

const MOTIVO_COR = {
  VENDA:            'bg-green-100 text-green-700',
  MANEJO:           'bg-yellow-100 text-yellow-700',
  CONSULTORIA:      'bg-blue-100 text-blue-700',
  'VENDA INOCULANTE': 'bg-purple-100 text-purple-700',
  OUTRO:            'bg-gray-100 text-gray-600',
};

function BadgeMotivo({ motivo }) {
  const cls = MOTIVO_COR[motivo] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>
      {motivo || 'SEM MOTIVO'}
    </span>
  );
}

export default function ListaVisitas() {
  const [visitas, setVisitas]         = useState([]);
  const [carregando, setCarregando]   = useState(true);
  const [busca, setBusca]             = useState('');
  const [ultimo, setUltimo]           = useState(null);
  const [temMais, setTemMais]         = useState(false);
  const [expandido, setExpandido]     = useState(null);

  async function carregar(cursor = null, filtro = '') {
    setCarregando(true);
    try {
      let q;
      if (filtro.trim().length >= 2) {
        // Busca simples por prefixo do nome do cliente
        const termo = filtro.trim().toUpperCase();
        q = query(
          collection(db, 'visitas'),
          where('clienteNome', '>=', termo),
          where('clienteNome', '<=', termo + ''),
          orderBy('clienteNome'),
          limit(PAGE_SIZE)
        );
      } else {
        q = cursor
          ? query(collection(db, 'visitas'), orderBy('dataVisita', 'desc'), startAfter(cursor), limit(PAGE_SIZE))
          : query(collection(db, 'visitas'), orderBy('dataVisita', 'desc'), limit(PAGE_SIZE));
      }

      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (cursor) {
        setVisitas(prev => [...prev, ...docs]);
      } else {
        setVisitas(docs);
      }

      setUltimo(snap.docs[snap.docs.length - 1] ?? null);
      setTemMais(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Erro ao carregar visitas:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar(null, busca);
  }, []);

  function handleBusca(e) {
    const v = e.target.value;
    setBusca(v);
    if (v.trim().length === 0 || v.trim().length >= 2) {
      carregar(null, v);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-blue-700 px-4 pt-10 pb-5 shadow-lg">
        <h1 className="text-white text-xl font-bold tracking-tight">Visitas Realizadas</h1>
        <p className="text-blue-300 text-xs mt-0.5">Equitec Agropecuária</p>

        {/* Campo de busca */}
        <div className="mt-3 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="search"
            placeholder="Buscar por cliente..."
            value={busca}
            onChange={handleBusca}
            className="w-full bg-blue-600 text-white placeholder:text-blue-300 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">

        {carregando && visitas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Carregando visitas...</p>
          </div>
        )}

        {!carregando && visitas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-400">
            <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium">Nenhuma visita encontrada</p>
          </div>
        )}

        {visitas.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Linha principal — clicável para expandir */}
            <button
              type="button"
              onClick={() => setExpandido(expandido === v.id ? null : v.id)}
              className="w-full text-left px-4 py-3.5 flex items-start gap-3"
            >
              {/* Badge número */}
              <div className="shrink-0 bg-blue-50 rounded-xl w-10 h-10 flex items-center justify-center">
                <span className="text-blue-700 font-black text-sm">#{String(v.nVisita ?? '?').padStart(2, '0')}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate">{v.clienteNome || '—'}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] text-gray-400">{formatarData(v.dataVisita)}</span>
                  {v.motivoVisita && <BadgeMotivo motivo={v.motivoVisita} />}
                </div>
                {v.vendedorNome && (
                  <p className="text-[11px] text-gray-400 mt-0.5">Vendedor: {v.vendedorNome}</p>
                )}
              </div>

              {/* Chevron */}
              <svg
                className={`w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform ${expandido === v.id ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Detalhes expandidos */}
            {expandido === v.id && (
              <div className="border-t border-gray-50 px-4 py-4 space-y-3 bg-gray-50/50">

                {/* Suínos */}
                {(v.granja || v.nAnimaisSuinos || v.tipoProducao) && (
                  <DetalheSecao titulo="Suínos">
                    <DetalheItem label="Granja" valor={v.granja} />
                    <DetalheItem label="N° Animais" valor={v.nAnimaisSuinos} />
                    <DetalheItem label="Tipo Produção" valor={v.tipoProducao} />
                    <DetalheItem label="Sêmen" valor={v.semen} />
                    <DetalheItem label="Nutrição" valor={v.nutricaoUtilizada} />
                    <DetalheItem label="Obs" valor={v.obsSuinos} full />
                  </DetalheSecao>
                )}

                {/* Bovinos Corte */}
                {v.gadoCorte && (
                  <DetalheSecao titulo="Bovinos de Corte">
                    <DetalheItem label="Cabeças" valor={v.gadoCorte} />
                    <DetalheItem label="Obs" valor={v.obsGadoCorte} full />
                  </DetalheSecao>
                )}

                {/* Bovinos Leite */}
                {(v.vacasEmLactacao || v.novilhas || v.vacasSecas) && (
                  <DetalheSecao titulo="Bovinos de Leite">
                    <DetalheItem label="Vacas Lactação" valor={v.vacasEmLactacao} />
                    <DetalheItem label="Novilhas" valor={v.novilhas} />
                    <DetalheItem label="Vacas Secas" valor={v.vacasSecas} />
                    <DetalheItem label="Total Animais" valor={v.totalAnimaisLeite} />
                    <DetalheItem label="Consumo Silagem" valor={v.consumoSilagem ? `${v.consumoSilagem} kg/dia` : null} />
                    <DetalheItem label="Produção Média" valor={v.producaoMedia ? `${v.producaoMedia} L/vaca` : null} />
                    <DetalheItem label="Obs" valor={v.obsBovLeite} full />
                  </DetalheSecao>
                )}

                {/* Silo */}
                {(v.tipoSilo || v.tipoLona || v.usaInoculante) && (
                  <DetalheSecao titulo="Silo">
                    <DetalheItem label="Tipo Silo" valor={v.tipoSilo} />
                    <DetalheItem label="Tipo Lona" valor={v.tipoLona} />
                    <DetalheItem label="Tamanho Lona" valor={v.tamanhoLona} />
                    <DetalheItem label="Valor Lona" valor={v.valorLona ? `R$ ${v.valorLona}` : null} />
                    <DetalheItem label="Inoculante" valor={v.usaInoculante} />
                    <DetalheItem label="Bactérias" valor={v.tiposBacterias} />
                    <DetalheItem label="Concentração" valor={v.concentracaoInoculante} />
                    <DetalheItem label="Dose" valor={v.doseInoculante} />
                    <DetalheItem label="Valor Inoculante" valor={v.valorInoculante ? `R$ ${v.valorInoculante}` : null} />
                  </DetalheSecao>
                )}

                {/* Silo Bag */}
                {v.utilizaSilobag === 'SIM' && (
                  <DetalheSecao titulo="Silo Bag">
                    <DetalheItem label="Comprimento/Largura" valor={v.comprimentoLargura} />
                    <DetalheItem label="Gramatura" valor={v.gramatura ? `${v.gramatura} g/m²` : null} />
                    <DetalheItem label="Garantia" valor={v.garantiaProduto} />
                    <DetalheItem label="Valor" valor={v.valorSilobag ? `R$ ${v.valorSilobag}` : null} />
                    <DetalheItem label="Obs" valor={v.obsSilobag} full />
                  </DetalheSecao>
                )}

                {/* Observações gerais */}
                {(v.obsVisita || v.proximoContato) && (
                  <DetalheSecao titulo="Observações Gerais">
                    <DetalheItem label="Obs da Visita" valor={v.obsVisita} full />
                    <DetalheItem label="Próximo Contato" valor={formatarData(v.proximoContato)} />
                    <DetalheItem label="Obs Próximo Contato" valor={v.obsProximoContato} full />
                  </DetalheSecao>
                )}

                <p className="text-[10px] text-gray-300 pt-1">
                  Registrado por: {v.criadoPorEmail || '—'}
                </p>
              </div>
            )}
          </div>
        ))}

        {/* Carregar mais */}
        {temMais && !carregando && (
          <button
            type="button"
            onClick={() => carregar(ultimo, busca)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition"
          >
            Carregar mais visitas
          </button>
        )}

        {carregando && visitas.length > 0 && (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

function DetalheSecao({ titulo, children }) {
  const filhos = Array.isArray(children) ? children : [children];
  const temConteudo = filhos.some(f => f?.props?.valor != null && f?.props?.valor !== '');
  if (!temConteudo) return null;
  return (
    <div>
      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">{titulo}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {children}
      </div>
    </div>
  );
}

function DetalheItem({ label, valor, full }) {
  if (valor == null || valor === '') return null;
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-700 font-medium">{String(valor)}</p>
    </div>
  );
}
