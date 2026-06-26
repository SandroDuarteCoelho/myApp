import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-valor-detalhe',
  templateUrl: './valor-detalhe.page.html',
  styleUrls: ['./valor-detalhe.page.scss'],
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
    IonCard,
    IonCardContent,
  ],
})
export class ValorDetalhePage implements OnInit {
  valorId: string | null = null;
  texto: string | null = null;
  imagem: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.valorId = this.route.snapshot.paramMap.get('id');

    if (!this.valorId) {
      this.texto = null;
      return;
    }

    // valorId vem decodificado do URL, mas fazemos o decode explícito por segurança
    const key = decodeURIComponent(this.valorId);

    this.imagem =
  'assets/fotos_valores/' +
  key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-') +
  '.webp';

    this.http
      .get<Record<string, string>>('assets/data/valores.json')
      .subscribe({
        next: (data) => {
          this.texto = data[key] ?? null;
        },
        error: () => {
          this.texto = null;
        },
      });
  }

  voltar(): void {
    window.location.href = '/valores';
  }

  getTitulo(): string {
    if (!this.valorId) return 'Valor';
    return decodeURIComponent(this.valorId);
  }
}

