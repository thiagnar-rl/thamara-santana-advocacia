import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { mensagemDeErro } from '../../core/auth.interceptor';
import { AvisoService } from '../../core/aviso.service';
import { ConfirmacaoService } from '../../core/confirmacao.service';
import { GoogleService } from '../../core/google.service';
import { dataDoAnexo, problemaNoArquivo, tamanhoLegivel, tipoDoArquivo } from '../../core/logica/anexos.logica';
import { Anexo, DonoAnexo } from '../../core/models';
import { Icone } from '../icone/icone';

/**
 * [F1] Documentos anexados (guardados no Google Drive) de um cliente, processo ou compromisso.
 * Solicitado por Thamara Santana (cliente) (04/11/2026).
 *
 * O arquivo vai do navegador DIRETO para o Drive (o servidor só abre o envio e depois registra),
 * por isso arquivos grandes não passam pela Vercel.
 */
@Component({
  selector: 'app-anexos',
  imports: [Icone],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './anexos.html',
  styleUrl: './anexos.scss',
})
export class Anexos {
  private api = inject(ApiService);
  private avisos = inject(AvisoService);
  private confirmacao = inject(ConfirmacaoService);
  protected google = inject(GoogleService);

  readonly tipo = input.required<DonoAnexo>();
  readonly donoId = input.required<number>();
  /** Avisa a tela quando a lista muda (a ficha usa na impressão). */
  readonly mudou = output<Anexo[]>();

  protected readonly lista = signal<Anexo[]>([]);
  protected readonly carregando = signal(true);
  protected readonly enviando = signal<{ nome: string; progresso: number } | null>(null);

  protected readonly tamanho = tamanhoLegivel;
  protected readonly tipoArquivo = tipoDoArquivo;
  protected readonly data = dataDoAnexo;

  constructor() {
    effect(() => {
      const tipo = this.tipo();
      const id = this.donoId();
      untracked(() => this.carregar(tipo, id));
    });
  }

  private carregar(tipo: DonoAnexo, id: number): void {
    this.carregando.set(true);
    this.api.listarAnexos(tipo, id).subscribe({
      next: (l) => this.definir(l),
      error: () => this.definir([]),
    });
  }

  private definir(lista: Anexo[]): void {
    this.lista.set(lista);
    this.carregando.set(false);
    this.mudou.emit(lista);
  }

  protected async escolher(evento: Event): Promise<void> {
    const campo = evento.target as HTMLInputElement;
    const arquivos = Array.from(campo.files ?? []);
    campo.value = '';
    for (const arquivo of arquivos) {
      const problema = problemaNoArquivo(arquivo);
      if (problema) {
        this.avisos.erro(problema);
        continue;
      }
      try {
        await this.enviar(arquivo);
      } catch (erro) {
        this.avisos.erro(typeof erro === 'string' ? erro : mensagemDeErro(erro));
        break;
      }
    }
    this.enviando.set(null);
  }

  /** 1) o servidor abre o envio no Drive; 2) o navegador manda o arquivo; 3) o servidor registra. */
  private async enviar(arquivo: File): Promise<void> {
    this.enviando.set({ nome: arquivo.name, progresso: 0 });
    const { url } = await new Promise<{ url: string }>((ok, falha) =>
      this.api.iniciarEnvioDeAnexo(this.tipo(), this.donoId(), arquivo).subscribe({ next: ok, error: falha }),
    );
    const driveId = await new Promise<string>((ok, falha) => {
      // XMLHttpRequest direto (sem o interceptor do sistema): mostra o progresso e não manda o login do sistema ao Google
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', arquivo.type || 'application/octet-stream');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) this.enviando.set({ nome: arquivo.name, progresso: Math.round((e.loaded / e.total) * 100) });
      };
      xhr.onload = () => {
        try {
          const id = (JSON.parse(xhr.responseText) as { id?: string }).id;
          if (xhr.status < 300 && id) ok(id);
          else falha(`O Google Drive recusou "${arquivo.name}" (erro ${xhr.status}).`);
        } catch {
          falha(`O Google Drive recusou "${arquivo.name}".`);
        }
      };
      xhr.onerror = () => falha(`Falha de conexão ao enviar "${arquivo.name}". Tente de novo.`);
      xhr.send(arquivo);
    });
    const anexo = await new Promise<Anexo>((ok, falha) => this.api.registrarAnexo(driveId).subscribe({ next: ok, error: falha }));
    this.definir([anexo, ...this.lista().filter((a) => a.id !== anexo.id)]);
    this.avisos.sucesso(`"${anexo.nome}" anexado.`);
  }

  protected async excluir(anexo: Anexo): Promise<void> {
    const sim = await this.confirmacao.perguntar({
      titulo: 'Excluir este documento?',
      mensagem: `"${anexo.nome}" sai do sistema e vai para a lixeira do Google Drive.`,
      detalhe: 'Na lixeira do Drive ele pode ser recuperado por 30 dias.',
      botao: 'Excluir',
      icone: 'lixeira',
      tom: 'perigo',
    });
    if (!sim) return;
    this.api.excluirAnexo(anexo.id).subscribe({
      next: () => {
        this.definir(this.lista().filter((a) => a.id !== anexo.id));
        this.avisos.sucesso('Documento excluído.');
      },
      error: (e) => this.avisos.erro(mensagemDeErro(e)),
    });
  }
}
