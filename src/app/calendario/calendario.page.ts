import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-calendario',
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons
  ]
})
export class CalendarioPage implements OnInit {
  dataReferencia: Date = new Date();
  diasSemana: DiaSemana[] = [];

  tituloMes = '';
  periodoSemana = '';
  textoSemana = '';

  private readonly nomesDias = [
    'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.atualizarCalendario();
  }

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
    const data = this.chaveData(dia.data);

    this.router.navigate(['/agenda-diaria'], {
      queryParams: { data }
    });
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
    window.history.back();
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

    return texto.charAt(0).toLocaleUpperCase('pt-PT') +
      texto.slice(1);
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
}