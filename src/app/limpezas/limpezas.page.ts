
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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
  IonSelectOption,
} from '@ionic/angular/standalone';


interface Divisao {
  id: string;
  nome: string;
  prioridade: number;
  ativa: boolean;
}


interface Tarefa {
  id: string;
  nome: string;
  divisao: string;
  frequencia: string;
  prioridade: number;
  duracao: number;
  ativa: boolean;
}


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
    IonAccordionGroup,
    IonAccordion,
    IonItem,
    IonLabel,
    IonList,
    IonCheckbox,
    IonButton,IonButtons,
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


  constructor(
    private http: HttpClient
  ) {}


  /* =====================================================
     INIT
     ===================================================== */

  ngOnInit(): void {

    this.carregarDivisoes();
    this.carregarTarefas();

  }


  /* =====================================================
     DIVISÕES
     ===================================================== */

  private carregarDivisoes(): void {
  const guardadas = localStorage.getItem(
    this.STORAGE_DIVISOES
  );

  if (guardadas) {
    try {
      const divisoesGuardadas =
        JSON.parse(guardadas) as Divisao[];

      // Garante que divisões antigas têm prioridade
      this.divisoes = divisoesGuardadas.map(divisao => ({
        ...divisao,
        prioridade:
          Number(divisao.prioridade) >= 1 &&
          Number(divisao.prioridade) <= 4
            ? Number(divisao.prioridade)
            : 2,
        ativa: divisao.ativa !== false
      }));

      // Guarda novamente já com a estrutura atualizada
      this.guardarDivisoes();

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

        this.divisoes = dados.divisoes.map(divisao => ({
          ...divisao,
          prioridade:
            Number(divisao.prioridade) >= 1 &&
            Number(divisao.prioridade) <= 4
              ? Number(divisao.prioridade)
              : 2,
          ativa: divisao.ativa !== false
        }));

        this.guardarDivisoes();
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


  alterarEstadoDivisao(divisao: Divisao): void {
  divisao.ativa = !divisao.ativa;

  // Se a divisão for desativada,
  // todas as tarefas dessa divisão ficam desativadas.
  if (!divisao.ativa) {
    this.tarefas.forEach(tarefa => {
      if (tarefa.divisao === divisao.id) {
        tarefa.ativa = false;
      }
    });

    this.guardarTarefas();
  }

  this.guardarDivisoes();
}


  adicionarDivisao(): void {

  const nome = this.novaDivisao.trim();

  if (!nome) {
    return;
  }

  const id = this.criarId(nome);

  const existe = this.divisoes.some(
    d => d.id === id
  );

  if (existe) {
    return;
  }

  this.divisoes.push({
    id,
    nome,
    prioridade: this.novaDivisaoPrioridade,
    ativa: true
  });

  this.guardarDivisoes();

  this.novaDivisao = '';
  this.novaDivisaoPrioridade = 2;
}


  apagarDivisao(divisao: Divisao): void { const confirmar = window.confirm( `Tem a certeza que quer eliminar a divisão "${divisao.nome}"?` ); if (!confirmar) { return; } 
  // Remove a divisão 
  this.divisoes = this.divisoes.filter( d => d.id !== divisao.id ); 
  // Remove também as tarefas dessa divisão 
  this.tarefas = this.tarefas.filter( t => t.divisao !== divisao.id ); 
  // Guarda ambas as alterações 
  this.guardarDivisoes(); this.guardarTarefas(); }


  /* =====================================================
     TAREFAS
     ===================================================== */

  private carregarTarefas(): void {

    const guardadas =
      localStorage.getItem(this.STORAGE_TAREFAS);

    if (guardadas) {

      try {

        this.tarefas =
          JSON.parse(guardadas);

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
            dados.tarefas;

          this.guardarTarefas();

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
    tarefa: Tarefa
  ): void {

    tarefa.ativa =
      !tarefa.ativa;

    this.guardarTarefas();

  }


  adicionarTarefa(): void {

  const nome = this.novaTarefa.trim();

  if (
    !nome ||
    !this.novaTarefaDivisao ||
    this.novaTarefaDuracao <= 0
  ) {
    return;
  }

  const id = this.criarId(
    `${this.novaTarefaDivisao}_${nome}`
  );

  const existe = this.tarefas.some(
    t => t.id === id
  );

  if (existe) {
    return;
  }

  this.tarefas.push({
    id,
    nome,
    divisao: this.novaTarefaDivisao,
    frequencia: this.novaTarefaFrequencia,
    prioridade: this.novaTarefaPrioridade,
    duracao: this.novaTarefaDuracao,
    ativa: true
  });

  this.guardarTarefas();

  this.novaTarefa = '';
  this.novaTarefaDivisao = '';
  this.novaTarefaFrequencia = 'semanal';
  this.novaTarefaPrioridade = 2;
  this.novaTarefaDuracao = 15;
}


 apagarTarefa(tarefa: Tarefa): void { const confirmar = window.confirm( `Tem a certeza que quer eliminar a tarefa "${tarefa.nome}"?` ); if (!confirmar) { return; } 
 // Remove a tarefa 
 this.tarefas = this.tarefas.filter( t => t.id !== tarefa.id ); 
 // Guarda as alterações 
 this.guardarTarefas(); }


  /* =====================================================
     DIVISÕES ATIVAS
     ===================================================== */

  get divisoesAtivas(): Divisao[] {

    return this.divisoes
      .filter(d => d.ativa);

  }


  /* =====================================================
   ORDENAÇÃO POR PRIORIDADE
   ===================================================== */

get divisoesOrdenadas(): Divisao[] {
  return [...this.divisoes].sort(
    (a, b) => b.prioridade - a.prioridade
  );
}


get tarefasOrdenadas(): Tarefa[] {

  const ordemFrequencia: Record<string, number> = {
    diaria: 1,
    semanal: 2,
    mensal: 3
  };

  return [...this.tarefas].sort((a, b) => {

    // 1. Prioridade: maior primeiro
    if (a.prioridade !== b.prioridade) {
      return b.prioridade - a.prioridade;
    }

    // 2. Frequência: diária → semanal → mensal
    const frequenciaA =
      ordemFrequencia[a.frequencia] ?? 99;

    const frequenciaB =
      ordemFrequencia[b.frequencia] ?? 99;

    if (frequenciaA !== frequenciaB) {
      return frequenciaA - frequenciaB;
    }

    // 3. Duração: menor duração primeiro
    return a.duracao - b.duracao;
  });
}


/* =====================================================
   CORES DA PRIORIDADE
   ===================================================== */

obterClassePrioridade(prioridade: number): string {

  switch (Number(prioridade)) {

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
     NOMES
     ===================================================== */

  obterNomeDivisao(
    id: string
  ): string {

    const divisao =
      this.divisoes.find(
        d => d.id === id
      );

    return divisao?.nome ?? id;

  }


  obterNomeFrequencia(
    frequencia: string
  ): string {

    const nomes: Record<string, string> = {

      diaria: 'Diária',

      semanal: 'Semanal',

      mensal: 'Mensal'

    };

    return nomes[frequencia] ?? frequencia;

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

      .replace(/[\u0300-\u036f]/g, '')

      .replace(/[^a-z0-9]+/g, '_')

      .replace(/^_+|_+$/g, '');

  }





obterDivisaoAtiva(id: string): boolean {

  const divisao = this.divisoes.find(
    d => d.id === id
  );

  return !!divisao?.ativa;
}

  voltar(): void {
  window.history.back();
}




}
