import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { AvisoService } from './aviso.service';
import { ConfirmacaoService } from './confirmacao.service';
import { mensagemDeErro } from './auth.interceptor';
import { Cliente, Compromisso, Processo } from './models';

export interface EdicaoCompromisso {
  compromisso: Compromisso | null; // null = novo
  processoId: number | null; // pré-seleciona um processo
  data: string | null; // pré-seleciona uma data
}

export interface EdicaoProcesso {
  processo: Processo | null; // null = novo
  /** [F6] Pré-seleciona um cliente cadastrado (ex.: "Novo processo" na ficha do cliente). */
  cliente?: Pick<Cliente, 'id' | 'nome'> | null;
}

/** [F6] Formulário de cliente. Solicitado por Thamara Santana (30/10/2026). */
export interface EdicaoCliente {
  cliente: Cliente | null; // null = novo
  /** Nome já digitado em outro formulário (ex.: no processo). */
  nomeSugerido?: string | null;
  /** Chamado depois de salvar (ex.: o formulário de processo já seleciona o cliente novo). */
  aoSalvar?: (cliente: Cliente) => void;
}

/**
 * Centraliza a abertura dos formulários (modais) e as ações
 * rápidas de concluir / excluir, para que qualquer tela possa usá-las.
 */
@Injectable({ providedIn: 'root' })
export class EdicaoService {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  private router = inject(Router);
  private confirmacao = inject(ConfirmacaoService);

  readonly compromisso = signal<EdicaoCompromisso | null>(null);
  readonly processo = signal<EdicaoProcesso | null>(null);
  readonly cliente = signal<EdicaoCliente | null>(null); // [F6]

  /** Algum formulário está aberto? (usado na confirmação de saída — [C2]) */
  formularioAberto(): boolean {
    return !!(this.compromisso() || this.processo() || this.cliente());
  }

  novoCompromisso(opcoes: { processoId?: number | null; data?: string | null } = {}): void {
    this.compromisso.set({
      compromisso: null,
      processoId: opcoes.processoId ?? null,
      data: opcoes.data ?? null,
    });
  }

  editarCompromisso(c: Compromisso): void {
    this.compromisso.set({ compromisso: c, processoId: c.processo_id, data: c.data });
  }

  novoProcesso(opcoes: { cliente?: Pick<Cliente, 'id' | 'nome'> | null } = {}): void {
    this.processo.set({ processo: null, cliente: opcoes.cliente ?? null });
  }

  /* ---------- [F6] Clientes ---------- */

  novoCliente(opcoes: Omit<EdicaoCliente, 'cliente'> = {}): void {
    this.cliente.set({ cliente: null, ...opcoes });
  }

  editarCliente(c: Cliente): void {
    this.cliente.set({ cliente: c });
  }

  async excluirCliente(c: Cliente): Promise<void> {
    const processos = c.total_processos;
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir cliente?',
      mensagem: `O cadastro de ${c.nome} será excluído definitivamente.`,
      detalhe: processos
        ? `${processos === 1 ? 'O processo vinculado continua' : `Os ${processos} processos vinculados continuam`} cadastrado${processos === 1 ? '' : 's'}, apenas sem o vínculo com este cliente.`
        : undefined,
      botao: 'Excluir cliente',
    });
    if (!sim) return;
    this.api.excluirCliente(c.id).subscribe({
      next: () => {
        this.avisos.sucesso('Cliente excluído');
        this.router.navigate(['/clientes']).then(() => this.api.avisarMudanca());
      },
      error: (e) => this.avisos.erro(mensagemDeErro(e)),
    });
  }

  editarProcesso(p: Processo): void {
    this.processo.set({ processo: p });
  }

  alternarStatus(c: Compromisso): void {
    const novo = c.status === 'pendente' ? 'concluido' : 'pendente';
    this.api.alterarStatus(c.id, novo).subscribe({
      next: () => {
        this.avisos.sucesso(novo === 'concluido' ? 'Compromisso concluído' : 'Marcado como pendente');
        this.api.avisarMudanca();
      },
      error: (e) => this.avisos.erro(mensagemDeErro(e)),
    });
  }

  async excluirCompromisso(c: Compromisso): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir compromisso?',
      mensagem: `"${c.titulo}" será removido da agenda. Esta ação não pode ser desfeita.`,
    });
    if (!sim) return;
    this.api.excluirCompromisso(c.id).subscribe({
      next: () => {
        this.avisos.sucesso('Compromisso excluído');
        this.api.avisarMudanca();
      },
      error: (e) => this.avisos.erro(mensagemDeErro(e)),
    });
  }

  async excluirProcesso(p: Processo): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir processo?',
      mensagem: `O processo ${p.numero} (${p.cliente}) será excluído definitivamente.`,
      detalhe: 'Todos os compromissos vinculados a este processo também serão apagados.',
      botao: 'Excluir processo',
    });
    if (!sim) return;
    this.api.excluirProcesso(p.id).subscribe({
      next: () => {
        this.avisos.sucesso('Processo excluído');
        this.router.navigate(['/processos']).then(() => this.api.avisarMudanca());
      },
      error: (e) => this.avisos.erro(mensagemDeErro(e)),
    });
  }
}
