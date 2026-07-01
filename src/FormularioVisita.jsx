import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection, query, where, orderBy, limit,
  getDocs, addDoc, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import NovoCliente from './NovoCliente';

const TIPOS_PRODUCAO = ['MATRIZES','UPL - UNIDADE PRODUTORA DE LEITÕES','UC - UNIDADE CRECHE','UT - UNIDADE TERMINAÇÃO'];
const TIPOS_SILO     = ['SILO TRINCHEIRA','SUPERFÍCIE'];
const TIPOS_LONA     = ['CONVENCIONAL','BARREIRA DE OXIGÊNIO'];
const OPCOES_SIM_NAO = ['SIM','NÃO'];
const MOTIVOS_VISITA = ['VENDA','MANEJO','CONSULTORIA','VENDA INOCULANTE','OUTRO'];

const VAZIO = {
  clienteId:'', clienteNome:'', localizacao:'',
  dataVisita: new Date().toISOString().split('T')[0],
  nVisita:1, motivoVisita:'', vendedorId:'', vendedorNome:'',
  granja:'', nAnimaisSuinos:'', tipoProducao:'', semen:'', nutricaoUtilizada:'', obsSuinos:'',
  gadoCorte:'', obsGadoCorte:'',
  vacasEmLactacao:'', novilhas:'', vacasSecas:'', consumoSilagem:'', producaoMedia:'', obsBovLeite:'',
  tipoSilo:'', tipoLona:'', tamanhoLona:'', valorLona:'',
  usaInoculante:'', tiposBacterias:'', concentracaoInoculante:'', doseInoculante:'', valorInoculante:'',
  utilizaSilobag:'', comprimentoLargura:'', gramatura:'', garantiaProduto:'', valorSilobag:'', obsSilobag:'',
  obsVisita:'', proximoContato:'', obsProximoContato:'',
};

const baseCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent ' +
  'bg-white transition placeholder:text-gray-400';

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
function Input({ label, required, className = '', ...props }) {
  return <Field label={label} required={required}><input className={`${baseCls} ${className}`} {...props} /></Field>;
}
function Select({ label, required, options, ...props }) {
  return (
    <Field label={label} required={required}>
      <select className={`${baseCls} appearance-none`} {...props}>
        <option value="">Selecione...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </Field>
  );
}
function Textarea({ label, required, ...props }) {
  return <Field label={label} required={required}><textarea className={`${baseCls} resize-none`} rows={3} {...props} /></Field>;
}
function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="bg-brand px-4 py-2">
        <h2 className="text-white text-[11px] font-bold uppercase tracking-widest">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

export default function FormularioVisita({ visitaExistente, onVoltar, usuarioEmail = '', usuarioId = '' }) {
  const editando = !!visitaExistente;
  const [form, setForm]             = useState(editando ? { ...VAZIO, ...visitaExistente } : VAZIO);
  const [clientes, setClientes]     = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [buscaCliente, setBuscaCliente] = useState(editando ? (visitaExistente.clienteNome || '') : '');
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [enviando, setEnviando]     = useState(false);
  const [feedback, setFeedback]     = useState(null);
  const [novoClienteAberto, setNovoClienteAberto] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    async function carregarBase() {
      try {
        const [sc, sv] = await Promise.all([
          getDocs(collection(db, 'clientes')),
          getDocs(collection(db, 'vendedores')),
        ]);
        setClientes(sc.docs.map(d => {
          const x = d.data();
          return { id: d.id, pesCodigo: x.PES_CODIGO ?? d.id, pesNome: x.pesNome ?? x.PES_NOME ?? '', localizacao: x.latlong ?? '', cidadeUf: x.PES_CIDADE_UF ?? '' };
        }));
        setVendedores(sv.docs.map(d => ({ id: d.id, nome: d.data().nome ?? d.data().NOME ?? '' })));
      } catch (err) { console.error(err); }
    }
    carregarBase();
  }, []);

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownAberto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const clientesFiltrados = buscaCliente.trim().length >= 2
    ? clientes.filter(c => c.pesNome.toLowerCase().includes(buscaCliente.toLowerCase()) || String(c.pesCodigo).includes(buscaCliente)).slice(0, 10)
    : [];

  const aoSelecionarCliente = useCallback(async cliente => {
    setBuscaCliente(cliente.pesNome);
    setDropdownAberto(false);
    setCarregandoHistorico(true);
    setForm(prev => ({ ...prev, clienteId: cliente.pesCodigo, clienteNome: cliente.pesNome, localizacao: cliente.localizacao }));
    try {
      const q = query(collection(db, 'visitas'), where('clienteId', '==', cliente.pesCodigo), orderBy('dataVisita', 'desc'), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const u = snap.docs[0].data();
        setForm(prev => ({
          ...prev, nVisita: (Number(u.nVisita) || 0) + 1,
          granja: u.granja ?? prev.granja, nAnimaisSuinos: u.nAnimaisSuinos ?? prev.nAnimaisSuinos,
          tipoProducao: u.tipoProducao ?? prev.tipoProducao, semen: u.semen ?? prev.semen,
          nutricaoUtilizada: u.nutricaoUtilizada ?? prev.nutricaoUtilizada, gadoCorte: u.gadoCorte ?? prev.gadoCorte,
          vacasEmLactacao: u.vacasEmLactacao ?? prev.vacasEmLactacao, novilhas: u.novilhas ?? prev.novilhas,
          vacasSecas: u.vacasSecas ?? prev.vacasSecas, consumoSilagem: u.consumoSilagem ?? prev.consumoSilagem,
          producaoMedia: u.producaoMedia ?? prev.producaoMedia, tipoSilo: u.tipoSilo ?? prev.tipoSilo,
          tipoLona: u.tipoLona ?? prev.tipoLona, tamanhoLona: u.tamanhoLona ?? prev.tamanhoLona,
          usaInoculante: u.usaInoculante ?? prev.usaInoculante, tiposBacterias: u.tiposBacterias ?? prev.tiposBacterias,
          concentracaoInoculante: u.concentracaoInoculante ?? prev.concentracaoInoculante,
          doseInoculante: u.doseInoculante ?? prev.doseInoculante,
          utilizaSilobag: u.utilizaSilobag ?? prev.utilizaSilobag, comprimentoLargura: u.comprimentoLargura ?? prev.comprimentoLargura,
          gramatura: u.gramatura ?? prev.gramatura, garantiaProduto: u.garantiaProduto ?? prev.garantiaProduto,
        }));
      } else {
        setForm(prev => ({ ...prev, nVisita: 1 }));
      }
    } catch (err) { console.error(err); }
    finally { setCarregandoHistorico(false); }
  }, []);

  function aoNovoClienteSalvo(cliente) {
    setClientes(prev => [...prev, cliente]);
    setNovoClienteAberto(false);
    aoSelecionarCliente(cliente);
  }

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const totalAnimaisLeite = (Number(form.vacasEmLactacao)||0) + (Number(form.novilhas)||0) + (Number(form.vacasSecas)||0);
  const mostrarCamposSilobag = form.utilizaSilobag === 'SIM';
  const mostrarDetalhesInoculante = form.usaInoculante.trim().length > 0;

  async function onSubmit(e) {
    e.preventDefault();
    setFeedback(null);
    if (!form.clienteId && !editando) {
      setFeedback({ tipo: 'erro', msg: 'Selecione um cliente antes de salvar.' });
      return;
    }
    setEnviando(true);
    const payload = {
      clienteId: form.clienteId, clienteNome: form.clienteNome, localizacao: form.localizacao,
      dataVisita: form.dataVisita, nVisita: Number(form.nVisita), motivoVisita: form.motivoVisita,
      vendedorId: form.vendedorId, vendedorNome: form.vendedorNome,
      granja: form.granja, nAnimaisSuinos: Number(form.nAnimaisSuinos)||null,
      tipoProducao: form.tipoProducao, semen: form.semen, nutricaoUtilizada: form.nutricaoUtilizada, obsSuinos: form.obsSuinos,
      gadoCorte: Number(form.gadoCorte)||null, obsGadoCorte: form.obsGadoCorte,
      vacasEmLactacao: Number(form.vacasEmLactacao)||null, novilhas: Number(form.novilhas)||null,
      vacasSecas: Number(form.vacasSecas)||null, totalAnimaisLeite,
      consumoSilagem: Number(form.consumoSilagem)||null, producaoMedia: Number(form.producaoMedia)||null, obsBovLeite: form.obsBovLeite,
      tipoSilo: form.tipoSilo, tipoLona: form.tipoLona, tamanhoLona: form.tamanhoLona, valorLona: Number(form.valorLona)||null,
      usaInoculante: form.usaInoculante, tiposBacterias: form.tiposBacterias,
      concentracaoInoculante: Number(form.concentracaoInoculante)||null,
      doseInoculante: Number(form.doseInoculante)||null, valorInoculante: Number(form.valorInoculante)||null,
      utilizaSilobag: form.utilizaSilobag,
      comprimentoLargura: mostrarCamposSilobag ? form.comprimentoLargura : null,
      gramatura: mostrarCamposSilobag ? (Number(form.gramatura)||null) : null,
      garantiaProduto: mostrarCamposSilobag ? form.garantiaProduto : null,
      valorSilobag: mostrarCamposSilobag ? (Number(form.valorSilobag)||null) : null,
      obsSilobag: mostrarCamposSilobag ? form.obsSilobag : null,
      obsVisita: form.obsVisita, proximoContato: form.proximoContato, obsProximoContato: form.obsProximoContato,
    };
    try {
      if (editando) {
        await updateDoc(doc(db, 'visitas', visitaExistente.id), { ...payload, atualizadoEm: serverTimestamp() });
        setFeedback({ tipo: 'sucesso', msg: 'Visita atualizada com sucesso!' });
      } else {
        await addDoc(collection(db, 'visitas'), { ...payload, criadoEm: serverTimestamp(), criadoPorId: usuarioId, criadoPorEmail: usuarioEmail });
        setFeedback({ tipo: 'sucesso', msg: `Visita N° ${form.nVisita} de ${form.clienteNome} salva!` });
        setForm(VAZIO); setBuscaCliente('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ tipo: 'erro', msg: 'Erro ao salvar. Será sincronizado ao reconectar.' });
    } finally { setEnviando(false); }
  }

  return (
    <>
    {novoClienteAberto && (
      <NovoCliente
        onSalvar={aoNovoClienteSalvo}
        onCancelar={() => setNovoClienteAberto(false)}
      />
    )}
    <form onSubmit={onSubmit} className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-brand px-3 pt-10 pb-3 shadow flex items-center gap-3">
        <button type="button" onClick={onVoltar} className="p-1.5 text-white hover:text-white/70 transition">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-base tracking-wide">{editando ? 'EDITAR VISITA' : 'NOVA VISITA'}</h1>
          <p className="text-white/70 text-[11px]">Equitec Agropecuária</p>
        </div>
        <div className="bg-brand-dark/40 rounded-lg px-3 py-1 text-center">
          <span className="text-white/70 text-[9px] block uppercase tracking-wide">Visita</span>
          <span className="text-white font-black text-base leading-none">#{String(form.nVisita).padStart(2,'0')}</span>
        </div>
      </div>

      <div className="px-3 mt-3 space-y-3">
        {feedback && (
          <div role="alert" className={`rounded-lg px-4 py-3 text-sm font-medium border ${feedback.tipo === 'sucesso' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
            {feedback.msg}
          </div>
        )}

        <SectionCard title="Dados do Cliente / Localização">
          <div className="flex flex-col gap-1 relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Cliente <span className="text-red-400">*</span>
            </label>
            <input type="search" autoComplete="off" placeholder="Digite o nome ou código do cliente..."
              value={buscaCliente}
              onChange={e => { setBuscaCliente(e.target.value); setDropdownAberto(true); }}
              onFocus={() => setDropdownAberto(true)}
              className={baseCls} />
            {dropdownAberto && (clientesFiltrados.length > 0 || buscaCliente.trim().length >= 2) && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                {clientesFiltrados.map(c => (
                  <button key={c.id} type="button"
                    className="w-full flex flex-col items-start px-4 py-2.5 hover:bg-brand/10 border-b border-gray-100 last:border-0 text-left"
                    onMouseDown={() => aoSelecionarCliente(c)}>
                    <span className="font-semibold text-gray-900 text-sm">{c.pesNome}</span>
                    <span className="text-[11px] text-gray-500">Cód. #{c.pesCodigo}{c.cidadeUf ? ` · ${c.cidadeUf}` : ''}</span>
                  </button>
                ))}
                {/* Botão adicionar novo cliente */}
                <button type="button"
                  onMouseDown={() => { setDropdownAberto(false); setNovoClienteAberto(true); }}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-brand/5 hover:bg-brand/15 border-t border-brand/20 text-left transition">
                  <span className="w-6 h-6 rounded-full bg-brand flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-brand-dark">Adicionar novo cliente</span>
                </button>
              </div>
            )}
          </div>

          {carregandoHistorico && (
            <div className="flex items-center gap-2 bg-brand/10 text-brand-dark rounded-lg px-3 py-2 text-sm">
              <span className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin shrink-0" />
              Buscando histórico...
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="N° da Visita">
              <input type="number" value={form.nVisita} readOnly className={`${baseCls} bg-brand/10 text-brand-dark font-bold cursor-not-allowed`} />
            </Field>
            <Input label="Data da Visita" required type="date" value={form.dataVisita} onChange={set('dataVisita')} />
          </div>
          <Select label="Motivo da Visita" options={MOTIVOS_VISITA} value={form.motivoVisita} onChange={set('motivoVisita')} />
          <Field label="Vendedor">
            <select className={`${baseCls} appearance-none`} value={form.vendedorNome}
              onChange={e => {
                const v = vendedores.find(x => x.nome === e.target.value);
                setForm(prev => ({ ...prev, vendedorId: v?.id ?? '', vendedorNome: v?.nome ?? '' }));
              }}>
              <option value="">Selecione...</option>
              {vendedores.map(v => <option key={v.id} value={v.nome}>{v.nome}</option>)}
            </select>
          </Field>
          <Field label="Localização (Lat/Long)">
            <input type="text" value={form.localizacao} readOnly placeholder="Preenchido ao selecionar o cliente" className={`${baseCls} cursor-not-allowed text-gray-400`} />
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
          <div className="grid grid-cols-3 gap-2">
            <Input label="Vacas em Lactação" type="number" inputMode="numeric" placeholder="0" value={form.vacasEmLactacao} onChange={set('vacasEmLactacao')} />
            <Input label="Novilhas" type="number" inputMode="numeric" placeholder="0" value={form.novilhas} onChange={set('novilhas')} />
            <Input label="Vacas Secas" type="number" inputMode="numeric" placeholder="0" value={form.vacasSecas} onChange={set('vacasSecas')} />
          </div>
          <div className="flex items-center justify-between bg-brand/10 rounded-lg px-4 py-2">
            <span className="text-xs font-bold text-brand-dark uppercase tracking-wide">Total de Animais</span>
            <span className="text-brand-dark font-black text-xl">{totalAnimaisLeite > 0 ? totalAnimaisLeite : '—'}</span>
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
            <div className="space-y-3 border-t border-dashed border-gray-200 pt-3">
              <Input label="Tipos de Bactérias" type="text" placeholder="Ex: TIPO D" value={form.tiposBacterias} onChange={set('tiposBacterias')} />
              <div className="grid grid-cols-3 gap-2">
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
            <div className="space-y-3 border-t border-dashed border-gray-200 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Comprimento e Largura" type="text" placeholder="Ex: 60 x 2.7" value={form.comprimentoLargura} onChange={set('comprimentoLargura')} />
                <Input label="Gramatura (g/m²)" type="number" inputMode="numeric" placeholder="Ex: 200" value={form.gramatura} onChange={set('gramatura')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Garantia do Produto" type="text" placeholder="Ex: 3 ANOS" value={form.garantiaProduto} onChange={set('garantiaProduto')} />
                <Input label="Valor Silo Bag (R$)" type="number" inputMode="decimal" placeholder="0,00" step="0.01" value={form.valorSilobag} onChange={set('valorSilobag')} />
              </div>
              <Textarea label="Obs Silo Bag" placeholder="Observações específicas..." value={form.obsSilobag} onChange={set('obsSilobag')} />
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

        <button type="submit" disabled={enviando}
          className="w-full bg-brand hover:bg-brand-dark active:scale-[0.98] text-white font-bold py-4 rounded-xl text-sm shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {enviando
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
            : editando ? 'Salvar Alterações' : `Salvar Visita N° ${form.nVisita}`}
        </button>

        <p className="text-center text-[10px] text-gray-300 pb-2">Offline-First — sincroniza automaticamente ao reconectar</p>
      </div>
    </form>
    </>
  );
}
