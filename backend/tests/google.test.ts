import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCompromisso, criarProcesso, criarUsuario, novoBanco, requisicao, resposta } from './helpers';
import { criarBancoLocal, definirBanco, migrarCompromissosParaGoogle, todos } from '../src/config/database';
import { CompromissosController } from '../src/controllers/compromissos.controller';
import { GoogleController, MENSAGEM_NAO_CONFIGURADO } from '../src/controllers/google.controller';
import { ProcessosController } from '../src/controllers/processos.controller';
import { AgendaGoogleModel } from '../src/models/agenda-google.model';
import { CompromissoModel } from '../src/models/compromisso.model';
import { GoogleModel, MENSAGEM_RECONECTAR } from '../src/models/google.model';
import { dadosDoEvento, dataHoraEmBrasilia, EventoGoogle, eventoDoCompromisso, somarMinutos } from '../src/utils/agenda-google';
import { cifrar, decifrar } from '../src/utils/cripto';
import { ClienteHttp, definirClienteHttp, urlDeAutorizacao } from '../src/utils/google';
import { gerarCodigoDeFinalidade } from '../src/utils/token';

/**
 * Google falso: guarda os eventos numa lista e responde como a API do Google Agenda.
 * Registra as chamadas para os testes conferirem.
 */
function googleFalso() {
  const eventos = new Map<string, EventoGoogle>();
  const chamadas: { metodo: string; url: string; corpo?: unknown }[] = [];
  let contador = 0;
  let relogio = Date.parse('2026-11-05T12:00:00Z');
  const carimbo = () => new Date((relogio += 1000)).toISOString();
  let recusarToken = false;

  const json = (status: number, corpo: unknown) => ({
    ok: status < 400,
    status,
    json: async () => corpo,
    text: async () => (corpo === null ? '' : JSON.stringify(corpo)),
  });

  const cliente: ClienteHttp = async (url, opcoes = {}) => {
    const metodo = opcoes.method ?? 'GET';
    const corpo = opcoes.body && opcoes.body.startsWith('{') ? JSON.parse(opcoes.body) : undefined;
    chamadas.push({ metodo, url, corpo });
    if (url.startsWith('https://oauth2.googleapis.com/token')) {
      if (recusarToken) return json(400, { error: 'invalid_grant' });
      return json(200, { access_token: 'acesso-falso', refresh_token: 'refresh-falso', expires_in: 3600 });
    }
    if (url.startsWith('https://oauth2.googleapis.com/revoke')) return json(200, {});
    if (url.startsWith('https://openidconnect.googleapis.com/v1/userinfo')) return json(200, { email: 'thamarasantana.adv@gmail.com' });
    const base = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
    if (url.startsWith(base)) {
      const resto = url.slice(base.length);
      if (metodo === 'POST') {
        const ev = { ...(corpo as EventoGoogle), id: `ev${++contador}`, updated: carimbo(), status: 'confirmed' };
        eventos.set(ev.id, ev);
        return json(200, ev);
      }
      if (metodo === 'GET') return json(200, { items: [...eventos.values()] });
      const id = decodeURIComponent(resto.slice(1));
      if (!eventos.has(id)) return json(404, { error: { message: 'Not Found' } });
      if (metodo === 'PATCH') {
        const ev = { ...eventos.get(id)!, ...(corpo as EventoGoogle), updated: carimbo() };
        eventos.set(id, ev);
        return json(200, ev);
      }
      if (metodo === 'DELETE') {
        eventos.delete(id);
        return json(204, null);
      }
    }
    return json(500, { error: { message: `chamada inesperada ${metodo} ${url}` } });
  };

  return {
    cliente,
    eventos,
    chamadas,
    carimbo,
    recusar: () => (recusarToken = true),
  };
}

/** [F8] Google Agenda nos dois sentidos — pedido de Thamara Santana (cliente) (04/11/2026). */
describe('[F8] Google Agenda (sugestão: Thamara Santana (cliente))', () => {
  let thamara: number;
  let google: ReturnType<typeof googleFalso>;

  beforeEach(async () => {
    await novoBanco();
    thamara = await criarUsuario('thamarasantana.adv@gmail.com', 'Thamara Santana');
    google = googleFalso();
    definirClienteHttp(google.cliente);
    GoogleModel.limparMemoria();
    process.env.GOOGLE_CLIENT_ID = 'id-de-teste';
    process.env.GOOGLE_CLIENT_SECRET = 'segredo-de-teste';
  });

  afterEach(() => {
    definirClienteHttp(null);
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  async function conectar() {
    await GoogleModel.salvar(thamara, 'thamarasantana.adv@gmail.com', 'refresh-falso');
  }

  describe('conversões', () => {
    it('eventoDoCompromisso(): tipo no título, ✓ quando concluído, dia inteiro sem hora e 1 hora com hora', () => {
      const base = { id: 7, tipo: 'audiencia' as const, titulo: 'Conciliação', data: '2026-11-05', hora: '23:30', local: 'Fórum', descricao: 'Levar documentos', status: 'pendente' as const, processo_numero: '0001234-56.2026.8.26.0100', processo_cliente: 'Maria' };
      const ev = eventoDoCompromisso(base);
      assert.equal(ev.summary, '[Audiência] Conciliação');
      assert.deepEqual(ev.start, { dateTime: '2026-11-05T23:30:00', timeZone: 'America/Sao_Paulo' });
      assert.deepEqual(ev.end, { dateTime: '2026-11-06T00:30:00', timeZone: 'America/Sao_Paulo' }); // passa da meia-noite
      assert.equal(ev.extendedProperties?.private?.tsId, '7');
      assert.match(ev.description!, /Processo 0001234-56\.2026\.8\.26\.0100 · Maria/);

      const diaInteiro = eventoDoCompromisso({ ...base, hora: null, status: 'concluido', tipo: 'outro' });
      assert.equal(diaInteiro.summary, '✓ Conciliação');
      assert.deepEqual(diaInteiro.start, { date: '2026-11-05' });
      assert.deepEqual(diaInteiro.end, { date: '2026-11-06' });
    });

    it('dadosDoEvento(): lê o tipo, o ✓, a hora em Brasília e tira o texto que o sistema escreveu', () => {
      const ida = eventoDoCompromisso({ id: 7, tipo: 'recurso', titulo: 'Prazo', data: '2026-11-05', hora: '10:00', local: null, descricao: 'Minha nota', status: 'concluido' });
      const volta = dadosDoEvento({ ...ida, id: 'x' })!;
      assert.equal(volta.tipo, 'recurso');
      assert.equal(volta.concluido, true);
      assert.equal(volta.titulo, 'Prazo');
      assert.equal(volta.descricao, 'Minha nota');
      assert.equal(volta.compromissoId, 7);

      const doGoogle = dadosDoEvento({ id: 'g', summary: 'Reunião com cliente', start: { dateTime: '2026-11-05T17:00:00Z' } })!;
      assert.equal(doGoogle.tipo, null);
      assert.equal(doGoogle.data, '2026-11-05');
      assert.equal(doGoogle.hora, '14:00'); // 17h UTC = 14h em Brasília
      assert.equal(dadosDoEvento({ id: 'c', status: 'cancelled' }), null);
      assert.deepEqual(dataHoraEmBrasilia('2026-11-06T02:30:00Z'), { data: '2026-11-05', hora: '23:30' });
      assert.deepEqual(somarMinutos('2026-12-31', '23:00', 60), { data: '2027-01-01', hora: '00:00' });
    });

    it('cifrar()/decifrar(): o acesso ao Google fica ilegível no banco', () => {
      const cifrado = cifrar('refresh-secreto');
      assert.notEqual(cifrado, 'refresh-secreto');
      assert.equal(decifrar(cifrado), 'refresh-secreto');
      assert.equal(decifrar(cifrado.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'))), null); // adulterado
    });
  });

  describe('conexão (login do Google)', () => {
    it('conectar() devolve a página de autorização; sem configuração responde 503', async () => {
      const res = resposta();
      await GoogleController.conectar(requisicao({ usuarioId: thamara }), res as never);
      assert.match(res.corpo.url, /^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth\?/);
      assert.match(res.corpo.url, /calendar\.events/);
      assert.match(res.corpo.url, /access_type=offline/);

      delete process.env.GOOGLE_CLIENT_ID;
      const sem = resposta();
      await GoogleController.conectar(requisicao({ usuarioId: thamara }), sem as never);
      assert.equal(sem.statusCode, 503);
      assert.equal(sem.corpo.erro, MENSAGEM_NAO_CONFIGURADO);
    });

    it('retorno() guarda a conta (token cifrado) e envia os compromissos pendentes ao Google', async () => {
      await criarCompromisso(thamara, { data: '2099-01-10', titulo: 'Audiência futura' });
      await criarCompromisso(thamara, { data: '2020-01-10', titulo: 'Antiga' });
      const res = resposta();
      await GoogleController.retorno(
        requisicao({ query: { code: 'codigo', state: gerarCodigoDeFinalidade(thamara, 'conectar-google') } }),
        res as never,
      );
      assert.equal(res.statusCode, 302);
      assert.match(res.redirecionadoPara!, /\/sistema\/inicio\?google=conectado$/);
      const conta = (await GoogleModel.buscar(thamara))!;
      assert.equal(conta.email, 'thamarasantana.adv@gmail.com');
      assert.notEqual(conta.refresh_token_cifrado, 'refresh-falso');
      assert.equal(google.eventos.size, 1); // só a futura
      assert.equal([...google.eventos.values()][0].summary, '[Audiência] Audiência futura');
    });

    it('retorno() com código de outra finalidade, ou cancelado pela usuária, não conecta', async () => {
      const falso = resposta();
      await GoogleController.retorno(requisicao({ query: { code: 'c', state: gerarCodigoDeFinalidade(thamara, 'outra-coisa') } }), falso as never);
      assert.match(falso.redirecionadoPara!, /google=erro$/);
      const cancelado = resposta();
      await GoogleController.retorno(requisicao({ query: { error: 'access_denied', state: 'x' } }), cancelado as never);
      assert.match(cancelado.redirecionadoPara!, /google=cancelado$/);
      assert.equal(await GoogleModel.buscar(thamara), undefined);
    });

    it('se o Google recusar o acesso, pede para reconectar (sem derrubar a tela)', async () => {
      await conectar();
      google.recusar();
      const res = resposta();
      await CompromissosController.criar(
        requisicao({ usuarioId: thamara, body: { tipo: 'audiencia', titulo: 'Teste', data: '2099-01-01' } }),
        res as never,
      );
      assert.equal(res.statusCode, 201); // o compromisso foi salvo mesmo assim
      assert.equal((await GoogleModel.situacao(thamara)).erro, MENSAGEM_RECONECTAR);
    });

    it('desconectar() apaga a conexão e os vínculos', async () => {
      await conectar();
      const id = await criarCompromisso(thamara, { data: '2099-01-10' });
      await AgendaGoogleModel.enviar(thamara, id);
      await GoogleController.desconectar(requisicao({ usuarioId: thamara }), resposta() as never);
      assert.equal(await GoogleModel.buscar(thamara), undefined);
      assert.equal((await CompromissoModel.buscar(thamara, id))!.google_event_id, null);
      assert.ok(google.chamadas.some((c) => c.url.startsWith('https://oauth2.googleapis.com/revoke')));
    });
  });

  describe('do sistema para o Google', () => {
    it('criar, editar, concluir e excluir um compromisso repete tudo no Google', async () => {
      await conectar();
      const criar = resposta();
      await CompromissosController.criar(
        requisicao({ usuarioId: thamara, body: { tipo: 'despacho', titulo: 'Despacho saneador', data: '2099-03-01', hora: '09:00' } }),
        criar as never,
      );
      const id = criar.corpo.id;
      assert.equal(criar.corpo.no_google, true);
      const [eventoId] = [...google.eventos.keys()];

      await CompromissosController.atualizar(
        requisicao({ usuarioId: thamara, params: { id: String(id) }, body: { tipo: 'despacho', titulo: 'Despacho saneador (novo)', data: '2099-03-02', hora: '09:00' } }),
        resposta() as never,
      );
      assert.equal(google.eventos.get(eventoId)!.summary, '[Despacho] Despacho saneador (novo)');

      await CompromissosController.alterarStatus(requisicao({ usuarioId: thamara, params: { id: String(id) }, body: { status: 'concluido' } }), resposta() as never);
      assert.equal(google.eventos.get(eventoId)!.summary, '✓ [Despacho] Despacho saneador (novo)');

      await CompromissosController.excluir(requisicao({ usuarioId: thamara, params: { id: String(id) } }), resposta() as never);
      assert.equal(google.eventos.size, 0);
    });

    it('excluir o processo apaga do Google os compromissos dele', async () => {
      await conectar();
      const processo = await criarProcesso(thamara);
      const c = await criarCompromisso(thamara, { processo_id: processo, data: '2099-01-10' });
      await AgendaGoogleModel.enviar(thamara, c);
      assert.equal(google.eventos.size, 1);
      await ProcessosController.excluir(requisicao({ usuarioId: thamara, params: { id: String(processo) } }), resposta() as never);
      assert.equal(google.eventos.size, 0);
    });

    it('sem conta Google conectada, nada é enviado', async () => {
      const id = await criarCompromisso(thamara);
      await AgendaGoogleModel.enviar(thamara, id);
      assert.equal(google.chamadas.length, 0);
    });
  });

  describe('do Google para o sistema', () => {
    it('evento novo vira compromisso "Outro"; alterado atualiza; excluído exclui', async () => {
      await conectar();
      google.eventos.set('g1', { id: 'g1', status: 'confirmed', summary: 'Reunião no escritório', location: 'Sala 4', start: { dateTime: '2026-11-10T13:00:00Z' }, updated: google.carimbo() });

      let r = await AgendaGoogleModel.receber(thamara, new Date('2026-11-05T12:00:00Z'));
      assert.deepEqual({ novos: r.novos, atualizados: r.atualizados, removidos: r.removidos, feita: r.feita }, { novos: 1, atualizados: 0, removidos: 0, feita: true });
      const [c] = await CompromissoModel.listar(thamara, {}, '2026-11-05');
      assert.equal(c.tipo, 'outro');
      assert.equal(c.titulo, 'Reunião no escritório');
      assert.equal(c.hora, '10:00');
      assert.equal(c.local, 'Sala 4');

      // Pedido de novo em menos de 2 minutos: não chama o Google
      const antes = google.chamadas.length;
      r = await AgendaGoogleModel.receber(thamara, new Date('2026-11-05T12:01:00Z'));
      assert.equal(r.feita, false);
      assert.equal(google.chamadas.length, antes);

      google.eventos.set('g1', { ...google.eventos.get('g1')!, summary: 'Reunião remarcada', start: { dateTime: '2026-11-11T13:00:00Z' }, updated: google.carimbo() });
      r = await AgendaGoogleModel.receber(thamara, new Date('2026-11-05T12:10:00Z'));
      assert.equal(r.atualizados, 1);
      assert.equal((await CompromissoModel.buscar(thamara, Number(c.id)))!.data, '2026-11-11');

      google.eventos.set('g1', { ...google.eventos.get('g1')!, status: 'cancelled', updated: google.carimbo() });
      r = await AgendaGoogleModel.receber(thamara, new Date('2026-11-05T12:20:00Z'));
      assert.equal(r.removidos, 1);
      assert.equal(await CompromissoModel.buscar(thamara, Number(c.id)), undefined);
    });

    it('a alteração feita pelo próprio sistema não volta como "atualizada"; a feita no celular volta', async () => {
      await conectar();
      const id = await criarCompromisso(thamara, { titulo: 'Audiência', data: '2026-11-20' });
      await AgendaGoogleModel.enviar(thamara, id);
      let r = await AgendaGoogleModel.receber(thamara, new Date('2026-11-05T12:00:00Z'), true);
      assert.equal(r.atualizados + r.novos, 0);

      // No celular, a Thamara marca como feito e muda o horário
      const [eventoId] = [...google.eventos.keys()];
      google.eventos.set(eventoId, { ...google.eventos.get(eventoId)!, summary: '✓ [Audiência] Audiência', start: { dateTime: '2026-11-20T18:00:00Z' }, updated: google.carimbo() });
      r = await AgendaGoogleModel.receber(thamara, new Date('2026-11-05T12:05:00Z'), true);
      assert.equal(r.atualizados, 1);
      const c = (await CompromissoModel.buscar(thamara, id))!;
      assert.equal(c.status, 'concluido');
      assert.equal(c.hora, '15:00');
      assert.equal(c.tipo, 'audiencia');
    });

    it('sincronizar() sem conta conectada responde "não conectado"', async () => {
      const res = resposta();
      await GoogleController.sincronizar(requisicao({ usuarioId: thamara, query: {} }), res as never);
      assert.equal(res.corpo.conectado, false);
    });
  });

  it('migração: banco antigo (sem o tipo "outro") é recriado sem perder compromissos', async () => {
    const banco = await criarBancoLocal(':memory:');
    definirBanco(banco);
    const u = await criarUsuario('velha@teste.com');
    await criarCompromisso(u, { titulo: 'Antigo' });
    // Volta a tabela para o formato antigo
    await banco.script(`
      CREATE TABLE velha AS SELECT id, usuario_id, processo_id, tipo, titulo, data, hora, local, descricao, prioridade, status, concluido_em, criado_em FROM compromissos;
      DROP TABLE compromissos;
      CREATE TABLE compromissos (
        id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, processo_id INTEGER,
        tipo TEXT NOT NULL CHECK (tipo IN ('audiencia', 'recurso', 'manifestacao', 'despacho')),
        titulo TEXT NOT NULL, data TEXT NOT NULL, hora TEXT, local TEXT, descricao TEXT,
        prioridade TEXT NOT NULL DEFAULT 'media', status TEXT NOT NULL DEFAULT 'pendente',
        concluido_em TEXT, criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
      INSERT INTO compromissos SELECT * FROM velha;
      DROP TABLE velha;
    `);
    await migrarCompromissosParaGoogle(banco);
    await migrarCompromissosParaGoogle(banco); // rodar de novo não faz nada
    const linhas = await todos<{ titulo: string; google_event_id: string | null }>('SELECT titulo, google_event_id FROM compromissos');
    assert.deepEqual(linhas.map((l) => ({ ...l })), [{ titulo: 'Antigo', google_event_id: null }]);
    await criarCompromisso(u, { tipo: 'outro', titulo: 'Do Google' }); // agora aceita "outro"
  });

  it('urlDeAutorizacao() leva o endereço de retorno do site', () => {
    process.env.APP_URL = 'https://thamarasantana.adv.br';
    try {
      assert.match(urlDeAutorizacao('x'), /redirect_uri=https%3A%2F%2Fthamarasantana\.adv\.br%2Fapi%2Fgoogle%2Fretorno/);
    } finally {
      delete process.env.APP_URL;
    }
  });
});
