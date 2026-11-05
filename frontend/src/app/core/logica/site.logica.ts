/**
 * Lógica do site institucional (funções puras, testadas em tests/site.logica.test.ts).
 * [F7] Solicitado por: Thamara Santana (cliente) (04/11/2026).
 */

/** ["A", "B", "C"] → "A, B e C" */
export function listarComE(itens: string[]): string {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/** Link do WhatsApp com mensagem pronta. */
export function linkWhatsApp(numero: string, mensagem = ''): string {
  const digitos = numero.replace(/\D/g, '');
  return mensagem ? `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}` : `https://wa.me/${digitos}`;
}

export function linkInstagram(usuario: string): string {
  return `https://www.instagram.com/${usuario.replace(/^@/, '')}/`;
}

/** Abre o endereço no Google Maps (rota "Como chegar"). */
export function linkMapa(endereco: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
}

/** Mapa incorporado na página (não precisa de chave de API). */
export function linkMapaIncorporado(endereco: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(endereco)}&output=embed`;
}

/** Divide o texto da publicação em parágrafos (linha em branco = novo parágrafo). */
export function paragrafos(texto: string | null | undefined): string[] {
  if (!texto) return [];
  return texto
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);
}

/** "agora há pouco", "há 3 horas", "ontem", "há 4 dias" ou a data (dd/mm/aaaa). */
export function tempoRelativo(iso: string | null | undefined, agora = new Date()): string {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  const minutos = Math.floor((agora.getTime() - data.getTime()) / 60_000);
  if (minutos < 60) return 'agora há pouco';
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? 'há 1 hora' : `há ${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;
  return dataCurta(iso);
}

/** dd/mm/aaaa (no horário de Brasília). */
export function dataCurta(iso: string | null | undefined): string {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/** "4 de novembro de 2026" (no horário de Brasília). */
export function dataPorExtenso(iso: string | null | undefined): string {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' });
}

/** Tempo estimado de leitura ("3 min de leitura"). */
export function tempoDeLeitura(texto: string | null | undefined): string {
  const palavras = (texto ?? '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(palavras / 200))} min de leitura`;
}

/** Contador de caracteres para os campos do editor ("120 / 300"). */
export function contagem(texto: string | null | undefined, limite: number): { texto: string; excedeu: boolean } {
  const n = (texto ?? '').length;
  return { texto: `${n.toLocaleString('pt-BR')} / ${limite.toLocaleString('pt-BR')}`, excedeu: n > limite };
}

/** Validação do editor de publicações (mesmas regras do servidor). */
export function validarPublicacao(p: { titulo: string; resumo: string | null; conteudo: string }): string | null {
  const titulo = p.titulo.trim();
  if (titulo.length < 5) return 'Escreva um título com pelo menos 5 letras.';
  if (titulo.length > 150) return 'O título pode ter no máximo 150 caracteres.';
  if ((p.resumo ?? '').trim().length > 300) return 'O resumo pode ter no máximo 300 caracteres.';
  if (p.conteudo.trim().length < 20) return 'Escreva o texto da publicação (pelo menos 20 caracteres).';
  if (p.conteudo.length > 20000) return 'O texto pode ter no máximo 20.000 caracteres.';
  return null;
}
