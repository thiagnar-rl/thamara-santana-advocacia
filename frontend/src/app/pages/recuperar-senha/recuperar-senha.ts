import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { requisitosSenha, validarEmail, validarNovaSenha } from '../../core/logica/formularios.logica';
import { Icone } from '../../shared/icone/icone';

/**
 * CONTROLLER das telas "Esqueci minha senha" e "Criar nova senha"
 * (VIEW: recuperar-senha.html + o visual da tela de entrada).
 *
 * [F3] Solicitado por: Thamara Santana (teste de usuário de 30/10/2026) —
 * "Esqueci minha senha" não existia na tela de entrada.
 *
 * - /recuperar-senha            → informa o e-mail e recebe o link
 * - /redefinir-senha?token=...  → abre pelo link do e-mail e cria a nova senha
 */
@Component({
  selector: 'app-recuperar-senha',
  imports: [FormsModule, RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recuperar-senha.html',
  styleUrls: ['../acesso/acesso.scss', './recuperar-senha.scss'],
})
export class RecuperarSenhaPage implements OnInit {
  private auth = inject(AuthService);
  private avisos = inject(AvisoService);
  private router = inject(Router);

  /** Vem do "data" da rota. */
  readonly modo = input<'recuperar' | 'redefinir'>('recuperar');
  /** Vem da URL: ?token= (link do e-mail) e ?email= (já preenchido a partir da tela de entrada). */
  readonly token = input<string>('');
  readonly email = input<string>('');

  protected emailDigitado = '';
  protected senha = '';
  protected confirmacao = '';

  protected readonly requisitosSenha = requisitosSenha; // [C3]
  protected readonly mostrarSenha = signal(false);
  protected readonly enviando = signal(false);
  protected readonly erro = signal('');
  protected readonly linkInvalido = signal(false);
  /** Mensagem de "confira seu e-mail" depois de pedir o link. */
  protected readonly enviado = signal('');

  ngOnInit(): void {
    this.emailDigitado = this.email() ?? '';
  }

  protected pedirLink(): void {
    const erro = validarEmail(this.emailDigitado);
    this.erro.set(erro ?? '');
    if (erro) return;

    this.enviando.set(true);
    this.auth.esqueciSenha(this.emailDigitado.trim()).subscribe({
      next: (r) => {
        this.enviado.set(r.mensagem);
        this.enviando.set(false);
      },
      error: (e) => {
        this.erro.set(mensagemDeErro(e));
        this.enviando.set(false);
      },
    });
  }

  protected pedirDeNovo(): void {
    this.enviado.set('');
    this.erro.set('');
  }

  protected salvarNovaSenha(): void {
    const erro = validarNovaSenha(this.senha, this.confirmacao);
    this.erro.set(erro ?? '');
    if (erro) return;

    this.enviando.set(true);
    this.auth.redefinirSenha(this.token(), this.senha).subscribe({
      next: () => {
        this.avisos.sucesso('Senha alterada! Você já está no sistema.');
        this.router.navigate(['/inicio']);
      },
      error: (e) => {
        const mensagem = mensagemDeErro(e);
        this.erro.set(mensagem);
        this.linkInvalido.set(/link/i.test(mensagem));
        this.enviando.set(false);
      },
    });
  }
}
