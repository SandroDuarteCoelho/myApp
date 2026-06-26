import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-metade-sombra',
  templateUrl: './metade-sombra.page.html',
  styleUrls: ['./metade-sombra.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
  ],
})
export class MetadeSombraPage {

  audioSelecionado: any = null;

  audios = [
    { nome: 'Sombra 1', src: 'assets/audio/sombra1.m4a' },
    { nome: 'Sombra 2', src: 'assets/audio/sombra2.m4a' },
    { nome: 'Sombra 3', src: 'assets/audio/sombra3.m4a' },
  ];

  selecionarAudio(audio: any) {
    this.audioSelecionado = audio;
  }

  parar() {
    const el = document.querySelector('audio') as HTMLAudioElement;

    if (el) {
      el.pause();
      el.currentTime = 0;
    }

    this.audioSelecionado = null;
  }

  voltar() {
    window.history.back();
  }

  abrirLinguagemCorpoDetalhe() {
    window.location.href = '/linguagem-corpo-detalhe';
  }

  abrirATuaCasa() {
    window.location.href = '/a-tua-casa';
  }

  abrirOQueComes() {
    window.location.href = '/o-que-comes';
  }

  abrirOQueVes() {
    window.location.href = '/o-que-ves';
  }

  abrirOQueUsas() {
    window.location.href = '/o-que-usas';
  }
}