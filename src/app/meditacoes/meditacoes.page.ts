import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-meditacoes',
  templateUrl: './meditacoes.page.html',
  styleUrls: ['./meditacoes.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons],
})
export class MeditacoesPage implements OnInit {

  ngOnInit() {}

  voltar() {
    window.location.href = '/oracao-perdao';
  }
}

