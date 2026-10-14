
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonInput,
  IonTextarea
} from '@ionic/angular/standalone';

interface DiaSemana {
  nome: string;
  numero: number;
  data: Date;
  eHoje: boolean;
}

interface AgendaDia {
  almoco: string;
  jantar: string;
  atividades: { [chave: string]: string };
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
    IonButtons,
    IonInput,
    IonTextarea
  ]
})
export class CalendarioPage implements OnInit {

  dataReferencia: Date = new Date();

  diasSemana: DiaSemana[] = [];

  tituloMes = '';

  periodoSemana = '';

  textoSemana = '';

  diaSelecionado: Date | null = null;

  dataSelecionadaTexto = '';

  agendaAtual: AgendaDia = this.novaAgenda();

  readonly horas: string[] = Array.from(
    { length: 15 },
    (_, indice) =>
      `${String(indice + 7).padStart(2, '0')}:00`
  );

  private readonly chaveArmazenamento =
    'calendario_agenda_v1';

  private backButtonSubscription?: Subscription;

  private readonly nomesDias = [
    'Seg',
    'Ter',
    'Qua',
    'Qui',
    'Sex',
    'Sáb',
    'Dom'
  ];

  constructor(private platform: Platform) {}

  ngOnInit(): void {
    this.atualizarCalendario();
  }

  ionViewDidEnter(): void {
    this.backButtonSubscription?.unsubscribe();

    this.backButtonSubscription =
      this.platform.backButton.subscribeWithPriority(
        10000,
        () => {
          if (this.diaSelecionado) {
            this.fecharDia();
          } else {
            this.voltar();
          }
        }
      );
  }

  ionViewWillLeave(): void {
    this.backButtonSubscription?.unsubscribe();
    this.backButtonSubscription = undefined;
  }

  atualizarCalendario(): void {
    const inicioSemana = this.obterInicioSemana(
      this.dataReferencia
    );

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(fimSemana.getDate() + 6);

    const hoje = new Date();

    this.diasSemana = this.nomesDias.map(
      (nome, indice) => {
        const data = new Date(inicioSemana);

        data.setDate(data.getDate() + indice);

        return {
          nome,
          numero: data.getDate(),
          data,
          eHoje: this.mesmoDia(data, hoje)
        };
      }
    );

    this.atualizarTituloMes(
      inicioSemana,
      fimSemana
    );

    this.periodoSemana =
      this.formatarDiaMes(inicioSemana) +
      ' – ' +
      this.formatarDiaMes(fimSemana);

    this.textoSemana =
      this.obterTextoSemana(inicioSemana);
  }

  abrirDia(dia: DiaSemana): void {
    this.diaSelecionado = new Date(dia.data);

    const texto = new Intl.DateTimeFormat(
      'pt-PT',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    ).format(dia.data);

    this.dataSelecionadaTexto =
      texto.charAt(0).toLocaleUpperCase('pt-PT') +
      texto.slice(1);

    this.agendaAtual = this.lerAgenda(
      this.chaveData(dia.data)
    );
  }

  fecharDia(): void {
    this.diaSelecionado = null;
  }

  guardarAgenda(): void {
    if (!this.diaSelecionado) {
      return;
    }

    try {
      const todasAgendas = this.lerTodasAgendas();

      todasAgendas[
        this.chaveData(this.diaSelecionado)
      ] = {
        almoco: this.agendaAtual.almoco,
        jantar: this.agendaAtual.jantar,
        atividades: {
          ...this.agendaAtual.atividades
        }
      };

      localStorage.setItem(
        this.chaveArmazenamento,
        JSON.stringify(todasAgendas)
      );
    } catch (erro) {
      console.error(
        'Não foi possível guardar a agenda.',
        erro
      );
    }
  }

  atualizarAtividade(
    hora: string,
    pessoa: string,
    valor: string
  ): void {
    const chave = `${hora}_${pessoa}`;

    this.agendaAtual.atividades[chave] = valor;

    this.guardarAgenda();
  }

  obterAtividade(
    hora: string,
    pessoa: string
  ): string {
    return this.agendaAtual.atividades[
      `${hora}_${pessoa}`
    ] || '';
  }

  semanaAnterior(): void {
    this.dataReferencia.setDate(
      this.dataReferencia.getDate() - 7
    );

    this.atualizarCalendario();
  }

  semanaSeguinte(): void {
    this.dataReferencia.setDate(
      this.dataReferencia.getDate() + 7
    );

    this.atualizarCalendario();
  }

  irParaSemanaAtual(): void {
    this.dataReferencia = new Date();

    this.atualizarCalendario();
  }

  
voltar(): void {
  if (this.diaSelecionado) {
    this.fecharDia();
    return;
  }

  window.history.back();
}


  private novaAgenda(): AgendaDia {
    return {
      almoco: '',
      jantar: '',
      atividades: {}
    };
  }

  private lerAgenda(chave: string): AgendaDia {
    const todasAgendas = this.lerTodasAgendas();
    const agenda = todasAgendas[chave];

    if (!agenda) {
      return this.novaAgenda();
    }

    return {
      almoco: agenda.almoco || '',
      jantar: agenda.jantar || '',
      atividades: agenda.atividades || {}
    };
  }

  private lerTodasAgendas():
    { [data: string]: AgendaDia } {
    try {
      const dados = localStorage.getItem(
        this.chaveArmazenamento
      );

      return dados ? JSON.parse(dados) : {};
    } catch {
      return {};
    }
  }

  private chaveData(data: Date): string {
    const ano = data.getFullYear();

    const mes = String(
      data.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      data.getDate()
    ).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private obterInicioSemana(data: Date): Date {
    const inicio = new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    );

    const diaSemana = inicio.getDay();

    const diferenca = diaSemana === 0
      ? -6
      : 1 - diaSemana;

    inicio.setDate(
      inicio.getDate() + diferenca
    );

    return inicio;
  }

  private atualizarTituloMes(
    inicio: Date,
    fim: Date
  ): void {
    const mesInicio =
      this.formatarMesAno(inicio);

    const mesFim =
      this.formatarMesAno(fim);

    this.tituloMes = mesInicio === mesFim
      ? mesInicio
      : `${mesInicio} – ${mesFim}`;
  }

  private formatarMesAno(data: Date): string {
    const texto = new Intl.DateTimeFormat(
      'pt-PT',
      {
        month: 'long',
        year: 'numeric'
      }
    ).format(data);

    return texto.charAt(0).toLocaleUpperCase('pt-PT') +
      texto.slice(1);
  }

  private formatarDiaMes(data: Date): string {
    return data.getDate() + ' ' +
      new Intl.DateTimeFormat(
        'pt-PT',
        {
          month: 'short'
        }
      ).format(data).replace('.', '');
  }

  private obterTextoSemana(
    inicio: Date
  ): string {
    const inicioAtual = this.obterInicioSemana(
      new Date()
    );

    if (this.mesmoDia(inicio, inicioAtual)) {
      return 'Semana atual';
    }

    const proxima = new Date(inicioAtual);

    proxima.setDate(
      proxima.getDate() + 7
    );

    if (this.mesmoDia(inicio, proxima)) {
      return 'Próxima semana';
    }

    const anterior = new Date(inicioAtual);

    anterior.setDate(
      anterior.getDate() - 7
    );

    if (this.mesmoDia(inicio, anterior)) {
      return 'Semana anterior';
    }

    return 'Semana de ' +
      this.formatarDiaMes(inicio);
  }

  private mesmoDia(
    a: Date,
    b: Date
  ): boolean {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }
}
