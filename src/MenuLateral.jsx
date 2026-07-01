export default function MenuLateral({ onFechar, onCadastrarCliente, usuarioEmail }) {
  return (
    <>
      {/* Overlay escuro */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onFechar}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl flex flex-col">

        {/* Cabeçalho do menu */}
        <div className="bg-brand px-5 pt-12 pb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-brand font-black text-base">EQ</span>
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Equitec</p>
              <p className="text-white/70 text-[11px]">Agropecuária</p>
            </div>
          </div>
          {usuarioEmail && (
            <p className="text-white/60 text-xs truncate">{usuarioEmail}</p>
          )}
        </div>

        {/* Itens do menu */}
        <nav className="flex-1 py-3">

          <p className="px-5 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Cadastros
          </p>

          <button
            type="button"
            onClick={() => { onFechar(); onCadastrarCliente(); }}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-brand/10 transition text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-brand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Cadastrar Cliente</p>
              <p className="text-[11px] text-gray-400">Adicionar novo cliente</p>
            </div>
          </button>

          <div className="mx-5 my-1 border-t border-gray-100" />

          <p className="px-5 pt-3 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Sistema
          </p>

          <div className="px-5 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Offline-First</p>
              <p className="text-[11px] text-gray-400">Sincroniza ao reconectar</p>
            </div>
          </div>
        </nav>

        {/* Versão */}
        <div className="px-5 py-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-300">Equitec App v1.0</p>
        </div>
      </div>
    </>
  );
}
