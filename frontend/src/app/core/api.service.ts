import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Compromisso,
  CompromissoForm,
  Dashboard,
  FiltroCompromissos,
  Processo,
  ProcessoDetalhe,
  ProcessoForm,
  StatusCompromisso,
  StatusProcesso,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  /**
   * Muda sempre que algo é salvo/excluído.
   * As telas observam este sinal para recarregar os dados.
   */
  readonly versao = signal(0);

  avisarMudanca(): void {
    this.versao.update((v) => v + 1);
  }

  /* ---------- Painel ---------- */

  dashboard() {
    return this.http.get<Dashboard>(`${this.base}/dashboard`);
  }

  /* ---------- Processos ---------- */

  listarProcessos(busca = '', status: StatusProcesso | null = null) {
    let params = new HttpParams();
    if (busca) params = params.set('busca', busca);
    if (status) params = params.set('status', status);
    return this.http.get<Processo[]>(`${this.base}/processos`, { params });
  }

  obterProcesso(id: number) {
    return this.http.get<ProcessoDetalhe>(`${this.base}/processos/${id}`);
  }

  criarProcesso(dados: ProcessoForm) {
    return this.http.post<Processo>(`${this.base}/processos`, dados);
  }

  atualizarProcesso(id: number, dados: ProcessoForm) {
    return this.http.put<Processo>(`${this.base}/processos/${id}`, dados);
  }

  excluirProcesso(id: number) {
    return this.http.delete<void>(`${this.base}/processos/${id}`);
  }

  /* ---------- Compromissos ---------- */

  listarCompromissos(filtro: FiltroCompromissos = {}) {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor !== null && valor !== undefined && valor !== '') {
        params = params.set(chave, String(valor));
      }
    }
    return this.http.get<Compromisso[]>(`${this.base}/compromissos`, { params });
  }

  criarCompromisso(dados: CompromissoForm) {
    return this.http.post<Compromisso>(`${this.base}/compromissos`, dados);
  }

  atualizarCompromisso(id: number, dados: CompromissoForm) {
    return this.http.put<Compromisso>(`${this.base}/compromissos/${id}`, dados);
  }

  alterarStatus(id: number, status: StatusCompromisso) {
    return this.http.patch<Compromisso>(`${this.base}/compromissos/${id}/status`, { status });
  }

  excluirCompromisso(id: number) {
    return this.http.delete<void>(`${this.base}/compromissos/${id}`);
  }
}
