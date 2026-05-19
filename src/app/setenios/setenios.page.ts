import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';

type Setenio = {
  id: number;
  nome: string;
  descricao: string;
};

@Component({
  selector: 'app-setenios',
  templateUrl: './setenios.page.html',
  styleUrls: ['./setenios.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,

      IonButtons,
  IonButton,

    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class SeteniosPage implements OnInit {

  setenios: Setenio[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {

    this.http
      .get<Setenio[]>('assets/data/setenios.json')
      .subscribe({
        next: (data) => {
          this.setenios = data;
        },
        error: (err) => {
          console.error('Erro ao carregar setenios.json', err);
        }
      });
  }


  voltar(): void {
    window.history.back();
  }
}