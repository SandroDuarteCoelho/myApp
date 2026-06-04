import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
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
  selector: 'app-linguagem-corpo-detalhe',
  templateUrl: './linguagem-corpo-detalhe.page.html',
  styleUrls: ['./linguagem-corpo-detalhe.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
  ],
})
export class LinguagemCorpoDetalhePage {
  voltar(): void {
    window.history.back();
  }

  chakras = [
    {
      id: 'coronario',
      nome: 'Chacra Coronário',
      cor: '#9b59b6',
    },
    {
      id: 'terceiro-olho',
      nome: 'Chacra Terceiro Olho',
      cor: '#5dade2',
    },
    {
      id: 'garganta',
      nome: 'Chacra Garganta',
      cor: '#3498db',
    },
    {
      id: 'cardiaco',
      nome: 'Chacra Cardíaco',
      cor: '#2ecc71',
    },
    {
      id: 'plexo-solar',
      nome: 'Chacra Plexo Solar',
      cor: '#f1c40f',
    },
    {
      id: 'sacral',
      nome: 'Chacra Sacral',
      cor: '#e67e22',
    },
    {
      id: 'raiz',
      nome: 'Chacra Raiz',
      cor: '#e74c3c',
    },
    {
  id: 'outros',
  nome: 'Outros',
  cor: '#34495e'
},
  ];

  selecionado: string | null = null;

  selecionarChacra(id: string): void {
    const rota = `/linguagem-corpo-detalhe/${id}`;
    window.location.href = rota;
  }



  getChakra(id: string) {
    return this.chakras.find((c) => c.id === id);
  }
}

