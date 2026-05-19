import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-eneagrama',
  templateUrl: './eneagrama.page.html',
  styleUrls: ['./eneagrama.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons],
})
export class EneagramaPage {
  voltar(): void {
    window.location.href = '/perfil';
  }
}

