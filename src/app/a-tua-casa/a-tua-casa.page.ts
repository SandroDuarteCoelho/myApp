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
  selector: 'app-a-tua-casa',
  templateUrl: './a-tua-casa.page.html',
  styleUrls: ['./a-tua-casa.page.scss'],
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
export class ATuaCasaPage {
  voltar(): void {
    window.history.back();
  }
}

