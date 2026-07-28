import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
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
  selector: 'app-autoavaliacao-terceiro-olho',
  templateUrl: './autoavaliacao-terceiro-olho.page.html',
  styleUrls: ['./autoavaliacao-terceiro-olho.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
export class AutoavaliacaoTerceiroOlhoPage {
  voltar(): void {
    window.history.back();
  }
}

