import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Envia o token em toda requisição e desloga se a sessão expirar. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  const requisicao = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requisicao).pipe(
    catchError((erro: HttpErrorResponse) => {
      if (erro.status === 401 && token) auth.sair();
      return throwError(() => erro);
    }),
  );
};

/** Extrai a mensagem de erro enviada pela API. */
export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof HttpErrorResponse) {
    if (erro.status === 0) return 'Não foi possível conectar ao servidor. A API está rodando?';
    const corpo = erro.error as { erro?: string } | null;
    if (corpo?.erro) return corpo.erro;
  }
  return 'Algo deu errado. Tente novamente.';
}
