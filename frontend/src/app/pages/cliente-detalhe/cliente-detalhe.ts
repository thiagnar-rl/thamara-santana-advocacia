import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { EdicaoService } from '../../core/edicao.service';
import {
  aniversarioProximo,
  enderecoCompleto,
  linkWhatsApp,
  textoAniversario,
} from '../../core/logica/clientes.logica';
import { iniciais, primeiroNome } from '../../core/logica/painel.logica';
import { ClienteDetalhe } from '../../core/models';
import { dataCurta, dataRelativa, rotuloStatusProcesso } from '../../core/rotulos';
import { Icone } from '../../shared/icone/icone';

/**
 * CONTROLLER da ficha do cliente (VIEW: cliente-detalhe.html + .scss).
 * [F6] Solicitado por: Thamara Santana (teste de usuário de 30/10/2026).
 */
@Component({
  selector: 'app-cliente-detalhe',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cliente-detalhe.html',
  styleUrl: './cliente-detalhe.scss',
})
export class ClienteDetalhePage {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  private router = inject(Router);
  protected edicao = inject(EdicaoService);

  /** Vem da URL: /clientes/:id */
  readonly id = input.required<string>();

  protected readonly detalhe = signal<ClienteDetalhe | null>(null);
  protected readonly dataCurta = dataCurta;
  protected readonly dataRelativa = dataRelativa;
  protected readonly rotuloStatus = rotuloStatusProcesso;
  protected readonly textoAniversario = textoAniversario;
  protected readonly aniversarioProximo = aniversarioProximo;
  protected readonly iniciais = iniciais;

  protected readonly endereco = computed(() => {
    const c = this.detalhe()?.cliente;
    return c ? enderecoCompleto(c) : '';
  });

  /** Link do WhatsApp (com parabéns se o aniversário estiver próximo). */
  protected readonly whatsapp = computed(() => {
    const c = this.detalhe()?.cliente;
    if (!c) return null;
    const nome = c.tipo === 'juridica' ? c.representante_nome || c.nome : c.nome;
    const mensagem = aniversarioProximo(c.aniversario, 0)
      ? `Olá, ${primeiroNome(nome)}! A equipe Thamara Santana Advocacia deseja um feliz aniversário! 🎉`
      : undefined;
    return linkWhatsApp(c.whatsapp || c.celular, mensagem);
  });

  protected readonly mapa = computed(() => {
    const e = this.endereco();
    return e ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e)}` : null;
  });

  constructor() {
    effect(() => {
      this.api.versao();
      const id = Number(this.id());
      untracked(() => this.carregar(id));
    });
  }

  private carregar(id: number): void {
    this.api.obterCliente(id).subscribe({
      next: (d) => this.detalhe.set(d),
      error: (e) => {
        if (e instanceof HttpErrorResponse && e.status === 404) {
          this.router.navigate(['/clientes']);
          return;
        }
        this.avisos.erro(mensagemDeErro(e));
      },
    });
  }
}
