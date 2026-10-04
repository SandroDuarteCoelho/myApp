
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import {
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
  IonButton,
  IonInput,
  IonSelect,
  IonSelectOption
} from '@ionic/angular/standalone';


interface Divisao {
  id: string;
  nome: string;
  ativa: boolean;
}


interface Tarefa {
  id: string;
  nome: string;
  divisao: string;
  frequencia: string;
  prioridade: number;
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
    IonButton,
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

  novaTarefa = '';
  novaTarefaDivisao = '';
  novaTarefaFrequencia = 'semanal';


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

    const guardadas =
      localStorage.getItem(this.STORAGE_DIVISOES);

    if (guardadas) {

      try {

        this.divisoes =
          JSON.parse(guardadas);

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
            dados.divisoes;

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


  alterarEstadoDivisao(
    divisao: Divisao
  ): void {

    divisao.ativa =
      !divisao.ativa;

    this.guardarDivisoes();

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

      ativa: true

    });

    this.guardarDivisoes();

    this.novaDivisao = '';

  }


  apagarDivisao(
    divisao: Divisao
  ): void {

    this.divisoes =
      this.divisoes.filter(
        d => d.id !== divisao.id
      );

    this.guardarDivisoes();

  }


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

    const nome =
      this.novaTarefa.trim();

    if (
      !nome ||
      !this.novaTarefaDivisao
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

      divisao:
        this.novaTarefaDivisao,

      frequencia:
        this.novaTarefaFrequencia,

      prioridade: 2,

      ativa: true

    });

    this.guardarTarefas();

    this.novaTarefa = '';

    this.novaTarefaDivisao = '';

    this.novaTarefaFrequencia = 'semanal';

  }


  apagarTarefa(
    tarefa: Tarefa
  ): void {

    this.tarefas =
      this.tarefas.filter(
        t => t.id !== tarefa.id
      );

    this.guardarTarefas();

  }


  /* =====================================================
     DIVISÕES ATIVAS
     ===================================================== */

  get divisoesAtivas(): Divisao[] {

    return this.divisoes
      .filter(d => d.ativa);

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

}
