import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';


@Component({
  selector: 'app-o-que-usas',
  templateUrl: './o-que-usas.page.html',
  styleUrls: ['./o-que-usas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
  ],

})
export class OQueUsasPage {
  voltar(): void {
    window.history.back();
  }
}

