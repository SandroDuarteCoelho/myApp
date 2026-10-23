
import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy
} from '@angular/core';

import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

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
  IonSpinner,
  IonAccordionGroup,
  IonAccordion
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  checkmarkCircleOutline,
  gitCompareOutline,
  peopleOutline,
  calendarOutline,
  personOutline
} from 'ionicons/icons';

type Pessoa = {
  id: number;
  nome: string;
  apelido: string;
  localidade: string;
  grupo: string;
  eneagrama_tipo: number | string;
  data: string;
  [campo: string]: any;
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
    IonSpinner,
    IonAccordionGroup,
    IonAccordion
  ]
})
export class CompararPerfisPage implements OnInit, OnDestroy {

  private readonly STORAGE_KEY_OVERRIDES = 'pessoas_overrides_v1';
  private readonly STORAGE_KEY_DELETED = 'pessoas_deleted_v1';

  private rotaSubscription?: Subscription;

  private idsParticipantesRecebidos: number[] = [];

  pessoas: Pessoa[] = [];

  pessoaAId: number | null = null;
  pessoaBId: number | null = null;

  filtroLocalidadeA = '';
  filtroGrupoA = '';

  filtroLocalidadeB = '';
  filtroGrupoB = '';

  carregando = true;
  erro = '';

  eventoOrigem = '';
  dataEvento = '';

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef,
    private readonly location: Location,
    private readonly route: ActivatedRoute
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      gitCompareOutline,
      peopleOutline,
      calendarOutline,
      personOutline
    });
  }

  ngOnInit(): void {
    this.rotaSubscription = this.route.queryParamMap.subscribe(params => {
      this.eventoOrigem =
        params.get('evento') ??
        params.get('eventoTexto') ??
        '';

      this.dataEvento = params.get('data') ?? '';

      const idsTexto =
        params.get('participantesIds') ??
        params.get('pessoasIds') ??
        '';

      this.idsParticipantesRecebidos = this.lerIdsParticipantes(idsTexto);

      this.cdr.markForCheck();
    });

    this.carregarPessoas();
  }

  ngOnDestroy(): void {
    this.rotaSubscription?.unsubscribe();
  }

  private lerIdsParticipantes(valor: string): number[] {
    if (!valor.trim()) {
      return [];
    }

    let valores: unknown[] = [];

    try {
      const descodificado = JSON.parse(valor);

      if (Array.isArray(descodificado)) {
        valores = descodificado;
      } else if (descodificado !== null && descodificado !== undefined) {
        valores = [descodificado];
      }
    } catch {
      valores = valor.split(',');
    }

    return [
      ...new Set(
        valores
          .map(id => Number(id))
          .filter(id => Number.isFinite(id) && id > 0)
      )
    ];
  }

  private carregarPessoas(): void {
    let overrides: Record<number, PessoaSemId> = {};
    let apagados = new Set<number>();

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_OVERRIDES);

      overrides = raw
        ? JSON.parse(raw) as Record<number, PessoaSemId>
        : {};
    } catch {
      overrides = {};
    }

    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_DELETED);
      const ids = raw ? JSON.parse(raw) as number[] : [];

      apagados = new Set<number>(
        ids.map(id => Number(id))
      );
    } catch {
      apagados = new Set<number>();
    }

    this.http
      .get<PessoaSemId[] | { pessoas: PessoaSemId[] }>(
        'assets/data/pessoas.json'
      )
      .subscribe({
        next: dados => {
          const listaBase = Array.isArray(dados)
            ? dados
            : dados?.pessoas ?? [];

          const base: Pessoa[] = listaBase.map((p, indice) => {
            const id = indice + 1;
            const override = overrides[id];

            return {
              ...p,
              ...(override ?? {}),
              id
            } as Pessoa;
          });

          const idsBase = new Set(base.map(p => p.id));

          const resultado = base.filter(p => !apagados.has(p.id));

          for (const [idTexto, pessoa] of Object.entries(overrides)) {
            const id = Number(idTexto);

            if (
              Number.isFinite(id) &&
              id > 0 &&
              !idsBase.has(id) &&
              !apagados.has(id)
            ) {
              resultado.push({
                ...pessoa,
                id
              } as Pessoa);
            }
          }

          this.pessoas = resultado.sort((a, b) => {
            const nomeA = `${a.nome ?? ''} ${a.apelido ?? ''}`.trim();
            const nomeB = `${b.nome ?? ''} ${b.apelido ?? ''}`.trim();

            return nomeA.localeCompare(nomeB, 'pt-PT');
          });

          this.carregando = false;
          this.cdr.markForCheck();
        },

        error: erro => {
          console.error('Erro ao carregar perfis:', erro);

          this.erro = 'Não foi possível carregar os perfis.';
          this.carregando = false;

          this.cdr.markForCheck();
        }
      });
  }

  // Filtros disponíveis

  get localidades(): string[] {
    return [
      ...new Set(
        this.pessoas
          .map(p => (p.localidade ?? '').trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }

  get grupos(): string[] {
    return [
      ...new Set(
        this.pessoas
          .map(p => (p.grupo ?? '').trim())
          .filter(Boolean)
      )
    ].sort((a, b) => a.localeCompare(b, 'pt-PT'));
  }

  // Listas filtradas dos dois seletores tradicionais

  get pessoasFiltradasA(): Pessoa[] {
    return this.pessoas.filter(p =>
      (!this.filtroLocalidadeA ||
        (p.localidade ?? '').trim() === this.filtroLocalidadeA) &&
      (!this.filtroGrupoA ||
        (p.grupo ?? '').trim() === this.filtroGrupoA) &&
      p.id !== this.pessoaBId
    );
  }

  get pessoasFiltradasB(): Pessoa[] {
    return this.pessoas.filter(p =>
      (!this.filtroLocalidadeB ||
        (p.localidade ?? '').trim() === this.filtroLocalidadeB) &&
      (!this.filtroGrupoB ||
        (p.grupo ?? '').trim() === this.filtroGrupoB) &&
      p.id !== this.pessoaAId
    );
  }

  // Perfis selecionados na comparação tradicional

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

  // Participantes do evento recebido pela rota

  get temEvento(): boolean {
    return this.idsParticipantesRecebidos.length > 0;
  }

  get participantesEvento(): Pessoa[] {
    return this.idsParticipantesRecebidos
      .filter(id => id !== this.pessoaAId)
      .map(id => this.pessoas.find(p => p.id === id))
      .filter((p): p is Pessoa => !!p);
  }

  get idsParticipantesNaoEncontrados(): number[] {
    return this.idsParticipantesRecebidos.filter(id =>
      !this.pessoas.some(p => p.id === id)
    );
  }

  get podeCompararComParticipantes(): boolean {
    return !!this.pessoaA && this.participantesEvento.length > 0;
  }

  alterarPessoaA(): void {
    if (this.pessoaAId === this.pessoaBId) {
      this.pessoaBId = null;
    }

    this.cdr.markForCheck();
  }

  alterarPessoaB(): void {
    if (this.pessoaAId === this.pessoaBId) {
      this.pessoaBId = null;
    }

    this.cdr.markForCheck();
  }

  // Semelhanças da comparação tradicional

  get mesmoGrupo(): boolean {
    return !!this.pessoaA &&
      !!this.pessoaB &&
      (this.pessoaA.grupo ?? '') === (this.pessoaB.grupo ?? '');
  }

  get mesmoEneagrama(): boolean {
    return !!this.pessoaA &&
      !!this.pessoaB &&
      String(this.pessoaA.eneagrama_tipo ?? '') ===
      String(this.pessoaB.eneagrama_tipo ?? '');
  }

  mesmoGrupoCom(pessoa: Pessoa): boolean {
    return !!this.pessoaA &&
      (this.pessoaA.grupo ?? '') === (pessoa.grupo ?? '');
  }

  mesmoEneagramaCom(pessoa: Pessoa): boolean {
    return !!this.pessoaA &&
      String(this.pessoaA.eneagrama_tipo ?? '') ===
      String(pessoa.eneagrama_tipo ?? '');
  }

  // Alterações dos filtros

  alterarFiltroLocalidadeA(): void {
    if (
      this.pessoaA &&
      this.filtroLocalidadeA &&
      (this.pessoaA.localidade ?? '').trim() !== this.filtroLocalidadeA
    ) {
      this.pessoaAId = null;
    }

    this.cdr.markForCheck();
  }

  alterarFiltroGrupoA(): void {
    if (
      this.pessoaA &&
      this.filtroGrupoA &&
      (this.pessoaA.grupo ?? '').trim() !== this.filtroGrupoA
    ) {
      this.pessoaAId = null;
    }

    this.cdr.markForCheck();
  }

  alterarFiltroLocalidadeB(): void {
    if (
      this.pessoaB &&
      this.filtroLocalidadeB &&
      (this.pessoaB.localidade ?? '').trim() !== this.filtroLocalidadeB
    ) {
      this.pessoaBId = null;
    }

    this.cdr.markForCheck();
  }

  alterarFiltroGrupoB(): void {
    if (
      this.pessoaB &&
      this.filtroGrupoB &&
      (this.pessoaB.grupo ?? '').trim() !== this.filtroGrupoB
    ) {
      this.pessoaBId = null;
    }

    this.cdr.markForCheck();
  }

  // Funções auxiliares

  nomeCompleto(pessoa: Pessoa | undefined): string {
    if (!pessoa) {
      return '';
    }

    return `${pessoa.nome ?? ''} ${pessoa.apelido ?? ''}`.trim();
  }

  valor(
    pessoa: Pessoa | undefined,
    campo: keyof Pessoa
  ): string {
    if (!pessoa) {
      return '';
    }

    const valor = pessoa[campo];

    if (
      valor === null ||
      valor === undefined ||
      String(valor).trim() === ''
    ) {
      return 'Não indicado';
    }

    return String(valor);
  }

  voltar(): void {
    this.location.back();
  }
}
