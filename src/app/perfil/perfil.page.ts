import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
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
  IonCol,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular/standalone';

import { Capacitor } from '@capacitor/core';
import {
  Filesystem,
  Directory,
  Encoding
} from '@capacitor/filesystem';

import { Share } from '@capacitor/share';


/* =====================================================
   TIPOS
   ===================================================== */

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


/*
 * Estrutura utilizada apenas durante a importação.
 *
 * O updatedAt não faz parte do Pessoa normal.
 * É utilizado para comparar qual versão do perfil
 * é mais recente.
 */
type PessoaImportada = PessoaPersistida & {
  updatedAt?: number;
};


/* =====================================================
   COMPONENTE
   ===================================================== */

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
    IonCol,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ]
})


export class PerfilPage implements OnInit {

  /* =====================================================
     FORMULÁRIO
     ===================================================== */

  primeiroNome = '';
  ultimoNome = '';
  dataNascimento = '';
  localidade = '';
  grupo = '';
  eneagrama = '';


  /* =====================================================
     STORAGE
     ===================================================== */

  private readonly STORAGE_KEY_OVERRIDES =
    'pessoas_overrides_v1';

  private readonly STORAGE_KEY_DELETED =
    'pessoas_deleted_v1';

  /*
   * Guarda a data/hora da última alteração de cada perfil.
   */
  private readonly STORAGE_KEY_UPDATED =
    'pessoas_updated_v1';


  /* =====================================================
     PERFIS
     ===================================================== */

  people: PessoaPersistida[] = [];

  filteredPeopleList: PessoaPersistida[] = [];

  visiblePeople: PessoaPersistida[] = [];


  /* =====================================================
     PAGINAÇÃO
     ===================================================== */

  private readonly PAGE_SIZE = 30;

  private visibleCount = this.PAGE_SIZE;

  hasMorePeople = false;


  /* =====================================================
     FILTROS
     ===================================================== */

  searchText = '';

  selectedGroup = '';

  selectedLocalidade = '';

  grupos: string[] = [];

  localidades: string[] = [];


  /* =====================================================
     OVERRIDES / APAGADOS / ALTERAÇÕES
     ===================================================== */

  private overrides: Record<number, Pessoa> = {};

  private deletedIds = new Set<number>();

  /*
   * ID -> timestamp da última alteração.
   *
   * Exemplo:
   *
   * {
   *   "1": 1757910000000,
   *   "2": 1757911000000
   * }
   */
  private updatedAt: Record<number, number> = {};


  /* =====================================================
     POPOVER
     ===================================================== */

  popoverMode: 'create' | 'edit' = 'create';

  editingId: number | null = null;


  /* =====================================================
     ELEMENTOS HTML
     ===================================================== */

  @ViewChild(IonPopover)
  popover?: IonPopover;

  @ViewChild('fileInput')
  fileInput?: ElementRef<HTMLInputElement>;


  /* =====================================================
     CONSTRUTOR
     ===================================================== */

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef
  ) {}


  /* =====================================================
     INICIALIZAÇÃO
     ===================================================== */

  ngOnInit(): void {

    this.loadOverrides();

    this.loadDeleted();

    this.loadUpdatedAt();


    this.http
      .get<Pessoa[]>('assets/data/pessoas.json')
      .subscribe({

        next: (data) => {

          const base: PessoaPersistida[] =
            data.map((p, i) => ({
              id: i + 1,
              ...p
            }));


          /*
           * Aplicar alterações locais aos perfis
           * existentes no pessoas.json.
           */
          this.people = base.map((p) => {

            const ov = this.overrides[p.id];

            return ov
              ? ({
                  ...p,
                  ...ov
                } as PessoaPersistida)
              : p;

          });


          const idsBase =
            new Set(base.map(p => p.id));


          /*
           * Adicionar perfis criados localmente
           * que não existem no pessoas.json.
           *
           * Perfis apagados não voltam a aparecer.
           */
          for (
            const [idStr, pessoa]
            of Object.entries(this.overrides)
          ) {

            const id = Number(idStr);


            if (
              !idsBase.has(id) &&
              !this.deletedIds.has(id)
            ) {

              this.people.unshift({
                id,
                ...pessoa
              });

            }

          }


          this.atualizarFiltros();

          this.atualizarLista();

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

/* =====================================================
   STORAGE — OVERRIDES
   ===================================================== */

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


/* =====================================================
   STORAGE — APAGADOS
   ===================================================== */

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
    JSON.stringify(
      Array.from(this.deletedIds)
    )
  );
}


/* =====================================================
   STORAGE — DATA DE ALTERAÇÃO
   ===================================================== */

private loadUpdatedAt(): void {
  try {
    const raw = window.localStorage.getItem(
      this.STORAGE_KEY_UPDATED
    );

    this.updatedAt = raw
      ? (JSON.parse(raw) as Record<number, number>)
      : {};
  } catch {
    this.updatedAt = {};
  }
}

  private persistUpdatedAt(): void {

    window.localStorage.setItem(
      this.STORAGE_KEY_UPDATED,
      JSON.stringify(this.updatedAt)
    );

  }


  /*
   * Registar uma nova alteração local.
   */
  private marcarComoAlterado(id: number): void {

    this.updatedAt[id] =
      Date.now();

    this.persistUpdatedAt();

  }


  /* =====================================================
     FILTROS
     ===================================================== */

  private atualizarFiltros(): void {

    this.grupos = [
      ...new Set(
        this.people
          .map(p => (p.grupo ?? '').trim())
          .filter(Boolean)
      )
    ].sort(
      (a, b) => a.localeCompare(b)
    );


    this.localidades = [
      ...new Set(
        this.people
          .map(p => (p.localidade ?? '').trim())
          .filter(Boolean)
      )
    ].sort(
      (a, b) => a.localeCompare(b)
    );


    /*
     * Se o grupo selecionado deixou de existir,
     * voltar automaticamente para "Todos".
     */
    if (
      this.selectedGroup &&
      !this.grupos.includes(this.selectedGroup)
    ) {

      this.selectedGroup = '';

    }


    /*
     * Se a localidade selecionada deixou de existir,
     * voltar automaticamente para "Todas".
     */
    if (
      this.selectedLocalidade &&
      !this.localidades.includes(
        this.selectedLocalidade
      )
    ) {

      this.selectedLocalidade = '';

    }

  }


  /* =====================================================
     PESQUISA / FILTRAGEM
     ===================================================== */

  atualizarLista(): void {

    const search =
      this.searchText
        .trim()
        .toLowerCase();


    this.filteredPeopleList =
      this.people

        .filter(
          p =>
            !this.deletedIds.has(p.id)
        )

        .filter(p => {

          const matchesGroup =
            !this.selectedGroup ||
            p.grupo === this.selectedGroup;


          const matchesLocalidade =
            !this.selectedLocalidade ||
            p.localidade ===
              this.selectedLocalidade;


          const nome =
            (p.nome ?? '').toLowerCase();


          const apelido =
            (p.apelido ?? '').toLowerCase();


          const matchesSearch =
            !search ||
            nome.includes(search) ||
            apelido.includes(search);


          return (
            matchesGroup &&
            matchesLocalidade &&
            matchesSearch
          );

        });


    /*
     * Sempre que há uma nova pesquisa/filtro,
     * voltar aos primeiros 30 perfis.
     */
    this.visibleCount =
      this.PAGE_SIZE;


    this.atualizarVisiblePeople();

    this.cdr.markForCheck();

  }


  /* =====================================================
     PERFIS VISÍVEIS
     ===================================================== */

  private atualizarVisiblePeople(): void {

    this.visiblePeople =
      this.filteredPeopleList.slice(
        0,
        this.visibleCount
      );


    this.hasMorePeople =
      this.visibleCount <
      this.filteredPeopleList.length;

  }


  /* =====================================================
     CARREGAR MAIS
     ===================================================== */

  async carregarMais(event: any): Promise<void> {

    this.visibleCount +=
      this.PAGE_SIZE;


    this.atualizarVisiblePeople();

    this.cdr.markForCheck();


    if (event) {

      await event.target.complete();

    }

  }


  /* =====================================================
     TRACK BY
     ===================================================== */

  trackByPessoaId(
    _: number,
    pessoa: PessoaPersistida
  ): number {

    return pessoa.id;

  }


  /* =====================================================
     NAVEGAÇÃO
     ===================================================== */

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


  /* =====================================================
     CRIAR
     ===================================================== */

  abrirCriar(): void {

    this.popoverMode = 'create';

    this.editingId = null;

    this.limparFormulario();

    this.popover?.present();

  }


  /* =====================================================
     GUARDAR
     ===================================================== */

  guardar(): void {

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


    /* ===================================================
       EDITAR
       =================================================== */

    if (
      this.popoverMode === 'edit' &&
      this.editingId !== null
    ) {

      const id =
        this.editingId;


      this.overrides[id] =
        payload;


      this.persistOverrides();


      /*
       * Registar a hora da alteração.
       */
      this.marcarComoAlterado(id);


      this.people =
        this.people.map(p =>
          p.id === id
            ? ({
                ...p,
                ...payload
              } as PessoaPersistida)
            : p
        );


      this.atualizarFiltros();

      this.atualizarLista();


      this.editingId = null;

      this.popoverMode = 'create';

    }


    /* ===================================================
       CRIAR NOVO
       =================================================== */

    else {

      const newId =
        this.obterProximoId();


      this.overrides[newId] =
        payload;


      this.persistOverrides();


      /*
       * Registar a hora de criação.
       */
      this.marcarComoAlterado(newId);


      const newPerson: PessoaPersistida = {

        id: newId,

        ...payload

      };


      this.people = [

        newPerson,

        ...this.people

      ];


      this.atualizarFiltros();

      this.atualizarLista();

    }


    this.limparFormulario();

    this.fecharPopover();

  }


  /* =====================================================
     OBTER PRÓXIMO ID LIVRE
     ===================================================== */

  private obterProximoId(): number {

    const idsUsados =
      new Set<number>();


    for (
      const pessoa of this.people
    ) {

      idsUsados.add(
        pessoa.id
      );

    }


    /*
     * IDs apagados também ficam reservados.
     * Assim nunca são reutilizados.
     */
    for (
      const id of this.deletedIds
    ) {

      idsUsados.add(id);

    }


    let id = 1;


    while (
      idsUsados.has(id)
    ) {

      id++;

    }


    return id;

  }


  /* =====================================================
     EDITAR
     ===================================================== */

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


  /* =====================================================
     LIMPAR FORMULÁRIO
     ===================================================== */

  private limparFormulario(): void {

    this.primeiroNome = '';

    this.ultimoNome = '';

    this.dataNascimento = '';

    this.localidade = '';

    this.grupo = '';

    this.eneagrama = '';

  }


  fecharPopover(): void {

    this.popover?.dismiss();

  }


  /* =====================================================
     ESCOLHER PERFIL
     ===================================================== */

  escolher(
    p: PessoaPersistida
  ): void {

    window.location.href =
      `/pessoa/${p.id}`;

  }


  /* =====================================================
     COMPARAR
     ===================================================== */

  comparar(
    p: PessoaPersistida
  ): void {

    window.location.href =
      `/pessoa/${p.id}`;

  }


  /* =====================================================
     APAGAR
     ===================================================== */

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


    /*
     * Marcar o ID como apagado.
     */
    this.deletedIds.add(
      p.id
    );


    this.persistDeleted();


    /*
     * Retirar da lista atual.
     */
    this.people =
      this.people.filter(
        x => x.id !== p.id
      );


    /*
     * Atualizar filtros.
     */
    this.atualizarFiltros();

    this.atualizarLista();

  }


  /* =====================================================
     EXPORTAR
     ===================================================== */

  async exportarTudo(): Promise<void> {

    /*
     * Exportar apenas perfis ativos.
     *
     * O updatedAt é incluído no ficheiro exportado
     * para permitir comparar versões quando o JSON
     * voltar a ser importado.
     */
    const dados: PessoaImportada[] =
      this.people

        .filter(
          p =>
            !this.deletedIds.has(p.id)
        )

        .map(p => ({

          ...p,

          updatedAt:
            this.updatedAt[p.id] ?? 0

        }));


    const json =
      JSON.stringify(
        dados,
        null,
        2
      );


    const nomeFicheiro =
      'perfis.json';


    /*
     * ===================================================
     * PC / BROWSER
     * ===================================================
     *
     * No PC continua a funcionar através do download
     * normal do navegador.
     */
    if (
      !Capacitor.isNativePlatform()
    ) {

      const blob =
        new Blob(
          [json],
          {
            type:
              'application/json;charset=utf-8'
          }
        );


      const url =
        URL.createObjectURL(blob);


      const link =
        document.createElement('a');


      link.href = url;

      link.download =
        nomeFicheiro;

      link.style.display =
        'none';


      document.body.appendChild(
        link
      );


      link.click();


      document.body.removeChild(
        link
      );


      URL.revokeObjectURL(
        url
      );


      return;

    }


    /*
     * ===================================================
     * TELEMÓVEL / CAPACITOR
     * ===================================================
     *
     * Guardar primeiro na área temporária da aplicação
     * e depois abrir o menu nativo de partilha/guardar.
     */
    try {

      const resultado =
        await Filesystem.writeFile({

          path:
            nomeFicheiro,

          data:
            json,

          directory:
            Directory.Cache,

          encoding:
            Encoding.UTF8

        });


      await Share.share({

        title:
          'Exportar perfis',

        text:
          'Ficheiro de perfis',

        url:
          resultado.uri,

        dialogTitle:
          'Guardar ou partilhar perfis'

      });


    } catch (error) {

      console.error(
        'Erro ao exportar perfis:',
        error
      );


      alert(
        'Não foi possível exportar os perfis.'
      );

    }

  }


  /* =====================================================
     ABRIR IMPORTAÇÃO
     ===================================================== */

  abrirImportacao(): void {

    this.fileInput
      ?.nativeElement
      .click();

  }


  /* =====================================================
     IMPORTAR FICHEIRO
     ===================================================== */

  importarFicheiro(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;


    const file =
      input.files?.[0];


    if (!file) {

      return;

    }


    const reader =
      new FileReader();


    reader.onload = () => {

      try {

        const parsed: unknown =
          JSON.parse(
            String(reader.result)
          );


        /*
         * O JSON tem de ser um array.
         */
        if (
          !Array.isArray(parsed)
        ) {

          throw new Error(
            'Formato inválido.'
          );

        }


        const dados =
          parsed as unknown[];


        let adicionados = 0;

        let atualizados = 0;

        let ignorados = 0;

        let antigosIgnorados = 0;


        /* =============================================
           PROCESSAR PERFIS
           ============================================= */

        for (
          const item of dados
        ) {

          /*
           * Verificar se é um objeto.
           */
          if (
            item === null ||
            typeof item !== 'object'
          ) {

            ignorados++;

            continue;

          }


          const pessoa =
            item as Partial<PessoaImportada>;


          /*
           * Nome é obrigatório.
           */
          if (
            typeof pessoa.nome !== 'string' ||
            pessoa.nome.trim() === ''
          ) {

            ignorados++;

            continue;

          }


          /*
           * Verificar se o ID importado é válido.
           */
          const idImportado =
            typeof pessoa.id === 'number' &&
            Number.isInteger(pessoa.id) &&
            pessoa.id > 0
              ? pessoa.id
              : null;


          /*
           * Se o ID foi apagado nesta instalação,
           * NÃO voltar a criar esse perfil.
           */
          if (
            idImportado !== null &&
            this.deletedIds.has(idImportado)
          ) {

            ignorados++;

            continue;

          }


          /*
           * Preparar os dados do perfil.
           */
          const payload: Pessoa = {

            nome:
              pessoa.nome.trim(),

            apelido:
              typeof pessoa.apelido === 'string'
                ? pessoa.apelido.trim()
                : '',

            localidade:
              typeof pessoa.localidade === 'string'
                ? pessoa.localidade.trim()
                : '',

            grupo:
              typeof pessoa.grupo === 'string'
                ? pessoa.grupo.trim()
                : '',

            eneagrama_tipo:
              pessoa.eneagrama_tipo ?? '',

            data:
              typeof pessoa.data === 'string'
                ? pessoa.data
                : ''

          };


          /*
           * Timestamp vindo do JSON.
           *
           * Um JSON antigo, que não tenha updatedAt,
           * recebe 0.
           */
          const importedUpdatedAt =
            typeof pessoa.updatedAt === 'number' &&
            Number.isFinite(pessoa.updatedAt) &&
            pessoa.updatedAt > 0
              ? pessoa.updatedAt
              : 0;


          /* =========================================
             IMPORTAÇÃO COM ID
             ========================================= */

          if (
            idImportado !== null
          ) {

            const existente =
              this.people.find(
                p =>
                  p.id === idImportado
              );


            /*
             * O ID já existe.
             */
            if (existente) {

              const currentUpdatedAt =
                this.updatedAt[idImportado] ?? 0;


              /*
               * Se o ficheiro não tiver timestamp,
               * consideramos que é um JSON antigo.
               *
               * Não permitimos que ele substitua
               * uma alteração local.
               */
              if (
                importedUpdatedAt === 0
              ) {

                antigosIgnorados++;

                continue;

              }


              /*
               * Se a versão local for igual ou mais recente,
               * ignorar o perfil importado.
               */
              if (
                importedUpdatedAt <=
                currentUpdatedAt
              ) {

                antigosIgnorados++;

                continue;

              }


              /*
               * Só chega aqui se o JSON importado
               * for realmente mais recente.
               */
              this.overrides[idImportado] =
                payload;


              this.updatedAt[idImportado] =
                importedUpdatedAt;


              this.people =
                this.people.map(p =>
                  p.id === idImportado
                    ? ({
                        ...p,
                        ...payload
                      } as PessoaPersistida)
                    : p
                );


              atualizados++;

              continue;

            }


            /*
             * O ID não existe localmente.
             *
             * Criar usando o ID que veio no ficheiro.
             */
            this.overrides[idImportado] =
              payload;


            /*
             * Se o ficheiro tiver timestamp,
             * preservá-lo.
             *
             * Caso contrário, usar agora.
             */
            this.updatedAt[idImportado] =
              importedUpdatedAt > 0
                ? importedUpdatedAt
                : Date.now();


            this.people.unshift({

              id: idImportado,

              ...payload

            });


            adicionados++;

            continue;

          }


          /* =========================================
             IMPORTAÇÃO SEM ID
             ========================================= */

          /*
           * Sem ID → novo perfil.
           */
          const newId =
            this.obterProximoId();


          this.overrides[newId] =
            payload;


          /*
           * Um perfil novo sem ID recebe
           * a data/hora atual.
           */
          this.updatedAt[newId] =
            importedUpdatedAt > 0
              ? importedUpdatedAt
              : Date.now();


          this.people.unshift({

            id: newId,

            ...payload

          });


          adicionados++;

        }


        /* =============================================
           GUARDAR
           ============================================= */

        this.persistOverrides();

        this.persistUpdatedAt();


        /*
         * Recalcular grupos e localidades.
         */
        this.atualizarFiltros();


        /*
         * Recalcular lista.
         */
        this.atualizarLista();


        this.cdr.markForCheck();


        /* =============================================
           RESULTADO
           ============================================= */

        alert(

          `Importação concluída.\n\n` +

          `Perfis adicionados: ${adicionados}\n` +

          `Perfis atualizados: ${atualizados}\n` +

          `Perfis antigos ignorados: ${antigosIgnorados}\n` +

          `Perfis inválidos/apagados ignorados: ${ignorados}`

        );

      } catch (error) {

        console.error(
          'Erro ao importar perfis:',
          error
        );


        alert(
          'Não foi possível importar o ficheiro. ' +
          'Verifique se é um ficheiro JSON válido.'
        );

      }


      /*
       * Permitir voltar a selecionar
       * o mesmo ficheiro.
       */
      input.value = '';

    };


    reader.readAsText(file);

  }

}