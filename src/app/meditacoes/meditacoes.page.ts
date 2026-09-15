import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
} from '@ionic/angular/standalone';

interface AudioMeditacao {
  nome: string;
  src: string;
}

@Component({
  selector: 'app-meditacoes',
  templateUrl: './meditacoes.page.html',
  styleUrls: ['./meditacoes.page.scss'],
  standalone: true,
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
export class MeditacoesPage {

  audioSelecionado: AudioMeditacao | null = null;

  audios: AudioMeditacao[] = [
    {
      nome: 'Autocrítica — 1',
      src: 'assets/audio/autocritica1_45.m4a',
    },
    {
      nome: 'Autocrítica — 2',
      src: 'assets/audio/autocritica2_46.m4a',
    },
    {
      nome: 'Culpa',
      src: 'assets/audio/culpa_67.m4a',
    },
    {
      nome: 'Perdoar — 1',
      src: 'assets/audio/perdoar1_68.m4a',
    },
    {
      nome: 'Perdoar — 2',
      src: 'assets/audio/perdoar2_69.m4a',
    },
    {
      nome: 'Criança — 1',
      src: 'assets/audio/crianca1_74.m4a',
    },
    {
      nome: 'Criança — 2',
      src: 'assets/audio/crianca2_75.m4a',
    },
  ];

  selecionarAudio(audio: AudioMeditacao): void {
    this.audioSelecionado = audio;
  }

  parar(): void {
    const elementos = document.querySelectorAll('audio');

    elementos.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });

    this.audioSelecionado = null;
  }

  voltar(): void {
    window.location.href = '/oracao-perdao';
  }
}