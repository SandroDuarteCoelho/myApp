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
  selector: 'app-o-que-ves',
  templateUrl: './o-que-ves.page.html',
  styleUrls: ['./o-que-ves.page.scss'],
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
export class OQueVesPage {
  voltar(): void {
    window.history.back();
  }
}

