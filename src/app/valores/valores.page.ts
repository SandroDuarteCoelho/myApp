import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
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
  IonCardTitle,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-valores',
  templateUrl: './valores.page.html',
  styleUrls: ['./valores.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
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
    IonCardTitle,
  ],
})
export class ValoresPage implements OnInit {
  valores: { id: string; nome: string; descricao: string }[] = [];

  // A ordem deve seguir exatamente a listagem pedida
  private readonly ordem = [
    'Paz',
    'Respeito',
    'Amor',
    'Tolerância',
    'Felicidade',
    'Responsabilidade',
    'Cooperação',
    'Humildade',
    'Honestidade',
    'Simplicidade',
    'Liberdade',
    'União',
  ];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<Record<string, string>>('assets/data/valores.json')
      .subscribe({
        next: (data) => {
          this.valores = this.ordem
            .filter((key) => data[key] != null)
            .map((key) => ({
              id: key,
              nome: key,
              descricao: data[key],
            }));
        },
        error: () => {
          this.valores = [];
        },
      });
  }

  voltar(): void {
    window.location.href = '/oracao-perdao';
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  navigateDetalhe(id: string): void {
    window.location.href = `/valor/${encodeURIComponent(id)}`;
  }
}


