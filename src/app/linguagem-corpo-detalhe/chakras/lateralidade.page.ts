import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-lateralidade',
  templateUrl: './lateralidade.page.html',
  styleUrls: ['./lateralidade.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
  ],
})
export class LateralidadePage {
  voltar(): void {
    window.history.back();
  }
}

