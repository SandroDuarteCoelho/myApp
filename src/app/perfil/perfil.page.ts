import { Component, OnInit } from '@angular/core';
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
  IonPopover,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';

export type Pessoa = {
  nome: string;
  apelido: string;
  localidade: string;
  grupo: string;
  eneagrama_tipo: number | string;
  data: string;
};

// (removido tipo duplicado que interrompia o decorator @Component)



@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,

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

    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,

    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,

    IonSearchbar,
    IonSelect,
    IonSelectOption,

    IonGrid,
    IonRow,
    IonCol
  ],
})




export class PerfilPage implements OnInit {


  primeiroNome = '';
  ultimoNome = '';
  dataNascimento = '';
  localidade = '';
  grupo = '';
  eneagrama = '';

  // Lista (pessoas.json)
  people: Pessoa[] = [];
  searchText = '';
  selectedGroup = '';
  grupos: string[] = [];

  constructor(private readonly http: HttpClient) {}

  ngOnInit() {
    this.http.get<Pessoa[]>('assets/data/pessoas.json').subscribe({
      next: (data) => {
        this.people = data;

        // grupos únicos
        this.grupos = [...new Set(data.map((p) => p.grupo))];
      },
      error: (err) => {
        console.error('Erro ao carregar pessoas.json', err);
      },
    });
  }


  voltar() {
    window.location.href = '/oracao-perdao';
  }

  guardar() {

    console.log({
       primeiroNome: this.primeiroNome,
    ultimoNome: this.ultimoNome,
    dataNascimento: this.dataNascimento,
    localidade: this.localidade,
    eneagrama: this.eneagrama,
    grupo: this.grupo
    });

  }

  filteredPeople(): Pessoa[] {
    const search = this.searchText.trim().toLowerCase();

    return this.people.filter((p) => {
      const matchesGroup = !this.selectedGroup || p.grupo === this.selectedGroup;

      const matchesSearch =
        !search ||
        (p.nome ?? '').toLowerCase().includes(search) ||
        (p.apelido ?? '').toLowerCase().includes(search);

      return matchesGroup && matchesSearch;
    });
  }

}

