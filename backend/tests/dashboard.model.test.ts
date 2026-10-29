import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { criarCompromisso, criarProcesso, criarUsuario, novoBanco } from './helpers';
import { DashboardModel } from '../src/models/dashboard.model';

const HOJE = '2026-10-28';

describe('(await DashboardModel.montar())', () => {
  let ana: number;

  beforeEach(async () => {
    await novoBanco();
    ana = await criarUsuario();
    await criarProcesso(ana, { numero: '1', status: 'ativo' });
    await criarProcesso(ana, { numero: '2', status: 'ativo' });
    await criarProcesso(ana, { numero: '3', status: 'arquivado' });

    await criarCompromisso(ana, { tipo: 'audiencia', data: HOJE, hora: '14:00', titulo: 'Hoje tarde' });
    await criarCompromisso(ana, { tipo: 'manifestacao', data: HOJE, hora: '09:00', titulo: 'Hoje manhã' });
    await criarCompromisso(ana, { tipo: 'despacho', data: HOJE, titulo: 'Hoje feito', status: 'concluido' });
    await criarCompromisso(ana, { tipo: 'recurso', data: '2026-10-30', titulo: 'Sexta' });
    await criarCompromisso(ana, { tipo: 'audiencia', data: '2026-11-04', titulo: 'Daqui 7 dias' });
    await criarCompromisso(ana, { tipo: 'audiencia', data: '2026-11-05', titulo: 'Daqui 8 dias' });
    await criarCompromisso(ana, { tipo: 'despacho', data: '2026-10-22', titulo: 'Atrasado' });
  });

  it('calcula os números do resumo', async () => {
    const { resumo } = await DashboardModel.montar(ana, HOJE);
    assert.deepEqual(resumo, { processosAtivos: 2, hoje: 2, semana: 2, atrasados: 1, concluidosMes: 1 });
  });

  it('lista hoje com pendentes primeiro e por hora', async () => {
    const { hoje } = await DashboardModel.montar(ana, HOJE);
    assert.deepEqual(hoje.map((c) => c.titulo), ['Hoje manhã', 'Hoje tarde', 'Hoje feito']);
  });

  it('próximos 7 dias não incluem hoje nem o 8º dia', async () => {
    const { proximos } = await DashboardModel.montar(ana, HOJE);
    assert.deepEqual(proximos.map((c) => c.titulo), ['Sexta', 'Daqui 7 dias']);
  });

  it('conta pendências por tipo a partir de hoje', async () => {
    const { porTipo } = await DashboardModel.montar(ana, HOJE);
    assert.deepEqual(porTipo, { audiencia: 3, recurso: 1, manifestacao: 1, despacho: 0 });
  });

  it('usuária sem dados recebe tudo zerado', async () => {
    const outra = await criarUsuario('nova@teste.com');
    const d = await DashboardModel.montar(outra, HOJE);
    assert.equal(d.resumo.hoje + d.resumo.semana + d.resumo.atrasados, 0);
    assert.equal(d.hoje.length, 0);
  });
});
