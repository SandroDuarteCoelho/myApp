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
  IonCardContent,
  IonButtons,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';





@Component({
  selector: 'app-oracao-perdao',
  templateUrl: './oracao-perdao.page.html',
  styleUrls: ['./oracao-perdao.page.scss'],
  standalone: true,
  imports: [
    CommonModule,

    IonHeader,


    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonModal,
    IonList,
    IonItem,
    IonLabel,
    IonGrid,


    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    
  ],
})

export class OracaoPerdaoPage implements OnInit {

  casaAtual: string = '';
  descricaoCasaAtual: string = '';
  casaClass: string = '';
  backgroundImage: string = '';

  // fontes de imagem por casa
  private backgroundByCasa: Record<string, string> = {
    'Casa da VIDA': 'assets/backgrounds/vida.webp',
    'Casa dos BENS': 'assets/backgrounds/bens.webp',
    'Casa do SANGUE': 'assets/backgrounds/sangue.webp',
    'Casa da SOLIDEZ': 'assets/backgrounds/solidez.webp',
    'Casa dos FILHOS': 'assets/backgrounds/filhos.webp',
    'Casa da SAÚDE': 'assets/backgrounds/saude.webp',
    'Casa do CASAMENTO': 'assets/backgrounds/casamento.webp',
    'Casa da MORTE/MUDANÇA': 'assets/backgrounds/morte.webp',
    'Casa DIVINA': 'assets/backgrounds/divina.webp',
    'Casa da POSIÇÃO SOCIAL': 'assets/backgrounds/social.webp',
    'Casa dos AMIGOS': 'assets/backgrounds/amigos.webp',
    'Casa dos INIMIGOS': 'assets/backgrounds/inimigos.webp',
  };


  isCasasModalOpen = false;

  // Área de edição (antes dos cards)
  isEditAreaVisible = true;
  userPhrase: string = '';

  phraseStorageKey = 'oracao_perdao_user_phrase';

  ngOnInit() {
    this.casaAtual = this.getCasaAtual();
    this.descricaoCasaAtual = this.getDescricaoCasaAtual(this.casaAtual);
    this.casaClass = this.getCasaClass(this.casaAtual);
    this.backgroundImage = this.backgroundByCasa[this.casaAtual] ?? this.backgroundByCasa['Casa da VIDA'];


    this.casasList = Object.keys(this.casasMap).map((nome) => ({
      nome,
      descricao: this.casasMap[nome],
    }));

    // Carrega frase salva (se houver)
    const saved = window.localStorage.getItem(this.phraseStorageKey);
    if (saved) {
      this.userPhrase = saved;
      this.isEditAreaVisible = false;
    }
  }

  savePhrase() {
    window.localStorage.setItem(this.phraseStorageKey, this.userPhrase ?? '');
    this.isEditAreaVisible = false;
  }



  private casasMap: Record<string, string> = {
    'Casa da VIDA':
      'empreendimentos pessoais, temperamento, qualidades, defeitos e projetos para o futuro',
    'Casa dos BENS':
      'bens materiais, fortuna, lucros, promoções, emprego, compras e vendas importantes.',
    'Casa do SANGUE':
      'família e parentes, tanto nas alegrias quanto nas tristezas. Se o relacionamento é bom, o período é muito positivo',
    'Casa da SOLIDEZ':
      'realização de sonhos, consolidação de negócios, sociedades, contratos, terra, propriedades e viagens importantes',
    'Casa dos FILHOS':
      'fertilidade, fecundidade, gestação, nascimento, educação, alegrias e tristezas, tudo envolvendo filhos.',
    'Casa da SAÚDE':
      'esta é a casa do sucesso em todos os sentidos, bem como da saúde física e mental. Curas e distúrbios podem acontecer nesse período. Período do Paraíso Astral.',
    'Casa do CASAMENTO':
      'tudo que se relacionar a sua relação amorosa, quer seja ou não formalizada, tanto no sentido de realização quanto no de finalização',
    'Casa da MORTE/MUDANÇA':
      'lutas, obstáculos, problemas, acidentes, operações cirúrgicas, bem como término abrupto de relacionamentos, sociedades, com prejuízos ou não.',
    'Casa DIVINA':
      'período da religiosidade, da dedicação às coisas do espírito, da busca e do encontro por respostas. Delicado para pessoas místicas ou fanáticas em excesso.',
    'Casa da POSIÇÃO SOCIAL':
      'sucesso, ascensão, glórias, reconhecimento, prêmios, evidência e elevação. Casamento por interesse.',
    'Casa dos AMIGOS':
      'início ou fim de relacionamentos com amigos. Indicado para pedir auxílio e proteção nos assuntos complicados.',
    'Casa dos INIMIGOS':
      'perseguições, desavenças, brigas, escândalos e tudo de ruim que possa ocorrer no período do seu Inferno Astral.',
  };

  casasList: Array<{ nome: string; descricao: string }> = [];




  private getCasaClass(casa: string): string {
    const map: Record<string, string> = {
      'Casa da VIDA': 'casa-VIDA',
      'Casa dos BENS': 'casa-BENS',
      'Casa do SANGUE': 'casa-SANGUE',
      'Casa da SOLIDEZ': 'casa-SOLIDEZ',
      'Casa dos FILHOS': 'casa-FILHOS',
      'Casa da SAÚDE': 'casa-SAÚDE',
      'Casa do CASAMENTO': 'casa-CASAMENTO',
      'Casa da MORTE/MUDANÇA': 'casa-MORTE-MUDANÇA',
      'Casa DIVINA': 'casa-DIVINA',
      'Casa da POSIÇÃO SOCIAL': 'casa-POSICAO-SOCIAL',
      'Casa dos AMIGOS': 'casa-AMIGOS',
      'Casa dos INIMIGOS': 'casa-INIMIGOS',
    };

    return map[casa] ?? '';
  }



  private getCasaAtual(): string {
    const now = new Date();
    const month = now.getMonth() + 1; // 1..12
    const day = now.getDate();

    // Faixas: 16/01–15/02, 16/02–15/03, ... 16/12–15/01
    // Implementação baseada em (month/day) para evitar cálculos com anos.
    if (month === 1) return day >= 16 ? 'Casa da VIDA' : 'Casa dos INIMIGOS';
    if (month === 2) return day <= 15 ? 'Casa da VIDA' : 'Casa dos BENS';
    if (month === 3) return day <= 15 ? 'Casa dos BENS' : 'Casa do SANGUE';
    if (month === 4) return day <= 15 ? 'Casa do SANGUE' : 'Casa da SOLIDEZ';
    if (month === 5) return day <= 15 ? 'Casa da SOLIDEZ' : 'Casa dos FILHOS';
    if (month === 6) return day <= 15 ? 'Casa dos FILHOS' : 'Casa da SAÚDE';
    if (month === 7) return day <= 15 ? 'Casa da SAÚDE' : 'Casa do CASAMENTO';

    if (month === 8) return day <= 15 ? 'Casa do CASAMENTO' : 'Casa da MORTE/MUDANÇA';
    if (month === 9) return day <= 15 ? 'Casa da MORTE/MUDANÇA' : 'Casa DIVINA';
    if (month === 10) return day <= 15 ? 'Casa DIVINA' : 'Casa da POSIÇÃO SOCIAL';
    if (month === 11) return day <= 15 ? 'Casa da POSIÇÃO SOCIAL' : 'Casa dos AMIGOS';
    // month === 12
    return day <= 15 ? 'Casa dos AMIGOS' : 'Casa dos INIMIGOS';
  }

  private getDescricaoCasaAtual(casa: string): string {
    return this.casasMap[casa] ?? '';
  }

  


  openCasasInfo() {
    this.isCasasModalOpen = true;
  }


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

