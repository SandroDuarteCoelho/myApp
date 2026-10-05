
import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import {
  HttpClient,
  HttpClientModule
} from '@angular/common/http';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonLabel,
  IonList,
  IonCheckbox,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';


/* =====================================================
   INTERFACES
   ===================================================== */

interface Divisao {
  id: string;
  nome: string;
  prioridade: number;
  ativa: boolean;
  descricao?: string;
}

interface Tarefa {
  id: string;
  nome: string;
  divisoes: string[];
  frequencia: string;
  prioridade: number;
  duracao: number;
  ativa: boolean;
  descricao?: string;
}

interface TarefaApresentacao {
  tarefa: Tarefa;
  divisaoId: string;
}

interface RegistoHistorico {
  tarefaId: string;
  divisaoId: string;
  data: string;
}

interface TarefaHistorico {
  tarefa: Tarefa;
  divisaoId: string;
  ultimaData: string;
  diasDesdeUltima: number;
  intervaloDias: number;
  diasAtraso: number;
  estado:
    | 'em-dia'
    | 'atencao'
    | 'acumulado'
    | 'intervencao';
}


/* =====================================================
   COMPONENTE
   ===================================================== */

@Component({
  selector: 'app-limpezas',
  templateUrl: './limpezas.page.html',
  styleUrls: ['./limpezas.page.scss'],
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonList,
    IonCheckbox,
    IonInput,
    IonSelect,
    IonSelectOption
  ]
})

export class LimpezasPage implements OnInit {


  /* =====================================================
     DADOS
     ===================================================== */

  divisoes: Divisao[] = [];
  tarefas: Tarefa[] = [];


  /* =====================================================
     HISTÓRICO
     ===================================================== */

  historico: RegistoHistorico[] = [];
  tarefasHistorico: TarefaHistorico[] = [];


  /* =====================================================
     NOVOS ELEMENTOS
     ===================================================== */

  novaDivisao = '';
  novaDivisaoPrioridade = 2;

  novaTarefa = '';
  novaTarefaDivisao = '';
  novaTarefaFrequencia = 'semanal';
  novaTarefaPrioridade = 2;
  novaTarefaDuracao = 15;


  /* =====================================================
     STORAGE
     ===================================================== */

  private readonly STORAGE_DIVISOES =
    'limpezas_divisoes_v1';

  private readonly STORAGE_TAREFAS =
    'limpezas_tarefas_v1';

  private readonly STORAGE_HISTORICO =
    'limpezas_historico_v1';


  /* =====================================================
     CONSTRUCTOR
     ===================================================== */

  constructor(
    private http: HttpClient
  ) {}


  /* =====================================================
     INIT
     ===================================================== */

  ngOnInit(): void {

    this.carregarDivisoes();
    this.carregarTarefas();
    this.carregarHistorico();

  }


  /* =====================================================
     DIVISÕES
     ===================================================== */

  private carregarDivisoes(): void {

    const guardadas =
      localStorage.getItem(
        this.STORAGE_DIVISOES
      );

    if (guardadas) {

      try {

        const divisoesGuardadas =
          JSON.parse(
            guardadas
          ) as Divisao[];

        this.divisoes =
          divisoesGuardadas.map(
            divisao => ({
              ...divisao,

              prioridade:
                Number(divisao.prioridade) >= 1 &&
                Number(divisao.prioridade) <= 4
                  ? Number(divisao.prioridade)
                  : 2,

              ativa:
                divisao.ativa !== false
            })
          );

        this.guardarDivisoes();

        this.atualizarHistorico();

        return;

      } catch {

        console.warn(
          'Não foi possível ler as divisões guardadas.'
        );

      }
    }


    this.http
      .get<{ divisoes: Divisao[] }>(
        'assets/data/divisoes.json'
      )
      .subscribe({

        next: dados => {

          this.divisoes =
            dados.divisoes.map(
              divisao => ({
                ...divisao,

                prioridade:
                  Number(divisao.prioridade) >= 1 &&
                  Number(divisao.prioridade) <= 4
                    ? Number(divisao.prioridade)
                    : 2,

                ativa:
                  divisao.ativa !== false
              })
            );

          this.guardarDivisoes();

          this.atualizarHistorico();

        },

        error: erro => {

          console.error(
            'Erro ao carregar divisoes.json',
            erro
          );

        }

      });

  }


  private guardarDivisoes(): void {

    localStorage.setItem(
      this.STORAGE_DIVISOES,
      JSON.stringify(this.divisoes)
    );

  }


  alterarEstadoDivisao(
    divisao: Divisao
  ): void {

    divisao.ativa =
      !divisao.ativa;

    this.guardarDivisoes();

    this.atualizarHistorico();

  }


  adicionarDivisao(): void {

    const nome =
      this.novaDivisao.trim();

    if (!nome) {
      return;
    }

    const id =
      this.criarId(nome);

    const existe =
      this.divisoes.some(
        d => d.id === id
      );

    if (existe) {
      return;
    }

    this.divisoes.push({

      id,

      nome,

      prioridade:
        this.novaDivisaoPrioridade,

      ativa: true

    });

    this.guardarDivisoes();

    this.novaDivisao = '';

    this.novaDivisaoPrioridade = 2;

  }


  apagarDivisao(
    divisao: Divisao
  ): void {

    const confirmar =
      window.confirm(
        `Tem a certeza que quer eliminar a divisão "${divisao.nome}"?`
      );

    if (!confirmar) {
      return;
    }

    this.divisoes =
      this.divisoes.filter(
        d => d.id !== divisao.id
      );

    this.tarefas =
      this.tarefas
        .map(
          tarefa => ({
            ...tarefa,

            divisoes:
              tarefa.divisoes.filter(
                id =>
                  id !== divisao.id
              )
          })
        )
        .filter(
          tarefa =>
            tarefa.divisoes.length > 0
        );

    this.historico =
      this.historico.filter(
        registo =>
          registo.divisaoId !==
          divisao.id
      );

    this.guardarDivisoes();
    this.guardarTarefas();
    this.guardarHistorico();

    this.atualizarHistorico();

  }


  /* =====================================================
     TAREFAS
     ===================================================== */

  private carregarTarefas(): void {

    const guardadas =
      localStorage.getItem(
        this.STORAGE_TAREFAS
      );

    if (guardadas) {

      try {

        const dados =
          JSON.parse(guardadas);

        this.tarefas =
          (dados as any[]).map(
            tarefa => {

              if (
                Array.isArray(
                  tarefa.divisoes
                )
              ) {

                return {
                  ...tarefa,

                  divisoes:
                    tarefa.divisoes
                };

              }

              return {

                ...tarefa,

                divisoes:
                  tarefa.divisao
                    ? [tarefa.divisao]
                    : []

              };

            }
          );

        this.guardarTarefas();

        this.atualizarHistorico();

        return;

      } catch {

        console.warn(
          'Não foi possível ler as tarefas guardadas.'
        );

      }

    }


    this.http
      .get<{ tarefas: Tarefa[] }>(
        'assets/data/tarefas.json'
      )
      .subscribe({

        next: dados => {

          this.tarefas =
            dados.tarefas.map(
              tarefa => ({
                ...tarefa,

                divisoes:
                  Array.isArray(
                    tarefa.divisoes
                  )
                    ? tarefa.divisoes
                    : []
              })
            );

          this.guardarTarefas();

          this.atualizarHistorico();

        },

        error: erro => {

          console.error(
            'Erro ao carregar tarefas.json',
            erro
          );

        }

      });

  }


  private guardarTarefas(): void {

    localStorage.setItem(
      this.STORAGE_TAREFAS,
      JSON.stringify(this.tarefas)
    );

  }


  alterarEstadoTarefa(
    item: TarefaApresentacao
  ): void {

    item.tarefa.ativa =
      !item.tarefa.ativa;

    this.guardarTarefas();

    this.atualizarHistorico();

  }


  adicionarTarefa(): void {

    const nome =
      this.novaTarefa.trim();

    if (
      !nome ||
      !this.novaTarefaDivisao ||
      this.novaTarefaDuracao <= 0
    ) {
      return;
    }

    const id =
      this.criarId(
        `${this.novaTarefaDivisao}_${nome}`
      );

    const existe =
      this.tarefas.some(
        t => t.id === id
      );

    if (existe) {
      return;
    }

    this.tarefas.push({

      id,

      nome,

      divisoes: [
        this.novaTarefaDivisao
      ],

      frequencia:
        this.novaTarefaFrequencia,

      prioridade:
        this.novaTarefaPrioridade,

      duracao:
        this.novaTarefaDuracao,

      ativa: true

    });

    this.guardarTarefas();

    this.novaTarefa = '';

    this.novaTarefaDivisao = '';

    this.novaTarefaFrequencia =
      'semanal';

    this.novaTarefaPrioridade = 2;

    this.novaTarefaDuracao = 15;

  }


  apagarTarefa(
    tarefa: Tarefa
  ): void {

    const confirmar =
      window.confirm(
        `Tem a certeza que quer eliminar a tarefa "${tarefa.nome}"?`
      );

    if (!confirmar) {
      return;
    }

    this.tarefas =
      this.tarefas.filter(
        t => t.id !== tarefa.id
      );

    this.historico =
      this.historico.filter(
        registo =>
          registo.tarefaId !==
          tarefa.id
      );

    this.guardarTarefas();
    this.guardarHistorico();

    this.atualizarHistorico();

  }


  /* =====================================================
     DIVISÕES ATIVAS
     ===================================================== */

  get divisoesAtivas(): Divisao[] {

    return this.divisoes.filter(
      d => d.ativa
    );

  }


  /* =====================================================
     TAREFAS PARA APRESENTAÇÃO
     ===================================================== */

  get tarefasApresentacao():
    TarefaApresentacao[] {

    const resultado:
      TarefaApresentacao[] = [];

    for (
      const tarefa of this.tarefas
    ) {

      for (
        const divisaoId of
        tarefa.divisoes
      ) {

        resultado.push({

          tarefa,

          divisaoId

        });

      }

    }

    return resultado.sort(
      (a, b) => {

        if (
          a.tarefa.prioridade !==
          b.tarefa.prioridade
        ) {

          return (
            b.tarefa.prioridade -
            a.tarefa.prioridade
          );

        }

        const ordemFrequencia:
          Record<string, number> = {

            diaria: 1,
            semanal: 2,
            mensal: 3

          };

        const frequenciaA =
          ordemFrequencia[
            a.tarefa.frequencia
          ] ?? 99;

        const frequenciaB =
          ordemFrequencia[
            b.tarefa.frequencia
          ] ?? 99;

        if (
          frequenciaA !==
          frequenciaB
        ) {

          return (
            frequenciaA -
            frequenciaB
          );

        }

        return (
          a.tarefa.duracao -
          b.tarefa.duracao
        );

      }
    );

  }


  /* =====================================================
     HISTÓRICO DE LIMPEZAS
     ===================================================== */

  private carregarHistorico(): void {

    const guardado =
      localStorage.getItem(
        this.STORAGE_HISTORICO
      );

    if (!guardado) {

      this.historico = [];

      this.tarefasHistorico = [];

      return;

    }

    try {

      const dados =
        JSON.parse(guardado);

      if (Array.isArray(dados)) {

        this.historico =
          dados as RegistoHistorico[];

      } else {

        this.historico = [];

      }

      this.atualizarHistorico();

    } catch {

      console.warn(
        'Não foi possível ler o histórico de limpezas.'
      );

      this.historico = [];

      this.tarefasHistorico = [];

    }

  }


  private guardarHistorico(): void {

    localStorage.setItem(
      this.STORAGE_HISTORICO,
      JSON.stringify(this.historico)
    );

  }


  private atualizarHistorico(): void {

    const hoje =
      new Date();

    const registosValidos =
      this.historico.filter(
        registo =>

          this.tarefas.some(
            tarefa =>
              tarefa.id ===
              registo.tarefaId
          ) &&

          this.divisoes.some(
            divisao =>
              divisao.id ===
              registo.divisaoId
          )
      );

    this.tarefasHistorico = [];


    /*
     * Apenas aparecem no Histórico
     * tarefas que já foram realizadas.
     */

    for (
      const registo of
      registosValidos
    ) {

      const tarefa =
        this.tarefas.find(
          t =>
            t.id ===
            registo.tarefaId
        );

      if (!tarefa) {
        continue;
      }

      if (!tarefa.ativa) {
        continue;
      }

      const divisao =
        this.divisoes.find(
          d =>
            d.id ===
            registo.divisaoId
        );

      if (!divisao?.ativa) {
        continue;
      }


      /*
       * Frequência prevista.
       */

      const intervaloDias =
        this.obterIntervaloDias(
          tarefa.frequencia
        );


      /*
       * Última limpeza.
       */

      const ultimaData =
        this.converterData(
          registo.data
        );

      const diasDesdeUltima =
        this.calcularDias(
          ultimaData,
          hoje
        );


      /*
       * Dias de atraso.
       */

      const diasAtraso =
        Math.max(
          0,
          diasDesdeUltima -
          intervaloDias
        );


      const estado =
        this.obterEstadoHistorico(
          tarefa,
          diasAtraso
        );


      this.tarefasHistorico.push({

        tarefa,

        divisaoId:
          registo.divisaoId,

        ultimaData:
          registo.data,

        diasDesdeUltima,

        intervaloDias,

        diasAtraso,

        estado

      });

    }


    /*
     * Mais atrasadas primeiro.
     */

    this.tarefasHistorico.sort(
      (a, b) => {

        if (
          b.diasAtraso !==
          a.diasAtraso
        ) {

          return (
            b.diasAtraso -
            a.diasAtraso
          );

        }

        return (
          Number(b.tarefa.prioridade) -
          Number(a.tarefa.prioridade)
        );

      }
    );

  }


  private obterIntervaloDias(
    frequencia: string
  ): number {

    switch (frequencia) {

      case 'diaria':
        return 1;

      case 'semanal':
        return 7;

      case 'mensal':
        return 30;

      default:
        return 7;

    }

  }


  private calcularDias(
    dataInicial: Date,
    dataFinal: Date
  ): number {

    const inicio =
      new Date(dataInicial);

    const fim =
      new Date(dataFinal);

    inicio.setHours(
      0,
      0,
      0,
      0
    );

    fim.setHours(
      0,
      0,
      0,
      0
    );

    const diferenca =
      fim.getTime() -
      inicio.getTime();

    return Math.floor(
      diferenca /
      (1000 * 60 * 60 * 24)
    );

  }


  private obterEstadoHistorico(
    tarefa: Tarefa,
    diasAtraso: number
  ):
    'em-dia' |
    'atencao' |
    'acumulado' |
    'intervencao' {

    if (
      diasAtraso > 0 &&
      Number(tarefa.prioridade) >= 4
    ) {

      return 'intervencao';

    }

    if (
      diasAtraso >= 7
    ) {

      return 'intervencao';

    }

    if (
      diasAtraso >= 3
    ) {

      return 'acumulado';

    }

    if (
      diasAtraso >= 1
    ) {

      return 'atencao';

    }

    return 'em-dia';

  }


 


  obterTextoEstado(
    estado:
      'em-dia' |
      'atencao' |
      'acumulado' |
      'intervencao'
  ): string {

    switch (estado) {

      case 'intervencao':
        return '🔴 Intervenção';

      case 'acumulado':
        return '🟠 Acumulado';

      case 'atencao':
        return '🟡 Atenção';

      case 'em-dia':
      default:
        return '🟢 Em dia';

    }

  }


  obterClasseEstado(
    estado:
      'em-dia' |
      'atencao' |
      'acumulado' |
      'intervencao'
  ): string {

    switch (estado) {

      case 'intervencao':
        return 'historico-intervencao';

      case 'acumulado':
        return 'historico-acumulado';

      case 'atencao':
        return 'historico-atencao';

      case 'em-dia':
      default:
        return 'historico-em-dia';

    }

  }


  /* =====================================================
     ESTADO GERAL DA CASA
     ===================================================== */

  get estadoCasa():
    'em-dia' |
    'atencao' |
    'acumulado' |
    'intervencao' {


    /*
     * ===================================================
     * 1. TAREFAS JÁ REALIZADAS MAS ATRASADAS
     * ===================================================
     */

    const tarefasAtrasadas =
      this.tarefasHistorico.filter(
        item =>
          item.diasAtraso > 0
      );


    /*
     * ===================================================
     * 2. TAREFAS ATIVAS QUE AINDA NÃO FORAM REALIZADAS
     * ===================================================
     */

    const tarefasPorFazer: {
      tarefa: Tarefa;
      divisaoId: string;
    }[] = [];


    for (
      const tarefa of this.tarefas
    ) {

      if (!tarefa.ativa) {
        continue;
      }

      for (
        const divisaoId of
        tarefa.divisoes
      ) {

        const divisao =
          this.divisoes.find(
            d =>
              d.id === divisaoId
          );

        if (!divisao?.ativa) {
          continue;
        }


        const existeHistorico =
          this.historico.some(
            registo =>

              registo.tarefaId ===
              tarefa.id &&

              registo.divisaoId ===
              divisaoId
          );


        if (!existeHistorico) {

          tarefasPorFazer.push({

            tarefa,

            divisaoId

          });

        }

      }

    }


    /*
     * ===================================================
     * 3. INTERVENÇÃO
     * ===================================================
     *
     * Prioridade 4 por fazer
     * ou prioridade 4 atrasada.
     */

    const existePrioridade4PorFazer =
      tarefasPorFazer.some(
        item =>
          Number(
            item.tarefa.prioridade
          ) >= 4
      );


    const existePrioridade4Atrasada =
      tarefasAtrasadas.some(
        item =>
          Number(
            item.tarefa.prioridade
          ) >= 4
      );


    if (
      existePrioridade4PorFazer ||
      existePrioridade4Atrasada
    ) {

      return 'intervencao';

    }


    /*
     * ===================================================
     * 4. ACUMULADO
     * ===================================================
     */

    const prioridades3PorFazer =
      tarefasPorFazer.filter(
        item =>
          Number(
            item.tarefa.prioridade
          ) >= 3
      );


    const prioridades3Atrasadas =
      tarefasAtrasadas.filter(
        item =>
          Number(
            item.tarefa.prioridade
          ) >= 3
      );


    if (
      prioridades3PorFazer.length > 0 ||
      prioridades3Atrasadas.length >= 2 ||
      tarefasPorFazer.length >= 3 ||
      tarefasAtrasadas.length >= 3
    ) {

      return 'acumulado';

    }


    /*
     * ===================================================
     * 5. ATENÇÃO
     * ===================================================
     */

    if (
      tarefasPorFazer.length > 0 ||
      tarefasAtrasadas.length > 0
    ) {

      return 'atencao';

    }


    /*
     * ===================================================
     * 6. EM DIA
     * =================================================== */

    return 'em-dia';

  }


  get textoEstadoCasa(): string {

    return this.obterTextoEstado(
      this.estadoCasa
    );

  }


  get classeEstadoCasa(): string {

    return this.obterClasseEstado(
      this.estadoCasa
    );

  }


  get tarefasAtrasadas(): number {

    return this.tarefasHistorico.filter(
      tarefa =>
        tarefa.diasAtraso > 0
    ).length;

  }


  get tarefasIntervencao(): number {

    return this.tarefasHistorico.filter(
      tarefa =>
        tarefa.estado ===
        'intervencao'
    ).length;

  }


  /* =====================================================
     DATAS
     ===================================================== */

  

  

  private converterData(
    data: string
  ): Date {

    const partes =
      data.split('-');

    return new Date(

      Number(partes[0]),

      Number(partes[1]) - 1,

      Number(partes[2])

    );

  }


  formatarData(
    data: string
  ): string {

    const partes =
      data.split('-');

    if (
      partes.length !== 3
    ) {

      return data;

    }

    return (
      `${partes[2]}/` +
      `${partes[1]}/` +
      `${partes[0]}`
    );

  }


  obterTextoUltimaVez(
    dias: number
  ): string {

    if (dias === 0) {
      return 'hoje';
    }

    if (dias === 1) {
      return 'há 1 dia';
    }

    return `há ${dias} dias`;

  }


  obterTextoHabitual(
    intervaloDias: number
  ): string {

    if (intervaloDias === 1) {
      return 'todos os dias';
    }

    if (intervaloDias === 7) {
      return 'a cada 7 dias';
    }

    if (intervaloDias === 30) {
      return 'a cada 30 dias';
    }

    return (
      `a cada ${intervaloDias} dias`
    );

  }


  obterTextoAtraso(
    dias: number
  ): string {

    if (dias <= 0) {
      return 'Está em dia';
    }

    if (dias === 1) {
      return 'Está atrasado 1 dia';
    }

    return (
      `Está atrasado ${dias} dias`
    );

  }


  /* =====================================================
     DIVISÃO ATIVA
     ===================================================== */

  temDivisaoAtiva(
    ids: string[]
  ): boolean {

    return ids.some(
      id => {

        const divisao =
          this.divisoes.find(
            d =>
              d.id === id
          );

        return !!divisao?.ativa;

      }
    );

  }


  obterDivisaoAtiva(
    id: string
  ): boolean {

    const divisao =
      this.divisoes.find(
        d =>
          d.id === id
      );

    return !!divisao?.ativa;

  }


  /* =====================================================
     NOMES
     ===================================================== */

  obterNomeDivisao(
    id: string
  ): string {

    const divisao =
      this.divisoes.find(
        d =>
          d.id === id
      );

    return (
      divisao?.nome ??
      id
    );

  }


  obterNomeFrequencia(
    frequencia: string
  ): string {

    const nomes:
      Record<string, string> = {

        diaria: 'Diária',
        semanal: 'Semanal',
        mensal: 'Mensal'

      };

    return (
      nomes[frequencia] ??
      frequencia
    );

  }


  /* =====================================================
     PRIORIDADE
     ===================================================== */

  obterClassePrioridade(
    prioridade: number
  ): string {

    switch (
      Number(prioridade)
    ) {

      case 4:
        return 'prioridade-muito-alta';

      case 3:
        return 'prioridade-alta';

      case 2:
        return 'prioridade-media';

      case 1:
        return 'prioridade-baixa';

      default:
        return 'prioridade-media';

    }

  }


  /* =====================================================
     ORDENAÇÃO DAS DIVISÕES
     ===================================================== */

  get divisoesOrdenadas():
    Divisao[] {

    return [
      ...this.divisoes
    ].sort(
      (a, b) =>
        b.prioridade -
        a.prioridade
    );

  }


  /* =====================================================
     ID
     ===================================================== */

  private criarId(
    texto: string
  ): string {

    return texto

      .toLowerCase()

      .normalize('NFD')

      .replace(
        /[\u0300-\u036f]/g,
        ''
      )

      .replace(
        /[^a-z0-9]+/g,
        '_'
      )

      .replace(
        /^_+|_+$/g,
        '');

  }


  /* =====================================================
     REPOR DADOS ORIGINAIS
     ===================================================== */

  reporDadosOriginais(): void {

    const confirmar =
      window.confirm(

        'Tem a certeza que pretende ' +
        'repor as tarefas e divisões originais?\n\n' +

        'Todas as alterações feitas, incluindo ' +
        'tarefas ou divisões eliminadas, serão ' +
        'substituídas pelos dados originais.\n\n' +

        'O histórico de limpezas também será apagado.'

      );

    if (!confirmar) {
      return;
    }


    localStorage.removeItem(
      this.STORAGE_DIVISOES
    );

    localStorage.removeItem(
      this.STORAGE_TAREFAS
    );

    localStorage.removeItem(
      this.STORAGE_HISTORICO
    );


    window.location.reload();

  }


  /* =====================================================
     VOLTAR
     ===================================================== */

  voltar(): void {

    window.history.back();

  }

}
