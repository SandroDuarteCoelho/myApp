import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-oracao-perdao',
  templateUrl: './oracao-perdao.page.html',
  styleUrls: ['./oracao-perdao.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent],
})
export class OracaoPerdaoPage implements OnInit {

  ngOnInit() {}

  navigatePrayer() {
    window.location.href = '/home';
  }

  navigatePerfil() {
    window.location.href = '/perfil';
  }

  navigateAnimais() {
    window.location.href = '/animais';
  }

  navigateValores() {
    window.location.href = '/valores';
  }

  navigateMeditacoes() {
    window.location.href = '/meditacoes';
  }


}

