import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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

interface Tarefa {
  id: string;
  nome: string;
  divisao: string;
  frequencia: string;
  prioridade: number;
  duracao: number;
  ativa: boolean;
  concluida?: boolean;
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

  backgroundByCasa: Record<string, string> = {
    'CASA DA VIDA': 'assets/backgrounds/vida.webp',
    'CASA DOS BENS': 'assets/backgrounds/bens.webp',
    'CASA DO SANGUE': 'assets/backgrounds/sangue.webp',
    'CASA DA SOLIDEZ': 'assets/backgrounds/solidez.webp',
    'CASA DOS FILHOS': 'assets/backgrounds/filhos.webp',
    'CASA DA SAÚDE': 'assets/backgrounds/saude.webp',
    'CASA DO CASAMENTO': 'assets/backgrounds/casamento.webp',
    'CASA DA MORTE/MUDANÇA': 'assets/backgrounds/morte.webp',
    'CASA DIVINA': 'assets/backgrounds/divina.webp',
    'CASA DA POSIÇÃO SOCIAL': 'assets/backgrounds/social.webp',
    'CASA DOS AMIGOS': 'assets/backgrounds/amigos.webp',
    'CASA DOS INIMIGOS': 'assets/backgrounds/inimigos.webp'
  };

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

  tempoDisponivel = 0;

  tarefas: Tarefa[] = [];

  tarefasSugeridas: Tarefa[] = [];

  tempoTarefasSugeridas = 0;

  isTarefasModalOpen = false;

  private readonly STORAGE_TAREFAS =
    'limpezas_tarefas_v1';

  private readonly STORAGE_DIVISOES =
    'limpezas_divisoes_v1';

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

    } else if (
      (mes === 2 && dia >= 16) ||
      (mes === 3 && dia <= 15)
    ) {
      casa = 'CASA DOS BENS';

    } else if (
      (mes === 3 && dia >= 16) ||
      (mes === 4 && dia <= 15)
    ) {
      casa = 'CASA DO SANGUE';

    } else if (
      (mes === 4 && dia >= 16) ||
      (mes === 5 && dia <= 15)
    ) {
      casa = 'CASA DA SOLIDEZ';

    } else if (
      (mes === 5 && dia >= 16) ||
      (mes === 6 && dia <= 15)
    ) {
      casa = 'CASA DOS FILHOS';

    } else if (
      (mes === 6 && dia >= 16) ||
      (mes === 7 && dia <= 15)
    ) {
      casa = 'CASA DA SAÚDE';

    } else if (
      (mes === 7 && dia >= 16) ||
      (mes === 8 && dia <= 15)
    ) {
      casa = 'CASA DO CASAMENTO';

    } else if (
      (mes === 8 && dia >= 16) ||
      (mes === 9 && dia <= 15)
    ) {
      casa = 'CASA DA MORTE/MUDANÇA';

    } else if (
      (mes === 9 && dia >= 16) ||
      (mes === 10 && dia <= 15)
    ) {
      casa = 'CASA DIVINA';

    } else if (
      (mes === 10 && dia >= 16) ||
      (mes === 11 && dia <= 15)
    ) {
      casa = 'CASA DA POSIÇÃO SOCIAL';

    } else if (
      (mes === 11 && dia >= 16) ||
      (mes === 12 && dia <= 15)
    ) {
      casa = 'CASA DOS AMIGOS';

    } else {
      casa = 'CASA DOS INIMIGOS';
    }

    this.casaAtual = casa;

    this.descricaoCasaAtual =
      this.casasMap[casa] ?? '';

    this.backgroundImage =
      this.backgroundByCasa[casa] ?? '';

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
     TAREFAS DE LIMPEZA
     ===================================================== */

  private carregarTarefasLimpezas(): void {
    const guardadas =
      window.localStorage.getItem(
        this.STORAGE_TAREFAS
      );

    if (!guardadas) {
      this.tarefas = [];
      return;
    }

    try {
      this.tarefas =
        JSON.parse(guardadas) as Tarefa[];

    } catch {
      this.tarefas = [];

      console.warn(
        'Não foi possível ler as tarefas de limpeza.'
      );
    }
  }

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
        JSON.parse(guardadas) as Array<{
          id: string;
          ativa: boolean;
        }>;

      return new Set(
        divisoes
          .filter(divisao => divisao.ativa)
          .map(divisao => divisao.id)
      );

    } catch {
      return new Set<string>();
    }
  }

  /* =====================================================
     DATA LOCAL DE HOJE
     ===================================================== */

  private obterChaveDataHoje(): string {
    const hoje = new Date();

    const ano =
      hoje.getFullYear();

    const mes =
      String(
        hoje.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        hoje.getDate()
      ).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  /* =====================================================
     CALCULAR TAREFAS PARA O TEMPO DISPONÍVEL
     ===================================================== */

  calcularTarefas(): void {

    const tempo =
      Number(this.tempoDisponivel);

    if (!tempo || tempo <= 0) {

      this.tarefasSugeridas = [];

      this.tempoTarefasSugeridas = 0;

      this.isTarefasModalOpen = true;

      return;
    }

    /* ---------------------------------------------
       CARREGAR DADOS ATUAIS
       --------------------------------------------- */

    this.carregarTarefasLimpezas();

    const divisoesAtivas =
      this.obterDivisoesAtivas();

    /* ---------------------------------------------
       TAREFAS JÁ CONCLUÍDAS HOJE
       --------------------------------------------- */

    const chaveHoje =
      `limpezas_concluidas_${this.obterChaveDataHoje()}`;

    let tarefasConcluidasHoje: string[] = [];

    const guardadasHoje =
      window.localStorage.getItem(chaveHoje);

    if (guardadasHoje) {
      try {
        tarefasConcluidasHoje =
          JSON.parse(guardadasHoje) as string[];
      } catch {
        tarefasConcluidasHoje = [];
      }
    }

    /* ---------------------------------------------
       FILTRAR TAREFAS DISPONÍVEIS
       --------------------------------------------- */

    const tarefasDisponiveis =
      this.tarefas

        .filter(tarefa =>
          tarefa.ativa &&
          divisoesAtivas.has(tarefa.divisao) &&
          Number(tarefa.duracao) > 0 &&
          !tarefasConcluidasHoje.includes(tarefa.id)
        )

        .sort((a, b) => {

          /* Primeiro: prioridade */

          const prioridadeA =
            Number(a.prioridade) || 0;

          const prioridadeB =
            Number(b.prioridade) || 0;

          if (
            prioridadeA !==
            prioridadeB
          ) {
            return prioridadeB -
                   prioridadeA;
          }

          /* Segundo: frequência */

          const ordemFrequencia:
            Record<string, number> = {
              diaria: 1,
              semanal: 2,
              mensal: 3
            };

          const frequenciaA =
            ordemFrequencia[
              a.frequencia
            ] ?? 99;

          const frequenciaB =
            ordemFrequencia[
              b.frequencia
            ] ?? 99;

          if (
            frequenciaA !==
            frequenciaB
          ) {
            return frequenciaA -
                   frequenciaB;
          }

          /* Terceiro: duração */

          return (
            Number(a.duracao) -
            Number(b.duracao)
          );
        });

    /* ---------------------------------------------
       ESCOLHER TAREFAS QUE CABEM NO TEMPO
       --------------------------------------------- */

    const selecionadas: Tarefa[] = [];

    let tempoUsado = 0;

    for (
      const tarefa of tarefasDisponiveis
    ) {

      const duracao =
        Number(tarefa.duracao);

      if (
        tempoUsado + duracao <=
        tempo
      ) {

        selecionadas.push(tarefa);

        tempoUsado += duracao;
      }
    }

    /* ---------------------------------------------
       GUARDAR RESULTADO
       --------------------------------------------- */

    this.tarefasSugeridas =
      selecionadas.map(tarefa => ({
        ...tarefa,
        concluida:
          tarefasConcluidasHoje.includes(
            tarefa.id
          )
      }));

    this.tempoTarefasSugeridas =
      tempoUsado;

    /* ---------------------------------------------
       ABRIR MODAL
       --------------------------------------------- */

    this.isTarefasModalOpen = true;
  }

  /* =====================================================
     FECHAR MODAL DAS TAREFAS
     ===================================================== */

  fecharTarefasModal(): void {
    this.isTarefasModalOpen = false;
  }

  /* =====================================================
     NOMES PARA APRESENTAÇÃO
     ===================================================== */

  obterNomeDivisao(id: string): string {

    const guardadas =
      window.localStorage.getItem(
        this.STORAGE_DIVISOES
      );

    if (!guardadas) {
      return id;
    }

    try {

      const divisoes =
        JSON.parse(guardadas) as Array<{
          id: string;
          nome: string;
        }>;

      const divisao =
        divisoes.find(
          d => d.id === id
        );

      return divisao?.nome ?? id;

    } catch {
      return id;
    }
  }

  obterNomeFrequencia(
    frequencia: string
  ): string {

    const nomes:
      Record<string, string> = {

      diaria: 'Diária',
      semanal: 'Semanal',
      mensal: 'Mensal'
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

  /*
   * A HOME é agora a página inicial.
   */

  irParaHome(): void {
    window.location.href = '/home';
  }

  irParaPerfil(): void {
    window.location.href = '/perfil';
  }

  irParaAnimais(): void {
    window.location.href = '/animais';
  }

  irParaValores(): void {
    window.location.href = '/valores';
  }

  irParaMeditacoes(): void {
    window.location.href = '/meditacoes';
  }

  irParaMetadeSombra(): void {
    window.location.href = '/metade-sombra';
  }

  irParaLimpezas(): void {
    window.location.href = '/limpezas';
  }

  /* =====================================================
     EDIÇÃO DA REGRA
     ===================================================== */

  openRegraEdit(): void {

    this.regraTextoEdit =
      this.regraTexto;

    this.regraTextoEditBackup =
      this.regraTexto;

    this.isRegraEditModalOpen = true;
  }

  closeRegraEdit(): void {
    this.isRegraEditModalOpen = false;
  }

  saveRegraEdit(): void {

    this.regraTexto =
      this.regraTextoEdit.trim();

    window.localStorage.setItem(
      'oracao_perdao_regra_texto',
      this.regraTexto
    );

    this.isRegraEditModalOpen = false;
  }

  /* =====================================================
     NAVEGAÇÃO DOS CARTÕES
     ===================================================== */

  /*
   * O cartão "Oração do Perdão" existente na HOME
   * deve abrir esta página.
   */

  navigatePrayer(): void {
    window.location.href = '/home';
  }

  navigateLimpezas(): void {
    window.location.href = '/limpezas';
  }

  navigatePerfil(): void {
    window.location.href = '/perfil';
  }

  navigateAnimais(): void {
    window.location.href = '/animais';
  }

  navigateValores(): void {
    window.location.href = '/valores';
  }

  navigateMeditacoes(): void {
    window.location.href = '/meditacoes';
  }

  navigateMetadeSombra(): void {
    window.location.href = '/metade-sombra';
  }

  /* =====================================================
     PRIORIDADE
     ===================================================== */

  obterClassePrioridade(
    prioridade: number
  ): string {

    switch (Number(prioridade)) {

      case 4:
        return 'prioridade-muito-alta';

      case 3:
        return 'prioridade-alta';

      case 2:
        return 'prioridade-media';

      case 1:
        return 'prioridade-baixa';

      default:
        /*
         * Qualquer valor inválido recebe
         * a cor da prioridade média.
         *
         * Nunca será preto.
         */
        return 'prioridade-media';
    }
  }

    /* =====================================================
     GUARDAR TAREFAS CONCLUÍDAS
     ===================================================== */

  guardarTarefasConcluidas(): void {

    const tarefasSelecionadas =
      this.tarefasSugeridas.filter(
        tarefa => tarefa.concluida === true
      );

    // Não permite guardar sem selecionar nenhuma tarefa
    if (tarefasSelecionadas.length === 0) {
      return;
    }

    // Confirmação antes de guardar
    const confirmar = window.confirm(
      'Tem a certeza que pretende guardar as tarefas selecionadas?'
    );

    if (!confirmar) {
      return;
    }

    const chave =
      `limpezas_concluidas_${this.obterChaveDataHoje()}`;

    try {

      const raw =
        window.localStorage.getItem(chave);

      const idsGuardados: string[] =
        raw ? JSON.parse(raw) : [];

      const novosIds =
        tarefasSelecionadas
          .map(tarefa => tarefa.id)
          .filter(
            id => !idsGuardados.includes(id)
          );

      const idsAtualizados = [
        ...idsGuardados,
        ...novosIds
      ];

      window.localStorage.setItem(
        chave,
        JSON.stringify(idsAtualizados)
      );

      // Retirar da lista as tarefas que acabaram
      // de ser guardadas
      this.tarefasSugeridas =
        this.tarefasSugeridas.filter(
          tarefa =>
            !tarefasSelecionadas.some(
              selecionada =>
                selecionada.id === tarefa.id
            )
        );

      // Recalcular o tempo restante da lista
      this.tempoTarefasSugeridas =
        this.tarefasSugeridas.reduce(
          (total, tarefa) =>
            total + Number(tarefa.duracao),
          0
        );

      // Se já não houver tarefas, fechar o modal
      if (this.tarefasSugeridas.length === 0) {
        this.fecharTarefasModal();
      }

    } catch (erro) {

      console.error(
        'Erro ao guardar tarefas concluídas:',
        erro
      );

    }
  }

  /* =====================================================
     VERIFICAR SE EXISTE ALGUMA TAREFA SELECIONADA
     ===================================================== */

  temTarefasSelecionadas(): boolean {

    return this.tarefasSugeridas.some(
      tarefa => tarefa.concluida === true
    );

  }

}