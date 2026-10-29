import { DadosPainel } from '../models/dashboard.model';
import { compromissosView } from './compromisso.view';

/** VIEW — Painel do dia. */
export function dashboardView(d: DadosPainel) {
  return {
    resumo: { ...d.resumo },
    hoje: compromissosView(d.hoje),
    proximos: compromissosView(d.proximos),
    atrasados: compromissosView(d.atrasados),
    porTipo: { ...d.porTipo },
  };
}
