
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonGrid,
  IonRow,
  IonCol,
  IonSpinner
} from '@ionic/angular/standalone';


import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  gitCompareOutline,
  peopleOutline
} from 'ionicons/icons';

type Pessoa = {
  id: number;
  nome: string;
  apelido: string;
  localidade: string;
  grupo: string;
  eneagrama_tipo: number | string;
  data: string;
};

type PessoaSemId = Omit<Pessoa, 'id'>;

@Component({
  selector: 'app-comparar-perfis',
  templateUrl: './comparar-perfis.page.html',
  styleUrls: ['./comparar-perfis.page.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonGrid,
    IonRow,
    IonCol,
    IonSpinner
  ]
})
export class CompararPerfisPage implements OnInit {

  private readonly STORAGE_KEY_OVERRIDES = 'pessoas_overrides_v1';
  private readonly STORAGE_KEY_DELETED = 'pessoas_deleted_v1';

  pessoas: Pessoa[] = [];

  pessoaAId: number | null = null;
  pessoaBId: number | null = null;

  carregando = true;
  erro = '';

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly location: Location
  ) {addIcons({
    arrowBackOutline,
    checkmarkCircleOutline,
    gitCompareOutline,
    peopleOutline
  });}

  ngOnInit(): void {
    this.carregarPessoas();
  }

  private carregarPessoas(): void {
    let overrides: Record<number, PessoaSemId> = {};
    let apagados = new Set<number>();

    try {
      const raw = localStorage.getItem(
        this.STORAGE_KEY_OVERRIDES
      );

      overrides = raw
        ? JSON.parse(raw) as Record<number, PessoaSemId>
        : {};
    } catch {
      overrides = {};
    }

    try {
      const raw = localStorage.getItem(
        this.STORAGE_KEY_DELETED
      );

      const ids = raw ? JSON.parse(raw) as number[] : [];
      apagados = new Set<number>(ids);
    } catch {
      apagados = new Set<number>();
    }

    this.http.get<PessoaSemId[]>('assets/data/pessoas.json')
      .subscribe({
        next: (dados) => {
          const base: Pessoa[] = dados.map((p, indice) => {
            const id = indice + 1;
            const override = overrides[id];

            return {
              id,
              ...p,
              ...(override ?? {})
            };
          });

          const idsBase = new Set(base.map(p => p.id));

          const resultado = base.filter(
            p => !apagados.has(p.id)
          );

          for (const [idTexto, pessoa] of Object.entries(overrides)) {
            const id = Number(idTexto);

            if (
              !idsBase.has(id) &&
              !apagados.has(id)
            ) {
              resultado.push({
                id,
                ...pessoa
              });
            }
          }

          this.pessoas = resultado.sort((a, b) => {
            const nomeA = `${a.nome} ${a.apelido}`.trim();
            const nomeB = `${b.nome} ${b.apelido}`.trim();

            return nomeA.localeCompare(nomeB, 'pt-PT');
          });

          this.carregando = false;
          this.cdr.markForCheck();
        },
        error: (erro) => {
          console.error('Erro ao carregar perfis:', erro);
          this.erro = 'Não foi possível carregar os perfis.';
          this.carregando = false;
          this.cdr.markForCheck();
        }
      });
  }

  get pessoaA(): Pessoa | undefined {
    return this.pessoas.find(p => p.id === this.pessoaAId);
  }

  get pessoaB(): Pessoa | undefined {
    return this.pessoas.find(p => p.id === this.pessoaBId);
  }

  get podeComparar(): boolean {
    return (
      this.pessoaAId !== null &&
      this.pessoaBId !== null &&
      this.pessoaAId !== this.pessoaBId &&
      !!this.pessoaA &&
      !!this.pessoaB
    );
  }

  get mesmoGrupo(): boolean {
    return !!this.pessoaA &&
      !!this.pessoaB &&
      this.pessoaA.grupo === this.pessoaB.grupo;
  }

  get mesmoEneagrama(): boolean {
    return !!this.pessoaA &&
      !!this.pessoaB &&
      String(this.pessoaA.eneagrama_tipo) ===
      String(this.pessoaB.eneagrama_tipo);
  }

  nomeCompleto(pessoa: Pessoa | undefined): string {
    if (!pessoa) {
      return '';
    }

    return `${pessoa.nome ?? ''} ${pessoa.apelido ?? ''}`.trim();
  }

  valor(pessoa: Pessoa | undefined, campo: keyof Pessoa): string {
    if (!pessoa) {
      return '—';
    }

    const valor = pessoa[campo];

    if (valor === null || valor === undefined || valor === '') {
      return 'Não indicado';
    }

    return String(valor);
  }

  voltar(): void {
    this.location.back();
  }
}
