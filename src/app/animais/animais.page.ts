import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonGrid, IonRow, IonCol,
  IonCard,
  IonCardTitle,
  IonButtons,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-animais',
  templateUrl: './animais.page.html',
  styleUrls: ['./animais.page.scss'],
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
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardTitle,
    IonButtons,
  ],
})
export class AnimaisPage implements OnInit {
  animais: { id: string; nome: string; imagem: string; descricao: string }[] = [];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http
      .get<{ id: string; nome: string; imagem: string; descricao: string }[]>(
        'assets/data/animais.json'
      )
      .subscribe({
        next: (data) => (this.animais = data),
        error: () => (this.animais = []),
      });
  }

  voltar(): void {
    window.location.href = '/oracao-perdao';
  }

  sair(): void {
    window.location.href = '/home';
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  getImagem(img: string): string {
    // Normaliza possíveis caminhos no JSON (ex: "./img/...")
    if (img.startsWith('./img/')) {
      return 'assets/animais/' + img.replace('./img/', '');
    }

    return img;
  }

  navigateDetalhe(id: string): void {
    window.location.href = `/animal/${id}`;
  }
}







