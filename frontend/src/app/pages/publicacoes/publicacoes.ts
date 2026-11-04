import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { contagem, dataCurta, validarPublicacao } from '../../core/logica/site.logica';
import { Publicacao, PublicacaoForm } from '../../core/models';
import { Icone } from '../../shared/icone/icone';

/** Áreas de atuação (as mesmas do site). */
const AREAS = [
  { chave: 'familia', nome: 'Família, Patrimônio e Sucessões' },
  { chave: 'previdenciario', nome: 'Previdenciário' },
  { chave: 'trabalhista', nome: 'Trabalhista' },
  { chave: 'consumidor', nome: 'Consumidor' },
  { chave: 'criminal', nome: 'Criminal' },
];

function formularioVazio(): PublicacaoForm {
  return { titulo: '', resumo: '', conteudo: '', area: 'familia', publicada: true };
}

/**
 * Tela "Publicações": a advogada escreve notícias e artigos que aparecem na aba Notícias do site.
 * [F7] Solicitado por: Thiago Rinaldi Luna (04/11/2026).
 */
@Component({
  selector: 'app-publicacoes',
  imports: [FormsModule, RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './publicacoes.html',
  styleUrl: './publicacoes.scss',
  host: { '(document:keydown.escape)': 'fecharEditor()' },
})
export class PublicacoesPage {
  private api = inject(ApiService);
  private aviso = inject(AvisoService);
  private confirmacao = inject(ConfirmacaoService);

  protected readonly areas = AREAS;
  protected readonly dataCurta = dataCurta;

  protected readonly lista = signal<Publicacao[]>([]);
  protected readonly apareceNoSite = signal(true);
  protected readonly carregando = signal(true);

  /** Publicação em edição (null = editor fechado; id null = nova). */
  protected readonly editando = signal<{ id: number | null; dados: PublicacaoForm } | null>(null);
  protected readonly erro = signal<string | null>(null);
  protected readonly salvando = signal(false);

  protected readonly publicadas = computed(() => this.lista().filter((p) => p.publicada).length);

  constructor() {
    this.carregar();
  }

  protected carregar(): void {
    this.api.listarPublicacoes().subscribe({
      next: (r) => {
        this.lista.set(r.publicacoes);
        this.apareceNoSite.set(r.aparece_no_site);
        this.carregando.set(false);
      },
      error: (e) => {
        this.carregando.set(false);
        this.aviso.erro(mensagemDeErro(e));
      },
    });
  }

  protected nova(): void {
    this.erro.set(null);
    this.editando.set({ id: null, dados: formularioVazio() });
  }

  protected editar(p: Publicacao): void {
    this.erro.set(null);
    this.editando.set({
      id: p.id,
      dados: { titulo: p.titulo, resumo: p.resumo ?? '', conteudo: p.conteudo, area: p.area, publicada: p.publicada },
    });
  }

  protected fecharEditor(): void {
    if (!this.salvando()) this.editando.set(null);
  }

  protected contar(texto: string | null, limite: number) {
    return contagem(texto, limite);
  }

  protected salvar(): void {
    const atual = this.editando();
    if (!atual) return;
    const dados: PublicacaoForm = {
      ...atual.dados,
      titulo: atual.dados.titulo.trim(),
      resumo: atual.dados.resumo?.trim() || null,
      area: atual.dados.area || null,
    };
    const problema = validarPublicacao(dados);
    if (problema) {
      this.erro.set(problema);
      return;
    }
    this.salvando.set(true);
    const pedido = atual.id ? this.api.atualizarPublicacao(atual.id, dados) : this.api.criarPublicacao(dados);
    pedido.subscribe({
      next: (salva) => {
        this.salvando.set(false);
        this.editando.set(null);
        this.aviso.sucesso(salva.publicada ? 'Publicação salva e visível no site.' : 'Rascunho salvo.');
        this.carregar();
      },
      error: (e) => {
        this.salvando.set(false);
        this.erro.set(mensagemDeErro(e));
      },
    });
  }

  protected async excluir(p: Publicacao): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir publicação?',
      mensagem: `"${p.titulo}" será apagada${p.publicada ? ' e sairá do site' : ''}.`,
      detalhe: 'Esta ação não pode ser desfeita.',
    });
    if (!sim) return;
    this.api.excluirPublicacao(p.id).subscribe({
      next: () => {
        this.aviso.sucesso('Publicação excluída.');
        this.carregar();
      },
      error: (e) => this.aviso.erro(mensagemDeErro(e)),
    });
  }
}
