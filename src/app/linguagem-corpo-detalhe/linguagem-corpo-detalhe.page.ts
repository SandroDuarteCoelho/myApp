import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-linguagem-corpo-detalhe',
  templateUrl: './linguagem-corpo-detalhe.page.html',
  styleUrls: ['./linguagem-corpo-detalhe.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
  ],
})
export class LinguagemCorpoDetalhePage {
  voltar(): void {
    window.history.back();
  }
}

