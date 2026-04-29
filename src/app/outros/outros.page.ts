import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-outros',
  templateUrl: './outros.page.html',
  styleUrls: ['./outros.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton],
})
export class OutrosPage implements OnInit {

  ngOnInit() {}

  voltar() {
    window.location.href = '/home';
  }

}
