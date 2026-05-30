import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';



@Component({
  selector: 'app-metade-sombra',
  templateUrl: './metade-sombra.page.html',
  styleUrls: ['./metade-sombra.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
  ],
})

export class MetadeSombraPage {
  voltar(): void {
    window.history.back();
  }

  abrirLinguagemCorpoDetalhe(): void {
    window.location.href = '/linguagem-corpo-detalhe';
  }

  abrirATuaCasa(): void {
    window.location.href = '/a-tua-casa';
  }

  abrirOQueComes(): void {
    window.location.href = '/o-que-comes';
  }
}


