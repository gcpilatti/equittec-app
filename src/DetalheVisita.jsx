function fmt(valor) {
  if (!valor && valor !== 0) return null;
  if (typeof valor === 'string' && valor.includes('-') && valor.length === 10) {
    const [y, m, d] = valor.split('-');
    return `${d}/${m}/${y}`;
  }
  if (valor?.toDate) return valor.toDate().toLocaleDateString('pt-BR');
  return String(valor);
}

function Item({ label, valor }) {
  const v = fmt(valor);
  if (!v) return null;
  return (
    <div className="py-2 border-b border-gray-50 last:border-0">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-800">{v}</p>
    </div>
  );
}

function Secao({ titulo, children }) {
  const filhos = Array.isArray(children) ? children.flat() : [children];
  const temConteudo = filhos.some(f => {
    const v = fmt(f?.props?.valor);
    return v !== null && v !== undefined && v !== '';
  });
  if (!temConteudo) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-brand px-4 py-2">
        <h2 className="text-white text-[11px] font-bold uppercase tracking-widest">{titulo}</h2>
      </div>
      <div className="px-4 divide-y divide-gray-50">
        {children}
      </div>
    </div>
  );
}

const MOTIVO_COR = {
  VENDA:              'bg-green-100 text-green-700',
  MANEJO:             'bg-yellow-100 text-yellow-700',
  CONSULTORIA:        'bg-blue-100 text-blue-700',
  'VENDA INOCULANTE': 'bg-purple-100 text-purple-700',
  OUTRO:              'bg-gray-100 text-gray-600',
};

export default function DetalheVisita({ visita, onVoltar, onEditar }) {
  const v = visita;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-brand px-3 pt-10 pb-3 shadow">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onVoltar}
            className="p-1.5 text-white hover:text-white/70 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base truncate">{v.clienteNome || '—'}</h1>
            <p className="text-white/70 text-[11px]">
              {fmt(v.dataVisita)}{v.vendedorNome ? ` · ${v.vendedorNome}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Badge visita */}
            <div className="bg-brand-dark/40 rounded-lg px-3 py-1 text-center">
              <span className="text-white/70 text-[9px] block uppercase tracking-wide">Visita</span>
              <span className="text-white font-black text-base leading-none">
                #{String(v.nVisita ?? '?').padStart(2, '0')}
              </span>
            </div>

            {/* Botão editar */}
            <button type="button" onClick={onEditar}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Badge motivo */}
        {v.motivoVisita && (
          <div className="mt-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${MOTIVO_COR[v.motivoVisita] ?? 'bg-white/20 text-white'}`}>
              {v.motivoVisita}
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="px-3 mt-3 space-y-3">

        {/* Identificação rápida */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-4">
          <div className="text-center">
            <p className="text-[9px] text-gray-400 uppercase tracking-wide">Cliente ID</p>
            <p className="text-sm font-bold text-gray-700">{v.clienteId || '—'}</p>
          </div>
          {v.localizacao && (
            <>
              <div className="w-px h-8 bg-gray-100" />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] text-gray-400 uppercase tracking-wide">Localização</p>
                <p className="text-sm text-gray-700 truncate">{v.localizacao}</p>
              </div>
            </>
          )}
        </div>

        {/* Dados da visita */}
        <Secao titulo="Dados da Visita">
          <Item label="Data da Visita"  valor={v.dataVisita} />
          <Item label="Motivo da Visita" valor={v.motivoVisita} />
          <Item label="Vendedor"         valor={v.vendedorNome} />
        </Secao>

        {/* Suínos */}
        <Secao titulo="Informações Suínos">
          <Item label="Granja"           valor={v.granja} />
          <Item label="N° de Animais"    valor={v.nAnimaisSuinos} />
          <Item label="Tipo de Produção" valor={v.tipoProducao} />
          <Item label="Sêmen"            valor={v.semen} />
          <Item label="Nutrição Utilizada" valor={v.nutricaoUtilizada} />
          <Item label="Observações"      valor={v.obsSuinos} />
        </Secao>

        {/* Bovinos de Corte */}
        <Secao titulo="Informações Bovinos de Corte">
          <Item label="Gado de Corte (cabeças)" valor={v.gadoCorte} />
          <Item label="Observações"             valor={v.obsGadoCorte} />
        </Secao>

        {/* Bovinos de Leite */}
        <Secao titulo="Informações Bovinos de Leite">
          <Item label="Vacas em Lactação"     valor={v.vacasEmLactacao} />
          <Item label="Novilhas"              valor={v.novilhas} />
          <Item label="Vacas Secas"           valor={v.vacasSecas} />
          <Item label="Total de Animais"      valor={v.totalAnimaisLeite} />
          <Item label="Consumo de Silagem"    valor={v.consumoSilagem ? `${v.consumoSilagem} kg/dia` : null} />
          <Item label="Produção Média"        valor={v.producaoMedia   ? `${v.producaoMedia} L/vaca`  : null} />
          <Item label="Observações"           valor={v.obsBovLeite} />
        </Secao>

        {/* Silo */}
        <Secao titulo="Silo">
          <Item label="Tipo de Silo"    valor={v.tipoSilo} />
          <Item label="Tipo da Lona"    valor={v.tipoLona} />
          <Item label="Tamanho da Lona" valor={v.tamanhoLona} />
          <Item label="Valor da Lona"   valor={v.valorLona   ? `R$ ${Number(v.valorLona).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
          <Item label="Usa Inoculante"  valor={v.usaInoculante} />
          <Item label="Tipos de Bactérias"   valor={v.tiposBacterias} />
          <Item label="Concentração Inoculante" valor={v.concentracaoInoculante} />
          <Item label="Dose Inoculante"      valor={v.doseInoculante} />
          <Item label="Valor Inoculante"     valor={v.valorInoculante ? `R$ ${Number(v.valorInoculante).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
        </Secao>

        {/* Silo Bag */}
        <Secao titulo="Silo Bag">
          <Item label="Utiliza Silo Bag"       valor={v.utilizaSilobag} />
          <Item label="Comprimento e Largura"  valor={v.comprimentoLargura} />
          <Item label="Gramatura"              valor={v.gramatura ? `${v.gramatura} g/m²` : null} />
          <Item label="Garantia do Produto"    valor={v.garantiaProduto} />
          <Item label="Valor Silo Bag"         valor={v.valorSilobag ? `R$ ${Number(v.valorSilobag).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
          <Item label="Observações Silo Bag"   valor={v.obsSilobag} />
        </Secao>

        {/* Observações Gerais */}
        <Secao titulo="Observações Gerais">
          <Item label="Obs da Visita"        valor={v.obsVisita} />
          <Item label="Próximo Contato"      valor={v.proximoContato} />
          <Item label="Obs Próximo Contato"  valor={v.obsProximoContato} />
        </Secao>

        {/* Rodapé */}
        <div className="text-center text-[10px] text-gray-300 pb-2 space-y-0.5">
          {v.criadoPorEmail && <p>Registrado por: {v.criadoPorEmail}</p>}
          {v.criadoEm?.toDate && <p>{v.criadoEm.toDate().toLocaleString('pt-BR')}</p>}
        </div>

        {/* Botão editar grande */}
        <button type="button" onClick={onEditar}
          className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-4 rounded-xl text-sm shadow transition-all flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar esta Visita
        </button>
      </div>
    </div>
  );
}
