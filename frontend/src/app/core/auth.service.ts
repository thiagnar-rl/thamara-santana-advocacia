import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { primeiroNome } from './logica/painel.logica';
import { RespostaAuth, Usuario } from './models';

const CHAVE_TOKEN = 'ts-advocacia.token';
const CHAVE_USUARIO = 'ts-advocacia.usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  /** Usuário logado (ou null). */
  readonly usuario = signal<Usuario | null>(this.lerUsuarioSalvo());
  readonly logado = computed(() => this.usuario() !== null);
  readonly primeiroNome = computed(() => primeiroNome(this.usuario()?.nome));

  get token(): string | null {
    return localStorage.getItem(CHAVE_TOKEN);
  }

  entrar(email: string, senha: string): Observable<RespostaAuth> {
    return this.http
      .post<RespostaAuth>('/api/auth/login', { email, senha })
      .pipe(tap((r) => this.salvarSessao(r)));
  }

  cadastrar(nome: string, email: string, senha: string): Observable<RespostaAuth> {
    return this.http
      .post<RespostaAuth>('/api/auth/registrar', { nome, email, senha })
      .pipe(tap((r) => this.salvarSessao(r)));
  }

  sair(): void {
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
    this.usuario.set(null);
    this.router.navigate(['/entrar']);
  }

  private salvarSessao(r: RespostaAuth): void {
    localStorage.setItem(CHAVE_TOKEN, r.token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(r.usuario));
    this.usuario.set(r.usuario);
  }

  private lerUsuarioSalvo(): Usuario | null {
    try {
      const salvo = localStorage.getItem(CHAVE_USUARIO);
      return salvo && localStorage.getItem(CHAVE_TOKEN) ? (JSON.parse(salvo) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
