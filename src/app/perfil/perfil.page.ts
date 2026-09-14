import {
  Component,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule
} from '@angular/common/http';

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
  IonCol
} from '@ionic/angular/standalone';


export type Pessoa = {

  nome: string;

  apelido: string;

  localidade: string;

  grupo: string;

  eneagrama_tipo: number | string;

  data: string;

};


export type PessoaPersistida = Pessoa & {

  id: number;

};


@Component({

  selector: 'app-perfil',

  templateUrl: './perfil.page.html',

  styleUrls: ['./perfil.page.scss'],

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

  ]

})


export class PerfilPage implements OnInit {


  primeiroNome = '';

  ultimoNome = '';

  dataNascimento = '';

  localidade = '';

  grupo = '';

  eneagrama = '';


  // =========================================================
  // PERSISTÊNCIA
  // =========================================================

  private readonly STORAGE_KEY_OVERRIDES =
    'pessoas_overrides_v1';

  private readonly STORAGE_KEY_DELETED =
    'pessoas_deleted_v1';


  people: PessoaPersistida[] = [];


  /*
   * NOVO:
   *
   * Esta é a lista efetivamente apresentada no HTML.
   *
   * Antes o HTML executava filteredPeople() constantemente.
   * Agora a lista só é recalculada quando necessário.
   */

  filteredPeopleList: PessoaPersistida[] = [];


  searchText = '';

  selectedGroup = '';

  selectedLocalidade = '';

  grupos: string[] = [];

  localidades: string[] = [];


  private overrides: Record<number, Pessoa> = {};

  private deletedIds = new Set<number>();


  // =========================================================
  // POPOVER
  // =========================================================

  popoverMode: 'create' | 'edit' = 'create';

  editingId: number | null = null;


  @ViewChild(IonPopover)
  popover?: IonPopover;


  // =========================================================
  // CONSTRUTOR
  // =========================================================

  constructor(

    private readonly http: HttpClient,

    private readonly cdr: ChangeDetectorRef

  ) {}


  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {

    this.loadOverrides();

    this.loadDeleted();


    this.http
      .get<Pessoa[]>('assets/data/pessoas.json')
      .subscribe({

        next: (data) => {


          // -------------------------------------------------
          // PERFIS BASE DO JSON
          // -------------------------------------------------

          const base: PessoaPersistida[] = data.map(
            (p, i) => ({

              id: i + 1,

              ...p

            })
          );


          // -------------------------------------------------
          // APLICAR ALTERAÇÕES GUARDADAS
          // -------------------------------------------------

          this.people = base.map((p) => {

            const ov = this.overrides[p.id];

            return ov

              ? ({
                  ...p,
                  ...ov
                } as PessoaPersistida)

              : p;

          });


          // -------------------------------------------------
          // ADICIONAR PERFIS CRIADOS LOCALMENTE
          // -------------------------------------------------

          const idsBase = new Set(
            base.map((p) => p.id)
          );


          for (
            const [idStr, pessoa]
            of Object.entries(this.overrides)
          ) {

            const id = Number(idStr);


            if (!idsBase.has(id)) {

              this.people.unshift({

                id,

                ...pessoa

              });

            }

          }


          // -------------------------------------------------
          // FILTROS
          // -------------------------------------------------

          this.atualizarFiltros();


          // -------------------------------------------------
          // CONSTRUIR LISTA VISÍVEL
          // -------------------------------------------------

          this.atualizarLista();


          /*
           * Como estamos a utilizar OnPush,
           * garantimos que o Angular verifica a alteração.
           */

          this.cdr.markForCheck();

        },


        error: (err) => {

          console.error(
            'Erro ao carregar pessoas.json',
            err
          );

        }

      });

  }

// =========================================================
// LOCAL STORAGE - OVERRIDES
// =========================================================

private loadOverrides(): void {

  try {

    const raw = window.localStorage.getItem(
      this.STORAGE_KEY_OVERRIDES
    );

    this.overrides = raw
      ? (JSON.parse(raw) as Record<number, Pessoa>)
      : {};

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


// =========================================================
// LOCAL STORAGE - APAGADOS
// =========================================================

private loadDeleted(): void {

  try {

    const raw = window.localStorage.getItem(
      this.STORAGE_KEY_DELETED
    );

    const arr = raw
      ? (JSON.parse(raw) as number[])
      : [];

    this.deletedIds = new Set<number>(arr);

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


  // =========================================================
  // FILTROS
  // =========================================================

  private atualizarFiltros(): void {

    this.grupos = [

      ...new Set(
        this.people.map(
          (p) => p.grupo
        )
      )

    ];


    this.localidades = [

      ...new Set(
        this.people.map(
          (p) => p.localidade
        )
      )

    ];

  }


  // =========================================================
  // ATUALIZAR LISTA
  // =========================================================

  atualizarLista(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.filteredPeopleList = this.people

      // -----------------------------------------------------
      // REMOVER PERFIS APAGADOS
      // -----------------------------------------------------

      .filter(
        (p) =>
          !this.deletedIds.has(p.id)
      )


      // -----------------------------------------------------
      // FILTROS + PESQUISA
      // -----------------------------------------------------

      .filter((p) => {


        const matchesGroup =

          !this.selectedGroup ||

          p.grupo ===
            this.selectedGroup;


        const matchesLocalidade =

          !this.selectedLocalidade ||

          p.localidade ===
            this.selectedLocalidade;


        const matchesSearch =

          !search ||

          (p.nome ?? '')
            .toLowerCase()
            .includes(search)

          ||

          (p.apelido ?? '')
            .toLowerCase()
            .includes(search);


        return (

          matchesGroup &&

          matchesLocalidade &&

          matchesSearch

        );

      });


    /*
     * Necessário devido ao OnPush quando
     * atualizarLista() é chamada por código.
     */

    this.cdr.markForCheck();

  }


  // =========================================================
  // TRACKBY
  // =========================================================

  trackByPessoaId(_: number, pessoa: PessoaPersistida): number {
  return pessoa.id;
}


  // =========================================================
  // NAVEGAÇÃO
  // =========================================================

  voltar(): void {

    window.location.href =
      '/oracao-perdao';

  }


  abrirSignos(): void {

    window.location.href =
      '/signos';

  }


  abrirEneagrama(): void {

    window.location.href =
      '/eneagrama';

  }


  // =========================================================
  // CRIAR
  // =========================================================

  private abrirCriarPopoverUI(): void {

    this.popoverMode = 'create';

    this.editingId = null;


    this.primeiroNome = '';

    this.ultimoNome = '';

    this.dataNascimento = '';

    this.localidade = '';

    this.grupo = '';

    this.eneagrama = '';

  }


  abrirCriar(): void {

    this.abrirCriarPopover();

  }


  private abrirCriarPopover(): void {

    this.abrirCriarPopoverUI();

    this.popover?.present();

  }


  private fecharPopover(): void {

    this.popover?.dismiss();

  }


  // =========================================================
  // GUARDAR
  // =========================================================

  guardar(): void {


    // =======================================================
    // VALIDAR CRIAÇÃO
    // =======================================================

    if (
      this.popoverMode === 'create'
    ) {


      const requiredValues:
        Array<[string, string]> = [

          [
            'Primeiro nome',
            this.primeiroNome
          ],

          [
            'Último nome',
            this.ultimoNome
          ],

          [
            'Data nascimento',
            this.dataNascimento
          ],

          [
            'Localidade',
            this.localidade
          ],

          [
            'Grupo',
            this.grupo
          ],

          [
            'Eneagrama',
            this.eneagrama
          ]

        ];


      const missing =
        requiredValues

          .filter(
            ([, v]) =>
              (v ?? '')
                .toString()
                .trim() === ''
          )

          .map(
            ([label]) => label
          );


      if (missing.length) {

        alert(

          `Preencha todos os campos antes de guardar. ` +

          `Faltando: ${missing.join(', ')}`

        );

        return;

      }

    }


    // =======================================================
    // PAYLOAD
    // =======================================================

    const payload: Pessoa = {

      nome:
        this.primeiroNome.trim(),

      apelido:
        this.ultimoNome.trim(),

      data:
        this.dataNascimento,

      localidade:
        this.localidade.trim(),

      grupo:
        this.grupo.trim(),

      eneagrama_tipo:
        this.eneagrama.trim()

    };


    // =======================================================
    // EDITAR
    // =======================================================

    if (

      this.popoverMode === 'edit' &&

      this.editingId

    ) {


      this.overrides[
        this.editingId
      ] = payload;


      this.persistOverrides();


      this.people =
        this.people.map((p) =>

          p.id === this.editingId

            ? ({
                ...p,
                ...payload
              } as PessoaPersistida)

            : p

        );


      // Atualizar filtros

      this.atualizarFiltros();


      // Atualizar lista

      this.atualizarLista();


      this.editingId = null;

      this.popoverMode = 'create';

    }


    // =======================================================
    // CRIAR
    // =======================================================

    else {


      const newId =

        Math.max(

          ...this.people.map(
            (p) => p.id
          ),

          0

        ) + 1;


      // Guardar no localStorage

      this.overrides[newId] =
        payload;


      this.persistOverrides();


      // Criar pessoa

      const newPerson:
        PessoaPersistida = {

          id: newId,

          ...payload

        };


      this.people = [

        newPerson,

        ...this.people

      ];


      // Atualizar filtros

      this.atualizarFiltros();


      // Atualizar lista

      this.atualizarLista();

    }


    // =======================================================
    // LIMPAR FORMULÁRIO
    // =======================================================

    this.primeiroNome = '';

    this.ultimoNome = '';

    this.dataNascimento = '';

    this.localidade = '';

    this.grupo = '';

    this.eneagrama = '';


    // =======================================================
    // FECHAR POPOVER
    // =======================================================

    this.fecharPopover();


    this.cdr.markForCheck();

  }


  // =========================================================
  // EDITAR
  // =========================================================

  abrirEditar(
    p: PessoaPersistida
  ): void {


    this.popoverMode = 'edit';

    this.editingId = p.id;


    this.primeiroNome =
      p.nome ?? '';

    this.ultimoNome =
      p.apelido ?? '';

    this.dataNascimento =
      p.data ?? '';

    this.localidade =
      p.localidade ?? '';

    this.grupo =
      p.grupo ?? '';

    this.eneagrama =
      String(
        p.eneagrama_tipo ?? ''
      );


    this.popover?.present();

  }


  // =========================================================
  // ESCOLHER
  // =========================================================

  escolher(
    p: PessoaPersistida
  ): void {

    window.location.href =
      `/pessoa/${p.id}`;

  }


  // =========================================================
  // APAGAR
  // =========================================================

  apagar(
    p: PessoaPersistida
  ): void {


    if (

      !confirm(

        `Apagar ${p.nome} ${p.apelido}?`

      )

    ) {

      return;

    }


    this.deletedIds.add(
      p.id
    );


    this.persistDeleted();


    this.people =
      this.people.filter(
        (x) => x.id !== p.id
      );


    this.atualizarFiltros();

    this.atualizarLista();

  }


  // =========================================================
  // COMPARAR
  // =========================================================

  comparar(
    p: PessoaPersistida
  ): void {

    window.location.href =
      `/pessoa/${p.id}`;

  }



  // =========================================================
  // EXPORTAR TODOS
  // =========================================================

  exportarTudo(): void {


    const dados =
      this.people.filter(

        (p) =>
          !this.deletedIds.has(
            p.id
          )

      );


    const json =
      JSON.stringify(
        dados,
        null,
        2
      );


    const blob =
      new Blob(

        [json],

        {
          type:
            'application/json'
        }

      );


    const url =
      URL.createObjectURL(blob);


    const a =
      document.createElement('a');


    a.href = url;


    a.download =
      'perfis.json';


    a.click();


    URL.revokeObjectURL(url);

  }


}