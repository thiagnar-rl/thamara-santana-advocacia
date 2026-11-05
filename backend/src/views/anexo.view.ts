import { Anexo } from '../models/anexo.model';

/** VIEW — Anexo [F1] (pedido de Thamara Santana (cliente), 04/11/2026). Sem o usuario_id nem o id interno do Drive. */
export interface AnexoJSON {
  id: number;
  dono_tipo: string;
  dono_id: number;
  nome: string;
  tipo_mime: string | null;
  tamanho: number | null;
  link: string | null;
  criado_em: string;
}

export function anexoView(a: Anexo): AnexoJSON {
  return {
    id: Number(a.id),
    dono_tipo: a.dono_tipo,
    dono_id: Number(a.dono_id),
    nome: a.nome,
    tipo_mime: a.tipo_mime ?? null,
    tamanho: a.tamanho === null || a.tamanho === undefined ? null : Number(a.tamanho),
    link: a.link ?? null,
    criado_em: a.criado_em,
  };
}

export function anexosView(lista: Anexo[]): AnexoJSON[] {
  return lista.map(anexoView);
}
