
import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  IonicModule,
  ModalController
} from '@ionic/angular';

interface ExpressaoArtistica {
  tipo: string;
  ficheiroId?: string;
  nomeFicheiro?: string;
  nota?: string;
  [chave: string]: unknown;
}

interface ItemArtistico {
  id: string;
  expressao: ExpressaoArtistica;
  url?: string;
  indisponivel?: boolean;
}

@Component({
  selector: 'app-registo-reflexao-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './registo-reflexao-modal.component.html',
  styleUrls: ['./registo-reflexao-modal.component.scss']
})
export class RegistoReflexaoModalComponent
  implements OnInit, OnDestroy {

  @Input() registo: any;
  @Input() definicao: any;

  expressoes: ItemArtistico[] = [];

  private readonly NOME_BD =
    'qualidade_vida_criacoes_artisticas_v1';

  private readonly NOME_STORE = 'ficheiros';

  constructor(
    private readonly modalController: ModalController
  ) {}

  ngOnInit(): void {
    this.prepararExpressoes();
  }

  ngOnDestroy(): void {
    for (const item of this.expressoes) {
      if (item.url?.startsWith('blob:')) {
        URL.revokeObjectURL(item.url);
      }
    }
  }

  fechar(): void {
    void this.modalController.dismiss();
  }

  get grupos(): any[] {
    return this.definicao?.grupos ?? [];
  }

  get camposReflexao(): any[] {
    return this.definicao?.reflexoes ?? [];
  }

  get respostas(): Record<string, boolean> {
    return this.registo?.respostas ?? {};
  }

  get reflexoes(): Record<string, string> {
    return this.registo?.reflexoes ?? {};
  }

  get percentagem(): number {
    const valor = Number(this.registo?.percentagem ?? 0);
    return Number.isFinite(valor)
      ? Math.max(0, Math.min(100, valor))
      : 0;
  }

  get dataFormatada(): string {
    const data = String(this.registo?.data ?? '');
    const partes = data.split('-').map(Number);

    if (
      partes.length !== 3 ||
      partes.some(n => !Number.isFinite(n)) ||
      partes[0] < 1000 ||
      partes[1] < 1 ||
      partes[1] > 12 ||
      partes[2] < 1 ||
      partes[2] > 31
    ) {
      return data || 'Data não disponível';
    }

    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(
      new Date(partes[0], partes[1] - 1, partes[2])
    );
  }

  get temRespostas(): boolean {
    return Object.values(this.respostas).some(Boolean);
  }

  get temReflexoes(): boolean {
    return this.camposReflexao.some(
      campo => this.textoReflexao(campo).length > 0
    );
  }

  get temExpressoes(): boolean {
    return this.expressoes.length > 0;
  }

  textoReflexao(campo: any): string {
    return String(this.reflexoes[campo.id] ?? '').trim();
  }

  tipoLegivel(tipo: string): string {
    const nomes: Record<string, string> = {
      diaria: 'Reflexão diária',
      semanal: 'Reflexão semanal',
      mensal: 'Reflexão mensal',
      anual: 'Reflexão anual'
    };

    return nomes[tipo] ?? 'Reflexão';
  }

  tipoArtisticoLegivel(tipo: string): string {
    const nomes: Record<string, string> = {
      desenho: 'Desenho',
      fotografia: 'Fotografia',
      audio: 'Áudio e música',
      livre: 'Expressão livre'
    };

    return nomes[tipo] ?? 'Expressão artística';
  }

  eImagem(item: ItemArtistico): boolean {
    const nome = item.expressao.nomeFicheiro ?? '';
    const extensao = nome.split('.').pop()?.toLowerCase();

    return [
      'jpg', 'jpeg', 'png', 'webp',
      'gif', 'bmp', 'avif'
    ].includes(extensao ?? '');
  }

  eAudio(item: ItemArtistico): boolean {
    const nome = item.expressao.nomeFicheiro ?? '';
    const extensao = nome.split('.').pop()?.toLowerCase();

    return [
      'mp3', 'wav', 'm4a', 'ogg',
      'aac', 'flac', 'opus'
    ].includes(extensao ?? '') ||
      item.expressao.tipo === 'audio';
  }

  abrirFicheiro(item: ItemArtistico): void {
    if (!item.url) return;

    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  }

  descarregarFicheiro(item: ItemArtistico): void {
    if (!item.url) return;

    const link = document.createElement('a');
    link.href = item.url;
    link.download =
      item.expressao.nomeFicheiro || 'criacao-artistica';

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private prepararExpressoes(): void {
    const guardadas = this.registo?.expressoesArtisticas;

    if (!guardadas || typeof guardadas !== 'object') {
      this.expressoes = [];
      return;
    }

    this.expressoes = Object.entries(guardadas)
      .map(([id, valor]) => ({
        id,
        expressao: valor as ExpressaoArtistica
      }))
      .filter(item => {
        const e = item.expressao;

        return !!e && (
          !!e.tipo ||
          !!e.nota ||
          !!e.ficheiroId ||
          !!e.nomeFicheiro
        );
      });

    for (const item of this.expressoes) {
      if (item.expressao.ficheiroId) {
        void this.carregarFicheiro(item);
      }
    }
  }

  private async carregarFicheiro(
    item: ItemArtistico
  ): Promise<void> {
    const id = item.expressao.ficheiroId;
    if (!id) return;

    let db: IDBDatabase | undefined;

    try {
      db = await this.abrirBaseDados();

      const resultado = await new Promise<any>(
        (resolve, reject) => {
          const transacao = db!.transaction(
            this.NOME_STORE,
            'readonly'
          );

          const pedido = transacao
            .objectStore(this.NOME_STORE)
            .get(id);

          pedido.onsuccess = () => resolve(pedido.result);
          pedido.onerror = () => reject(pedido.error);
        }
      );

      if (!resultado) {
        item.indisponivel = true;
        return;
      }

      /*
       * Compatibilidade com formatos frequentes.
       * A estrutura exata do armazenamento original
       * deve ser confirmada no método que guarda os ficheiros.
       */
      const blob = this.obterBlob(resultado);

      if (blob) {
        item.url = URL.createObjectURL(blob);
        return;
      }

      const url =
        resultado?.url ??
        resultado?.dataUrl ??
        resultado?.dataURL;

      if (typeof url === 'string' && url) {
        item.url = url;
        return;
      }

      item.indisponivel = true;
    } catch (erro) {
      console.error(
        'Não foi possível ler o ficheiro artístico:',
        erro
      );
      item.indisponivel = true;
    } finally {
      db?.close();
    }
  }

  private obterBlob(resultado: any): Blob | null {
    if (resultado instanceof Blob) {
      return resultado;
    }

    const possiveisCampos = [
      'blob',
      'ficheiro',
      'arquivo',
      'conteudo'
    ];

    for (const campo of possiveisCampos) {
      if (resultado?.[campo] instanceof Blob) {
        return resultado[campo] as Blob;
      }
    }

    return null;
  }

  private abrirBaseDados(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      /*
       * Não especificar uma versão evita forçar uma
       * migração da base de dados existente.
       */
      const pedido = indexedDB.open(this.NOME_BD);

      pedido.onsuccess = () => {
        const db = pedido.result;

        if (!db.objectStoreNames.contains(this.NOME_STORE)) {
          db.close();
          reject(
            new Error(
              'A base de dados não contém o arquivo esperado.'
            )
          );
          return;
        }

        resolve(db);
      };

      pedido.onerror = () => reject(pedido.error);
    });
  }
}
