import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent ' +
  'bg-white transition placeholder:text-gray-400';

function Campo({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function NovoCliente({ onSalvar, onCancelar }) {
  const [form, setForm] = useState({
    nome: '', endereco: '', email: '', telefone: '',
    rgInscricao: '', cpfCnpj: '', dataNascimento: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState('');

  const set = field => e => setForm(prev => ({ ...prev, [field]: e.target.value }));

  async function handleSalvar() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return; }
    setSalvando(true);
    setErro('');
    try {
      const docRef = await addDoc(collection(db, 'clientes'), {
        pesNome:       form.nome.trim().toUpperCase(),
        PES_NOME:      form.nome.trim().toUpperCase(),
        endereco:      form.endereco,
        email:         form.email,
        telefone:      form.telefone,
        rgInscricao:   form.rgInscricao,
        cpfCnpj:       form.cpfCnpj,
        dataNascimento: form.dataNascimento,
        latlong:       '',
        PES_CIDADE_UF: '',
        criadoEm:      new Date().toISOString(),
      });
      onSalvar({
        id:          docRef.id,
        pesCodigo:   docRef.id,
        pesNome:     form.nome.trim().toUpperCase(),
        localizacao: '',
        cidadeUf:    '',
      });
    } catch (err) {
      console.error(err);
      setErro('Erro ao salvar cliente. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    /* Overlay escuro */
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="bg-brand px-4 pt-5 pb-3 rounded-t-2xl sm:rounded-t-2xl flex items-center gap-3 shrink-0">
          <button type="button" onClick={onCancelar} className="p-1.5 text-white hover:text-white/70">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-white font-bold text-base">Novo Cliente</h2>
            <p className="text-white/70 text-[11px]">Preencha os dados do cliente</p>
          </div>
        </div>

        {/* Formulário */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2.5">
              {erro}
            </div>
          )}

          <Campo label="Nome" required>
            <input type="text" placeholder="Nome completo / Razão social"
              value={form.nome} onChange={set('nome')} autoFocus className={inputCls} />
          </Campo>

          <Campo label="Endereço">
            <input type="text" placeholder="Rua, número, cidade - UF"
              value={form.endereco} onChange={set('endereco')} className={inputCls} />
          </Campo>

          <Campo label="E-mail">
            <input type="email" inputMode="email" placeholder="exemplo@email.com"
              value={form.email} onChange={set('email')} className={inputCls} />
          </Campo>

          <Campo label="Telefone">
            <input type="tel" inputMode="tel" placeholder="(00) 00000-0000"
              value={form.telefone} onChange={set('telefone')} className={inputCls} />
          </Campo>

          <Campo label="RG / Inscrição Estadual">
            <input type="text" placeholder="RG ou Inscrição Estadual"
              value={form.rgInscricao} onChange={set('rgInscricao')} className={inputCls} />
          </Campo>

          <Campo label="CPF / CNPJ">
            <input type="text" inputMode="numeric" placeholder="000.000.000-00 ou 00.000.000/0001-00"
              value={form.cpfCnpj} onChange={set('cpfCnpj')} className={inputCls} />
          </Campo>

          <Campo label="Data de Nascimento / Fundação">
            <input type="date" value={form.dataNascimento} onChange={set('dataNascimento')} className={inputCls} />
          </Campo>

        </div>

        {/* Rodapé */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-3 shrink-0">
          <button type="button" onClick={onCancelar}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="button" onClick={handleSalvar} disabled={salvando}
            className="flex-1 py-3 rounded-xl bg-brand hover:bg-brand-dark text-white font-bold text-sm shadow transition disabled:opacity-60 flex items-center justify-center gap-2">
            {salvando
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
              : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
