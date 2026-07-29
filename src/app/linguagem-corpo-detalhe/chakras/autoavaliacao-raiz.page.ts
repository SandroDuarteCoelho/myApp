import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpClient } from '@angular/common/http';

import {

  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonToggle

} from '@ionic/angular/standalone';



interface Pergunta {

  id:string;
  texto:string;

}



interface Coluna {

  id:string;
  titulo:string;

}



interface Grupo {

  id:string;
  titulo:string;
  colunas:Coluna[];
  perguntas:Pergunta[];

}




@Component({

  selector:'app-autoavaliacao-raiz',

  templateUrl:'./autoavaliacao-raiz.page.html',

  styleUrls:['./autoavaliacao-raiz.page.scss'],

  standalone:true,


  imports:[

    CommonModule,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonToggle

  ]

})



export class AutoavaliacaoRaizPage implements OnInit {



  // perguntas carregadas

  grupos:Grupo[]=[];



  // respostas do utilizador

  respostas:any={};



  // resultados finais

  totalA=0;
  totalB=0;
  totalC=0;
  totalD=0;
  totalE=0;



  resultados:any={};



  interpretacoes:any={};



  mostrarResultado=false;





  constructor(

    private http:HttpClient

  ){}





  ngOnInit(){


    this.carregarQuestionario();

    this.carregarResultados();


  }







  voltar(){

    window.history.back();

  }








  carregarQuestionario(){



    this.http

    .get<any>('assets/data/autoavaliacoes.json')

    .subscribe({



      next:(dados)=>{


        const chakra =

        dados.chakras.find(

          (x:any)=>

          x.id==='raiz'

        );



        this.grupos =
        chakra.grupos;



        // cria estrutura inicial

        this.grupos.forEach(

          grupo=>{


            grupo.perguntas.forEach(

              pergunta=>{


                this.respostas[pergunta.id]={

                  A:false,
                  B:false,
                  C:false,
                  D:false,
                  E:false

                };


              }

            );


          }

        );



      },


      error:(erro)=>{


        console.error(

          'Erro ao carregar questionário',

          erro

        );


      }


    });



  }









  carregarResultados(){



    this.http

    .get<any>('assets/data/resultados.json')

    .subscribe({



      next:(dados)=>{


        this.resultados =

        dados.chakras.raiz;



      },


      error:(erro)=>{


        console.error(

          'Erro resultados',

          erro

        );


      }


    });



  }









  calcular(){



    this.totalA=0;
    this.totalB=0;
    this.totalC=0;
    this.totalD=0;
    this.totalE=0;





    Object.keys(this.respostas)

    .forEach(id=>{


      const resposta =

      this.respostas[id];



      if(resposta.A)
        this.totalA++;


      if(resposta.B)
        this.totalB++;


      if(resposta.C)
        this.totalC++;


      if(resposta.D)
        this.totalD++;


      if(resposta.E)
        this.totalE++;



    });




    this.gerarInterpretacoes();



    this.mostrarResultado=true;



  }









  buscarIntervalo(

    valor:number,

    dados:any

  ){


    return dados.intervalos.find(

      (item:any)=>

      valor >= item.min &&

      valor <= item.max


    );


  }









  gerarInterpretacoes(){



    /*
      Coluna A
    */


    this.interpretacoes.A =

    this.buscarIntervalo(

      this.totalA,

      this.resultados.A

    );






    /*
      Coluna D
    */


    this.interpretacoes.D =

    this.buscarIntervalo(

      this.totalD,

      this.resultados.D

    );







    /*
      Coluna B
    */


    this.interpretacoes.B =

    this.resultados.B.comparacoes.find(

      (item:any)=>{


        if(

          item.condicao ===

          'menor_ou_igual_A'

        ){

          return this.totalB <= this.totalA;

        }


        if(

          item.condicao ===

          'maior_A'

        ){

          return this.totalB > this.totalA;

        }


        return false;


      }


    );








    /*
      Coluna C
    */


    this.interpretacoes.C =

    this.resultados.C.comparacoes.find(

      (item:any)=>{


        if(

          item.condicao ===

          'menor_A'

        ){

          return this.totalC < this.totalA;

        }


        if(

          item.condicao ===

          'maior_A'

        ){

          return this.totalC > this.totalA;

        }


        return false;


      }


    );










    /*
      Coluna E
    */


    this.interpretacoes.E =

    this.resultados.E.comparacoes.find(

      (item:any)=>{


        if(

          item.condicao ===

          'menor_ou_igual_D'

        ){

          return this.totalE <= this.totalD;

        }


        if(

          item.condicao ===

          'maior_D'

        ){

          return this.totalE > this.totalD;

        }


        return false;


      }


    );



  }



}