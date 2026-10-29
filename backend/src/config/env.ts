/**
 * Carrega as variáveis do arquivo .env (se existir) e silencia o aviso
 * "SQLite is an experimental feature" do Node — o módulo funciona normalmente.
 * Este arquivo precisa ser o PRIMEIRO import do server.ts.
 */
try {
  process.loadEnvFile();
} catch {
  // Sem arquivo .env: usamos os valores padrão.
}

const emitirAvisoOriginal = process.emitWarning.bind(process);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(process as any).emitWarning = (aviso: string | Error, ...resto: any[]) => {
  const texto = typeof aviso === 'string' ? aviso : aviso.message;
  if (texto.includes('SQLite')) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (emitirAvisoOriginal as any)(aviso, ...resto);
};

export {};
