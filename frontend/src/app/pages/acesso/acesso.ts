import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { requisitosSenha, validarAcesso } from '../../core/logica/formularios.logica';
import { Icone } from '../../shared/icone/icone';

/** Tela de login e de criação de conta (o "modo" vem da rota). */
@Component({
  selector: 'app-acesso',
  imports: [FormsModule, RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acesso.html',
  styleUrl: './acesso.scss',
})
export class AcessoPage {
  private auth = inject(AuthService);
  private router = inject(Router);

  /** Preenchido automaticamente pelo "data" da rota. */
  readonly modo = input<'entrar' | 'cadastro'>('entrar');
  protected readonly cadastro = computed(() => this.modo() === 'cadastro');

  protected nome = '';
  protected email = '';
  protected senha = '';

  protected readonly requisitosSenha = requisitosSenha; // [C3]
  protected readonly mostrarSenha = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');

  protected enviar(): void {
    const erro = validarAcesso(this.modo(), { nome: this.nome, email: this.email, senha: this.senha });
    this.erro.set(erro ?? '');
    if (erro) return;

    this.enviando.set(true);
    const requisicao = this.cadastro()
      ? this.auth.cadastrar(this.nome, this.email, this.senha)
      : this.auth.entrar(this.email, this.senha);

    requisicao.subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.enviando.set(false);
      },
    });
  }
}
