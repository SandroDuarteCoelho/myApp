
import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit
} from '@angular/core';

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
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonButtons,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonCheckbox
} from '@ionic/angular/standalone';


/* =====================================================
   DIVISÃO
   ===================================================== */

interface Divisao {
  id: string;
  nome: string;
  prioridade: number;
  ativa: boolean;
  descricao?: string;
}


/* =====================================================
   TAREFA
   ===================================================== */

interface Tarefa {
  id: string;
  nome: string;
  divisoes: string[];
  frequencia: string;
  prioridade: number;
  duracao: number;
  ativa: boolean;
  descricao?: string;
  concluida?: boolean;
}


/* =====================================================
   TAREFA PARA APRESENTAÇÃO
   ===================================================== */

interface TarefaApresentacao {
  tarefa: Tarefa;
  divisaoId: string;
}


@Component({
  selector: 'app-oracao-perdao',
  templateUrl: './oracao-perdao.page.html',
  styleUrls: ['./oracao-perdao.page.scss'],
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
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonButtons,
    IonModal,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonCheckbox
  ]
})


export class OracaoPerdaoPage implements OnInit {


  /* =====================================================
     CASA ATUAL
     ===================================================== */

  regraTexto = '';
  casaAtual = '';
  descricaoCasaAtual = '';
  casaClass = '';
  backgroundImage = '';

  
backgroundByCasa: Record<string, string[]> = {
  'CASA DA VIDA': [
    'assets/backgrounds/vida.webp',
    'assets/backgrounds/vida2.webp'
  ],

  'CASA DOS BENS': [
    'assets/backgrounds/bens.webp',
    'assets/backgrounds/bens2.webp'
  ],

  'CASA DO SANGUE': [
    'assets/backgrounds/sangue.webp',
    'assets/backgrounds/sangue2.webp'
  ],

  'CASA DA SOLIDEZ': [
    'assets/backgrounds/solidez.webp',
    'assets/backgrounds/solidez2.webp'
  ],

  'CASA DOS FILHOS': [
    'assets/backgrounds/filhos.webp',
    'assets/backgrounds/filhos2.webp'
  ],

  'CASA DA SAÚDE': [
    'assets/backgrounds/saude.webp',
    'assets/backgrounds/saude2.webp'
  ],

  'CASA DO CASAMENTO': [
    'assets/backgrounds/casamento.webp',
    'assets/backgrounds/casamento2.webp'
  ],

  'CASA DA MORTE/MUDANÇA': [
    'assets/backgrounds/morte.webp',
    'assets/backgrounds/morte2.webp'
  ],

  'CASA DIVINA': [
    'assets/backgrounds/divina.webp',
    'assets/backgrounds/divina2.webp'
  ],

  'CASA DA POSIÇÃO SOCIAL': [
    'assets/backgrounds/social.webp',
    'assets/backgrounds/social2.webp'
  ],

  'CASA DOS AMIGOS': [
    'assets/backgrounds/amigos.webp',
    'assets/backgrounds/amigos2.webp'
  ],

  'CASA DOS INIMIGOS': [
    'assets/backgrounds/inimigos.webp',
    'assets/backgrounds/inimigos2.webp'
  ]
};


private escolherImagemCasa(casa: string): void {
  const imagens = this.backgroundByCasa[casa];

  if (!imagens || imagens.length === 0) {
    this.backgroundImage = '';
    return;
  }

  const indice = Math.floor(Math.random() * imagens.length);

  this.backgroundImage = imagens[indice];
}


  /* =====================================================
     MODAIS
     ===================================================== */

  isCasasModalOpen = false;
  isRegraEditModalOpen = false;


  /* =====================================================
     EDIÇÃO DA REGRA
     ===================================================== */

  regraTextoEdit = '';
  regraTextoEditBackup = '';
  isEditAreaVisible = false;


  /* =====================================================
     FRASE DO UTILIZADOR
     ===================================================== */

  userPhrase = '';

  private readonly phraseStorageKey =
    'oracao_perdao_user_phrase';


  /* =====================================================
     CASAS
     ===================================================== */

  casasMap: Record<string, string> = {

    'CASA DA VIDA':
      'Representa a própria vida, a identidade e a forma como a pessoa se posiciona perante a existência.',

    'CASA DOS BENS':
      'Relaciona-se com bens materiais, recursos, dinheiro, segurança e relação com aquilo que se possui.',

    'CASA DO SANGUE':
      'Está ligada à família de origem, às raízes, à ancestralidade e aos vínculos familiares.',

    'CASA DA SOLIDEZ':
      'Relaciona-se com estabilidade, estrutura, segurança, corpo e capacidade de sustentar a própria vida.',

    'CASA DOS FILHOS':
      'Representa criação, expressão, criatividade, filhos, projetos e aquilo que nasce da própria pessoa.',

    'CASA DA SAÚDE':
      'Relaciona-se com saúde, rotina, trabalho diário, cuidado e equilíbrio entre corpo e vida.',

    'CASA DO CASAMENTO':
      'Representa relações próximas, parceria, casamento, intimidade e encontro com o outro.',

    'CASA DA MORTE/MUDANÇA':
      'Relaciona-se com transformações profundas, perdas, desapego, mudanças e renascimento.',

    'CASA DIVINA':
      'Representa espiritualidade, sentido, fé, conhecimento, expansão e procura de significado.',

    'CASA DA POSIÇÃO SOCIAL':
      'Relaciona-se com profissão, reconhecimento, responsabilidade, estatuto e contribuição no mundo.',

    'CASA DOS AMIGOS':
      'Representa amizades, grupos, comunidade, projetos colectivos e sentimento de pertença.',

    'CASA DOS INIMIGOS':
      'Relaciona-se com conflitos, oposição, limites, aquilo que desafia a pessoa e os aspectos que precisam de ser integrados.'

  };


  casasList = Object.entries(this.casasMap).map(
    ([nome, descricao]) => ({
      nome,
      descricao
    })
  );


  /* =====================================================
     TEMPO DISPONÍVEL / TAREFAS
     ===================================================== */

  tempoDisponivel: number | null = null;

  tarefas: Tarefa[] = [];

  tarefasSugeridas: TarefaApresentacao[] = [];

  tempoTarefasSugeridas = 0;

  isTarefasModalOpen = false;


  /* =====================================================
     DESCRIÇÃO DO LOCAL / TAREFA
     ===================================================== */

  tarefaDescricaoAbertaId = '';


  /* =====================================================
     STORAGE
     ===================================================== */

  private readonly STORAGE_TAREFAS =
    'limpezas_tarefas_v1';

  private readonly STORAGE_DIVISOES =
    'limpezas_divisoes_v1';

  private readonly STORAGE_TAREFAS_ELIMINADAS =
    'limpezas_tarefas_eliminadas_v1';


  /* =====================================================
     INICIALIZAÇÃO
     ===================================================== */

  constructor(
    private http: HttpClient
  ) {}


  ngOnInit(): void {

    this.getCasaAtual();

    this.loadRegra();

    this.loadPhrase();

  }


  /* =====================================================
     FRASE
     ===================================================== */

  private loadPhrase(): void {

    const guardada =
      window.localStorage.getItem(
        this.phraseStorageKey
      );

    if (guardada !== null) {

      this.userPhrase = guardada;

    }

  }


  savePhrase(): void {

    window.localStorage.setItem(
      this.phraseStorageKey,
      this.userPhrase.trim()
    );

  }


  /* =====================================================
     CASA ATUAL
     ===================================================== */

  getCasaAtual(): string {

    const hoje = new Date();

    const dia = hoje.getDate();

    const mes = hoje.getMonth() + 1;

    let casa = '';


    if (
      (mes === 1 && dia >= 16) ||
      (mes === 2 && dia <= 15)
    ) {

      casa = 'CASA DA VIDA';

    }

    else if (
      (mes === 2 && dia >= 16) ||
      (mes === 3 && dia <= 15)
    ) {

      casa = 'CASA DOS BENS';

    }

    else if (
      (mes === 3 && dia >= 16) ||
      (mes === 4 && dia <= 15)
    ) {

      casa = 'CASA DO SANGUE';

    }

    else if (
      (mes === 4 && dia >= 16) ||
      (mes === 5 && dia <= 15)
    ) {

      casa = 'CASA DA SOLIDEZ';

    }

    else if (
      (mes === 5 && dia >= 16) ||
      (mes === 6 && dia <= 15)
    ) {

      casa = 'CASA DOS FILHOS';

    }

    else if (
      (mes === 6 && dia >= 16) ||
      (mes === 7 && dia <= 15)
    ) {

      casa = 'CASA DA SAÚDE';

    }

    else if (
      (mes === 7 && dia >= 16) ||
      (mes === 8 && dia <= 15)
    ) {

      casa = 'CASA DO CASAMENTO';

    }

    else if (
      (mes === 8 && dia >= 16) ||
      (mes === 9 && dia <= 15)
    ) {

      casa = 'CASA DA MORTE/MUDANÇA';

    }

    else if (
      (mes === 9 && dia >= 16) ||
      (mes === 10 && dia <= 15)
    ) {

      casa = 'CASA DIVINA';

    }

    else if (
      (mes === 10 && dia >= 16) ||
      (mes === 11 && dia <= 15)
    ) {

      casa = 'CASA DA POSIÇÃO SOCIAL';

    }

    else if (
      (mes === 11 && dia >= 16) ||
      (mes === 12 && dia <= 15)
    ) {

      casa = 'CASA DOS AMIGOS';

    }

    else {

      casa = 'CASA DOS INIMIGOS';

    }


    this.casaAtual = casa;
this.escolherImagemCasa(this.casaAtual);

    this.descricaoCasaAtual =
      this.casasMap[casa] ?? '';

  

    this.casaClass =
      this.getCasaClass(casa);


    return casa;

  }


  getDescricaoCasaAtual(): string {

    return this.casasMap[this.casaAtual] ?? '';

  }


  getCasaClass(casa: string): string {

    return casa
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

  }


  /* =====================================================
     REGRA
     ===================================================== */

  loadRegra(): void {

    const guardada =
      window.localStorage.getItem(
        'oracao_perdao_regra_texto'
      );


    if (guardada !== null) {

      this.regraTexto = guardada;

      return;

    }


    this.http
      .get<{ texto: string }>(
        'assets/data/regra.json'
      )
      .subscribe({

        next: dados => {

          this.regraTexto =
            dados.texto ?? '';

        },

        error: erro => {

          console.error(
            'Erro ao carregar regra.json',
            erro
          );

        }

      });

  }


  /* =====================================================
     MODAL DA REGRA
     ===================================================== */

  abrirEdicaoRegra(): void {

    this.regraTextoEdit =
      this.regraTexto;

    this.regraTextoEditBackup =
      this.regraTexto;

    this.isRegraEditModalOpen = true;

  }


  cancelarEdicaoRegra(): void {

    this.regraTextoEdit =
      this.regraTextoEditBackup;

    this.isRegraEditModalOpen = false;

  }


  guardarRegra(): void {

    this.regraTexto =
      this.regraTextoEdit.trim();

    window.localStorage.setItem(
      'oracao_perdao_regra_texto',
      this.regraTexto
    );

    this.isRegraEditModalOpen = false;

  }


  openRegraEdit(): void {

    this.abrirEdicaoRegra();

  }


  closeRegraEdit(): void {

    this.cancelarEdicaoRegra();

  }


  saveRegraEdit(): void {

    this.guardarRegra();

  }


  /* =====================================================
     MODAL DAS CASAS
     ===================================================== */

  abrirCasasModal(): void {

    this.isCasasModalOpen = true;

  }


  fecharCasasModal(): void {

    this.isCasasModalOpen = false;

  }


  openCasasInfo(): void {

    this.isCasasModalOpen = true;

  }


  closeCasasInfo(): void {

    this.isCasasModalOpen = false;

  }


  /* =====================================================
     CARREGAR TAREFAS
     ===================================================== */

  private carregarTarefasLimpezas(): void {

    const guardadas =
      window.localStorage.getItem(
        this.STORAGE_TAREFAS
      );

    let tarefasLocais: Tarefa[] = [];


    if (guardadas) {

      try {

        const dados =
          JSON.parse(guardadas);


        if (Array.isArray(dados)) {

          tarefasLocais =
            dados.map(
              (tarefa: any): Tarefa => ({

                ...tarefa,

                divisoes:
                  Array.isArray(tarefa.divisoes)
                    ? tarefa.divisoes
                    : [],

                prioridade:
                  Number(tarefa.prioridade) || 2,

                duracao:
                  Number(tarefa.duracao) || 15,

                ativa:
                  tarefa.ativa !== false

              })
            );

        }

      }

      catch (erro) {

        console.error(
          'Não foi possível ler as tarefas de limpeza:',
          erro
        );

        tarefasLocais = [];

      }

    }


    this.tarefas =
      tarefasLocais;


    /*
     * A sincronização é feita a partir do JSON,
     * mas nunca elimina os dados existentes.
     */
    this.sincronizarTarefasComJson(
      tarefasLocais
    );

  }


  /* =====================================================
     SINCRONIZAÇÃO JSON + LOCALSTORAGE

     REGRAS:

     1. Tarefa nova no JSON -> é adicionada.

     2. Campo inexistente localmente -> é adicionado.

     3. Campo local vazio -> recebe o valor do JSON.

     4. Campo local preenchido -> é preservado.

     5. Isto aplica-se a TODAS as tarefas e a TODOS
        os campos do JSON.

     6. Tarefas eliminadas continuam eliminadas.

     7. Histórico não é alterado.
     ===================================================== */

  private sincronizarTarefasComJson(
    tarefasLocais: Tarefa[]
  ): void {

    this.http
      .get<any>(
        'assets/data/tarefas.json'
      )
      .subscribe({

        next: resposta => {

          /*
           * Aceita tanto:
           *
           * { "tarefas": [...] }
           *
           * como:
           *
           * [...]
           */
          let tarefasJson: any[] = [];

          if (Array.isArray(resposta)) {

            tarefasJson = resposta;

          }

          else if (
            resposta &&
            Array.isArray(resposta.tarefas)
          ) {

            tarefasJson =
              resposta.tarefas;

          }


          if (!tarefasJson.length) {

            this.tarefas =
              tarefasLocais;

            return;

          }


          /* ---------------------------------------------
             TAREFAS ELIMINADAS
             --------------------------------------------- */

          let idsEliminados =
            new Set<string>();


          try {

            const guardado =
              window.localStorage.getItem(
                this.STORAGE_TAREFAS_ELIMINADAS
              );


            if (guardado) {

              const ids =
                JSON.parse(
                  guardado
                );


              if (Array.isArray(ids)) {

                idsEliminados =
                  new Set<string>(ids);

              }

            }

          }

          catch (erro) {

            console.error(
              'Erro ao ler tarefas eliminadas:',
              erro
            );

          }


          let houveAlteracoes =
            false;


          /* ---------------------------------------------
             PERCORRER TODAS AS TAREFAS DO JSON
             --------------------------------------------- */

          for (
            const tarefaJson of tarefasJson
          ) {

            if (
              !tarefaJson ||
              !tarefaJson.id ||
              idsEliminados.has(
                tarefaJson.id
              )
            ) {

              continue;

            }


            const existente =
              tarefasLocais.find(
                tarefa =>
                  tarefa.id ===
                  tarefaJson.id
              );


            /* -----------------------------------------
               NOVA TAREFA
               ----------------------------------------- */

            if (!existente) {

              tarefasLocais.push({

                ...tarefaJson,

                divisoes:
                  Array.isArray(
                    tarefaJson.divisoes
                  )
                    ? tarefaJson.divisoes
                    : [],

                prioridade:
                  Number(
                    tarefaJson.prioridade
                  ) || 2,

                duracao:
                  Number(
                    tarefaJson.duracao
                  ) || 15,

                ativa:
                  tarefaJson.ativa !== false

              });


              houveAlteracoes =
                true;


              continue;

            }


            /* -----------------------------------------
               SINCRONIZAR CAMPOS
               -----------------------------------------

               Aqui está a parte importante.

               Para cada campo existente no JSON:

               - se não existe localmente -> adiciona;
               - se está null/undefined -> adiciona;
               - se é string vazia -> preenche;
               - se já tem valor -> mantém.

               Portanto, a descrição de qualquer tarefa
               passa a ser sincronizada automaticamente.
               ----------------------------------------- */

            for (
              const chave of Object.keys(
                tarefaJson
              )
            ) {

              const valorJson =
                tarefaJson[chave];

              const valorLocal =
                (existente as any)[chave];


              if (
                valorJson === undefined ||
                valorJson === null
              ) {

                continue;

              }


              /*
               * Campo ainda não existe localmente.
               */
              if (
                valorLocal === undefined ||
                valorLocal === null
              ) {

                (existente as any)[chave] =
                  valorJson;

                houveAlteracoes =
                  true;

                continue;

              }


              /*
               * Campo textual vazio localmente.
               *
               * Isto resolve, por exemplo:
               *
               * localStorage:
               * descricao: ""
               *
               * JSON:
               * descricao: "O poder das plantas..."
               *
               * -> passa a guardar a descrição do JSON.
               */
              if (
                typeof valorLocal === 'string' &&
                valorLocal.trim() === '' &&
                typeof valorJson === 'string' &&
                valorJson.trim() !== ''
              ) {

                (existente as any)[chave] =
                  valorJson;

                houveAlteracoes =
                  true;

                continue;

              }

            }


            /* -----------------------------------------
               NORMALIZAR DIVISÕES
               ----------------------------------------- */

            if (
              !Array.isArray(
                existente.divisoes
              )
            ) {

              existente.divisoes =
                [];

              houveAlteracoes =
                true;

            }


            /* -----------------------------------------
               NORMALIZAR PRIORIDADE
               ----------------------------------------- */

            if (
              typeof existente.prioridade !==
              'number'
            ) {

              existente.prioridade =
                Number(
                  existente.prioridade
                ) || 2;

              houveAlteracoes =
                true;

            }


            /* -----------------------------------------
               NORMALIZAR DURAÇÃO
               ----------------------------------------- */

            if (
              typeof existente.duracao !==
              'number'
            ) {

              existente.duracao =
                Number(
                  existente.duracao
                ) || 15;

              houveAlteracoes =
                true;

            }


            /* -----------------------------------------
               NORMALIZAR ATIVA
               ----------------------------------------- */

            if (
              existente.ativa === undefined ||
              existente.ativa === null
            ) {

              existente.ativa =
                true;

              houveAlteracoes =
                true;

            }

          }


          /* ---------------------------------------------
             GUARDAR ALTERAÇÕES
             --------------------------------------------- */

          if (houveAlteracoes) {

            try {

              window.localStorage.setItem(
                this.STORAGE_TAREFAS,
                JSON.stringify(
                  tarefasLocais
                )
              );

            }

            catch (erro) {

              console.error(
                'Erro ao guardar tarefas sincronizadas:',
                erro
              );

            }

          }


          /*
           * IMPORTANTE:
           * Só depois da sincronização terminada
           * atualizamos this.tarefas.
           */
          this.tarefas =
            tarefasLocais;

        },


        error: erro => {

          console.error(
            'Erro ao carregar tarefas.json:',
            erro
          );


          /*
           * Se o JSON falhar, mantém
           * o localStorage.
           */
          this.tarefas =
            tarefasLocais;

        }

      });

  }


  /* =====================================================
     DIVISÕES ATIVAS
     ===================================================== */

  private obterDivisoesAtivas(): Set<string> {

    const guardadas =
      window.localStorage.getItem(
        this.STORAGE_DIVISOES
      );


    if (!guardadas) {

      return new Set<string>();

    }


    try {

      const divisoes =
        JSON.parse(
          guardadas
        ) as Divisao[];


      if (!Array.isArray(divisoes)) {

        return new Set<string>();

      }


      return new Set(

        divisoes
          .filter(
            divisao =>
              divisao &&
              divisao.ativa === true
          )
          .map(
            divisao =>
              divisao.id
          )
          .filter(
            id => !!id
          )

      );

    }

    catch (erro) {

      console.error(
        'Erro ao ler as divisões:',
        erro
      );

      return new Set<string>();

    }

  }


  /* =====================================================
     ID DA OCORRÊNCIA
     ===================================================== */

  private obterIdOcorrencia(
    tarefaId: string,
    divisaoId: string
  ): string {

    return `${tarefaId}__${divisaoId}`;

  }


  /* =====================================================
     DATA DE HOJE
     ===================================================== */

  private obterChaveDataHoje(): string {

    const hoje =
      new Date();


    const ano =
      hoje.getFullYear();


    const mes =
      String(
        hoje.getMonth() + 1
      ).padStart(
        2,
        '0'
      );


    const dia =
      String(
        hoje.getDate()
      ).padStart(
        2,
        '0'
      );


    return `${ano}-${mes}-${dia}`;

  }


  /* =====================================================
     CALCULAR TAREFAS
     ===================================================== */

  calcularTarefas(): void {

    const tempo =
      Number(
        this.tempoDisponivel
      );


    if (
      !tempo ||
      tempo <= 0
    ) {

      this.tarefasSugeridas =
        [];

      this.tempoTarefasSugeridas =
        0;

      this.isTarefasModalOpen =
        true;

      return;

    }


    this.carregarTarefasLimpezas();


    /*
     * Nota:
     * A sincronização do JSON é assíncrona.
     *
     * Por isso o cálculo imediato pode acontecer
     * antes de a descrição nova chegar.
     *
     * O HTML continuará a funcionar quando
     * this.tarefas for atualizado, mas para evitar
     * resultados inconsistentes, fazemos o cálculo
     * também quando a sincronização termina através
     * da atualização de this.tarefas.
     */


    const divisoesAtivas =
      this.obterDivisoesAtivas();


    /* ---------------------------------------------
       TAREFAS CONCLUÍDAS HOJE
       --------------------------------------------- */

    const chaveHoje =
      `limpezas_concluidas_${this.obterChaveDataHoje()}`;


    let tarefasConcluidasHoje:
      string[] = [];


    const guardadasHoje =
      window.localStorage.getItem(
        chaveHoje
      );


    if (guardadasHoje) {

      try {

        const dados =
          JSON.parse(
            guardadasHoje
          );


        if (Array.isArray(dados)) {

          tarefasConcluidasHoje =
            dados;

        }

      }

      catch {

        tarefasConcluidasHoje =
          [];

      }

    }


    /* ---------------------------------------------
       EXPANDIR TAREFAS POR DIVISÃO
       --------------------------------------------- */

    const tarefasDisponiveis:
      TarefaApresentacao[] =
      [];


    for (
      const tarefa of this.tarefas
    ) {

      if (
        !tarefa.ativa
      ) {

        continue;

      }


      if (
        !Array.isArray(
          tarefa.divisoes
        )
      ) {

        continue;

      }


      if (
        Number(
          tarefa.duracao
        ) <= 0
      ) {

        continue;

      }


      for (
        const divisaoId of tarefa.divisoes
      ) {

        if (
          !divisoesAtivas.has(
            divisaoId
          )
        ) {

          continue;

        }


        const idOcorrencia =
          this.obterIdOcorrencia(
            tarefa.id,
            divisaoId
          );


        if (
          tarefasConcluidasHoje.includes(
            idOcorrencia
          )
        ) {

          continue;

        }


        tarefasDisponiveis.push({

          tarefa,

          divisaoId

        });

      }

    }


    /* ---------------------------------------------
       ORDENAR
       --------------------------------------------- */

    tarefasDisponiveis.sort(
      (a, b) => {

        const prioridadeA =
          Number(
            a.tarefa.prioridade
          ) || 0;


        const prioridadeB =
          Number(
            b.tarefa.prioridade
          ) || 0;


        if (
          prioridadeA !==
          prioridadeB
        ) {

          return (
            prioridadeB -
            prioridadeA
          );

        }


        const ordemFrequencia:
          Record<string, number> = {

            diaria: 1,

            semanal: 2,

            mensal: 3

          };


        const frequenciaA =
          ordemFrequencia[
            a.tarefa.frequencia
          ] ?? 99;


        const frequenciaB =
          ordemFrequencia[
            b.tarefa.frequencia
          ] ?? 99;


        if (
          frequenciaA !==
          frequenciaB
        ) {

          return (
            frequenciaA -
            frequenciaB
          );

        }


        return (
          Number(
            a.tarefa.duracao
          ) -
          Number(
            b.tarefa.duracao
          )
        );

      }
    );


    /* ---------------------------------------------
       ESCOLHER TAREFAS QUE CABEM NO TEMPO
       --------------------------------------------- */

    const selecionadas:
      TarefaApresentacao[] =
      [];


    let tempoUsado =
      0;


    for (
      const item of tarefasDisponiveis
    ) {

      const duracao =
        Number(
          item.tarefa.duracao
        );


      if (
        tempoUsado +
        duracao <=
        tempo
      ) {

        selecionadas.push(
          item
        );

        tempoUsado +=
          duracao;

      }

    }


    /* ---------------------------------------------
       GUARDAR RESULTADO
       --------------------------------------------- */

    this.tarefasSugeridas =
      selecionadas.map(
        item => ({

          tarefa: {

            ...item.tarefa,

            concluida:
              false

          },

          divisaoId:
            item.divisaoId

        })
      );


    this.tempoTarefasSugeridas =
      tempoUsado;


    this.tarefaDescricaoAbertaId =
      '';


    this.isTarefasModalOpen =
      true;

  }


  /* =====================================================
     FECHAR MODAL DAS TAREFAS
     ===================================================== */

  fecharTarefasModal(): void {

    this.isTarefasModalOpen =
      false;

    this.tarefaDescricaoAbertaId =
      '';

  }


  /* =====================================================
     NOMES DAS DIVISÕES
     ===================================================== */

  obterNomeDivisao(
    id: string
  ): string {

    const guardadas =
      window.localStorage.getItem(
        this.STORAGE_DIVISOES
      );


    if (!guardadas) {

      return id;

    }


    try {

      const divisoes =
        JSON.parse(
          guardadas
        ) as Divisao[];


      const divisao =
        divisoes.find(
          d =>
            d.id === id
        );


      return (
        divisao?.nome ??
        id
      );

    }

    catch {

      return id;

    }

  }


  obterNomesDivisoes(
    divisoes: string[]
  ): string {

    if (
      !Array.isArray(divisoes)
    ) {

      return '';

    }


    return divisoes
      .map(
        id =>
          this.obterNomeDivisao(
            id
          )
      )
      .join(
        ' · '
      );

  }


  /* =====================================================
     DESCRIÇÕES
     ===================================================== */

  obterDescricaoDivisao(
    id: string
  ): string {

    const guardadas =
      window.localStorage.getItem(
        this.STORAGE_DIVISOES
      );


    if (!guardadas) {

      return '';

    }


    try {

      const divisoes =
        JSON.parse(
          guardadas
        ) as Divisao[];


      const divisao =
        divisoes.find(
          d =>
            d.id === id
        );


      return (
        divisao?.descricao?.trim() ??
        ''
      );

    }

    catch {

      return '';

    }

  }


  obterDescricaoTarefa(
    item: TarefaApresentacao
  ): string {

    return (
      item.tarefa.descricao?.trim() ??
      ''
    );

  }


  temDescricaoDivisao(
    item: TarefaApresentacao
  ): boolean {

    return (
      this.obterDescricaoDivisao(
        item.divisaoId
      ).length > 0
    );

  }


  temDescricaoTarefa(
    item: TarefaApresentacao
  ): boolean {

    return (
      this.obterDescricaoTarefa(
        item
      ).length > 0
    );

  }


  mostrarDescricaoDivisao(
    item: TarefaApresentacao
  ): void {

    if (
      !this.temDescricaoDivisao(
        item
      )
    ) {

      return;

    }


    const id =
      'divisao__' +
      this.obterIdOcorrencia(
        item.tarefa.id,
        item.divisaoId
      );


    if (
      this.tarefaDescricaoAbertaId ===
      id
    ) {

      this.tarefaDescricaoAbertaId =
        '';

      return;

    }


    this.tarefaDescricaoAbertaId =
      id;

  }


  mostrarDescricaoTarefa(
    item: TarefaApresentacao
  ): void {

    if (
      !this.temDescricaoTarefa(
        item
      )
    ) {

      return;

    }


    const id =
      'tarefa__' +
      this.obterIdOcorrencia(
        item.tarefa.id,
        item.divisaoId
      );


    if (
      this.tarefaDescricaoAbertaId ===
      id
    ) {

      this.tarefaDescricaoAbertaId =
        '';

      return;

    }


    this.tarefaDescricaoAbertaId =
      id;

  }


  /* =====================================================
     FREQUÊNCIA
     ===================================================== */

  obterNomeFrequencia(
    frequencia: string
  ): string {

    const nomes:
      Record<string, string> = {

        diaria:
          'Diária',

        semanal:
          'Semanal',

        mensal:
          'Mensal'

      };


    return (
      nomes[frequencia] ??
      frequencia
    );

  }


  /* =====================================================
     NAVEGAÇÃO
     ===================================================== */

  voltar(): void {

    window.history.back();

  }


  irParaHome(): void {

    window.location.href =
      '/home';

  }


  irParaPerfil(): void {

    window.location.href =
      '/perfil';

  }


  irParaAnimais(): void {

    window.location.href =
      '/animais';

  }


  irParaValores(): void {

    window.location.href =
      '/valores';

  }


  irParaMeditacoes(): void {

    window.location.href =
      '/meditacoes';

  }


  irParaMetadeSombra(): void {

    window.location.href =
      '/metade-sombra';

  }


  irParaLimpezas(): void {

    window.location.href =
      '/limpezas';

  }


  /* =====================================================
     NAVEGAÇÃO DOS CARTÕES
     ===================================================== */

  navigatePrayer(): void {

    window.location.href =
      '/home';

  }


  navigateLimpezas(): void {

    window.location.href =
      '/limpezas';

  }


  navigatePerfil(): void {

    window.location.href =
      '/perfil';

  }


  navigateAnimais(): void {

    window.location.href =
      '/animais';

  }


  navigateValores(): void {

    window.location.href =
      '/valores';

  }


  navigateMeditacoes(): void {

    window.location.href =
      '/meditacoes';

  }


  navigateMetadeSombra(): void {

    window.location.href =
      '/metade-sombra';

  }


  /* =====================================================
     PRIORIDADE
     ===================================================== */

  obterClassePrioridade(
    prioridade: number
  ): string {

    switch (
      Number(prioridade)
    ) {

      case 4:

        return 'prioridade-muito-alta';

      case 3:

        return 'prioridade-alta';

      case 2:

        return 'prioridade-media';

      case 1:

        return 'prioridade-baixa';

      default:

        return 'prioridade-media';

    }

  }


  /* =====================================================
     GUARDAR TAREFAS CONCLUÍDAS
     ===================================================== */

  guardarTarefasConcluidas(): void {

    const tarefasSelecionadas =
      this.tarefasSugeridas.filter(
        item =>
          item.tarefa.concluida === true
      );


    if (
      tarefasSelecionadas.length === 0
    ) {

      return;

    }


    const confirmar =
      window.confirm(
        'Tem a certeza que pretende guardar as tarefas selecionadas?'
      );


    if (!confirmar) {

      return;

    }


    const hoje =
      this.obterChaveDataHoje();


    /* =====================================================
       1. GUARDAR CONCLUÍDAS DE HOJE
       ===================================================== */

    const chave =
      `limpezas_concluidas_${hoje}`;


    try {

      const raw =
        window.localStorage.getItem(
          chave
        );


      let idsGuardados:
        string[] =
        [];


      if (raw) {

        const dados =
          JSON.parse(
            raw
          );


        if (Array.isArray(dados)) {

          idsGuardados =
            dados;

        }

      }


      const novosIds =
        tarefasSelecionadas
          .map(
            item =>
              this.obterIdOcorrencia(
                item.tarefa.id,
                item.divisaoId
              )
          )
          .filter(
            id =>
              !idsGuardados.includes(
                id
              )
          );


      const idsAtualizados = [

        ...idsGuardados,

        ...novosIds

      ];


      window.localStorage.setItem(

        chave,

        JSON.stringify(
          idsAtualizados
        )

      );


      /* =====================================================
         2. HISTÓRICO
         ===================================================== */

      const chaveHistorico =
        'limpezas_historico_v1';


      const rawHistorico =
        window.localStorage.getItem(
          chaveHistorico
        );


      let historico:
        {
          tarefaId: string;
          divisaoId: string;
          data: string;
        }[] =
        [];


      if (rawHistorico) {

        try {

          const dados =
            JSON.parse(
              rawHistorico
            );


          if (Array.isArray(dados)) {

            historico =
              dados;

          }

        }

        catch {

          historico =
            [];

        }

      }


      /* =====================================================
         3. ATUALIZAR ÚLTIMA DATA
         ===================================================== */

      for (
        const item of tarefasSelecionadas
      ) {

        const existente =
          historico.find(
            registo =>

              registo.tarefaId ===
                item.tarefa.id &&

              registo.divisaoId ===
                item.divisaoId
          );


        if (existente) {

          existente.data =
            hoje;

        }

        else {

          historico.push({

            tarefaId:
              item.tarefa.id,

            divisaoId:
              item.divisaoId,

            data:
              hoje

          });

        }

      }


      /* =====================================================
         4. GUARDAR HISTÓRICO
         ===================================================== */

      window.localStorage.setItem(

        chaveHistorico,

        JSON.stringify(
          historico
        )

      );


      /* =====================================================
         5. RETIRAR DA LISTA ATUAL
         ===================================================== */

      this.tarefasSugeridas =
        this.tarefasSugeridas.filter(
          item =>
            !tarefasSelecionadas.some(
              selecionada =>

                selecionada.tarefa.id ===
                  item.tarefa.id &&

                selecionada.divisaoId ===
                  item.divisaoId
            )
        );


      /* =====================================================
         6. ATUALIZAR TEMPO
         ===================================================== */

      this.tempoTarefasSugeridas =
        this.tarefasSugeridas.reduce(
          (total, item) =>

            total +
            Number(
              item.tarefa.duracao
            ),

          0
        );


      this.tarefaDescricaoAbertaId =
        '';


      /* =====================================================
         7. FECHAR SE NÃO HOUVER MAIS TAREFAS
         ===================================================== */

      if (
        this.tarefasSugeridas.length ===
        0
      ) {

        this.fecharTarefasModal();

      }

    }

    catch (erro) {

      console.error(
        'Erro ao guardar tarefas concluídas:',
        erro
      );

    }

  }


  /* =====================================================
     EXISTEM TAREFAS SELECIONADAS?
     ===================================================== */

  temTarefasSelecionadas(): boolean {

    return this.tarefasSugeridas.some(
      item =>
        item.tarefa.concluida === true
    );

  }

}

