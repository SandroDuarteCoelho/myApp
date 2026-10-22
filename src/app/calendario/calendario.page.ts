import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';

interface DiaSemana {
  nome: string;
  numero: number;
  data: Date;
  eHoje: boolean;
}

interface EventoAgenda {
  texto: string;
  horaFim: string;
}

interface AgendaDia {
  almoco: string;
  jantar: string;
  atividades: {
    [chave: string]: string | EventoAgenda;
  };
}

type PessoaAgenda = 'sandro' | 'joana';

interface ProdutoCompra {
  id: number;
  nome: string;
  categoria: string;
  loja: string;
  preco: number | null;
  selecionado: boolean;
}

interface FormularioCompra {
  nome: string;
  categoria: string;
  loja: string;
  preco: number | null;
}

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons
  ]
})
export class CalendarioPage implements OnInit {

  // --------------------------------------------------
  // CALENDÁRIO ORIGINAL
  // --------------------------------------------------

  dataReferencia: Date = new Date();
  diasSemana: DiaSemana[] = [];
  tituloMes = '';
  periodoSemana = '';
  textoSemana = '';

  diaSelecionado: Date | null = null;
  dataSelecionadaTexto = '';
  agendaAtual: AgendaDia = this.novaAgenda();

  readonly horas: string[] = Array.from(
    { length: 29 },
    (_, indice) => {
      const minutos = 7 * 60 + indice * 30;
      const hora = Math.floor(minutos / 60);
      const minuto = minutos % 60;

      return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    }
  );

  eventoModalAberto = false;
  eventoPessoa: PessoaAgenda = 'sandro';
  eventoHora = '07:00';
  eventoHoraFim = '07:30';
  eventoTexto = '';
  mensagemEvento = '';

  private eventoOrigemChave = '';
  eventoOrigemTexto = '';

  private readonly chaveArmazenamento = 'calendario_agenda_v1';
  private backButtonSubscription?: Subscription;

  private readonly nomesDias = [
    'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'
  ];

  // --------------------------------------------------
  // LISTA DE COMPRAS
  // --------------------------------------------------

  readonly categoriasCompras: string[] = [
    'Peixaria',
    'Legumes',
    'Fruta',
    'Padaria',
    'Congelados',
    'Despensa',
    'Limpeza',
    'Animal',
    'Outros'
  ];

  private readonly chaveListaCompras = 'calendario_lista_compras_v1';

  produtosCompras: ProdutoCompra[] = [];

  modalProdutoAberto = false;
  modalRemoverAberto = false;
  modalLimparAberto = false;
  mostrarListaImpressao = false;

  produtoEmEdicaoId: number | null = null;
  produtoParaRemover: ProdutoCompra | null = null;

  mensagemCompras = '';

  formCompra: FormularioCompra = this.novoFormulario();

  constructor(
  private platform: Platform,
  private router: Router
) {}

  ngOnInit(): void {
    this.atualizarCalendario();
    this.carregarProdutosCompras();
  }

  // --------------------------------------------------
  // CICLO DE VIDA E BOTÃO VOLTAR DO TELEMÓVEL
  // --------------------------------------------------

  ionViewDidEnter(): void {
    this.backButtonSubscription?.unsubscribe();

    this.backButtonSubscription =
      this.platform.backButton.subscribeWithPriority(10000, () => {

        if (this.modalProdutoAberto) {
          this.fecharModalProduto();
        } else if (this.modalRemoverAberto) {
          this.fecharConfirmacaoRemover();
        } else if (this.modalLimparAberto) {
          this.fecharConfirmacaoLimpar();
        } else if (this.mostrarListaImpressao) {
          this.fecharListaImpressao();
        } else if (this.eventoModalAberto) {
          this.fecharModalEvento();
        } else if (this.diaSelecionado) {
          this.fecharDia();
        } else {
          this.voltar();
        }
      });
  }

  ionViewWillLeave(): void {
    this.backButtonSubscription?.unsubscribe();
    this.backButtonSubscription = undefined;
  }

  // --------------------------------------------------
  // CALENDÁRIO ORIGINAL
  // --------------------------------------------------

  atualizarCalendario(): void {
    const inicioSemana = this.obterInicioSemana(this.dataReferencia);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);

    const hoje = new Date();

    this.diasSemana = this.nomesDias.map((nome, indice) => {
      const data = new Date(inicioSemana);
      data.setDate(data.getDate() + indice);

      return {
        nome,
        numero: data.getDate(),
        data,
        eHoje: this.mesmoDia(data, hoje)
      };
    });

    this.atualizarTituloMes(inicioSemana, fimSemana);

    this.periodoSemana =
      this.formatarDiaMes(inicioSemana) +
      ' – ' +
      this.formatarDiaMes(fimSemana);

    this.textoSemana = this.obterTextoSemana(inicioSemana);
  }

  abrirDia(dia: DiaSemana): void {
  const data = dia.data;

  const dataFormatada =
    `${data.getFullYear()}-` +
    `${String(data.getMonth() + 1).padStart(2, '0')}-` +
    `${String(data.getDate()).padStart(2, '0')}`;

  this.router.navigate(['/agenda-diaria'], {
    queryParams: {
      data: dataFormatada
    }
  });
}

  fecharDia(): void {
    this.fecharModalEvento();
    this.diaSelecionado = null;
  }

  guardarAgenda(): void {
    if (!this.diaSelecionado) {
      return;
    }

    try {
      const todasAgendas = this.lerTodasAgendas();

      todasAgendas[this.chaveData(this.diaSelecionado)] = {
        almoco: this.agendaAtual.almoco,
        jantar: this.agendaAtual.jantar,
        atividades: { ...this.agendaAtual.atividades }
      };

      localStorage.setItem(
        this.chaveArmazenamento,
        JSON.stringify(todasAgendas)
      );
    } catch (erro) {
      console.error('Não foi possível guardar a agenda.', erro);
    }
  }

  private obterEvento(chave: string): EventoAgenda | null {
    const valor = this.agendaAtual.atividades[chave];

    if (!valor) {
      return null;
    }

    // Compatibilidade com eventos antigos guardados como texto.
    if (typeof valor === 'string') {
      const horaInicio = chave.substring(0, 5);

      return {
        texto: valor,
        horaFim: this.somarMeiaHora(horaInicio)
      };
    }

    return valor;
  }

  private somarMeiaHora(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const total = h * 60 + m + 30;

    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private minutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  obterAtividade(hora: string, pessoa: PessoaAgenda): string {
    const chave = `${hora}_${pessoa}`;
    const eventoInicio = this.obterEvento(chave);

    if (eventoInicio) {
      return `${eventoInicio.texto} (${hora}–${eventoInicio.horaFim})`;
    }

    // Mostra as linhas abrangidas por um evento mais longo.
    for (const outraChave of Object.keys(this.agendaAtual.atividades)) {
      if (!outraChave.endsWith(`_${pessoa}`)) {
        continue;
      }

      const inicio = outraChave.substring(0, 5);
      const evento = this.obterEvento(outraChave);

      if (
        evento &&
        this.minutos(hora) > this.minutos(inicio) &&
        this.minutos(hora) < this.minutos(evento.horaFim)
      ) {
        return `↳ ${evento.texto}`;
      }
    }

    return '';
  }

  abrirEvento(hora: string, pessoa: PessoaAgenda): void {
    this.eventoPessoa = pessoa;

    // Se tocar num horário abrangido por um evento longo,
    // abre o evento original.
    let chaveOrigem = `${hora}_${pessoa}`;

    for (const chave of Object.keys(this.agendaAtual.atividades)) {
      if (!chave.endsWith(`_${pessoa}`)) {
        continue;
      }

      const inicio = chave.substring(0, 5);
      const evento = this.obterEvento(chave);

      if (
        evento &&
        this.minutos(hora) >= this.minutos(inicio) &&
        this.minutos(hora) < this.minutos(evento.horaFim)
      ) {
        chaveOrigem = chave;
        break;
      }
    }

    this.eventoOrigemChave = chaveOrigem;
    this.eventoOrigemTexto =
      this.obterEvento(chaveOrigem)?.texto || '';

    this.eventoHora = chaveOrigem.substring(0, 5);
    this.eventoHoraFim =
      this.obterEvento(chaveOrigem)?.horaFim ||
      this.somarMeiaHora(this.eventoHora);

    this.eventoTexto = this.eventoOrigemTexto;
    this.mensagemEvento = '';
    this.eventoModalAberto = true;
  }

  guardarEvento(): void {
    const texto = this.eventoTexto.trim();

    if (!texto) {
      this.mensagemEvento = 'Escreve uma descrição para o evento.';
      return;
    }

    if (
      !this.horas.includes(this.eventoHora) ||
      !this.horas.includes(this.eventoHoraFim)
    ) {
      this.mensagemEvento = 'Seleciona horas válidas.';
      return;
    }

    if (this.minutos(this.eventoHoraFim) <= this.minutos(this.eventoHora)) {
      this.mensagemEvento =
        'A hora de fim tem de ser posterior à hora de início.';
      return;
    }

    const novaChave = `${this.eventoHora}_${this.eventoPessoa}`;
    const inicioNovo = this.minutos(this.eventoHora);
    const fimNovo = this.minutos(this.eventoHoraFim);

    // Impede sobreposições para a mesma pessoa.
    for (const chave of Object.keys(this.agendaAtual.atividades)) {
      if (
        chave === this.eventoOrigemChave ||
        !chave.endsWith(`_${this.eventoPessoa}`)
      ) {
        continue;
      }

      const inicioExistente = chave.substring(0, 5);
      const eventoExistente = this.obterEvento(chave);

      if (!eventoExistente) {
        continue;
      }

      const inicio = this.minutos(inicioExistente);
      const fim = this.minutos(eventoExistente.horaFim);

      if (inicioNovo < fim && fimNovo > inicio) {
        this.mensagemEvento =
          `Este horário sobrepõe-se a "${eventoExistente.texto}" ` +
          `(${inicioExistente}–${eventoExistente.horaFim}). Escolhe outro horário.`;
        return;
      }
    }

    if (
      this.eventoOrigemChave &&
      this.eventoOrigemChave !== novaChave
    ) {
      delete this.agendaAtual.atividades[this.eventoOrigemChave];
    }

    this.agendaAtual.atividades[novaChave] = {
      texto,
      horaFim: this.eventoHoraFim
    };

    this.guardarAgenda();
    this.fecharModalEvento();
  }

  apagarEvento(): void {
    if (this.eventoOrigemChave) {
      delete this.agendaAtual.atividades[this.eventoOrigemChave];
      this.guardarAgenda();
    }

    this.fecharModalEvento();
  }

  fecharModalEvento(): void {
    this.eventoModalAberto = false;
    this.eventoTexto = '';
    this.mensagemEvento = '';
    this.eventoOrigemChave = '';
    this.eventoOrigemTexto = '';
    this.eventoHoraFim = '07:30';
  }

  semanaAnterior(): void {
    this.dataReferencia.setDate(this.dataReferencia.getDate() - 7);
    this.atualizarCalendario();
  }

  semanaSeguinte(): void {
    this.dataReferencia.setDate(this.dataReferencia.getDate() + 7);
    this.atualizarCalendario();
  }

  irParaSemanaAtual(): void {
    this.dataReferencia = new Date();
    this.atualizarCalendario();
  }

  voltar(): void {
    if (this.modalProdutoAberto) {
      this.fecharModalProduto();
      return;
    }

    if (this.modalRemoverAberto) {
      this.fecharConfirmacaoRemover();
      return;
    }

    if (this.modalLimparAberto) {
      this.fecharConfirmacaoLimpar();
      return;
    }

    if (this.mostrarListaImpressao) {
      this.fecharListaImpressao();
      return;
    }

    if (this.eventoModalAberto) {
      this.fecharModalEvento();
      return;
    }

    if (this.diaSelecionado) {
      this.fecharDia();
      return;
    }

    this.router.navigate(['/oracao-perdao']);
  }

  private novaAgenda(): AgendaDia {
    return {
      almoco: '',
      jantar: '',
      atividades: {}
    };
  }

  

  private lerTodasAgendas(): { [data: string]: AgendaDia } {
    try {
      const dados = localStorage.getItem(this.chaveArmazenamento);
      return dados ? JSON.parse(dados) : {};
    } catch {
      return {};
    }
  }

  private chaveData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private obterInicioSemana(data: Date): Date {
    const inicio = new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    );

    const diaSemana = inicio.getDay();
    const diferenca = diaSemana === 0 ? -6 : 1 - diaSemana;

    inicio.setDate(inicio.getDate() + diferenca);
    return inicio;
  }

  private atualizarTituloMes(inicio: Date, fim: Date): void {
    const mesInicio = this.formatarMesAno(inicio);
    const mesFim = this.formatarMesAno(fim);

    this.tituloMes = mesInicio === mesFim
      ? mesInicio
      : `${mesInicio} – ${mesFim}`;
  }

  private formatarMesAno(data: Date): string {
    const texto = new Intl.DateTimeFormat('pt-PT', {
      month: 'long',
      year: 'numeric'
    }).format(data);

    return texto.charAt(0).toLocaleUpperCase('pt-PT') + texto.slice(1);
  }

  private formatarDiaMes(data: Date): string {
    return data.getDate() + ' ' +
      new Intl.DateTimeFormat('pt-PT', {
        month: 'short'
      }).format(data).replace('.', '');
  }

  private obterTextoSemana(inicio: Date): string {
    const inicioAtual = this.obterInicioSemana(new Date());

    if (this.mesmoDia(inicio, inicioAtual)) {
      return 'Semana atual';
    }

    const proxima = new Date(inicioAtual);
    proxima.setDate(proxima.getDate() + 7);

    if (this.mesmoDia(inicio, proxima)) {
      return 'Próxima semana';
    }

    const anterior = new Date(inicioAtual);
    anterior.setDate(anterior.getDate() - 7);

    if (this.mesmoDia(inicio, anterior)) {
      return 'Semana anterior';
    }

    return 'Semana de ' + this.formatarDiaMes(inicio);
  }

  private mesmoDia(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  // --------------------------------------------------
  // LISTA DE COMPRAS: CARREGAR E GUARDAR
  // --------------------------------------------------

  private novoFormulario(categoria = 'Fruta'): FormularioCompra {
    return {
      nome: '',
      categoria,
      loja: '',
      preco: null
    };
  }

  private carregarProdutosCompras(): void {
    try {
      const dados = localStorage.getItem(this.chaveListaCompras);

      if (!dados) {
        this.produtosCompras = [];
        return;
      }

      const parsed: unknown = JSON.parse(dados);

      if (!Array.isArray(parsed)) {
        this.produtosCompras = [];
        return;
      }

      this.produtosCompras = parsed
        .filter((item: unknown) => {
          if (!item || typeof item !== 'object') {
            return false;
          }

          const p = item as Partial<ProdutoCompra>;

          return typeof p.id === 'number' &&
            typeof p.nome === 'string' &&
            typeof p.categoria === 'string';
        })
        .map((item: unknown) => {
          const p = item as Partial<ProdutoCompra>;

          return {
            id: p.id as number,
            nome: (p.nome || '').trim(),
            categoria: this.categoriasCompras.includes(p.categoria || '')
              ? p.categoria as string
              : 'Despensa',
            loja: typeof p.loja === 'string' ? p.loja : '',
            preco: typeof p.preco === 'number' && Number.isFinite(p.preco)
              ? p.preco
              : null,
            selecionado: p.selecionado === true
          };
        })
        .filter(p => p.nome.length > 0);
    } catch (erro) {
      console.error('Não foi possível carregar a lista de compras.', erro);
      this.produtosCompras = [];
    }
  }

  private guardarListaCompras(): void {
    try {
      localStorage.setItem(
        this.chaveListaCompras,
        JSON.stringify(this.produtosCompras)
      );
    } catch (erro) {
      console.error('Não foi possível guardar a lista de compras.', erro);
      this.mensagemCompras =
        'Não foi possível guardar os dados neste dispositivo.';
    }
  }

  get totalSelecionados(): number {
    return this.produtosCompras.filter(p => p.selecionado).length;
  }

  produtosDaCategoria(categoria: string): ProdutoCompra[] {
    return this.produtosCompras.filter(p => p.categoria === categoria);
  }

  produtosSelecionadosDaCategoria(categoria: string): ProdutoCompra[] {
    return this.produtosCompras.filter(
      p => p.categoria === categoria && p.selecionado
    );
  }

  formatarPreco(preco: number | null): string {
    if (preco === null || !Number.isFinite(preco)) {
      return 'Preço não indicado';
    }

    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(preco);
  }

  // --------------------------------------------------
  // LISTA DE COMPRAS: ADICIONAR E EDITAR
  // --------------------------------------------------

  abrirAdicionarProduto(categoria: string): void {
    this.produtoEmEdicaoId = null;
    this.formCompra = this.novoFormulario(categoria);
    this.mensagemCompras = '';
    this.modalProdutoAberto = true;
  }

  abrirEditarProduto(produto: ProdutoCompra): void {
    this.produtoEmEdicaoId = produto.id;

    this.formCompra = {
      nome: produto.nome,
      categoria: produto.categoria,
      loja: produto.loja,
      preco: produto.preco
    };

    this.mensagemCompras = '';
    this.modalProdutoAberto = true;
  }

  guardarProduto(): void {
    const nome = this.formCompra.nome.trim();
    const loja = this.formCompra.loja.trim();
    const categoria = this.formCompra.categoria;
    const preco = this.formCompra.preco;

    if (!nome) {
      this.mensagemCompras = 'Escreve o nome do produto.';
      return;
    }

    if (!this.categoriasCompras.includes(categoria)) {
      this.mensagemCompras = 'Seleciona uma categoria válida.';
      return;
    }

    if (
      preco !== null &&
      (typeof preco !== 'number' || !Number.isFinite(preco) || preco < 0)
    ) {
      this.mensagemCompras = 'Indica um preço válido ou deixa o campo vazio.';
      return;
    }

    if (this.produtoEmEdicaoId !== null) {
      const indice = this.produtosCompras.findIndex(
        p => p.id === this.produtoEmEdicaoId
      );

      if (indice === -1) {
        this.mensagemCompras = 'Não foi possível encontrar esse produto.';
        return;
      }

      const produtoAtual = this.produtosCompras[indice];

      this.produtosCompras[indice] = {
        ...produtoAtual,
        nome,
        categoria,
        loja,
        preco
      };
    } else {
      this.produtosCompras.push({
        id: this.novoIdProduto(),
        nome,
        categoria,
        loja,
        preco,
        selecionado: false
      });
    }

    this.guardarListaCompras();
    this.fecharModalProduto();
  }

  private novoIdProduto(): number {
    let id = Date.now();

    while (this.produtosCompras.some(p => p.id === id)) {
      id++;
    }

    return id;
  }

  fecharModalProduto(): void {
    this.modalProdutoAberto = false;
    this.produtoEmEdicaoId = null;
    this.formCompra = this.novoFormulario();
    this.mensagemCompras = '';
  }

  // --------------------------------------------------
  // LISTA DE COMPRAS: SELEÇÃO
  // --------------------------------------------------

  alternarSelecao(produto: ProdutoCompra, evento: Event): void {
    const input = evento.target as HTMLInputElement;
    produto.selecionado = input.checked;
    this.guardarListaCompras();
  }

  // --------------------------------------------------
  // LISTA DE COMPRAS: REMOVER PRODUTO
  // --------------------------------------------------

  abrirConfirmacaoRemover(produto: ProdutoCompra): void {
    this.produtoParaRemover = produto;
    this.modalRemoverAberto = true;
  }

  confirmarRemoverProduto(): void {
    if (!this.produtoParaRemover) {
      return;
    }

    this.produtosCompras = this.produtosCompras.filter(
      p => p.id !== this.produtoParaRemover?.id
    );

    this.guardarListaCompras();
    this.fecharConfirmacaoRemover();
  }

  fecharConfirmacaoRemover(): void {
    this.modalRemoverAberto = false;
    this.produtoParaRemover = null;
  }

  // --------------------------------------------------
  // LISTA DE COMPRAS: LIMPAR TUDO
  // --------------------------------------------------

  abrirConfirmacaoLimpar(): void {
    this.modalLimparAberto = true;
  }

  confirmarLimparLista(): void {
  this.produtosCompras = this.produtosCompras.map(produto => ({
    ...produto,
    selecionado: false
  }));

  this.guardarListaCompras();
  this.modalLimparAberto = false;
}

  fecharConfirmacaoLimpar(): void {
    this.modalLimparAberto = false;
  }

  // --------------------------------------------------
  // LISTA DE COMPRAS: IMPRESSÃO
  // --------------------------------------------------

  abrirListaImpressao(): void {
    this.mostrarListaImpressao = true;
  }

  fecharListaImpressao(): void {
    this.mostrarListaImpressao = false;
  }

  imprimirLista(): void {
    if (this.totalSelecionados === 0) {
      return;
    }

    window.print();
  }
}