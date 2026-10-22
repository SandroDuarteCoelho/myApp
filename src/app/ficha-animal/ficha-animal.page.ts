
import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import {
  Directory,
  Filesystem
} from '@capacitor/filesystem';
import {
  AlertController,
  IonicModule,
  ToastController
} from '@ionic/angular';

interface Animal {
  id: string;
  nome: string;
  foto?: string;
}

interface OpcaoEscala {
  valor: number;
  nome: string;
  descricao?: string;
}

interface Indicador {
  id: string;
  titulo: string;
  pergunta: string;
  orientacao?: string;
  criterios: Record<string, string>;
}

interface IntervaloResultado {
  minimo: number;
  maximo: number;
  estado: string;
  titulo: string;
  orientacao: string;
}

interface RegistoAvaliacao {
  id: string;
  animalId: string;
  data: string;
  total: number;
  estado: string;
  tituloEstado: string;
  pontuacoes: Record<string, number>;
  observacoes: string;
}

interface ConfiguracaoAvaliacao {
  escala?: {
    maximo?: number;
    opcoes?: OpcaoEscala[];
  };
  indicadores?: Indicador[];
  resultado?: {
    pontuacaoMaxima?: number;
    intervalos?: IntervaloResultado[];
  };
  sinaisAlerta?: {
    itens?: string[];
    acao?: string;
  };
}

interface FotoIndexedDB {
  dataUrl: string;
  mimeType: string;
}

@Component({
  selector: 'app-ficha-animal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HttpClientModule
  ],
  templateUrl: './ficha-animal.page.html',
  styleUrls: ['./ficha-animal.page.scss']
})
export class FichaAnimalPage {
  @ViewChild('inputFoto') inputFoto!: ElementRef<HTMLInputElement>;

  private readonly CHAVE_ANIMAIS = 'qualidade_vida_animais_v1';
  private readonly CHAVE_HISTORICO = 'avaliacao_animal_historico_v1';

  private readonly NOME_BD_FOTOS = 'fotos_animais_v1';
  private readonly NOME_TABELA_FOTOS = 'fotos';

  id = '';
  nome = '';

  // foto é apenas a imagem apresentada no ecrã.
  // A referência persistente fica em fotoReferencia.
  foto = '';
  private fotoReferencia = '';

  avaliacaoAberta = false;
  historicoAberto = false;
  reflexaoAberta = false;

  aCarregar = true;
  aGuardar = false;
  erroConfiguracao = '';

  indicadores: Indicador[] = [];
  opcoesEscala: OpcaoEscala[] = [];
  intervalosResultado: IntervaloResultado[] = [];

  pontuacoes: Record<string, number> = {};
  observacoes = '';

  pontuacaoMaxima = 15;
  sinaisAlerta: string[] = [];
  mensagemAlerta = '';

  animais: Animal[] = [];
  historico: RegistoAvaliacao[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id') ?? '';
      this.carregarAnimal();
      this.carregarHistorico();
    });

    this.carregarConfiguracao();
  }

  // --------------------------------------------------
  // CÁLCULOS DA AVALIAÇÃO
  // --------------------------------------------------

  get pontuacaoTotal(): number {
    return this.indicadores.reduce((total, indicador) => {
      return total + (this.pontuacoes[indicador.id] ?? 0);
    }, 0);
  }

  get avaliacaoCompleta(): boolean {
    return this.indicadores.length > 0 &&
      this.indicadores.every(indicador => {
        const valor = this.pontuacoes[indicador.id];
        return Number.isInteger(valor) && valor >= 0 && valor <= 3;
      });
  }

  get percentagemResultado(): number {
    if (this.pontuacaoMaxima <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((this.pontuacaoTotal / this.pontuacaoMaxima) * 100)
    );
  }

  get resultadoAtual(): IntervaloResultado {
    const resultado = this.intervalosResultado.find(intervalo =>
      this.pontuacaoTotal >= intervalo.minimo &&
      this.pontuacaoTotal <= intervalo.maximo
    );

    return resultado ?? {
      minimo: 0,
      maximo: this.pontuacaoMaxima,
      estado: 'pendente',
      titulo: 'Por avaliar',
      orientacao: 'Preenche os indicadores para obter uma orientação.'
    };
  }

  voltar(): void {
    this.router.navigate(['/qualidade-vida']);
  }

  // --------------------------------------------------
  // EDITAR NOME DO ANIMAL
  // --------------------------------------------------

  async editarNome(): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Editar nome',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          value: this.nome,
          placeholder: 'Nome do animal',
          attributes: {
            maxlength: 80,
            autocapitalize: 'words'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (dados) => {
            const novoNome = String(dados?.nome ?? '').trim();

            if (!novoNome) {
              await this.mostrarMensagem(
                'Introduz um nome para o animal.'
              );
              return false;
            }

            const nomeAnterior = this.nome;
            this.nome = novoNome;

            const guardou = this.guardarDadosAnimal();

            if (!guardou) {
              this.nome = nomeAnterior;
              return false;
            }

            await this.mostrarMensagem('Nome atualizado.');
            return true;
          }
        }
      ]
    });

    await alerta.present();
  }

  // --------------------------------------------------
  // FOTOGRAFIA
  // --------------------------------------------------

  selecionarFoto(): void {
    this.inputFoto?.nativeElement.click();
  }

  async aoSelecionarFoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const ficheiro = input.files?.[0];

    if (!ficheiro) {
      return;
    }

    if (!ficheiro.type.startsWith('image/')) {
      await this.mostrarMensagem(
        'Seleciona um ficheiro de imagem válido.'
      );
      input.value = '';
      return;
    }

    if (ficheiro.size > 2 * 1024 * 1024) {
      await this.mostrarMensagem(
        'A fotografia deve ter, no máximo, 2 MB.'
      );
      input.value = '';
      return;
    }

    try {
      const dataUrl = await this.lerFicheiroComoDataUrl(ficheiro);

      // A imagem é guardada fora do localStorage.
      await this.guardarFotoDataUrl(dataUrl, ficheiro.type);

      await this.mostrarMensagem('Fotografia guardada.');
    } catch (erro) {
      console.error('Erro ao guardar fotografia:', erro);

      await this.mostrarMensagem(
        'Não foi possível guardar a fotografia. Verifica o espaço disponível.'
      );
    } finally {
      input.value = '';
    }
  }

  private lerFicheiroComoDataUrl(ficheiro: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const leitor = new FileReader();

      leitor.onload = () => {
        if (typeof leitor.result === 'string') {
          resolve(leitor.result);
        } else {
          reject(new Error('Formato de imagem inválido.'));
        }
      };

      leitor.onerror = () => {
        reject(new Error('Não foi possível ler a imagem.'));
      };

      leitor.readAsDataURL(ficheiro);
    });
  }

  private async guardarFotoDataUrl(
    dataUrl: string,
    mimeOriginal?: string
  ): Promise<void> {
    const separador = dataUrl.indexOf(',');

    if (separador < 0) {
      throw new Error('Dados da imagem inválidos.');
    }

    const cabecalho = dataUrl.substring(0, separador);
    const base64 = dataUrl.substring(separador + 1);

    const mime = mimeOriginal ||
      cabecalho.match(/^data:(.*?);base64/i)?.[1] ||
      'image/jpeg';

    const extensao = this.obterExtensao(mime);
    const idSeguro = this.id.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (!idSeguro) {
      throw new Error('Não foi possível identificar o animal.');
    }

    let novaReferencia: string;

    if (Capacitor.isNativePlatform()) {
      const caminho = `animal-photos/${idSeguro}.${extensao}`;

      await Filesystem.writeFile({
        path: caminho,
        data: base64,
        directory: Directory.Data,
        recursive: true
      });

      novaReferencia = `fs:${caminho}|${mime}`;
    } else {
      const chave = `animal:${this.id}`;

      await this.guardarFotoIndexedDB(chave, {
        dataUrl,
        mimeType: mime
      });

      novaReferencia = `idb:${chave}|${mime}`;
    }

    const referenciaAnterior = this.fotoReferencia;
    this.fotoReferencia = novaReferencia;

    if (!this.guardarDadosAnimal()) {
      this.fotoReferencia = referenciaAnterior;
      throw new Error('Não foi possível guardar os dados do animal.');
    }

    this.foto = dataUrl;
  }

  private obterExtensao(mime: string): string {
    switch (mime.toLowerCase()) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/gif':
        return 'gif';
      case 'image/heic':
        return 'heic';
      case 'image/heif':
        return 'heif';
      default:
        return 'jpg';
    }
  }

  private async carregarAnimal(): Promise<void> {
    try {
      const dados = localStorage.getItem(this.CHAVE_ANIMAIS);
      const guardados: unknown = dados ? JSON.parse(dados) : [];

      if (!Array.isArray(guardados)) {
        this.animais = [];
        this.nome = '';
        this.foto = '';
        this.fotoReferencia = '';
        return;
      }

      this.animais = guardados as Animal[];

      const animal = this.animais.find(item => item.id === this.id);

      this.nome = animal?.nome ?? '';
      this.foto = '';
      this.fotoReferencia = '';

      if (!animal?.foto) {
        return;
      }

      // Migração automática das fotografias antigas em Base64.
      if (animal.foto.startsWith('data:image/')) {
        try {
          const referenciaAntiga = animal.foto;
          const mime = referenciaAntiga.match(/^data:(.*?);base64/i)?.[1]
            ?? 'image/jpeg';

          await this.guardarFotoDataUrl(referenciaAntiga, mime);
        } catch (erro) {
          console.error('Não foi possível migrar a fotografia antiga:', erro);

          // Mantém a imagem visível nesta sessão se a migração falhar.
          this.foto = animal.foto;
          await this.mostrarMensagem(
            'A fotografia antiga ainda não foi transferida para o novo armazenamento.'
          );
        }

        return;
      }

      this.fotoReferencia = animal.foto;
      this.foto = await this.lerFotoGuardada(animal.foto);
    } catch (erro) {
      console.error('Erro ao carregar animal:', erro);
      this.animais = [];
      this.nome = '';
      this.foto = '';
      this.fotoReferencia = '';
    }
  }

  private async lerFotoGuardada(referencia: string): Promise<string> {
    if (referencia.startsWith('fs:')) {
      const conteudo = referencia.substring(3);
      const separador = conteudo.lastIndexOf('|');

      if (separador < 0) {
        return '';
      }

      const caminho = conteudo.substring(0, separador);
      const mime = conteudo.substring(separador + 1);

      const resultado = await Filesystem.readFile({
        path: caminho,
        directory: Directory.Data
      });

      if (typeof resultado.data !== 'string') {
        return '';
      }

      return `data:${mime};base64,${resultado.data}`;
    }

    if (referencia.startsWith('idb:')) {
      const conteudo = referencia.substring(4);
      const separador = conteudo.lastIndexOf('|');
      const chave = separador >= 0
        ? conteudo.substring(0, separador)
        : conteudo;

      const registo = await this.lerFotoIndexedDB(chave);
      return registo?.dataUrl ?? '';
    }

    // Caminho desconhecido ou formato antigo não suportado.
    return '';
  }

  private guardarDadosAnimal(): boolean {
    const indice = this.animais.findIndex(item => item.id === this.id);

    if (indice < 0) {
      return false;
    }

    const animalAtualizado: Animal = {
      ...this.animais[indice],
      nome: this.nome
    };

    if (this.fotoReferencia) {
      animalAtualizado.foto = this.fotoReferencia;
    } else {
      delete animalAtualizado.foto;
    }

    const listaAtualizada = [...this.animais];
    listaAtualizada[indice] = animalAtualizado;

    try {
      localStorage.setItem(
        this.CHAVE_ANIMAIS,
        JSON.stringify(listaAtualizada)
      );

      this.animais = listaAtualizada;
      return true;
    } catch (erro) {
      console.error('Erro ao guardar dados do animal:', erro);
      void this.mostrarMensagem(
        'Não foi possível guardar os dados do animal.'
      );
      return false;
    }
  }

  async limparFoto(event?: Event): Promise<void> {
    event?.stopPropagation();

    const referenciaAnterior = this.fotoReferencia;

    this.foto = '';
    this.fotoReferencia = '';

    if (!this.guardarDadosAnimal()) {
      this.fotoReferencia = referenciaAnterior;
      this.foto = await this.lerFotoGuardada(referenciaAnterior);
      return;
    }

    try {
      await this.apagarFotoGuardada(referenciaAnterior);
    } catch (erro) {
      // A foto já deixou de estar associada ao animal.
      // Uma eventual cópia física que não seja apagada não afeta o histórico.
      console.warn('Não foi possível apagar o ficheiro antigo:', erro);
    }

    await this.mostrarMensagem('Fotografia removida.');
  }

  private async apagarFotoGuardada(referencia: string): Promise<void> {
    if (!referencia) {
      return;
    }

    if (referencia.startsWith('fs:')) {
      const conteudo = referencia.substring(3);
      const separador = conteudo.lastIndexOf('|');
      const caminho = separador >= 0
        ? conteudo.substring(0, separador)
        : conteudo;

      await Filesystem.deleteFile({
        path: caminho,
        directory: Directory.Data
      });

      return;
    }

    if (referencia.startsWith('idb:')) {
      const conteudo = referencia.substring(4);
      const separador = conteudo.lastIndexOf('|');
      const chave = separador >= 0
        ? conteudo.substring(0, separador)
        : conteudo;

      await this.apagarFotoIndexedDB(chave);
    }
  }

  // --------------------------------------------------
  // INDEXEDDB: ARMAZENAMENTO DE FOTOGRAFIAS NO NAVEGADOR
  // --------------------------------------------------

  private abrirBaseDadosFotos(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB não está disponível neste navegador.'));
        return;
      }

      const pedido = window.indexedDB.open(this.NOME_BD_FOTOS, 1);

      pedido.onupgradeneeded = () => {
        const bd = pedido.result;

        if (!bd.objectStoreNames.contains(this.NOME_TABELA_FOTOS)) {
          bd.createObjectStore(this.NOME_TABELA_FOTOS);
        }
      };

      pedido.onsuccess = () => resolve(pedido.result);
      pedido.onerror = () => reject(pedido.error);
    });
  }

  private async guardarFotoIndexedDB(
    chave: string,
    foto: FotoIndexedDB
  ): Promise<void> {
    const bd = await this.abrirBaseDadosFotos();

    try {
      await new Promise<void>((resolve, reject) => {
        const transacao = bd.transaction(
          this.NOME_TABELA_FOTOS,
          'readwrite'
        );

        transacao.objectStore(this.NOME_TABELA_FOTOS).put(foto, chave);

        transacao.oncomplete = () => resolve();
        transacao.onerror = () => reject(transacao.error);
        transacao.onabort = () => reject(transacao.error);
      });
    } finally {
      bd.close();
    }
  }

  private async lerFotoIndexedDB(
    chave: string
  ): Promise<FotoIndexedDB | undefined> {
    const bd = await this.abrirBaseDadosFotos();

    try {
      return await new Promise<FotoIndexedDB | undefined>((resolve, reject) => {
        const transacao = bd.transaction(
          this.NOME_TABELA_FOTOS,
          'readonly'
        );

        const pedido = transacao.objectStore(this.NOME_TABELA_FOTOS).get(chave);

        pedido.onsuccess = () => {
          resolve(pedido.result as FotoIndexedDB | undefined);
        };

        pedido.onerror = () => reject(pedido.error);
      });
    } finally {
      bd.close();
    }
  }

  private async apagarFotoIndexedDB(chave: string): Promise<void> {
    const bd = await this.abrirBaseDadosFotos();

    try {
      await new Promise<void>((resolve, reject) => {
        const transacao = bd.transaction(
          this.NOME_TABELA_FOTOS,
          'readwrite'
        );

        transacao.objectStore(this.NOME_TABELA_FOTOS).delete(chave);

        transacao.oncomplete = () => resolve();
        transacao.onerror = () => reject(transacao.error);
        transacao.onabort = () => reject(transacao.error);
      });
    } finally {
      bd.close();
    }
  }

  // --------------------------------------------------
  // CARREGAR JSON DA AVALIAÇÃO
  // --------------------------------------------------

  private carregarConfiguracao(): void {
    this.http
      .get<ConfiguracaoAvaliacao>('assets/data/avaliacao-animal.json')
      .subscribe({
        next: config => {
          this.indicadores = config.indicadores ?? [];

          this.opcoesEscala = config.escala?.opcoes ?? [
            { valor: 0, nome: 'Muito comprometido' },
            { valor: 1, nome: 'Comprometido' },
            { valor: 2, nome: 'Razoável' },
            { valor: 3, nome: 'Favorável' }
          ];

          this.pontuacaoMaxima =
            config.resultado?.pontuacaoMaxima ??
            this.indicadores.length * 3;

          this.intervalosResultado = config.resultado?.intervalos ?? [];
          this.sinaisAlerta = config.sinaisAlerta?.itens ?? [];

          this.mensagemAlerta =
            config.sinaisAlerta?.acao ??
            'Contacta um serviço veterinário se existir algum sinal grave.';

          this.aCarregar = false;
          this.erroConfiguracao = '';
        },
        error: () => {
          this.aCarregar = false;
          this.erroConfiguracao =
            'Não foi possível carregar os indicadores. Confirma se avaliacao-animal.json existe em assets/data.';
        }
      });
  }

  // --------------------------------------------------
  // PONTUAÇÕES
  // --------------------------------------------------

  selecionarPontuacao(indicadorId: string, valor: number): void {
    this.pontuacoes = {
      ...this.pontuacoes,
      [indicadorId]: valor
    };
  }

  obterCriterio(indicador: Indicador, valor: number): string {
    return indicador.criterios?.[String(valor)] ?? '';
  }

  // --------------------------------------------------
  // NOVA AVALIAÇÃO
  // --------------------------------------------------

  async novaAvaliacao(): Promise<void> {
    const temDados =
      Object.keys(this.pontuacoes).length > 0 ||
      this.observacoes.trim().length > 0;

    if (temDados) {
      const alerta = await this.alertController.create({
        header: 'Começar nova avaliação?',
        message:
          'As pontuações e observações atuais serão limpas do formulário. As avaliações já guardadas no histórico não serão apagadas.',
        buttons: [
          {
            text: 'Continuar a preencher',
            role: 'cancel'
          },
          {
            text: 'Começar em branco',
            role: 'destructive',
            handler: () => {
              this.limparFormulario();
            }
          }
        ]
      });

      await alerta.present();
      return;
    }

    this.limparFormulario();
    await this.mostrarMensagem('Formulário pronto para uma nova avaliação.');
  }

  private limparFormulario(): void {
    this.pontuacoes = {};
    this.observacoes = '';
    this.avaliacaoAberta = true;
  }

  // --------------------------------------------------
  // GUARDAR AVALIAÇÃO
  // --------------------------------------------------

  async guardarAvaliacao(): Promise<void> {
    if (!this.avaliacaoCompleta || this.aGuardar) {
      return;
    }

    this.aGuardar = true;

    const novoRegisto: RegistoAvaliacao = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      animalId: this.id,
      data: new Date().toISOString(),
      total: this.pontuacaoTotal,
      estado: this.resultadoAtual.estado,
      tituloEstado: this.resultadoAtual.titulo,
      pontuacoes: { ...this.pontuacoes },
      observacoes: this.observacoes.trim()
    };

    try {
      const dados = localStorage.getItem(this.CHAVE_HISTORICO);
      const registos: RegistoAvaliacao[] = dados ? JSON.parse(dados) : [];

      registos.push(novoRegisto);

      localStorage.setItem(
        this.CHAVE_HISTORICO,
        JSON.stringify(registos)
      );

      this.carregarHistorico();
      this.historicoAberto = true;
      this.limparFormulario();

      await this.mostrarMensagem(
        'Avaliação guardada no histórico deste animal.'
      );
    } catch {
      await this.mostrarMensagem(
        'Não foi possível guardar a avaliação. Verifica o espaço disponível.'
      );
    } finally {
      this.aGuardar = false;
    }
  }

  // --------------------------------------------------
  // HISTÓRICO DO ANIMAL ATUAL
  // --------------------------------------------------

  private carregarHistorico(): void {
    try {
      const dados = localStorage.getItem(this.CHAVE_HISTORICO);
      const registos: unknown = dados ? JSON.parse(dados) : [];

      if (!Array.isArray(registos)) {
        this.historico = [];
        return;
      }

      this.historico = (registos as RegistoAvaliacao[])
        .filter(registo => registo.animalId === this.id)
        .sort((a, b) =>
          new Date(b.data).getTime() - new Date(a.data).getTime()
        );
    } catch {
      this.historico = [];
    }
  }

  alternarHistorico(): void {
    this.historicoAberto = !this.historicoAberto;
  }

  carregarAvaliacao(registo: RegistoAvaliacao): void {
    this.pontuacoes = { ...registo.pontuacoes };
    this.observacoes = registo.observacoes ?? '';
    this.avaliacaoAberta = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  obterPontuacaoHistorica(
    registo: RegistoAvaliacao,
    indicadorId: string
  ): number | string {
    const valor = registo.pontuacoes?.[indicadorId];
    return valor === undefined ? '—' : valor;
  }

  formatarData(data: string): string {
    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return 'Data desconhecida';
    }

    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(dataObj);
  }

  formatarHora(data: string): string {
    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('pt-PT', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(dataObj);
  }

  async confirmarApagarAvaliacao(
    registo: RegistoAvaliacao
  ): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Apagar avaliação',
      message:
        'Queres apagar esta avaliação do histórico? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Apagar',
          role: 'destructive',
          handler: () => {
            this.apagarAvaliacao(registo.id);
          }
        }
      ]
    });

    await alerta.present();
  }

  private apagarAvaliacao(registoId: string): void {
    try {
      const dados = localStorage.getItem(this.CHAVE_HISTORICO);
      const registos: RegistoAvaliacao[] = dados ? JSON.parse(dados) : [];

      const atualizados = registos.filter(
        registo => registo.id !== registoId
      );

      localStorage.setItem(
        this.CHAVE_HISTORICO,
        JSON.stringify(atualizados)
      );

      this.carregarHistorico();
      void this.mostrarMensagem('Avaliação apagada do histórico.');
    } catch {
      void this.mostrarMensagem('Não foi possível apagar a avaliação.');
    }
  }

  // --------------------------------------------------
  // EVOLUÇÃO AO LONGO DO TEMPO
  // --------------------------------------------------

  get historicoCronologico(): RegistoAvaliacao[] {
    return [...this.historico].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );
  }

  get variacaoTotal(): number {
    const lista = this.historicoCronologico;

    if (lista.length < 2) {
      return 0;
    }

    return lista[lista.length - 1].total - lista[0].total;
  }

  get classeVariacao(): string {
    if (this.variacaoTotal > 0) return 'variacao-positiva';
    if (this.variacaoTotal < 0) return 'variacao-negativa';
    return 'variacao-estavel';
  }

  get textoVariacao(): string {
    if (this.variacaoTotal > 0) return 'Pontuação aumentou';
    if (this.variacaoTotal < 0) return 'Pontuação diminuiu';
    return 'Sem variação global';
  }

  get dadosGrafico(): {
    x: number;
    y: number;
    total: number;
    dataCurta: string;
  }[] {
    const lista = this.historicoCronologico;

    if (lista.length < 2) {
      return [];
    }

    const larguraUtil = 260;
    const xInicial = 45;

    return lista.map((registo, indice) => {
      const x = xInicial + indice * larguraUtil / (lista.length - 1);
      const total = Math.max(0, Math.min(15, registo.total));
      const y = 145 - (total / 15) * 120;

      return {
        x,
        y,
        total,
        dataCurta: this.formatarDataCurta(registo.data)
      };
    });
  }

  get pontosGrafico(): string {
    return this.dadosGrafico
      .map(ponto => `${ponto.x},${ponto.y}`)
      .join(' ');
  }

  formatarDataCurta(data: string): string {
    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return '—';
    }

    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit'
    }).format(dataObj);
  }

  iconeTendencia(indicadorId: string): string {
    const lista = this.historicoCronologico;

    if (lista.length < 2) {
      return 'remove-outline';
    }

    const primeiro = lista[0].pontuacoes?.[indicadorId];
    const ultimo = lista[lista.length - 1].pontuacoes?.[indicadorId];

    if (primeiro === undefined || ultimo === undefined) {
      return 'help-outline';
    }

    if (ultimo > primeiro) return 'arrow-up-outline';
    if (ultimo < primeiro) return 'arrow-down-outline';

    return 'remove-outline';
  }

  classeTendencia(indicadorId: string): string {
    const lista = this.historicoCronologico;

    if (lista.length < 2) return 'tendencia-estavel';

    const primeiro = lista[0].pontuacoes?.[indicadorId];
    const ultimo = lista[lista.length - 1].pontuacoes?.[indicadorId];

    if (primeiro === undefined || ultimo === undefined) {
      return 'tendencia-desconhecida';
    }

    if (ultimo > primeiro) return 'tendencia-positiva';
    if (ultimo < primeiro) return 'tendencia-negativa';

    return 'tendencia-estavel';
  }

  // --------------------------------------------------
  // MENSAGENS
  // --------------------------------------------------

  private async mostrarMensagem(mensagem: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 2500,
      position: 'bottom'
    });

    await toast.present();
  }
}
