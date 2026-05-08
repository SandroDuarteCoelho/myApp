import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons } from '@ionic/angular/standalone';

@Component({
  selector: 'app-valores',
  templateUrl: './valores.page.html',
  styleUrls: ['./valores.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons],
})
export class ValoresPage implements OnInit {

  ngOnInit() {}

  voltar() {
    window.location.href = '/oracao-perdao';
  }
}

