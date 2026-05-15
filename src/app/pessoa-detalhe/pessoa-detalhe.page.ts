import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';

export type PessoaJson = {
  nome: string;
  apelido: string;
  localidade: string;
  grupo: string;
  eneagrama_tipo: number | string;
  data: string;
};

export type PessoaWithId = PessoaJson & { id: number };

@Component({
  selector: 'app-pessoa-detalhe',
  templateUrl: './pessoa-detalhe.page.html',
  styleUrls: ['./pessoa-detalhe.page.scss'],
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class PessoaDetalhePage implements OnInit {
  pessoa: PessoaWithId | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? Number(idStr) : NaN;
    if (!id || Number.isNaN(id)) return;

    this.http.get<PessoaJson[]>('assets/data/pessoas.json').subscribe({
      next: (arr) => {
        const pessoaArr = arr as PessoaJson[];
        // Como o JSON não tem id persistente, tratamos id = índice+1
        // (tanto no perfil quanto aqui).
        const idx = id - 1;
        this.pessoa = pessoaArr[idx]
          ? ({ id, ...pessoaArr[idx] } as PessoaWithId)
          : null;
      },
      error: () => {
        this.pessoa = null;
      },
    });
  }

  voltar(): void {
    window.location.href = '/perfil';
  }
}

