import { Component, OnInit, ViewChild } from '@angular/core';


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

export type PessoaPersistida = Pessoa & { id: number };

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

  // Fonte: pessoas.json + persistência local via localStorage
  private readonly STORAGE_KEY_OVERRIDES = 'pessoas_overrides_v1';
  private readonly STORAGE_KEY_DELETED = 'pessoas_deleted_v1';

  people: PessoaPersistida[] = [];
  searchText = '';
  selectedGroup = '';
  selectedLocalidade = '';
  grupos: string[] = [];
  localidades: string[] = [];


  private overrides: Record<number, Pessoa> = {};
  private deletedIds = new Set<number>();

  // popover (criar/editar)
  popoverMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;

  @ViewChild(IonPopover) popover?: IonPopover;



  // ids baseados em índice do JSON; quando criamos, atribuímos o próximo id



  private abrirCriarPopoverUI(): void {

    // limpar campos
    this.popoverMode = 'create';
    this.editingId = null;

    this.primeiroNome = '';
    this.ultimoNome = '';
    this.dataNascimento = '';
    this.localidade = '';
    this.grupo = '';
    this.eneagrama = '';
  }

  // Se o botão "Criar novo" aparecer na UI, pode chamar esta função.
  abrirCriar(): void {
    this.abrirCriarPopover();
  }

  private abrirCriarPopover(): void {
    this.abrirCriarPopoverUI();

    // dispara UI caso o popover exista no DOM
    this.popover?.present();
  }

  private fecharPopover(): void {
    this.popover?.dismiss();
  }



  constructor(private readonly http: HttpClient) {}


  ngOnInit() {
    this.loadOverrides();
    this.loadDeleted();

    this.http.get<Pessoa[]>('assets/data/pessoas.json').subscribe({
      next: (data) => {
        // id = índice + 1 (já que JSON não tem id)
        const base: PessoaPersistida[] = data.map((p, i) => ({ id: i + 1, ...p }));

        // aplica overrides persistidos
        this.people = base.map((p) => {
          const ov = this.overrides[p.id];
          return ov ? ({ ...p, ...ov } as PessoaPersistida) : p;
        });

        this.grupos = [...new Set(this.people.map((p) => p.grupo))];
        this.localidades = [...new Set(this.people.map((p) => p.localidade))];

      },
      error: (err) => {
        console.error('Erro ao carregar pessoas.json', err);
      },
    });
  }

  private loadOverrides(): void {
    try {
      const raw = window.localStorage.getItem(this.STORAGE_KEY_OVERRIDES);
      this.overrides = raw ? (JSON.parse(raw) as Record<number, Pessoa>) : {};
    } catch {
      this.overrides = {};
    }
  }

  private persistOverrides(): void {
    window.localStorage.setItem(
      this.STORAGE_KEY_OVERRIDES,
      JSON.stringify(this.overrides)
    );
  }

  private loadDeleted(): void {
    try {
      const raw = window.localStorage.getItem(this.STORAGE_KEY_DELETED);
      const arr = raw ? (JSON.parse(raw) as number[]) : [];
      this.deletedIds = new Set(arr);
    } catch {
      this.deletedIds = new Set<number>();
    }
  }

  private persistDeleted(): void {
    window.localStorage.setItem(
      this.STORAGE_KEY_DELETED,
      JSON.stringify(Array.from(this.deletedIds))
    );
  }

  voltar() {
    window.location.href = '/oracao-perdao';
  }



  guardar() {

    const payload: Pessoa = {

    nome: this.primeiroNome.trim(),
    apelido: this.ultimoNome.trim(),
    data: this.dataNascimento,
    localidade: this.localidade.trim(),
    grupo: this.grupo.trim(),
    eneagrama_tipo: this.eneagrama.trim(),
  };


  // 🟡 EDITAR
  if (this.popoverMode === 'edit' && this.editingId) {

    this.overrides[this.editingId] = payload;
    this.persistOverrides();

    this.people = this.people.map((p) =>
      p.id === this.editingId
        ? ({ ...p, ...payload } as PessoaPersistida)
        : p
    );

    this.editingId = null;
    this.popoverMode = 'create';

  }

  // 🟢 CRIAR (ESTAVA EM FALTA!)
  else {

    const newId = Math.max(...this.people.map(p => p.id), 0) + 1;


    const newPerson: PessoaPersistida = {
      id: newId,
      ...payload
    };

    this.people = [newPerson, ...this.people];
  }

  // 🔥 IMPORTANTE: limpar form sempre
  this.primeiroNome = '';
  this.ultimoNome = '';
  this.dataNascimento = '';
  this.localidade = '';
  this.grupo = '';
    this.eneagrama = '';

  // fecha o popover após gravar
  this.fecharPopover();
  }



  filteredPeople(): PessoaPersistida[] {
    const search = this.searchText.trim().toLowerCase();

    return this.people
      .filter((p) => !this.deletedIds.has(p.id))
      .filter((p) => {
        const matchesGroup = !this.selectedGroup || p.grupo === this.selectedGroup;
        const matchesLocalidade = !this.selectedLocalidade || p.localidade === this.selectedLocalidade;

        const matchesSearch =
          !search ||
          (p.nome ?? '').toLowerCase().includes(search) ||
          (p.apelido ?? '').toLowerCase().includes(search);

        return matchesGroup && matchesLocalidade && matchesSearch;
      });

  }

  abrirEditar(p: PessoaPersistida): void {
    this.popoverMode = 'edit';
    this.editingId = p.id;

    this.primeiroNome = p.nome ?? '';
    this.ultimoNome = p.apelido ?? '';
    this.dataNascimento = p.data ?? '';
    this.localidade = p.localidade ?? '';
    this.grupo = p.grupo ?? '';
    this.eneagrama = String(p.eneagrama_tipo ?? '');

    // abre o mesmo popover em modo edição
    this.popover?.present();
  }


  escolher(p: PessoaPersistida): void {
    window.location.href = `/pessoa/${p.id}`;
  }

  apagar(p: PessoaPersistida): void {
    if (!confirm(`Apagar ${p.nome} ${p.apelido}?`)) return;

    this.deletedIds.add(p.id);
    this.persistDeleted();

    this.people = this.people.filter((x) => x.id !== p.id);
  }


}

