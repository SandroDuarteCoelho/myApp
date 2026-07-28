import { Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { HttpClient } from '@angular/common/http';


import {

  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonItem,
  IonLabel,
  IonAccordion,
  IonAccordionGroup

} from '@ionic/angular/standalone';





interface Residencia {


  numero:number;


  titulo:string;


  descricao:string;


}







@Component({


  selector:'app-casa-porta',


  templateUrl:'./casa-porta.page.html',


  styleUrls:['./casa-porta.page.scss'],


  standalone:true,



  imports:[


    CommonModule,


    FormsModule,


    IonHeader,

    IonToolbar,

    IonTitle,

    IonContent,

    IonButton,

    IonButtons,

    IonItem,

    IonLabel,

    IonAccordion,

    IonAccordionGroup


  ]


})



export class CasaPortaPage implements OnInit {





  residencias:Residencia[] = [];





  constructor(

    private http:HttpClient

  ){}





  ngOnInit(){


    this.carregarResidencias();


  }







  carregarResidencias(){



    this.http

    .get<any>('assets/data/residencias.json')


    .subscribe({




      next:(dados)=>{



        console.log(

          'JSON residencias:',

          dados

        );




        this.residencias =

          dados.residencias;



      },





      error:(erro)=>{


        console.error(

          'Erro ao carregar residencias:',

          erro

        );



      }



    });



  }







  voltar(){


    window.history.back();


  }





}