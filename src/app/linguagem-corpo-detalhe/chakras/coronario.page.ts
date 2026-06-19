import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  IonLabel,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-chacra-coronario',
  templateUrl: './coronario.page.html',
  styleUrls: ['./coronario.page.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class CoronarioPage {
  voltar(): void {
    window.history.back();
  }

  irLateralidade(): void {
    window.location.href = '/linguagem-corpo-detalhe/lateralidade';
  }

  termoBusca = '';

  indiceCoronario: Array<{
    id: string;
    nome: string;
    ficheiro: string;
  }> = [];

  listaFiltrada: Array<{
    id: string;
    nome: string;
    ficheiro: string;
  }> = [];

  indiceCarregado = false;

  cache: {
    [key: string]: {
      significado: string;
      alimentos: any[];
      sistemico: string;
    };
  } = {};

  async ionViewWillEnter(): Promise<void> {
    await this.carregarIndice();
  }

  private async carregarIndice(): Promise<void> {
    try {
      const data = await fetch('assets/data/doencas/indice_coronario.json').then((r) => r.json());

      this.indiceCoronario = data;
      this.listaFiltrada = [...data];
      this.indiceCarregado = true;
    } catch (e) {
      console.error('Erro ao carregar índice', e);

      this.indiceCoronario = [];
      this.listaFiltrada = [];
      this.indiceCarregado = true;
    }
  }

  async selecionarDoenca(item: any): Promise<void> {
    console.log('Selecionado:', item);

    if (this.cache[item.id]) {
      return;
    }

    this.cache[item.id] = {
      significado: 'A carregar...',
      alimentos: [],
      sistemico: '',
    };

    try {
      const url = `assets/data/doencas/${item.ficheiro}`;

      console.log('A carregar:', url);

      const response = await fetch(url);
      const json = await response.json();

      console.log('JSON carregado:', json);

      this.cache[item.id] = {
        significado: json.significado ?? '',
        alimentos: json.alimentos ?? [],
        sistemico: json.sistemico ?? '',
      };
    } catch (e) {
      console.error('Erro ao carregar doença', e);

      this.cache[item.id] = {
        significado: 'Erro ao carregar dados.',
        alimentos: [],
        sistemico: '',
      };
    }
  }
}





