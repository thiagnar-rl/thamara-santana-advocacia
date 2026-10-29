import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Só deixa entrar quem está logado. */
export const exigeLogin: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.logado() ? true : router.createUrlTree(['/entrar']);
};

/** Quem já está logado não precisa ver a tela de login. */
export const somenteVisitante: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.logado() ? router.createUrlTree(['/inicio']) : true;
};
