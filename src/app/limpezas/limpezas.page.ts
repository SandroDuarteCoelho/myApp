
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
     TAREFAS PARA APRESENTAÇÃO
     ===================================================== */

  tarefasApresentacao: TarefaApresentacao[] = [];

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

  private readonly STORAGE_DIVISOES_ELIMINADAS =
    'limpezas_divisoes_eliminadas_v1';

  private readonly STORAGE_TAREFAS_ELIMINADAS =
    'limpezas_tarefas_eliminadas_v1';

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
    console.log('LIMPEZAS: iniciou');

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
          JSON.parse(guardadas) as Divisao[];

        this.divisoes =
          divisoesGuardadas.map(
            divisao =>
              this.normalizarDivisao(divisao)
          );

        this.guardarDivisoes();

      } catch {
        console.warn(
          'Não foi possível ler as divisões guardadas.'
        );

        this.divisoes = [];
      }
    }

    /*
     * Mesmo existindo dados no localStorage,
     * consultamos sempre o JSON.
     *
     * Assim conseguimos encontrar:
     *
     * - divisões novas;
     * - campos novos;
     * - informação nova.
     */

    this.http
      .get<{ divisoes: Divisao[] }>(
        'assets/data/divisoes.json'
      )
      .subscribe({

        next: dados => {

          this.sincronizarDivisoesComJson(
            dados.divisoes ?? []
          );
        },

        error: erro => {

          console.error(
            'Erro ao carregar divisoes.json',
            erro
          );

          this.atualizarHistorico();
        }
      });
  }

  private normalizarDivisao(
    divisao: Divisao
  ): Divisao {

    return {
      ...divisao,

      prioridade:
        Number(divisao.prioridade) >= 1 &&
        Number(divisao.prioridade) <= 4
          ? Number(divisao.prioridade)
          : 2,

      ativa:
        divisao.ativa !== false
    };
  }

  private sincronizarDivisoesComJson(
    divisoesJson: Divisao[]
  ): void {

    const eliminadas =
      this.obterIdsEliminados(
        this.STORAGE_DIVISOES_ELIMINADAS
      );

    let houveAlteracoes = false;

    for (
      const divisaoJsonOriginal of divisoesJson
    ) {

      const divisaoJson =
        this.normalizarDivisao(
          divisaoJsonOriginal
        );

      /*
       * Se foi eliminada pelo utilizador,
       * não volta a ser criada.
       */

      if (
        eliminadas.has(divisaoJson.id)
      ) {
        continue;
      }

      const existente =
        this.divisoes.find(
          divisao =>
            divisao.id === divisaoJson.id
        );

      /*
       * DIVISÃO NOVA
       */

      if (!existente) {

        this.divisoes.push({
          ...divisaoJson
        });

        houveAlteracoes = true;

        continue;
      }

      /*
       * DIVISÃO EXISTENTE
       *
       * Só acrescentamos propriedades que
       * ainda não existam.
       */

      for (
        const chave of Object.keys(divisaoJson)
      ) {

        const valorJson =
          (divisaoJson as any)[chave];

        const valorExistente =
          (existente as any)[chave];

        if (
          (
            valorExistente === undefined ||
            valorExistente === null ||
            (
              chave === 'descricao' &&
              typeof valorExistente === 'string' &&
              valorExistente.trim() === ''
            )
          ) &&
          valorJson !== undefined &&
          valorJson !== null
        ) {

          (existente as any)[chave] =
            valorJson;

          houveAlteracoes = true;
        }
      }
    }

    if (houveAlteracoes) {
      this.guardarDivisoes();
    }

    this.atualizarHistorico();
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

    /*
     * Se anteriormente esta divisão tivesse
     * sido eliminada, retiramos o ID da lista
     * de eliminações.
     */

    this.removerIdEliminado(
      this.STORAGE_DIVISOES_ELIMINADAS,
      id
    );

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

    /*
     * Regista a divisão como eliminada.
     */

    this.adicionarIdEliminado(
      this.STORAGE_DIVISOES_ELIMINADAS,
      divisao.id
    );

    /*
     * Remove a divisão das tarefas.
     *
     * Se uma tarefa ficar sem qualquer divisão,
     * essa tarefa é também considerada eliminada.
     */

    const tarefasRemovidas: string[] = [];

    this.tarefas =
      this.tarefas
        .map(tarefa => ({
          ...tarefa,

          divisoes:
            tarefa.divisoes.filter(
              id => id !== divisao.id
            )
        }))
        .filter(tarefa => {

          if (
            tarefa.divisoes.length === 0
          ) {

            tarefasRemovidas.push(
              tarefa.id
            );

            return false;
          }

          return true;
        });

    /*
     * Regista como eliminadas as tarefas
     * que ficaram sem divisões.
     */

    for (
      const tarefaId of tarefasRemovidas
    ) {

      this.adicionarIdEliminado(
        this.STORAGE_TAREFAS_ELIMINADAS,
        tarefaId
      );
    }

    /*
     * Remove histórico da divisão.
     */

    this.historico =
      this.historico.filter(
        registo =>
          registo.divisaoId !==
          divisao.id
      );

    /*
     * Remove a divisão.
     */

    this.divisoes =
      this.divisoes.filter(
        d =>
          d.id !== divisao.id
      );

    this.atualizarTarefasApresentacao();

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

              /*
               * Compatibilidade com a estrutura antiga
               * que tinha apenas "divisao".
               */

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

        this.tarefas =
          this.tarefas.map(
            tarefa =>
              this.normalizarTarefa(
                tarefa
              )
          );

        this.guardarTarefas();

      } catch {

        console.warn(
          'Não foi possível ler as tarefas guardadas.'
        );

        this.tarefas = [];
      }
    }

    /*
     * Mesmo existindo tarefas no localStorage,
     * consultamos sempre o JSON.
     */

    this.http
      .get<{ tarefas: Tarefa[] }>(
        'assets/data/tarefas.json'
      )
      .subscribe({

        next: dados => {

          this.sincronizarTarefasComJson(
            dados.tarefas ?? []
          );
        },

        error: erro => {

          console.error(
            'Erro ao carregar tarefas.json',
            erro
          );

          this.atualizarTarefasApresentacao();
          this.atualizarHistorico();
        }
      });
  }

  private normalizarTarefa(
    tarefa: Tarefa
  ): Tarefa {

    return {
      ...tarefa,

      divisoes:
        Array.isArray(tarefa.divisoes)
          ? tarefa.divisoes
          : [],

      prioridade:
        Number(tarefa.prioridade) >= 1 &&
        Number(tarefa.prioridade) <= 4
          ? Number(tarefa.prioridade)
          : 2,

      duracao:
        Number(tarefa.duracao) > 0
          ? Number(tarefa.duracao)
          : 15,

      ativa:
        tarefa.ativa !== false
    };
  }

  private sincronizarTarefasComJson(
    tarefasJson: Tarefa[]
  ): void {

    const eliminadas =
      this.obterIdsEliminados(
        this.STORAGE_TAREFAS_ELIMINADAS
      );

    let houveAlteracoes = false;

    for (
      const tarefaJsonOriginal of tarefasJson
    ) {

      const tarefaJson =
        this.normalizarTarefa(
          tarefaJsonOriginal
        );

      /*
       * Não recria uma tarefa que o utilizador
       * tenha eliminado.
       */

      if (
        eliminadas.has(tarefaJson.id)
      ) {
        continue;
      }

      const existente =
        this.tarefas.find(
          tarefa =>
            tarefa.id === tarefaJson.id
        );

      /*
       * TAREFA NOVA
       */

      if (!existente) {

        this.tarefas.push({
          ...tarefaJson
        });

        houveAlteracoes = true;

        continue;
      }

      /*
       * TAREFA EXISTENTE
       *
       * Acrescentamos propriedades novas.
       *
       * IMPORTANTE:
       * Se descricao no localStorage estiver vazia,
       * usamos a descrição do JSON.
       */

      for (
        const chave of Object.keys(tarefaJson)
      ) {

        const valorJson =
          (tarefaJson as any)[chave];

        const valorExistente =
          (existente as any)[chave];

        const descricaoVazia =
          chave === 'descricao' &&
          typeof valorExistente === 'string' &&
          valorExistente.trim() === '';

        if (
          (
            valorExistente === undefined ||
            valorExistente === null ||
            descricaoVazia
          ) &&
          valorJson !== undefined &&
          valorJson !== null
        ) {

          (existente as any)[chave] =
            valorJson;

          houveAlteracoes = true;
        }
      }

      /*
       * Se uma tarefa antiga ainda não tiver
       * nenhuma divisão, podemos completar
       * as divisões vindas do JSON.
       *
       * Não substituímos divisões que o utilizador
       * já tenha alterado.
       */

      if (
        (
          !Array.isArray(
            existente.divisoes
          ) ||
          existente.divisoes.length === 0
        ) &&
        tarefaJson.divisoes.length > 0
      ) {

        existente.divisoes =
          [
            ...tarefaJson.divisoes
          ];

        houveAlteracoes = true;
      }
    }

    if (houveAlteracoes) {
      this.guardarTarefas();
    }

    this.atualizarTarefasApresentacao();
    this.atualizarHistorico();
  }

  private guardarTarefas(): void {

    localStorage.setItem(
      this.STORAGE_TAREFAS,
      JSON.stringify(this.tarefas)
    );
  }

  /* =====================================================
     TAREFAS PARA APRESENTAÇÃO
     ===================================================== */

  private atualizarTarefasApresentacao(): void {

    const resultado:
      TarefaApresentacao[] = [];

    for (
      const tarefa of this.tarefas
    ) {

      const divisoes =
        Array.isArray(tarefa.divisoes)
          ? tarefa.divisoes
          : [];

      for (
        const divisaoId of divisoes
      ) {

        resultado.push({
          tarefa,
          divisaoId
        });
      }
    }

    const ordemFrequencia:
      Record<string, number> = {
        diaria: 1,
        semanal: 2,
        mensal: 3
      };

    resultado.sort(
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

    this.tarefasApresentacao =
      resultado;
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

    /*
     * Se anteriormente esta tarefa tivesse
     * sido eliminada, permite voltar a criá-la.
     */

    this.removerIdEliminado(
      this.STORAGE_TAREFAS_ELIMINADAS,
      id
    );

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

    this.atualizarTarefasApresentacao();
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

    /*
     * Regista a eliminação.
     */

    this.adicionarIdEliminado(
      this.STORAGE_TAREFAS_ELIMINADAS,
      tarefa.id
    );

    /*
     * Remove a tarefa.
     */

    this.tarefas =
      this.tarefas.filter(
        t =>
          t.id !== tarefa.id
      );

    /*
     * Remove o histórico correspondente.
     */

    this.historico =
      this.historico.filter(
        registo =>
          registo.tarefaId !==
          tarefa.id
      );

    this.atualizarTarefasApresentacao();

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

      const intervaloDias =
        this.obterIntervaloDias(
          tarefa.frequencia
        );

      const ultimaData =
        this.converterData(
          registo.data
        );

      const diasDesdeUltima =
        this.calcularDias(
          ultimaData,
          hoje
        );

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

    const tarefasAtrasadas =
      this.tarefasHistorico.filter(
        item =>
          item.diasAtraso > 0
      );

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

    if (
      tarefasPorFazer.length > 0 ||
      tarefasAtrasadas.length > 0
    ) {

      return 'atencao';
    }

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

  get divisoesOrdenadas(): Divisao[] {

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
     ELIMINAÇÕES - APOIO
     ===================================================== */

  private obterIdsEliminados(
    storageKey: string
  ): Set<string> {

    const guardados =
      localStorage.getItem(
        storageKey
      );

    if (!guardados) {

      return new Set<string>();
    }

    try {

      const dados =
        JSON.parse(guardados);

      if (
        Array.isArray(dados)
      ) {

        return new Set<string>(
          dados.filter(
            id =>
              typeof id === 'string'
          )
        );
      }

    } catch {

      console.warn(
        `Não foi possível ler ${storageKey}.`
      );
    }

    return new Set<string>();
  }

  private guardarIdsEliminados(
    storageKey: string,
    ids: Set<string>
  ): void {

    localStorage.setItem(
      storageKey,
      JSON.stringify(
        Array.from(ids)
      )
    );
  }

  private adicionarIdEliminado(
    storageKey: string,
    id: string
  ): void {

    const ids =
      this.obterIdsEliminados(
        storageKey
      );

    ids.add(id);

    this.guardarIdsEliminados(
      storageKey,
      ids
    );
  }

  private removerIdEliminado(
    storageKey: string,
    id: string
  ): void {

    const ids =
      this.obterIdsEliminados(
        storageKey
      );

    if (!ids.has(id)) {
      return;
    }

    ids.delete(id);

    this.guardarIdsEliminados(
      storageKey,
      ids
    );
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

    /*
     * Esta função continua a ser a reposição
     * TOTAL e destrutiva.
     *
     * A utilização normal da aplicação NÃO passa
     * por aqui.
     *
     * A sincronização automática acontece quando
     * a página é aberta.
     */

    localStorage.removeItem(
      this.STORAGE_DIVISOES
    );

    localStorage.removeItem(
      this.STORAGE_TAREFAS
    );

    localStorage.removeItem(
      this.STORAGE_HISTORICO
    );

    localStorage.removeItem(
      this.STORAGE_DIVISOES_ELIMINADAS
    );

    localStorage.removeItem(
      this.STORAGE_TAREFAS_ELIMINADAS
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

