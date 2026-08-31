
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';


@Component({
  selector: 'app-home',

  templateUrl: 'home.page.html',

  styleUrls: ['home.page.scss'],

  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons
  ],
})


export class HomePage implements OnInit {


  // =====================================================
  // VARIÁVEIS
  // =====================================================

  mensagem: string = '';

  currentDate: Date = new Date();

  totalClicks: number = 0;

  buttonEnabled: boolean = true;

  displayLabel: string = '';

  storedDate: string = '';


  // =====================================================
  // 90 VELAS
  // =====================================================

  velas = Array.from(
    { length: 90 },
    (_, index) => index
  );


  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================

  ngOnInit() {

    this.loadCounter();

  }


  // =====================================================
  // CARREGAR CONTADOR
  // =====================================================

  private loadCounter() {

    const today = this.getToday();


    const storedDate =
      localStorage.getItem('lastClickDate');


    const storedClicksStr =
      localStorage.getItem('totalClicks') || '0';


    let storedClicks =
      parseInt(storedClicksStr, 10);


    // ---------------------------------------------
    // PRIMEIRA UTILIZAÇÃO
    // ---------------------------------------------

    if (!storedDate) {

      storedClicks = 0;

      this.buttonEnabled = true;

    }


    // ---------------------------------------------
    // JÁ FOI FEITO HOJE
    // ---------------------------------------------

    else if (storedDate === today) {

      /*
       * A oração já foi realizada hoje.
       *
       * Mantém a contagem.
       *
       * Impede novo registo no mesmo dia.
       */

      this.buttonEnabled = false;

    }


    // ---------------------------------------------
    // FOI FEITO ONTEM
    // ---------------------------------------------

    else if (
      this.daysBetween(storedDate, today) === 1
    ) {

      /*
       * A oração foi feita ontem.
       *
       * Hoje ainda não foi feita.
       *
       * Mantemos a sequência durante todo o dia.
       */

      this.buttonEnabled = true;

    }


    // ---------------------------------------------
    // FOI PERDIDO UM DIA OU MAIS
    // ---------------------------------------------

    else {

      /*
       * Exemplo:
       *
       * Última oração: 29/08
       * Hoje:          31/08
       *
       * O dia 30 não foi realizado.
       *
       * A sequência é perdida.
       */

      storedClicks = 0;

      this.buttonEnabled = true;

    }


    // Guardar valores

    this.totalClicks = storedClicks;

    this.storedDate =
      storedDate || today;


    // Atualizar Mãe / Pai

    this.updateLabel();

  }


  // =====================================================
  // DETERMINAR MÃE / PAI
  // =====================================================

  private updateLabel() {

    const today = this.getToday();


    /*
     * DATA DE REFERÊNCIA
     *
     * 30/08/2026 = Mãe
     *
     * Depois:
     *
     * 31/08/2026 = Pai
     * 01/09/2026 = Mãe
     * 02/09/2026 = Pai
     * 03/09/2026 = Mãe
     *
     * A alternância não depende da contagem.
     */


    const referenceDate =
      new Date('2026-08-30T00:00:00');


    const currentDate =
      new Date(today + 'T00:00:00');


    const difference =
      currentDate.getTime() -
      referenceDate.getTime();


    const daysPassed =
      Math.floor(
        difference /
        (1000 * 60 * 60 * 24)
      );


    if (daysPassed % 2 === 0) {

      this.displayLabel = 'Mãe';

    } else {

      this.displayLabel = 'Pai';

    }

  }


  // =====================================================
  // OBTER DATA ATUAL
  // =====================================================

  private getToday(): string {

    const now = new Date();


    const year =
      now.getFullYear();


    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, '0');


    const day =
      String(
        now.getDate()
      ).padStart(2, '0');


    return `${year}-${month}-${day}`;

  }


  // =====================================================
  // DIFERENÇA ENTRE DATAS
  // =====================================================

  private daysBetween(
    date1Str: string,
    date2Str: string
  ): number {


    const d1 =
      new Date(
        date1Str + 'T00:00:00'
      );


    const d2 =
      new Date(
        date2Str + 'T00:00:00'
      );


    const diffTime =
      d2.getTime() -
      d1.getTime();


    /*
     * Não usamos Math.abs().
     *
     * Queremos saber quantos dias passaram
     * realmente desde o último registo.
     */

    return Math.floor(
      diffTime /
      (1000 * 60 * 60 * 24)
    );

  }


  // =====================================================
  // GRAVAR
  // =====================================================

  gravar() {


    // Segurança:
    // se já foi gravado hoje, não faz nada.

    if (!this.buttonEnabled) {

      return;

    }


    const today =
      this.getToday();


    // ---------------------------------------------
    // AUMENTAR CONTADOR
    // ---------------------------------------------

    this.totalClicks++;


    /*
     * O máximo visual é 90 velas.
     *
     * Mesmo que totalClicks ultrapasse 90,
     * apenas as 90 velas existentes serão mostradas.
     */


    // ---------------------------------------------
    // GUARDAR CONTADOR
    // ---------------------------------------------

    localStorage.setItem(
      'totalClicks',
      this.totalClicks.toString()
    );


    // ---------------------------------------------
    // GUARDAR DATA
    // ---------------------------------------------

    localStorage.setItem(
      'lastClickDate',
      today
    );


    this.storedDate =
      today;


    // ---------------------------------------------
    // DESATIVAR BOTÃO
    // ---------------------------------------------

    this.buttonEnabled =
      false;


    // ---------------------------------------------
    // MENSAGEM
    // ---------------------------------------------

    this.mensagem =
      'Gravado com sucesso!';

  }


  // =====================================================
  // OUTROS
  // =====================================================

  openOutros() {

    window.location.href =
      '/outros';

  }


  // =====================================================
  // VOLTAR
  // =====================================================

  goBack() {

    window.location.href =
      '/oracao-perdao';

  }

}

