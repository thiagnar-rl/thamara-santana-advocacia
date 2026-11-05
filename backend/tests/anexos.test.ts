import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCliente, criarCompromisso, criarProcesso, criarUsuario, novoBanco, requisicao, resposta } from './helpers';
import { todos } from '../src/config/database';
import { AnexosController } from '../src/controllers/anexos.controller';
import { ClientesController } from '../src/controllers/clientes.controller';
import { ProcessosController } from '../src/controllers/processos.controller';
import { AnexoModel, MENSAGEM_SEM_GOOGLE, PASTA_RAIZ } from '../src/models/anexo.model';
import { GoogleModel } from '../src/models/google.model';
import { TIPO_PASTA } from '../src/utils/drive';
import { ClienteHttp, definirClienteHttp } from '../src/utils/google';

interface ArquivoFalso {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  parents?: string[];
  trashed?: boolean;
  appProperties?: Record<string, string>;
  webViewLink?: string;
}

/** Google Drive falso: guarda os arquivos num mapa e responde como a API do Drive. */
function driveFalso() {
  const arquivos = new Map<string, ArquivoFalso>();
  const envios: { url: string; origem?: string; metadados: Partial<ArquivoFalso>; tipo?: string; tamanho?: string }[] = [];
  let contador = 0;
  const json = (status: number, corpo: unknown, cabecalhos: Record<string, string> = {}) => ({
    ok: status < 400,
    status,
    json: async () => corpo,
    text: async () => (corpo === null ? '' : JSON.stringify(corpo)),
    headers: { get: (n: string) => cabecalhos[n.toLowerCase()] ?? null },
  });

  const cliente: ClienteHttp = async (url, opcoes = {}) => {
    const metodo = opcoes.method ?? 'GET';
    const corpo = opcoes.body && opcoes.body.startsWith('{') ? JSON.parse(opcoes.body) : undefined;
    if (url.startsWith('https://oauth2.googleapis.com/token')) return json(200, { access_token: 'acesso', expires_in: 3600 });
    if (url.startsWith('https://www.googleapis.com/upload/drive/v3/files')) {
      const endereco = `https://upload.falso/sessao${envios.length + 1}`;
      envios.push({ url: endereco, origem: opcoes.headers?.Origin, metadados: corpo, tipo: opcoes.headers?.['X-Upload-Content-Type'], tamanho: opcoes.headers?.['X-Upload-Content-Length'] });
      return json(200, null, { location: endereco });
    }
    const base = 'https://www.googleapis.com/drive/v3/files';
    if (url.startsWith(base)) {
      const resto = url.slice(base.length);
      const id = resto.startsWith('/') ? decodeURIComponent(resto.slice(1).split('?')[0]) : '';
      if (metodo === 'POST' && !id) {
        const novo = { ...(corpo as ArquivoFalso), id: `pasta${++contador}` };
        arquivos.set(novo.id, novo);
        return json(200, { id: novo.id });
      }
      const arq = arquivos.get(id);
      if (!arq) return json(404, { error: { message: 'File not found' } });
      if (metodo === 'GET') return json(200, arq);
      if (metodo === 'PATCH') {
        Object.assign(arq, corpo);
        return json(200, { id });
      }
    }
    return json(500, { error: { message: `chamada inesperada ${metodo} ${url}` } });
  };

  /** Simula o navegador terminando o envio do arquivo (o Drive cria o arquivo). */
  function concluirEnvio(n: number, conteudo = 1234): string {
    const envio = envios[n];
    const id = `arquivo${++contador}xxxxxxxx`;
    arquivos.set(id, {
      id,
      name: envio.metadados.name!,
      mimeType: envio.tipo!,
      size: String(conteudo),
      parents: envio.metadados.parents,
      appProperties: envio.metadados.appProperties,
      webViewLink: `https://drive.google.com/file/d/${id}/view`,
    });
    return id;
  }

  return { cliente, arquivos, envios, concluirEnvio };
}

/** [F1] Anexos no Google Drive — pedido de Thiago Rinaldi Luna (04/11/2026). */
describe('[F1] Anexos no Google Drive (sugestão: Thiago Rinaldi Luna)', () => {
  let thamara: number;
  let drive: ReturnType<typeof driveFalso>;

  beforeEach(async () => {
    await novoBanco();
    thamara = await criarUsuario('thamarasantana.adv@gmail.com', 'Thamara Santana');
    drive = driveFalso();
    definirClienteHttp(drive.cliente);
    GoogleModel.limparMemoria();
    await GoogleModel.salvar(thamara, 'thamarasantana.adv@gmail.com', 'refresh-falso');
  });

  afterEach(() => definirClienteHttp(null));

  async function anexar(tipo: string, id: number, nome = 'procuracao.pdf') {
    const r = resposta();
    await AnexosController.iniciarEnvio(
      requisicao({ usuarioId: thamara, body: { tipo, id, nome, tipo_mime: 'application/pdf', tamanho: 1234 }, headers: { origin: 'http://localhost:4200' } }),
      r,
    );
    assert.equal(r.statusCode, 200, JSON.stringify(r.corpo));
    const driveId = drive.concluirEnvio(drive.envios.length - 1);
    const r2 = resposta();
    await AnexosController.registrar(requisicao({ usuarioId: thamara, body: { drive_arquivo_id: driveId } }), r2);
    assert.equal(r2.statusCode, 201, JSON.stringify(r2.corpo));
    return { driveId, anexo: r2.corpo as { id: number; nome: string; link: string } };
  }

  it('anexa um documento ao processo: cria as pastas no Drive, envia direto do navegador e registra', async () => {
    const processo = await criarProcesso(thamara);
    const { anexo } = await anexar('processo', processo);
    assert.equal(anexo.nome, 'procuracao.pdf');
    assert.match(anexo.link, /drive\.google\.com/);

    // pastas "Thamara Santana Advocacia/Processos"
    const pastas = [...drive.arquivos.values()].filter((a) => a.mimeType === TIPO_PASTA);
    assert.deepEqual(pastas.map((p) => p.name).sort(), ['Processos', PASTA_RAIZ].sort());
    assert.equal(drive.envios[0].origem, 'http://localhost:4200'); // o Drive só aceita o envio vindo do site
    assert.equal(drive.envios[0].metadados.appProperties?.tsDono, 'processo');

    const lista = resposta();
    await AnexosController.listar(requisicao({ usuarioId: thamara, query: { tipo: 'processo', id: String(processo) } }), lista);
    assert.equal((lista.corpo as unknown[]).length, 1);
    assert.equal('drive_arquivo_id' in (lista.corpo as object[])[0], false); // o id interno do Drive não sai na API
  });

  it('reaproveita as pastas e cria só a subpasta que falta (Clientes, Compromissos)', async () => {
    await anexar('processo', await criarProcesso(thamara));
    await anexar('processo', await criarProcesso(thamara, { numero: '0009999-11.2026.8.26.0100' }));
    await anexar('cliente', await criarCliente(thamara));
    await anexar('compromisso', await criarCompromisso(thamara));
    const pastas = [...drive.arquivos.values()].filter((a) => a.mimeType === TIPO_PASTA).map((p) => p.name).sort();
    assert.deepEqual(pastas, ['Clientes', 'Compromissos', 'Processos', PASTA_RAIZ].sort());
  });

  it('se a pasta foi apagada no Drive, cria de novo', async () => {
    const processo = await criarProcesso(thamara);
    await anexar('processo', processo);
    for (const a of drive.arquivos.values()) if (a.name === 'Processos') a.trashed = true;
    await anexar('processo', processo, 'contrato.pdf');
    const ativas = [...drive.arquivos.values()].filter((a) => a.name === 'Processos' && !a.trashed);
    assert.equal(ativas.length, 1);
  });

  it('sem a conta Google conectada, avisa para conectar', async () => {
    await GoogleModel.desconectar(thamara);
    const r = resposta();
    await AnexosController.iniciarEnvio(requisicao({ usuarioId: thamara, body: { tipo: 'processo', id: await criarProcesso(thamara), nome: 'a.pdf', tamanho: 10 } }), r);
    assert.equal(r.statusCode, 409);
    assert.equal((r.corpo as { erro: string }).erro, MENSAGEM_SEM_GOOGLE);
  });

  it('recusa: arquivo acima de 50 MB, registro de outra usuária e arquivo que o sistema não criou', async () => {
    const processo = await criarProcesso(thamara);
    const grande = resposta();
    await AnexosController.iniciarEnvio(requisicao({ usuarioId: thamara, body: { tipo: 'processo', id: processo, nome: 'a.zip', tamanho: 51 * 1024 * 1024 } }), grande);
    assert.equal(grande.statusCode, 400);

    const outra = await criarUsuario('outra@teste.com', 'Outra');
    const alheio = resposta();
    await AnexosController.iniciarEnvio(requisicao({ usuarioId: thamara, body: { tipo: 'processo', id: await criarProcesso(outra), nome: 'a.pdf', tamanho: 10 } }), alheio);
    assert.equal(alheio.statusCode, 404);

    drive.arquivos.set('qualquerarquivo123', { id: 'qualquerarquivo123', name: 'x', mimeType: 'text/plain' });
    const estranho = resposta();
    await AnexosController.registrar(requisicao({ usuarioId: thamara, body: { drive_arquivo_id: 'qualquerarquivo123' } }), estranho);
    assert.equal(estranho.statusCode, 400);

    const invalido = resposta();
    await AnexosController.listar(requisicao({ usuarioId: thamara, query: { tipo: 'usuario', id: '1' } }), invalido);
    assert.equal(invalido.statusCode, 400);
  });

  it('excluir o anexo manda o arquivo para a lixeira do Drive (recuperável por 30 dias)', async () => {
    const { driveId, anexo } = await anexar('cliente', await criarCliente(thamara));
    const r = resposta();
    await AnexosController.excluir(requisicao({ usuarioId: thamara, params: { id: String(anexo.id) } }), r);
    assert.equal(r.statusCode, 204);
    assert.equal(drive.arquivos.get(driveId)?.trashed, true);
    assert.equal((await todos('SELECT * FROM anexos')).length, 0);
  });

  it('excluir o processo leva junto os anexos dele e dos compromissos dele', async () => {
    const processo = await criarProcesso(thamara);
    const compromisso = await criarCompromisso(thamara, { processo_id: processo });
    const doProcesso = await anexar('processo', processo);
    const doCompromisso = await anexar('compromisso', compromisso);
    const cliente = await criarCliente(thamara);
    await anexar('cliente', cliente);

    const r = resposta();
    await ProcessosController.excluir(requisicao({ usuarioId: thamara, params: { id: String(processo) } }), r);
    assert.equal(r.statusCode, 204);
    assert.equal(drive.arquivos.get(doProcesso.driveId)?.trashed, true);
    assert.equal(drive.arquivos.get(doCompromisso.driveId)?.trashed, true);
    assert.equal((await todos('SELECT * FROM anexos')).length, 1); // o do cliente continua

    await ClientesController.excluir(requisicao({ usuarioId: thamara, params: { id: String(cliente) } }), resposta());
    assert.equal((await todos('SELECT * FROM anexos')).length, 0);
  });

  it('contar(): número de anexos de cada registro', async () => {
    const a = await criarProcesso(thamara);
    const b = await criarProcesso(thamara, { numero: '0009999-11.2026.8.26.0100' });
    await anexar('processo', a);
    await anexar('processo', a, 'b.pdf');
    const mapa = await AnexoModel.contar(thamara, 'processo', [a, b]);
    assert.equal(mapa.get(a), 2);
    assert.equal(mapa.get(b), undefined);
  });
});
