import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [ CommonModule,IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class HomePage implements OnInit {

  mensagem = "";
  currentDate: Date = new Date();
  totalClicks: number = 0;
  buttonEnabled: boolean = true;
  displayLabel: string = '';
  storedDate: string = '';

  ngOnInit() {
    this.loadCounter();
  }

  private loadCounter() {
    const today = this.getToday();
    const storedDate = localStorage.getItem('lastClickDate');
    const storedClicksStr = localStorage.getItem('totalClicks') || '0';
    let storedClicks = parseInt(storedClicksStr, 10);

    if (!storedDate || this.daysBetween(storedDate, today) > 1) {
      storedClicks = 0;
    }

    this.totalClicks = storedClicks;
    this.buttonEnabled = storedDate !== today;
    this.storedDate = storedDate || today;
    this.updateLabel();
  }

  private updateLabel() {
    const today = this.getToday();
    const day = parseInt(today.split('-')[2], 10);
    this.displayLabel = day % 2 === 0 ? ' Mãe' : ' Pai';
  }

  private getToday(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private daysBetween(date1Str: string, date2Str: string): number {
    const d1 = new Date(date1Str + 'T00:00:00');
    const d2 = new Date(date2Str + 'T00:00:00');
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  gravar() {
    if (this.buttonEnabled) {
      this.totalClicks++;
      const today = this.getToday();
      localStorage.setItem('totalClicks', this.totalClicks.toString());
      localStorage.setItem('lastClickDate', today);
      this.buttonEnabled = false;
      this.updateLabel();
      this.mensagem = 'Gravado com sucesso!';
    }
  }

  openOutros() {
    window.location.href = '/outros';
  }
}
