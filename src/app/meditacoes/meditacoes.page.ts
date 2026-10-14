import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons
} from '@ionic/angular/standalone';

interface AudioMeditacao {
  nome: string;
  src: string;
}

interface TipoMeditacao {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  simbolo: string;
  descricao: string;
  objetivo: string;
  audios: AudioMeditacao[];
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
    IonButtons
  ]
})
export class MeditacoesPage {

  audioSelecionado: AudioMeditacao | null = null;

  tipoSelecionado: TipoMeditacao | null = null;

  // ÁUDIOS EXISTENTES
  private readonly audioAutocritica1: AudioMeditacao = {
    nome: 'Autocrítica — 1',
    src: 'assets/audio/autocritica1_45.m4a'
  };

  private readonly audioAutocritica2: AudioMeditacao = {
    nome: 'Autocrítica — 2',
    src: 'assets/audio/autocritica2_46.m4a'
  };

  private readonly audioCulpa: AudioMeditacao = {
    nome: 'Culpa',
    src: 'assets/audio/culpa_67.m4a'
  };

  private readonly audioPerdoar1: AudioMeditacao = {
    nome: 'Perdoar — 1',
    src: 'assets/audio/perdoar1_68.m4a'
  };

  private readonly audioPerdoar2: AudioMeditacao = {
    nome: 'Perdoar — 2',
    src: 'assets/audio/perdoar2_69.m4a'
  };

  private readonly audioCrianca1: AudioMeditacao = {
    nome: 'Criança — 1',
    src: 'assets/audio/crianca1_74.m4a'
  };

  private readonly audioCrianca2: AudioMeditacao = {
    nome: 'Criança — 2',
    src: 'assets/audio/crianca2_75.m4a'
  };

  // TIPOS DE MEDITAÇÃO
  // As associações dos áudios são provisórias.
  // Confirma o conteúdo de cada gravação antes de as considerares definitivas.

  
tiposMeditacao: TipoMeditacao[] = [

  {
    id: 'mindfulness',
    numero: 1,
    titulo: 'Meditação mindfulness — atenção plena',
    subtitulo: 'Consciência do momento presente',
    simbolo: '🍃',
    descricao:
      'Consiste em observar a respiração, as sensações corporais, ' +
      'os pensamentos e as emoções sem os julgar nem tentar eliminá-los.',
    objetivo:
      'Reconhecer reações automáticas, reduzir a ruminação e responder ' +
      'com mais consciência em vez de reagir impulsivamente.',
    audios: [
      this.audioAutocritica1,
      this.audioAutocritica2
    ]
  },

  {
    id: 'concentracao',
    numero: 2,
    titulo: 'Meditação de concentração',
    subtitulo: 'Treinar a estabilidade da atenção',
    simbolo: '🕯️',
    descricao:
      'A atenção é mantida num objeto, como a respiração, uma chama, ' +
      'um som ou um mantra. Quando a mente se distrai, regressa-se ' +
      'ao objeto escolhido.',
    objetivo:
      'Desenvolver foco, disciplina mental e capacidade de permanecer presente.',
    audios: []
  },

  {
    id: 'metta',
    numero: 3,
    titulo: 'Meditação da bondade amorosa — Metta',
    subtitulo: 'Cultivar benevolência e compaixão',
    simbolo: '💗',
    descricao:
      'Utilizam-se frases ou intenções dirigidas a si próprio, a pessoas ' +
      'próximas, a pessoas difíceis e, progressivamente, aos outros em geral.',
    objetivo:
      'Suavizar a autocrítica, desenvolver empatia e transformar a relação ' +
      'com os outros.',
    audios: [
      this.audioPerdoar1,
      this.audioPerdoar2
    ]
  },

  {
    id: 'corpo',
    numero: 4,
    titulo: 'Meditação de varrimento corporal — body scan',
    subtitulo: 'Reconhecer sensações e tensão corporal',
    simbolo: '🌿',
    descricao:
      'A atenção percorre lentamente o corpo, dos pés à cabeça, ' +
      'observando sensações, desconforto e tensão sem exigir que desapareçam.',
    objetivo:
      'Melhorar a consciência corporal e reconhecer sinais de stress ou cansaço.',
    audios: []
  },

  {
    id: 'contemplacao',
    numero: 5,
    titulo: 'Meditação contemplativa — Zen ou investigação interior',
    subtitulo: 'Observar a experiência e questionar pressupostos',
    simbolo: '🌼',
    descricao:
      'Algumas práticas privilegiam a observação silenciosa; outras usam ' +
      'perguntas profundas, como «Quem sou eu?» ou «O que estou a tomar ' +
      'como verdade?».',
    objetivo:
      'Reconhecer identificações, questionar crenças e aprofundar a ' +
      'compreensão de si. Os objetivos variam conforme a tradição.',
    audios: [
      this.audioCulpa
    ]
  },

  {
    id: 'mantra',
    numero: 6,
    titulo: 'Meditação com mantra ou meditação transcendental',
    subtitulo: 'Estabilizar a atenção através de um som ou frase',
    simbolo: '〰️',
    descricao:
      'Repete-se mentalmente um mantra, de forma contínua ou segundo ' +
      'as instruções de uma tradição.',
    objetivo:
      'Reduzir a dispersão mental e criar um período de recolhimento. ' +
      'A meditação transcendental é um método específico, não um nome ' +
      'genérico para qualquer meditação com mantra.',
    audios: []
  },

  {
    id: 'movimento',
    numero: 7,
    titulo: 'Meditação em movimento',
    subtitulo: 'Unir atenção, corpo e movimento',
    simbolo: '🦋',
    descricao:
      'Inclui caminhada meditativa, Tai Chi e certas práticas de Qigong. ' +
      'A atenção acompanha os movimentos, a respiração e o equilíbrio.',
    objetivo:
      'Desenvolver presença corporal e atenção sem exigir que a pessoa ' +
      'permaneça imóvel.',
    audios: []
  },

  {
    id: 'espiritual',
    numero: 8,
    titulo: 'Meditação espiritual ou devocional',
    subtitulo: 'Aprofundar sentido, fé ou ligação espiritual',
    simbolo: '✨',
    descricao:
      'Pode envolver oração silenciosa, contemplação de textos, gratidão ' +
      'ou entrega a uma realidade considerada transcendente.',
    objetivo:
      'Cultivar sentido de vida, esperança, humildade e ligação a algo maior, ' +
      'de acordo com as crenças da pessoa.',
    audios: [
      this.audioCrianca1,
      this.audioCrianca2
    ]
  }

];


  abrirTipo(id: string): void {
    this.parar();

    const tipo = this.tiposMeditacao.find(
      item => item.id === id
    );

    this.tipoSelecionado = tipo ?? null;
  }

  fecharTipo(): void {
    this.parar();
    this.tipoSelecionado = null;
  }

  selecionarAudio(audio: AudioMeditacao): void {
    this.parar();
    this.audioSelecionado = audio;
  }

  parar(): void {
    const elementosAudio = document.querySelectorAll('audio');

    elementosAudio.forEach(audio => {
      audio.pause();

      try {
        audio.currentTime = 0;
      } catch {
        // O elemento pode ainda não ter carregado os metadados.
      }
    });

    this.audioSelecionado = null;
  }

  voltar(): void {
    window.location.href = '/oracao-perdao';
  }
}