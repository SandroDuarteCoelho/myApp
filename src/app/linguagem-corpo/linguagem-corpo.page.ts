import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-linguagem-corpo',
  templateUrl: './linguagem-corpo.page.html',
  styleUrls: ['./linguagem-corpo.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons],
})
export class LinguagemCorpoPage implements OnInit {
  ngOnInit() {}

  voltar() {
    window.location.href = '/oracao-perdao';
  }
}

