import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonImg,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-animal-detalhe',
  templateUrl: './animal-detalhe.page.html',
  styleUrls: ['./animal-detalhe.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonImg,
    IonCard,
    IonCardContent,
  ],
})
export class AnimalDetalhePage implements OnInit {
  animalId: string | null = null;
  animal: { id: string; nome: string; imagem: string; descricao: string } | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.animalId = this.route.snapshot.paramMap.get('id');
    if (!this.animalId) return;

    this.http
      .get<{ id: string; nome: string; imagem: string; descricao: string }[]>(
        'assets/data/animais.json'
      )
      .subscribe({
        next: (animais) => {
          this.animal = animais.find((a) => a.id === this.animalId) ?? null;
        },
        error: () => {
          this.animal = null;
        },
      });
  }

  voltar(): void {
    window.location.href = '/animais';
  }

  sair(): void {
    window.location.href = '/oracao-perdao';
  }


  getImagem(img: string | undefined | null): string {
    if (!img) return '';

    // Alguns itens no JSON usam "./img/...". Vamos normalizar para assets.
    if (img.startsWith('./img/')) {
      return 'assets/animais/' + img.replace('./img/', '');
    }

    return img;
  }
}

