import { CUSTOM_ELEMENTS_SCHEMA, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonSearchbar,
  IonList,
  IonItem,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';


@Component({
  selector: 'app-linguagem-corpo-detalhe',
  templateUrl: './linguagem-corpo-detalhe.page.html',
  styleUrls: ['./linguagem-corpo-detalhe.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,

    IonButton,
    IonButtons,

    IonSearchbar,
    IonList,
    IonItem,

    IonCard,
    IonCardContent,
  ],
})


export class LinguagemCorpoDetalhePage implements OnInit {


  constructor(
    private http: HttpClient
  ) {}



  textoPesquisa = '';

  indiceGlobal: any[] = [];

  resultados: any[] = [];

  doencaSelecionada: any = null;




  ngOnInit(): void {


    this.http
      .get<any[]>('assets/data/doencas/indice_global.json')

      .subscribe((dados)=>{

        this.indiceGlobal = dados;

      });


  }





  voltar(): void {

    window.history.back();

  }





  irLateralidade(): void {

    window.location.href = '/linguagem-corpo-detalhe/lateralidade';

  }





  chakras = [

    {
      id:'coronario',
      nome:'Chacra Coronário',
      cor:'#9b59b6'
    },

    {
      id:'terceiro-olho',
      nome:'Chacra Terceiro Olho',
      cor:'#5dade2'
    },

    {
      id:'garganta',
      nome:'Chacra Garganta',
      cor:'#3498db'
    },

    {
      id:'cardiaco',
      nome:'Chacra Cardíaco',
      cor:'#2ecc71'
    },

    {
      id:'plexo-solar',
      nome:'Chacra Plexo Solar',
      cor:'#f1c40f'
    },

    {
      id:'sacral',
      nome:'Chacra Sacral',
      cor:'#e67e22'
    },

    {
      id:'raiz',
      nome:'Chacra Raiz',
      cor:'#e74c3c'
    },

    {
      id:'outros',
      nome:'Outros',
      cor:'#34495e'
    }

  ];





  selecionado:string|null = null;



  selecionarChacra(id:string):void {

    const rota = `/linguagem-corpo-detalhe/${id}`;

    window.location.href = rota;

  }





  pesquisar():void {


    const texto =
      this.textoPesquisa
      .trim()
      .toLowerCase();



    if(!texto){

      this.resultados=[];

      return;

    }



    this.resultados =
      this.indiceGlobal

      .filter(d =>
        d.nome
        .toLowerCase()
        .includes(texto)
      )

      .slice(0,20);


  }





  abrirDoenca(doenca:any):void {


    const caminho =
      `assets/data/doencas/${doenca.ficheiro}`;



    this.http
    .get<any>(caminho)

    .subscribe({

      next:(dados)=>{


        this.doencaSelecionada={

          ...dados,

          nome:doenca.nome

        };


        this.textoPesquisa='';

        this.resultados=[];


      },


      error:()=>{

        this.doencaSelecionada=null;

      }


    });


  }





  fecharDoenca():void {


    this.doencaSelecionada=null;


  }


}