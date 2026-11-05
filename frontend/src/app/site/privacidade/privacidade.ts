import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../../shared/icone/icone';
import { CONTATO, ESCRITORIO } from '../conteudo';
import { ATUALIZADA_EM, POLITICA } from './politica';

/**
 * Página "Política de Privacidade" (/privacidade).
 * [F9] Solicitado por: Thamara Santana (cliente), pedido de 05/11/2026.
 */
@Component({
  selector: 'app-privacidade-site',
  imports: [RouterLink, Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacidade.html',
  styleUrl: './privacidade.scss',
})
export class PrivacidadeSite {
  protected readonly secoes = POLITICA;
  protected readonly atualizadaEm = ATUALIZADA_EM;
  protected readonly escritorio = ESCRITORIO;
  protected readonly email = CONTATO.email;
}
