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
  selector: 'app-metade-sombra',
  templateUrl: './metade-sombra.page.html',
  styleUrls: ['./metade-sombra.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons],
})
export class MetadeSombraPage {
  voltar(): void {
    window.history.back();
  }
}

