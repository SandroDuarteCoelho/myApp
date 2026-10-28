
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  AlertController,
  IonicModule,
  ToastController
} from '@ionic/angular';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  brushOutline,
  cameraOutline,
  musicalNotesOutline,
  infiniteOutline,
  colorPaletteOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  chevronDownOutline,
  chevronUpOutline,
  timeOutline,
  attachOutline,
  documentAttachOutline,
  saveOutline,
  refreshOutline
} from 'ionicons/icons';

// =========================================================
// TIPOS E INTERFACES
// =========================================================

type TipoReflexao = 'diaria' | 'semanal' | 'mensal' | 'anual';

type TipoExpressaoArtistica =
  | 'desenho'
  | 'fotografia'
  | 'audio'
  | 'livre';

interface Pergunta {
  id: string;
  texto: string;
}

interface Grupo {
  titulo: string;
  perguntas: Pergunta[];
}

interface Campo {
  id: string;
  rotulo: string;
  pergunta: string;
}

interface Definicao {
  titulo: string;
  subtitulo: string;
  perguntaInicial: string;
  duracao: string;
  introducao: string;
  grupos: Grupo[];
  reflexoes: Campo[];
  encerramento?: string;
}

interface Configuracao {
  versao: number;
  tipos: Record<TipoReflexao, Definicao>;
}

interface ExpressaoArtisticaGuardada {
  tipo: TipoExpressaoArtistica;
  ficheiroId?: string;
  nomeFicheiro?: string;
  nota: string;
}

interface ExpressaoArtisticaAtual {
  aberta: boolean;
  tipo: TipoExpressaoArtistica | '';
  ficheiroId?: string;
  nomeFicheiro?: string;
  nota: string;
}

interface Registo {
  id: string;
  tipo: TipoReflexao;
  data: string;
  guardadoEm: string;
  respostas: Record<string, boolean>;
  reflexoes: Record<string, string>;
  assinaladas: number;
  totalPerguntas: number;
  percentagem: number;
  expressoesArtisticas?: Record<string, ExpressaoArtisticaGuardada>;
}

interface FicheiroHistorico {
  perguntaId: string;
  expressao: ExpressaoArtisticaGuardada;
  url?: string;
  tipoMime: string;
  imagem: boolean;
  audio: boolean;
  indisponivel: boolean;
}

interface ExpressaoHistorica {
  perguntaId: string;
  perguntaTexto: string;
  expressao: ExpressaoArtisticaGuardada;
}

// =========================================================
// COMPONENTE
// =========================================================

@Component({
  selector: 'app-reflexao',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    HttpClientModule
  ],
  templateUrl: './reflexao.page.html',
  styleUrls: ['./reflexao.page.scss']
})
export class ReflexaoPage implements OnInit, OnDestroy {

  tipo: TipoReflexao = 'diaria';

  definicao?: Definicao;

  carregado = false;
  aGuardar = false;

  respostas: Record<string, boolean> = {};
  reflexoes: Record<string, string> = {};

  registos: Registo[] = [];

  expressoesArtisticas: Record<string, ExpressaoArtisticaAtual> = {};

  // ID do registo que está aberto no histórico.
  registoAbertoId: string | null = null;

  // Ficheiros associados a cada registo histórico.
  ficheirosHistoricos: Record<string, FicheiroHistorico[]> = {};

  aCarregarFicheirosHistorico: Record<string, boolean> = {};

  // Mantidos públicos porque o HTML utiliza router e route.
  constructor(
    public route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      'brush-outline': brushOutline,
      'camera-outline': cameraOutline,
      'musical-notes-outline': musicalNotesOutline,
      'infinite-outline': infiniteOutline,
      'color-palette-outline': colorPaletteOutline,
      'checkmark-circle': checkmarkCircle,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-up-outline': chevronUpOutline,
      'time-outline': timeOutline,
      'attach-outline': attachOutline,
      'document-attach-outline': documentAttachOutline,
      'save-outline': saveOutline,
      'refresh-outline': refreshOutline,
      'attach': attachOutline
    });
  }

  private readonly CHAVE_HISTORICO =
    'qualidade_vida_reflexoes_historico_v1';

  private readonly tiposValidos: TipoReflexao[] = [
    'diaria',
    'semanal',
    'mensal',
    'anual'
  ];

  private readonly NOME_BASE_DADOS =
    'qualidade_vida_criacoes_artisticas_v1';

  private readonly NOME_ARMAZENAMENTO = 'ficheiros';

  private readonly TAMANHO_MAXIMO_FICHEIRO =
    50 * 1024 * 1024;

  private readonly urlsCriados = new Set<string>();

  private subscricaoRota?: Subscription;

  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  ngOnInit(): void {
    this.subscricaoRota = this.route.queryParamMap.subscribe(params => {
      const valor = params.get('tipo');

      const novoTipo: TipoReflexao =
        this.tiposValidos.includes(valor as TipoReflexao)
          ? valor as TipoReflexao
          : 'diaria';

      if (this.tipo !== novoTipo || !this.definicao) {
        this.tipo = novoTipo;
        this.registoAbertoId = null;
        this.limparUrlsHistorico();
        this.carregarDefinicoes();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscricaoRota?.unsubscribe();
    this.limparUrlsHistorico();
  }

  private carregarDefinicoes(): void {
    this.carregado = false;

    this.http
      .get<Configuracao>('assets/data/reflexoes.json')
      .subscribe({
        next: config => {
          const definicao = config?.tipos?.[this.tipo];

          if (!definicao) {
            this.definicao = undefined;
            this.carregado = true;

            void this.mostrarToast(
              'Não foi encontrada a definição deste tipo de reflexão.'
            );

            return;
          }

          this.definicao = definicao;
          this.respostas = {};
          this.reflexoes = {};
          this.expressoesArtisticas = {};

          this.carregarHistorico();
          this.carregado = true;
        },

        error: erro => {
          console.error(
            'Não foi possível carregar reflexoes.json:',
            erro
          );

          this.definicao = undefined;
          this.carregado = true;

          void this.mostrarToast(
            'Não foi possível carregar as perguntas. Confirma se existe assets/data/reflexoes.json.'
          );
        }
      });
  }

  // =========================================================
  // ESTATÍSTICAS
  // =========================================================

  get totalPerguntas(): number {
    if (!this.definicao) {
      return 0;
    }

    return this.definicao.grupos.reduce(
      (soma, grupo) => soma + grupo.perguntas.length,
      0
    );
  }

  get totalAssinaladas(): number {
    return Object.values(this.respostas)
      .filter(valor => valor === true)
      .length;
  }

  get percentagemAtual(): number {
    if (!this.totalPerguntas) {
      return 0;
    }

    return Math.round(
      (this.totalAssinaladas / this.totalPerguntas) * 100
    );
  }

  get registosOrdenados(): Registo[] {
    return [...this.registos].sort((a, b) => {
      const comparacaoData = b.data.localeCompare(a.data);

      if (comparacaoData !== 0) {
        return comparacaoData;
      }

      return b.guardadoEm.localeCompare(a.guardadoEm);
    });
  }

  get percentagemUltimoRegisto(): number | null {
    const lista = this.registosOrdenados;
    return lista.length ? lista[0].percentagem : null;
  }

  get diferencaPercentual(): number | null {
    const lista = this.registosOrdenados;

    if (lista.length < 2) {
      return null;
    }

    return lista[0].percentagem - lista[1].percentagem;
  }

  // =========================================================
  // HISTÓRICO E LOCALSTORAGE
  // =========================================================

  private carregarHistorico(): void {
    try {
      const raw = localStorage.getItem(this.CHAVE_HISTORICO);
      const todos: unknown = raw ? JSON.parse(raw) : [];

      this.registos = Array.isArray(todos)
        ? (todos as Registo[]).filter(
            registo => registo && registo.tipo === this.tipo
          )
        : [];
    } catch (erro) {
      console.error('Não foi possível carregar o histórico:', erro);
      this.registos = [];
    }
  }

  private lerTodosOsRegistos(): Registo[] {
    try {
      const raw = localStorage.getItem(this.CHAVE_HISTORICO);
      const dados: unknown = raw ? JSON.parse(raw) : [];

      return Array.isArray(dados) ? dados as Registo[] : [];
    } catch (erro) {
      console.error('Não foi possível ler os registos:', erro);
      return [];
    }
  }

  private guardarTodosOsRegistos(registos: Registo[]): void {
    localStorage.setItem(
      this.CHAVE_HISTORICO,
      JSON.stringify(registos)
    );
  }

  // =========================================================
  // RESPOSTAS E REFLEXÕES ESCRITAS
  // =========================================================

  alterarResposta(id: string, assinalada: boolean): void {
    this.respostas = {
      ...this.respostas,
      [id]: assinalada
    };
  }

  alterarReflexao(
    id: string,
    valor: string | null | undefined
  ): void {
    this.reflexoes = {
      ...this.reflexoes,
      [id]: valor ?? ''
    };
  }

  temReflexoesGuardadas(registo: Registo): boolean {
    return this.obterReflexoesRegisto(registo).length > 0;
  }

  obterReflexoesRegisto(
    registo: Registo
  ): { rotulo: string; texto: string }[] {
    if (!this.definicao) {
      return [];
    }

    return (this.definicao.reflexoes || [])
      .map(campo => ({
        rotulo: campo.rotulo,
        texto: (registo.reflexoes?.[campo.id] || '').trim()
      }))
      .filter(campo => !!campo.texto);
  }

  // =========================================================
  // EXPRESSÃO ARTÍSTICA DURANTE A REFLEXÃO
  // =========================================================

  obterExpressao(perguntaId: string): ExpressaoArtisticaAtual {
    if (!this.expressoesArtisticas[perguntaId]) {
      this.expressoesArtisticas[perguntaId] = {
        aberta: false,
        tipo: '',
        nota: ''
      };
    }

    return this.expressoesArtisticas[perguntaId];
  }

  alternarExpressaoArtistica(perguntaId: string): void {
    const expressao = this.obterExpressao(perguntaId);

    this.expressoesArtisticas = {
      ...this.expressoesArtisticas,
      [perguntaId]: {
        ...expressao,
        aberta: !expressao.aberta
      }
    };
  }

  alterarTipoExpressaoArtistica(
    perguntaId: string,
    valor: string | null | undefined
  ): void {
    const tipos: TipoExpressaoArtistica[] = [
      'desenho',
      'fotografia',
      'audio',
      'livre'
    ];

    const tipo: TipoExpressaoArtistica | '' =
      tipos.includes(valor as TipoExpressaoArtistica)
        ? valor as TipoExpressaoArtistica
        : '';

    const atual = this.obterExpressao(perguntaId);

    this.expressoesArtisticas = {
      ...this.expressoesArtisticas,
      [perguntaId]: { ...atual, tipo }
    };
  }

  alterarNotaArtistica(
    perguntaId: string,
    valor: string | null | undefined
  ): void {
    const atual = this.obterExpressao(perguntaId);

    this.expressoesArtisticas = {
      ...this.expressoesArtisticas,
      [perguntaId]: {
        ...atual,
        nota: valor ?? ''
      }
    };
  }

  async selecionarFicheiroArtistico(
    perguntaId: string
  ): Promise<void> {
    const expressao = this.obterExpressao(perguntaId);

    if (!expressao.tipo) {
      await this.mostrarToast(
        'Escolhe primeiro o tipo de expressão artística.'
      );
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';

    switch (expressao.tipo) {
      case 'desenho':
      case 'fotografia':
        input.accept = 'image/*';
        break;

      case 'audio':
        input.accept = 'audio/*';
        break;

      case 'livre':
        input.accept = 'image/*,audio/*,text/plain,application/pdf';
        break;
    }

    input.onchange = () => {
      const ficheiro = input.files?.[0];

      if (ficheiro) {
        void this.processarFicheiroArtistico(perguntaId, ficheiro);
      }
    };

    input.click();
  }

  private async processarFicheiroArtistico(
    perguntaId: string,
    ficheiro: File
  ): Promise<void> {
    if (ficheiro.size > this.TAMANHO_MAXIMO_FICHEIRO) {
      await this.mostrarToast('O ficheiro excede o limite de 50 MB.');
      return;
    }

    const expressao = this.obterExpressao(perguntaId);
    const ficheiroAnterior = expressao.ficheiroId;
    const ficheiroId = this.criarId();

    try {
      await this.guardarFicheiroIndexedDB(ficheiroId, ficheiro);

      this.expressoesArtisticas = {
        ...this.expressoesArtisticas,
        [perguntaId]: {
          ...expressao,
          aberta: true,
          ficheiroId,
          nomeFicheiro: ficheiro.name
        }
      };

      if (ficheiroAnterior) {
        await this.eliminarFicheiroIndexedDB(ficheiroAnterior);
      }

      await this.mostrarToast('Criação artística associada à pergunta.');
    } catch (erro) {
      console.error('Erro ao guardar o ficheiro artístico:', erro);

      await this.mostrarToast(
        'Não foi possível guardar o ficheiro. Tenta novamente.'
      );
    }
  }

  // =========================================================
  // INDEXEDDB
  // =========================================================

  private abrirBaseDadosArtistica(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB não está disponível.'));
        return;
      }

      const pedido = indexedDB.open(this.NOME_BASE_DADOS, 1);

      pedido.onupgradeneeded = () => {
        const baseDados = pedido.result;

        if (!baseDados.objectStoreNames.contains(this.NOME_ARMAZENAMENTO)) {
          baseDados.createObjectStore(this.NOME_ARMAZENAMENTO);
        }
      };

      pedido.onsuccess = () => resolve(pedido.result);

      pedido.onerror = () => reject(
        pedido.error ?? new Error('Não foi possível abrir a base de dados.')
      );
    });
  }

  private async guardarFicheiroIndexedDB(
    id: string,
    ficheiro: File
  ): Promise<void> {
    const baseDados = await this.abrirBaseDadosArtistica();

    try {
      await new Promise<void>((resolve, reject) => {
        const transacao = baseDados.transaction(
          this.NOME_ARMAZENAMENTO,
          'readwrite'
        );

        transacao.objectStore(this.NOME_ARMAZENAMENTO).put(ficheiro, id);

        transacao.oncomplete = () => resolve();

        transacao.onerror = () => reject(
          transacao.error ?? new Error('Erro ao guardar o ficheiro.')
        );

        transacao.onabort = () => reject(
          transacao.error ?? new Error('Gravação interrompida.')
        );
      });
    } finally {
      baseDados.close();
    }
  }

  private async lerFicheiroIndexedDB(
    id: string
  ): Promise<Blob | undefined> {
    const baseDados = await this.abrirBaseDadosArtistica();

    try {
      return await new Promise<Blob | undefined>((resolve, reject) => {
        const transacao = baseDados.transaction(
          this.NOME_ARMAZENAMENTO,
          'readonly'
        );

        const pedido = transacao.objectStore(this.NOME_ARMAZENAMENTO).get(id);

        pedido.onsuccess = () => {
          resolve(pedido.result as Blob | undefined);
        };

        pedido.onerror = () => reject(
          pedido.error ?? new Error('Não foi possível ler o ficheiro.')
        );
      });
    } finally {
      baseDados.close();
    }
  }

  private async eliminarFicheiroIndexedDB(id: string): Promise<void> {
    const baseDados = await this.abrirBaseDadosArtistica();

    try {
      await new Promise<void>((resolve, reject) => {
        const transacao = baseDados.transaction(
          this.NOME_ARMAZENAMENTO,
          'readwrite'
        );

        transacao.objectStore(this.NOME_ARMAZENAMENTO).delete(id);

        transacao.oncomplete = () => resolve();

        transacao.onerror = () => reject(
          transacao.error ?? new Error('Não foi possível eliminar o ficheiro.')
        );
      });
    } finally {
      baseDados.close();
    }
  }

  // =========================================================
  // GUARDAR A AVALIAÇÃO
  // =========================================================

  private obterExpressoesParaGuardar():
    Record<string, ExpressaoArtisticaGuardada> {
    const guardadas: Record<string, ExpressaoArtisticaGuardada> = {};

    for (const perguntaId of Object.keys(this.expressoesArtisticas)) {
      const expressao = this.expressoesArtisticas[perguntaId];

      const temFicheiro = !!expressao.ficheiroId;
      const nota = expressao.nota.trim();

      if (!expressao.tipo || (!temFicheiro && !nota)) {
        continue;
      }

      guardadas[perguntaId] = {
        tipo: expressao.tipo,
        ...(expressao.ficheiroId
          ? { ficheiroId: expressao.ficheiroId }
          : {}),
        ...(expressao.nomeFicheiro
          ? { nomeFicheiro: expressao.nomeFicheiro }
          : {}),
        nota
      };
    }

    return guardadas;
  }

  async guardarAvaliacao(): Promise<void> {
    if (!this.definicao || this.aGuardar) {
      return;
    }

    const agora = new Date();
    const total = this.totalPerguntas;
    const assinaladas = this.totalAssinaladas;
    const expressoes = this.obterExpressoesParaGuardar();

    const registo: Registo = {
      id: this.criarId(),
      tipo: this.tipo,
      data: this.dataLocalISO(agora),
      guardadoEm: agora.toISOString(),
      respostas: { ...this.respostas },
      reflexoes: { ...this.reflexoes },
      assinaladas,
      totalPerguntas: total,
      percentagem: total
        ? Math.round((assinaladas / total) * 100)
        : 0,
      ...(Object.keys(expressoes).length
        ? { expressoesArtisticas: expressoes }
        : {})
    };

    this.aGuardar = true;

    try {
      const historico = this.lerTodosOsRegistos();
      historico.push(registo);

      this.guardarTodosOsRegistos(historico);
      this.carregarHistorico();

      this.respostas = {};
      this.reflexoes = {};
      this.expressoesArtisticas = {};

      await this.mostrarToast('Reflexão guardada no histórico.');
    } catch (erro) {
      console.error('Não foi possível guardar a reflexão:', erro);

      await this.mostrarToast(
        'Não foi possível guardar. Verifica o armazenamento disponível.'
      );
    } finally {
      this.aGuardar = false;
    }
  }

  // =========================================================
  // LIMPAR FORMULÁRIO
  // =========================================================

  async limparFormulario(): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Limpar esta sessão?',
      message:
        'As respostas e reflexões ainda não guardadas serão apagadas. Os registos anteriores serão mantidos.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Limpar',
          role: 'destructive',
          handler: () => {
            this.respostas = {};
            this.reflexoes = {};
            this.expressoesArtisticas = {};
          }
        }
      ]
    });

    await alerta.present();
  }

  // =========================================================
  // HISTÓRICO: ABRIR E FECHAR DETALHES
  // =========================================================

  async verRegisto(registo: Registo): Promise<void> {
    // Se o registo já estiver aberto, fecha-o.
    if (this.registoAbertoId === registo.id) {
      this.registoAbertoId = null;
      this.limparUrlsHistorico();
      return;
    }

    // Liberta os recursos do registo anteriormente aberto.
    this.limparUrlsHistorico();

    // Atualiza o estado usado pelo *ngIf do HTML.
    this.registoAbertoId = registo.id;

    // Carrega os ficheiros artísticos associados.
    await this.carregarFicheirosDoRegisto(registo);
  }

  obterExpressoesDoRegisto(registo: Registo): ExpressaoHistorica[] {
    const expressoes = registo.expressoesArtisticas || {};

    return Object.entries(expressoes).map(([perguntaId, expressao]) => ({
      perguntaId,
      perguntaTexto: this.obterTextoPergunta(perguntaId),
      expressao
    }));
  }

  nomeTipoArte(tipo: TipoExpressaoArtistica): string {
    switch (tipo) {
      case 'desenho':
        return 'Desenho';

      case 'fotografia':
        return 'Fotografia';

      case 'audio':
        return 'Áudio ou música';

      case 'livre':
        return 'Outra expressão';

      default:
        return 'Expressão artística';
    }
  }

  obterTextoPergunta(perguntaId: string): string {
    if (!this.definicao) {
      return perguntaId;
    }

    for (const grupo of this.definicao.grupos) {
      const pergunta = grupo.perguntas.find(
        item => item.id === perguntaId
      );

      if (pergunta) {
        return pergunta.texto;
      }
    }

    return perguntaId;
  }

  obterGrupoPergunta(perguntaId: string): string {
    if (!this.definicao) {
      return '';
    }

    for (const grupo of this.definicao.grupos) {
      if (grupo.perguntas.some(item => item.id === perguntaId)) {
        return grupo.titulo;
      }
    }

    return '';
  }

  obterRespostaRegisto(
    registo: Registo,
    perguntaId: string
  ): boolean {
    return registo.respostas?.[perguntaId] === true;
  }

  // =========================================================
  // CARREGAR FICHEIROS ARTÍSTICOS DO HISTÓRICO
  // =========================================================

  private async carregarFicheirosDoRegisto(
    registo: Registo
  ): Promise<void> {
    const expressoes = registo.expressoesArtisticas || {};
    const lista: FicheiroHistorico[] = [];

    this.aCarregarFicheirosHistorico = {
      ...this.aCarregarFicheirosHistorico,
      [registo.id]: true
    };

    try {
      for (const [perguntaId, expressao] of Object.entries(expressoes)) {
        if (!expressao.ficheiroId) {
          continue;
        }

        const item: FicheiroHistorico = {
          perguntaId,
          expressao,
          tipoMime: '',
          imagem: false,
          audio: false,
          indisponivel: false
        };

        try {
          const blob = await this.lerFicheiroIndexedDB(
            expressao.ficheiroId
          );

          if (!blob) {
            item.indisponivel = true;
            lista.push(item);
            continue;
          }

          const url = URL.createObjectURL(blob);
          this.urlsCriados.add(url);

          const mime = blob.type || '';

          item.url = url;
          item.tipoMime = mime;
          item.imagem = mime.startsWith('image/');
          item.audio = mime.startsWith('audio/');

          // Fallback para ficheiros cujo tipo MIME não foi identificado.
          if (!mime && expressao.nomeFicheiro) {
            const nome = expressao.nomeFicheiro.toLowerCase();

            item.imagem = /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(nome);
            item.audio = /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/.test(nome);
          }

          lista.push(item);
        } catch (erro) {
          console.error(
            `Não foi possível carregar o ficheiro ${expressao.nomeFicheiro || expressao.ficheiroId}:`,
            erro
          );

          item.indisponivel = true;
          lista.push(item);
        }
      }

      // Só publica a lista se este registo continuar aberto.
      if (this.registoAbertoId === registo.id) {
        this.ficheirosHistoricos = {
          ...this.ficheirosHistoricos,
          [registo.id]: lista
        };
      }
    } finally {
      this.aCarregarFicheirosHistorico = {
        ...this.aCarregarFicheirosHistorico,
        [registo.id]: false
      };
    }
  }

  descarregarFicheiroHistorico(
    ficheiroId: string | undefined
  ): void {
    if (!ficheiroId) {
      return;
    }

    let ficheiro: FicheiroHistorico | undefined;

for (const lista of Object.values(this.ficheirosHistoricos)) {
  ficheiro = lista.find(
    (item: FicheiroHistorico) =>
      item.expressao.ficheiroId === ficheiroId
  );

  if (ficheiro) {
    break;
  }
}
    if (!ficheiro?.url) {
      void this.mostrarToast('O ficheiro ainda não está disponível.');
      return;
    }

    const link = document.createElement('a');
    link.href = ficheiro.url;
    link.download = ficheiro.expressao.nomeFicheiro || 'criacao-artistica';

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  abrirFicheiroHistorico(
    ficheiroId: string | undefined
  ): void {
    if (!ficheiroId) {
      return;
    }

    let ficheiro: FicheiroHistorico | undefined;

for (const lista of Object.values(this.ficheirosHistoricos)) {
  ficheiro = lista.find(
    (item: FicheiroHistorico) =>
      item.expressao.ficheiroId === ficheiroId
  );

  if (ficheiro) {
    break;
  }
}
    if (!ficheiro?.url) {
      void this.mostrarToast('O ficheiro ainda não está disponível.');
      return;
    }

    const janela = window.open(ficheiro.url, '_blank');

    if (!janela) {
      this.descarregarFicheiroHistorico(ficheiroId);
    }
  }

  private limparUrlsHistorico(): void {
    for (const url of this.urlsCriados) {
      URL.revokeObjectURL(url);
    }

    this.urlsCriados.clear();
    this.ficheirosHistoricos = {};
    this.aCarregarFicheirosHistorico = {};
  }

  // =========================================================
  // ELIMINAR REGISTO
  // =========================================================

  async confirmarEliminarRegisto(id: string): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Eliminar registo?',
      message:
        'Este registo será eliminado do histórico. Esta ação não pode ser anulada.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            void this.eliminarRegisto(id);
          }
        }
      ]
    });

    await alerta.present();
  }

  private async eliminarRegisto(id: string): Promise<void> {
    try {
      const historico = this.lerTodosOsRegistos();
      const restantes = historico.filter(registo => registo.id !== id);

      this.guardarTodosOsRegistos(restantes);
      this.carregarHistorico();

      if (this.registoAbertoId === id) {
        this.registoAbertoId = null;
        this.limparUrlsHistorico();
      }

      await this.limparFicheirosOrfaos(restantes);

      await this.mostrarToast('Registo eliminado.');
    } catch (erro) {
      console.error('Não foi possível eliminar o registo:', erro);

      await this.mostrarToast('Não foi possível eliminar o registo.');
    }
  }

  private async limparFicheirosOrfaos(
    restantes: Registo[]
  ): Promise<void> {
    const idsAindaUsados = new Set<string>();

    for (const registo of restantes) {
      const expressoes = registo.expressoesArtisticas || {};

      for (const expressao of Object.values(expressoes)) {
        if (expressao.ficheiroId) {
          idsAindaUsados.add(expressao.ficheiroId);
        }
      }
    }

    const baseDados = await this.abrirBaseDadosArtistica();

    try {
      await new Promise<void>((resolve, reject) => {
        const transacao = baseDados.transaction(
          this.NOME_ARMAZENAMENTO,
          'readwrite'
        );

        const armazenamento = transacao.objectStore(
          this.NOME_ARMAZENAMENTO
        );

        const pedido = armazenamento.openCursor();

        pedido.onsuccess = () => {
          const cursor = pedido.result;

          if (!cursor) {
            return;
          }

          const idFicheiro = String(cursor.key);

          if (!idsAindaUsados.has(idFicheiro)) {
            cursor.delete();
          }

          cursor.continue();
        };

        pedido.onerror = () => reject(
          pedido.error ?? new Error('Não foi possível verificar os ficheiros.')
        );

        transacao.oncomplete = () => resolve();

        transacao.onerror = () => reject(
          transacao.error ?? new Error('Erro ao limpar ficheiros.')
        );

        transacao.onabort = () => reject(
          transacao.error ?? new Error('Limpeza dos ficheiros interrompida.')
        );
      });
    } finally {
      baseDados.close();
    }
  }

  // =========================================================
  // RESUMO DO REGISTO
  // =========================================================

  resumoReflexoes(registo: Registo): string {
    if (!this.definicao) {
      return '';
    }

    const partes: string[] = [];

    for (const campo of this.definicao.reflexoes || []) {
      const texto = (registo.reflexoes?.[campo.id] || '').trim();

      if (texto) {
        partes.push(texto);
      }
    }

    const expressoes = registo.expressoesArtisticas || {};

    for (const expressao of Object.values(expressoes)) {
      const nota = (expressao.nota || '').trim();

      if (nota) {
        partes.push(nota);
      } else if (expressao.nomeFicheiro) {
        partes.push(`Criação artística: ${expressao.nomeFicheiro}`);
      }
    }

    const texto = partes.join(' · ').replace(/\s+/g, ' ');

    return texto.length > 180
      ? texto.slice(0, 177) + '…'
      : texto;
  }

  // =========================================================
  // DATAS E IDENTIFICADORES
  // =========================================================

  formatarData(data: string): string {
    const partes = data.split('-').map(Number);

    if (
      partes.length !== 3 ||
      partes.some(Number.isNaN)
    ) {
      const dataAlternativa = new Date(data);

      if (Number.isNaN(dataAlternativa.getTime())) {
        return data;
      }

      return new Intl.DateTimeFormat('pt-PT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(dataAlternativa);
    }

    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(
      new Date(partes[0], partes[1] - 1, partes[2])
    );
  }

  private dataLocalISO(data: Date): string {
    return (
      `${data.getFullYear()}-` +
      `${String(data.getMonth() + 1).padStart(2, '0')}-` +
      `${String(data.getDate()).padStart(2, '0')}`
    );
  }

  private criarId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  // =========================================================
  // NAVEGAÇÃO E MENSAGENS
  // =========================================================

  voltar(): void {
    this.router.navigate(['/qualidade-vida']);
  }

  private async mostrarToast(mensagem: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2600,
      position: 'bottom'
    });

    await toast.present();
  }
}
