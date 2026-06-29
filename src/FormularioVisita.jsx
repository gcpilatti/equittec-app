import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const TIPOS_PRODUCAO = [
  'MATRIZES',
  'UPL - UNIDADE PRODUTORA DE LEITÕES',
  'UC - UNIDADE CRECHE',
  'UT - UNIDADE TERMINAÇÃO',
];

const TIPOS_SILO   = ['SILO TRINCHEIRA', 'SUPERFÍCIE'];
const TIPOS_LONA   = ['CONVENCIONAL', 'BARREIRA DE OXIGÊNIO'];
const OPCOES_SIM_NAO = ['SIM', 'NÃO'];
const MOTIVOS_VISITA = ['VENDA', 'MANEJO', 'CONSULTORIA', 'VENDA INOCULANTE', 'OUTRO'];

const ESTADO_INICIAL = {
  clienteId:    '',
  clienteNome:  '',
  localizacao:  '',
  dataVisita:   new Date().toISOString().split('T')[0],
  nVisita:      1,
  motivoVisita: '',
  vendedorId:   '',
  vendedorNome: '',

  granja:            '',
  nAnimaisSuinos:    '',
  tipoProducao:      '',
  semen:             '',
  nutricaoUtilizada: '',
  obsSuinos:         '',

  gadoCorte:    '',
  obsGadoCorte: '',

  vacasEmLactacao: '',
  novilhas:        '',
  vacasSecas:      '',
  consumoSilagem:  '',
  producaoMedia:   '',
  obsBovLeite:     '',

  tipoSilo:               '',
  tipoLona:               '',
  tamanhoLona:            '',
  valorLona:              '',
  usaInoculante:          '',
  tiposBacterias:         '',
  concentracaoInoculante: '',
  doseInoculante:         '',
  valorInoculante:        '',

  utilizaSilobag:     '',
  comprimentoLargura: '',
  gramatura:          '',
  garantiaProduto:    '',
  valorSilobag:       '',
  obsSilobag:         '',

  obsVisita:         '',
  proximoContato:    '',
  obsProximoContato: '',
};

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-blue-700 px-4 py-3">
        <h2 className="text-white text-xs font-bold uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

const baseCls =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-[15px] ' +
  'focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ' +
  'bg-gray-50 transition placeholder:text-gray-300';

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({ label, required, className = '', ...props }) {
  return (
    <Field label={label} required={required}>
      <input className={`${baseCls} ${className}`} {...props} />
    </Field>
  );
}

function Select({ label, required, options, ...props }) {
  return (
    <Field label={label} required={required}>
      <select className={`${baseCls} appearance-none`} {...props}>
        <option value="">Selecione...</option>
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
}

function Textarea({ label, required, ...props }) {
  return (
    <Field label={label} required={required}>
      <textarea className={`${baseCls} resize-none`} rows={3} {...props} />
    </Field>
  );
}

export default function FormularioVisita({ usuarioEmail = '', usuarioId = '' }) {
  const [form, setForm]                 = useState(ESTADO_INICIAL);
  const [clientes, setClientes]         = useState([]);
  const [vendedores, setVendedores]     = useState([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [enviando, setEnviando]         = useState(false);
  const [feedback, setFeedback]         = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function carregarBaseDados() {
      try {
        const [snapClientes, snapVendedores] = await Promise.all([
          getDocs(collection(db, 'clientes')),
          getDocs(collection(db, 'vendedores')),
        ]);

        setClientes(
          snapClientes.docs.map(doc => {
            const d = doc.data();
            return {
              id:          doc.id,
              pesCodigo:   d.PES_CODIGO ?? doc.id,
              pesNome:     d.pesNome    ?? d.PES_NOME ?? '',
              localizacao: d.latlong    ?? '',
              cidadeUf:    d.PES_CIDADE_UF ?? '',
            };
          })
        );

        setVendedores(
          snapVendedores.docs.map(doc => ({
            id:   doc.id,
            nome: doc.data().nome ?? doc.data().NOME ?? '',
          }))
        );
      } catch (err) {
        console.error('Erro ao carregar dados base:', err);
      }
    }
    carregarBaseDados();
  }, []);

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clientesFiltrados =
    buscaCliente.trim().length >= 2
      ? clientes
          .filter(
            c =>
              c.pesNome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
              String(c.pesCodigo).includes(buscaCliente)
          )
          .slice(0, 10)
      : [];

  const aoSelecionarCliente = useCallback(async cliente => {
    setBuscaCliente(cliente.pesNome);
    setDropdownAberto(false);
    setCarregandoHistorico(true);

    setForm(prev => ({
      ...prev,
      clienteId:   cliente.pesCodigo,
      clienteNome: cliente.pesNome,
      localizacao: cliente.localizacao,
    }));

    try {
      const q = query(
        collection(db, 'visitas'),
        where('clienteId', '==', cliente.pesCodigo),
        orderBy('dataVisita', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const u = snap.docs[0].data();

        setForm(prev => ({
          ...prev,
          nVisita: (Number(u.nVisita) || 0) + 1,
          granja:                 u.granja                 ?? prev.granja,
          nAnimaisSuinos:         u.nAnimaisSuinos         ?? prev.nAnimaisSuinos,
          tipoProducao:           u.tipoProducao           ?? prev.tipoProducao,
          semen:                  u.semen                  ?? prev.semen,
          nutricaoUtilizada:      u.nutricaoUtilizada       ?? prev.nutricaoUtilizada,
          gadoCorte:              u.gadoCorte              ?? prev.gadoCorte,
          vacasEmLactacao:        u.vacasEmLactacao        ?? prev.vacasEmLactacao,
          novilhas:               u.novilhas               ?? prev.novilhas,
          vacasSecas:             u.vacasSecas             ?? prev.vacasSecas,
          consumoSilagem:         u.consumoSilagem         ?? prev.consumoSilagem,
          producaoMedia:          u.producaoMedia          ?? prev.producaoMedia,
          tipoSilo:               u.tipoSilo               ?? prev.tipoSilo,
          tipoLona:               u.tipoLona               ?? prev.tipoLona,
          tamanhoLona:            u.tamanhoLona            ?? prev.tamanhoLona,
          usaInoculante:          u.usaInoculante          ?? prev.usaInoculante,
          tiposBacterias:         u.tiposBacterias         ?? prev.tiposBacterias,
          concentracaoInoculante: u.concentracaoInoculante ?? prev.concentracaoInoculante,
          doseInoculante:         u.doseInoculante         ?? prev.doseInoculante,
          utilizaSilobag:         u.utilizaSilobag         ?? prev.utilizaSilobag,
          comprimentoLargura:     u.comprimentoLargura     ?? prev.comprimentoLargura,
          gramatura:              u.gramatura              ?? prev.gramatura,
          garantiaProduto:        u.garantiaProduto        ?? prev.garantiaProduto,
        }));
      } else {
        setForm(prev => ({ ...prev, nVisita: 1 }));
      }
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
    } finally {
      setCarregandoHistorico(false);
    }
  }, []);

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const totalAnimaisLeite =
    (Number(form.vacasEmLactacao) || 0) +
    (Number(form.novilhas)        || 0) +
    (Number(form.vacasSecas)      || 0);

  const mostrarCamposSilobag = form.utilizaSilobag === 'SIM';
  const mostrarDetalhesInoculante = form.usaInoculante.trim().length > 0;

  async function onSubmit(e) {
    e.preventDefault();
    setFeedback(null);

    if (!form.clienteId) {
      setFeedback({ tipo: 'erro', msg: 'Selecione um cliente antes de salvar.' });
      return;
    }

    setEnviando(true);

    try {
      await addDoc(collection(db, 'visitas'), {
        clienteId:    form.clienteId,
        clienteNome:  form.clienteNome,
        localizacao:  form.localizacao,
        dataVisita:   form.dataVisita,
        nVisita:      Number(form.nVisita),
        motivoVisita: form.motivoVisita,
        vendedorId:   form.vendedorId,
        vendedorNome: form.vendedorNome,

        granja:            form.granja,
        nAnimaisSuinos:    Number(form.nAnimaisSuinos) || null,
        tipoProducao:      form.tipoProducao,
        semen:             form.semen,
        nutricaoUtilizada: form.nutricaoUtilizada,
        obsSuinos:         form.obsSuinos,

        gadoCorte:    Number(form.gadoCorte) || null,
        obsGadoCorte: form.obsGadoCorte,

        vacasEmLactacao: Number(form.vacasEmLactacao) || null,
        novilhas:        Number(form.novilhas)        || null,
        vacasSecas:      Number(form.vacasSecas)      || null,
        totalAnimaisLeite,
        consumoSilagem:  Number(form.consumoSilagem) || null,
        producaoMedia:   Number(form.producaoMedia)  || null,
        obsBovLeite:     form.obsBovLeite,

        tipoSilo:               form.tipoSilo,
        tipoLona:               form.tipoLona,
        tamanhoLona:            form.tamanhoLona,
        valorLona:              Number(form.valorLona) || null,
        usaInoculante:          form.usaInoculante,
        tiposBacterias:         form.tiposBacterias,
        concentracaoInoculante: Number(form.concentracaoInoculante) || null,
        doseInoculante:         Number(form.doseInoculante)         || null,
        valorInoculante:        Number(form.valorInoculante)        || null,

        utilizaSilobag:     form.utilizaSilobag,
        comprimentoLargura: mostrarCamposSilobag ? form.comprimentoLargura : null,
        gramatura:          mostrarCamposSilobag ? (Number(form.gramatura) || null) : null,
        garantiaProduto:    mostrarCamposSilobag ? form.garantiaProduto    : null,
        valorSilobag:       mostrarCamposSilobag ? (Number(form.valorSilobag) || null) : null,
        obsSilobag:         mostrarCamposSilobag ? form.obsSilobag         : null,

        obsVisita:         form.obsVisita,
        proximoContato:    form.proximoContato,
        obsProximoContato: form.obsProximoContato,

        criadoEm:       serverTimestamp(),
        criadoPorId:    usuarioId,
        criadoPorEmail: usuarioEmail,
      });

      setFeedback({
        tipo: 'sucesso',
        msg: `Visita N° ${form.nVisita} de ${form.clienteNome} salva com sucesso!`,
      });
      setForm(ESTADO_INICIAL);
      setBuscaCliente('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Erro ao salvar visita:', err);
      setFeedback({
        tipo: 'erro',
        msg: 'Erro ao salvar. O registro será sincronizado ao reconectar.',
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="min-h-screen bg-gray-50 pb-12">

      <div className="sticky top-0 z-40 bg-blue-700 px-4 pt-10 pb-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-bold tracking-tight">Nova Visita</h1>
            <p className="text-blue-300 text-xs mt-0.5">Equitec Agropecuária</p>
          </div>
          <div className="bg-blue-600 rounded-xl px-3 py-1.5 text-center min-w-[56px]">
            <span className="text-blue-200 text-[10px] block uppercase tracking-wide">Visita</span>
            <span className="text-white font-bold text-lg leading-none">
              #{String(form.nVisita).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {feedback && (
          <div
            role="alert"
            className={`rounded-xl px-4 py-3 text-sm font-medium border ${
              feedback.tipo === 'sucesso'
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <SectionCard title="Dados do Cliente / Localização">

          <div className="flex flex-col gap-1.5 relative" ref={dropdownRef}>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Cliente <span className="text-red-400">*</span>
            </label>
            <input
              type="search"
              inputMode="text"
              autoComplete="off"
              placeholder="Digite o nome ou código do cliente..."
              value={buscaCliente}
              onChange={e => {
                setBuscaCliente(e.target.value);
                setDropdownAberto(true);
              }}
              onFocus={() => setDropdownAberto(true)}
              className={baseCls}
            />

            {dropdownAberto && clientesFiltrados.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {clientesFiltrados.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full flex flex-col items-start px-4 py-3 hover:bg-blue-50 active:bg-blue-100 border-b border-gray-50 last:border-0 transition text-left"
                    onMouseDown={() => aoSelecionarCliente(c)}
                  >
                    <span className="font-semibold text-gray-800 text-sm">{c.pesNome}</span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      Cód. #{c.pesCodigo}
                      {c.cidadeUf ? ` · ${c.cidadeUf}` : ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {carregandoHistorico && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-600 rounded-xl px-3 py-2.5 text-sm">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
              Buscando histórico de visitas...
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="N° da Visita">
              <input
                type="number"
                value={form.nVisita}
                readOnly
                className={`${baseCls} bg-blue-50 text-blue-700 font-bold cursor-not-allowed`}
              />
            </Field>
            <Input
              label="Data da Visita"
              required
              type="date"
              value={form.dataVisita}
              onChange={set('dataVisita')}
            />
          </div>

          <Select
            label="Motivo da Visita"
            options={MOTIVOS_VISITA}
            value={form.motivoVisita}
            onChange={set('motivoVisita')}
          />

          <Field label="Vendedor">
            <select
              className={`${baseCls} appearance-none`}
              value={form.vendedorNome}
              onChange={e => {
                const v = vendedores.find(x => x.nome === e.target.value);
                setForm(prev => ({
                  ...prev,
                  vendedorId:   v?.id   ?? '',
                  vendedorNome: v?.nome ?? '',
                }));
              }}
            >
              <option value="">Selecione...</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.nome}>{v.nome}</option>
              ))}
            </select>
          </Field>

          <Field label="Localização (Lat/Long)">
            <input
              type="text"
              value={form.localizacao}
              readOnly
              placeholder="Preenchido ao selecionar o cliente"
              className={`${baseCls} cursor-not-allowed text-gray-400`}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Informações Suínos">
          <Input label="Granja" type="text" placeholder="Nome da granja" value={form.granja} onChange={set('granja')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="N° de Animais" type="number" inputMode="numeric" placeholder="Ex: 500" value={form.nAnimaisSuinos} onChange={set('nAnimaisSuinos')} />
            <Select label="Tipo de Produção" options={TIPOS_PRODUCAO} value={form.tipoProducao} onChange={set('tipoProducao')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sêmen" type="text" placeholder="Ex: BRF" value={form.semen} onChange={set('semen')} />
            <Input label="Nutrição Utilizada" type="text" placeholder="Ex: RG" value={form.nutricaoUtilizada} onChange={set('nutricaoUtilizada')} />
          </div>
          <Textarea label="Observações Suínos" placeholder="Observações sobre o plantel..." value={form.obsSuinos} onChange={set('obsSuinos')} />
        </SectionCard>

        <SectionCard title="Informações Bovinos de Corte">
          <Input label="Gado de Corte (cabeças)" type="number" inputMode="numeric" placeholder="Ex: 200" value={form.gadoCorte} onChange={set('gadoCorte')} />
          <Textarea label="Observações Gado de Corte" placeholder="Tipo de confinamento, raça, manejo..." value={form.obsGadoCorte} onChange={set('obsGadoCorte')} />
        </SectionCard>

        <SectionCard title="Informações Bovinos de Leite">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Vacas em Lactação" type="number" inputMode="numeric" placeholder="0" value={form.vacasEmLactacao} onChange={set('vacasEmLactacao')} />
            <Input label="Novilhas" type="number" inputMode="numeric" placeholder="0" value={form.novilhas} onChange={set('novilhas')} />
            <Input label="Vacas Secas" type="number" inputMode="numeric" placeholder="0" value={form.vacasSecas} onChange={set('vacasSecas')} />
          </div>
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2.5">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Total de Animais</span>
            <span className="text-blue-800 font-bold text-xl">{totalAnimaisLeite > 0 ? totalAnimaisLeite : '—'}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Consumo de Silagem (kg/dia)" type="number" inputMode="decimal" placeholder="Ex: 253.2" value={form.consumoSilagem} onChange={set('consumoSilagem')} />
            <Input label="Produção Média (L/vaca)" type="number" inputMode="decimal" placeholder="Ex: 54.8" value={form.producaoMedia} onChange={set('producaoMedia')} />
          </div>
          <Textarea label="Observações Bovinos de Leite" placeholder="Raça, sanidade, manejo..." value={form.obsBovLeite} onChange={set('obsBovLeite')} />
        </SectionCard>

        <SectionCard title="Silo">
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tipo de Silo" options={TIPOS_SILO} value={form.tipoSilo} onChange={set('tipoSilo')} />
            <Select label="Tipo da Lona" options={TIPOS_LONA} value={form.tipoLona} onChange={set('tipoLona')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tamanho da Lona" type="text" placeholder="Ex: 152 x 152" value={form.tamanhoLona} onChange={set('tamanhoLona')} />
            <Input label="Valor da Lona (R$)" type="number" inputMode="decimal" placeholder="0,00" step="0.01" value={form.valorLona} onChange={set('valorLona')} />
          </div>
          <Input label="Usa Inoculante? Qual?" type="text" placeholder="Deixe em branco se não utiliza" value={form.usaInoculante} onChange={set('usaInoculante')} />
          {mostrarDetalhesInoculante && (
            <div className="space-y-4 border-t border-dashed border-gray-100 pt-4">
              <Input label="Tipos de Bactérias" type="text" placeholder="Ex: TIPO D" value={form.tiposBacterias} onChange={set('tiposBacterias')} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Concentração" type="number" inputMode="decimal" placeholder="0" value={form.concentracaoInoculante} onChange={set('concentracaoInoculante')} />
                <Input label="Dose" type="number" inputMode="decimal" placeholder="0" value={form.doseInoculante} onChange={set('doseInoculante')} />
                <Input label="Valor (R$)" type="number" inputMode="decimal" placeholder="0,00" step="0.01" value={form.valorInoculante} onChange={set('valorInoculante')} />
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Silo Bag">
          <Select label="Utiliza Silo Bag?" options={OPCOES_SIM_NAO} value={form.utilizaSilobag} onChange={set('utilizaSilobag')} />
          {mostrarCamposSilobag && (
            <div className="space-y-4 border-t border-dashed border-blue-100 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Comprimento e Largura" type="text" placeholder="Ex: 60 x 2.7" value={form.comprimentoLargura} onChange={set('comprimentoLargura')} />
                <Input label="Gramatura (g/m²)" type="number" inputMode="numeric" placeholder="Ex: 200" value={form.gramatura} onChange={set('gramatura')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Garantia do Produto" type="text" placeholder="Ex: 3 ANOS" value={form.garantiaProduto} onChange={set('garantiaProduto')} />
                <Input label="Valor Silo Bag (R$)" type="number" inputMode="decimal" placeholder="0,00" step="0.01" value={form.valorSilobag} onChange={set('valorSilobag')} />
              </div>
              <Textarea label="Obs Silo Bag" placeholder="Observações específicas sobre o Silo Bag..." value={form.obsSilobag} onChange={set('obsSilobag')} />
            </div>
          )}
        </SectionCard>

        <SectionCard title="Observações Gerais">
          <Textarea label="Obs da Visita" placeholder="Resumo da visita, oportunidades, pendências..." value={form.obsVisita} onChange={set('obsVisita')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Próximo Contato" type="date" value={form.proximoContato} onChange={set('proximoContato')} />
            <Textarea label="Obs Próximo Contato" placeholder="Pauta para o próximo contato..." value={form.obsProximoContato} onChange={set('obsProximoContato')} />
          </div>
        </SectionCard>

        <button
          type="submit"
          disabled={enviando}
          className="w-full bg-blue-700 hover:bg-blue-800 active:scale-[0.98] text-white font-bold py-4 rounded-2xl text-base shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {enviando ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            `Salvar Visita N° ${form.nVisita}`
          )}
        </button>

        <p className="text-center text-[11px] text-gray-300 pb-2">
          Offline-First — sincroniza automaticamente ao reconectar
        </p>
      </div>
    </form>
  );
}
