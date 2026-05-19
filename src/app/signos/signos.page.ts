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
  selector: 'app-signos',
  templateUrl: './signos.page.html',
  styleUrls: ['./signos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons],
})
export class SignosPage {
  voltar(): void {
    window.location.href = '/perfil';
  }
}

