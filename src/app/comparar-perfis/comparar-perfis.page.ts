
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom, Subscription } from 'rxjs';

interface Pessoa {
  id: number;
  nome?: string;
  apelido?: string;
  localidade?: string;
  grupo?: string;
  data?: string;
  eneagrama_tipo?: number | string;
  [campo: string]: any;
}

interface RegistoRelacional {
  descricao?: string;
  objetivo?: string;
  personalidade?: string;
  ferida?: string;
  questao_sistemica?: string;
  afirmacao?: string;
  frase_matriz?: string;
  espelho?: string;
  valores?: string | string[];
  infancia?: string;
  dificuldades?: string[];
  gostos?: string[];
  autoajuda?: string;
  exercicios_praticos?: string[];
  tipo?: number;
  signo?: string;
  elemento?: string;
  anos?: number[];
  id?: number;
  nome?: string;
  faixa_etaria?: string;
  idades?: number[];
}

interface AnalisePerfil {
  idade: number | null;
  signoSolar: string;
  signoChines: string;
  setenio: string;
  setenioId: number | null;
  setenioDescricao: string;
  ferida: string;
  necessidade: string;
  defesa: string;
  valores: string;
  questao: string;
  afirmacao: string;
  fraseMatriz: string;
  temas: string[];
  fontes: string[];
}

interface AnaliseSeteniosRelacional {
  temDados: boolean;
  titulo: string;
  descricao: string;
  setenioA: string;
  setenioB: string;
  descricaoA: string;
  descricaoB: string;
  temasA: string[];
  temasB: string[];
  temasComuns: string[];
  temasDiferentes: string[];
  pergunta: string;
}

interface MapaRelacional {
  espelhamento: string;
  resumoComum: string;
  complementaridade: string;
  ativacao: string;
  risco: string;
  integracao: string;
  temasA: string[];
  temasB: string[];
  temasComuns: string[];
  temasOpostos: string[];
  pergunta: string;

  tipoRelacao: string[];
  afinidade: number;
  complementaridadeNivel: number;
  potencialCrescimento: number;
  ativacaoPadroes: number;

  explicacaoAfinidade: string;
  explicacaoComplementaridade: string;
  explicacaoCrescimento: string;
  explicacaoAtivacao: string;

  cicloProvavel: string[];
  passosIntegracao: string[];
}

@Component({
  selector: 'app-comparar-perfis',
  templateUrl: './comparar-perfis.page.html',
  styleUrls: ['./comparar-perfis.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonicModule
  ]
})
export class CompararPerfisPage implements OnInit, OnDestroy {

  carregando = true;
  erro = '';

  pessoas: Pessoa[] = [];
  pessoaA: Pessoa | null = null;
  pessoaB: Pessoa | null = null;

  pessoaAId: number | null = null;
  pessoaBId: number | null = null;

  filtroLocalidadeA = '';
  filtroGrupoA = '';
  filtroLocalidadeB = '';
  filtroGrupoB = '';

  localidades: string[] = [];
  grupos: string[] = [];

  eventoOrigem = '';
  dataEvento = '';
  participantesEvento: Pessoa[] = [];
  idsParticipantesNaoEncontrados: number[] = [];

  private idsParticipantes: number[] = [];
  private subscription = new Subscription();

  private registosDia: Record<string, RegistoRelacional> = {};
  private registosChineses: RegistoRelacional[] = [];
  private registosSetenios: RegistoRelacional[] = [];
  private registosEneagrama: RegistoRelacional[] = [];
  private registosSolares = new Map<string, RegistoRelacional>();

  private readonly chavesSolares = [
    'carneiro',
    'touro',
    'gemeos',
    'caranguejo',
    'leao',
    'virgem',
    'balanca',
    'escorpiao',
    'sagitario',
    'capricornio',
    'aquario',
    'peixes'
  ];

  /**
   * Legenda das classificações relacionais.
   * São hipóteses para reflexão, não diagnósticos.
   */
  readonly legendaTiposRelacao = [
    {
      nome: 'Facilitadora',
      classe: 'tipo-facilitadora',
      cor: '#237342',
      fundo: '#DDF3E4',
      descricao:
        'Pode favorecer a integração das dificuldades e o desenvolvimento de recursos.'
    },
    {
      nome: 'Desafiante',
      classe: 'tipo-desafiante',
      cor: '#946300',
      fundo: '#FFF0C2',
      descricao:
        'Pode trazer desconforto e oportunidades de crescimento.'
    },
    {
      nome: 'Ativadora',
      classe: 'tipo-ativadora',
      cor: '#B42323',
      fundo: '#FBE0E0',
      descricao:
        'Justifica explorar possíveis reações defensivas e sensibilidades.'
    },
    {
      nome: 'Complementar',
      classe: 'tipo-complementar',
      cor: '#245DB0',
      fundo: '#DDEBFF',
      descricao:
        'Pode permitir a troca de capacidades e perspetivas diferentes.'
    },
    {
      nome: 'Espelho',
      classe: 'tipo-espelho',
      cor: '#7541A5',
      fundo: '#EDE0FF',
      descricao:
        'Pode evidenciar temas, necessidades ou sensibilidades semelhantes.'
    }
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.subscription.add(
      this.route.queryParamMap.subscribe(params => {
        this.eventoOrigem = params.get('evento') || '';
        this.dataEvento = params.get('data') || '';

        const idsRaw = params.get('participantesIds');

        this.idsParticipantes = this.lerIdsParticipantes(idsRaw);

        if (this.pessoas.length) {
          this.atualizarParticipantesEvento();
        }
      })
    );

    await this.carregarDados();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // =========================================================
  // CARREGAMENTO DOS DADOS
  // =========================================================

  private async carregarDados(): Promise<void> {
    this.carregando = true;
    this.erro = '';

    try {
      const [
        pessoasJson,
        diaJson,
        chinesesJson,
        seteniosJson,
        eneagramaJson
      ] = await Promise.all([
        firstValueFrom(this.http.get<any>('assets/data/pessoas.json')),
        firstValueFrom(this.http.get<any>('assets/data/dia_nascimento.json')),
        firstValueFrom(this.http.get<any>('assets/data/chineses.json')),
        firstValueFrom(this.http.get<any>('assets/data/setenios.json')),
        firstValueFrom(this.http.get<any>('assets/data/eneagrama.json'))
      ]);

      this.registosDia = this.normalizarRegistosDia(diaJson);

      this.registosChineses = Array.isArray(chinesesJson)
        ? chinesesJson
        : [];

      this.registosSetenios = Array.isArray(seteniosJson)
        ? seteniosJson
        : [];

      this.registosEneagrama = Array.isArray(eneagramaJson)
        ? eneagramaJson
        : [];

      await this.carregarSignosSolares();

      this.pessoas = this.aplicarOverrides(pessoasJson);

      this.atualizarFiltros();
      this.atualizarParticipantesEvento();
      this.atualizarSelecoes();

    } catch (error) {
      console.error('Erro ao carregar dados da comparação:', error);

      this.erro =
        'Não foi possível carregar os perfis ou os ficheiros de análise. Confirma os ficheiros em assets/data.';

    } finally {
      this.carregando = false;
    }
  }

  private async carregarSignosSolares(): Promise<void> {
    const pedidos = this.chavesSolares.map(async chave => {
      try {
        const dados = await firstValueFrom(
          this.http.get<any>(`assets/data/solares/${chave}.json`)
        );

        const registo = Array.isArray(dados) ? dados[0] : dados;

        if (registo && typeof registo === 'object') {
          this.registosSolares.set(chave, registo);
        }
      } catch {
        // Um ficheiro solar em falta não impede a comparação.
      }
    });

    await Promise.all(pedidos);
  }

  private normalizarRegistosDia(
    dados: any
  ): Record<string, RegistoRelacional> {
    if (Array.isArray(dados)) {
      const resultado: Record<string, RegistoRelacional> = {};

      dados.forEach((registo: any, indice: number) => {
        const dia = String(registo?.dia ?? registo?.id ?? indice + 1);
        resultado[dia] = registo;
      });

      return resultado;
    }

    return dados && typeof dados === 'object' ? dados : {};
  }

  private aplicarOverrides(dados: any): Pessoa[] {
    const base: any[] = Array.isArray(dados)
      ? dados
      : Array.isArray(dados?.pessoas)
        ? dados.pessoas
        : [];

    const overrides = this.lerLocalStorage<Record<string, any>>(
      'pessoas_overrides_v1',
      {}
    );

    const eliminadosRaw = this.lerLocalStorage<any[]>(
      'pessoas_deleted_v1',
      []
    );

    const eliminados = new Set<number>(
      eliminadosRaw.map((item: any) =>
        Number(typeof item === 'object' ? item.id : item)
      )
    );

    const porId = new Map<number, Pessoa>();

    base.forEach((pessoa, indice) => {
      const id = Number(pessoa?.id ?? indice + 1);

      if (!Number.isFinite(id) || eliminados.has(id)) {
        return;
      }

      porId.set(id, {
        ...pessoa,
        ...(overrides[String(id)] || {}),
        id
      });
    });

    Object.entries(overrides).forEach(([idTexto, override]) => {
      const id = Number(idTexto);

      if (
        !Number.isFinite(id) ||
        id <= 0 ||
        eliminados.has(id) ||
        porId.has(id) ||
        !override
      ) {
        return;
      }

      porId.set(id, {
        ...override as Pessoa,
        id
      });
    });

    return Array.from(porId.values()).sort((a, b) =>
      this.nomeCompleto(a).localeCompare(this.nomeCompleto(b), 'pt')
    );
  }

  private lerLocalStorage<T>(chave: string, fallback: T): T {
    try {
      const valor = localStorage.getItem(chave);
      return valor ? JSON.parse(valor) as T : fallback;
    } catch {
      return fallback;
    }
  }

  // =========================================================
  // FILTROS E SELEÇÃO DOS PERFIS
  // =========================================================

  get pessoasFiltradasA(): Pessoa[] {
    return this.filtrarPessoas(
      this.filtroLocalidadeA,
      this.filtroGrupoA
    );
  }

  get pessoasFiltradasB(): Pessoa[] {
    return this.filtrarPessoas(
      this.filtroLocalidadeB,
      this.filtroGrupoB
    );
  }

  private filtrarPessoas(
    localidade: string,
    grupo: string
  ): Pessoa[] {
    return this.pessoas.filter(pessoa => {
      const correspondeLocalidade =
        !localidade || (pessoa.localidade || '') === localidade;

      const correspondeGrupo =
        !grupo || (pessoa.grupo || '') === grupo;

      return correspondeLocalidade && correspondeGrupo;
    });
  }

  private atualizarFiltros(): void {
    this.localidades = Array.from(
      new Set(
        this.pessoas
          .map(p => (p.localidade || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt'));

    this.grupos = Array.from(
      new Set(
        this.pessoas
          .map(p => (p.grupo || '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt'));
  }

  private atualizarSelecoes(): void {
    this.pessoaA = this.pessoas.find(
      p => p.id === Number(this.pessoaAId)
    ) || null;

    this.pessoaB = this.pessoas.find(
      p => p.id === Number(this.pessoaBId)
    ) || null;
  }

  alterarFiltroLocalidadeA(): void {
    this.pessoaAId = null;
    this.pessoaA = null;
  }

  alterarFiltroGrupoA(): void {
    this.pessoaAId = null;
    this.pessoaA = null;
  }

  alterarFiltroLocalidadeB(): void {
    this.pessoaBId = null;
    this.pessoaB = null;
  }

  alterarFiltroGrupoB(): void {
    this.pessoaBId = null;
    this.pessoaB = null;
  }

  alterarPessoaA(): void {
    this.pessoaA = this.pessoas.find(
      p => p.id === Number(this.pessoaAId)
    ) || null;
  }

  alterarPessoaB(): void {
    this.pessoaB = this.pessoas.find(
      p => p.id === Number(this.pessoaBId)
    ) || null;
  }

  nomeCompleto(pessoa: Pessoa | null | undefined): string {
    if (!pessoa) {
      return '';
    }

    return [pessoa.nome, pessoa.apelido]
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .join(' ');
  }

  valor(
    pessoa: Pessoa | null | undefined,
    campo: 'data' | 'eneagrama_tipo'
  ): string {
    if (!pessoa) {
      return '—';
    }

    const valor = pessoa[campo];

    if (
      valor === undefined ||
      valor === null ||
      String(valor).trim() === '' ||
      (campo === 'eneagrama_tipo' && Number(valor) === 0)
    ) {
      return 'Não indicado';
    }

    if (campo === 'data') {
      return this.formatarData(String(valor));
    }

    return String(valor);
  }

  voltar(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      void this.router.navigate(['/']);
    }
  }

  get podeComparar(): boolean {
    return !!this.pessoaA &&
      !!this.pessoaB &&
      this.pessoaA.id !== this.pessoaB.id;
  }

  get temEvento(): boolean {
    return !!(
      this.eventoOrigem ||
      this.dataEvento ||
      this.idsParticipantes.length
    );
  }

  get podeCompararComParticipantes(): boolean {
    return !!this.pessoaA && this.participantesEvento.length > 0;
  }

  private lerIdsParticipantes(valor: string | null): number[] {
    if (!valor) {
      return [];
    }

    try {
      const parsed = JSON.parse(valor);

      if (Array.isArray(parsed)) {
        return parsed.map(Number).filter(Number.isFinite);
      }
    } catch {
      // Pode ser uma lista separada por vírgulas.
    }

    return valor
      .split(',')
      .map(v => Number(v.trim()))
      .filter(v => Number.isFinite(v) && v > 0);
  }

  private atualizarParticipantesEvento(): void {
    const ids = new Set(this.idsParticipantes);

    this.participantesEvento = this.pessoas.filter(
      pessoa => ids.has(pessoa.id)
    );

    this.idsParticipantesNaoEncontrados = Array.from(ids).filter(
      id => !this.pessoas.some(pessoa => pessoa.id === id)
    );
  }

  // =========================================================
  // ANÁLISE INDIVIDUAL
  // =========================================================

  analiseDe(pessoa: Pessoa | null): AnalisePerfil {
    if (!pessoa) {
      return this.analiseVazia();
    }

    const nascimento = this.lerData(pessoa.data);
    const idade = nascimento ? this.calcularIdade(nascimento) : null;

    const chaveSolar = pessoa.data
      ? this.getSignoSolarKeyPorDataNascimento(pessoa.data)
      : null;

    const solar = chaveSolar
      ? this.registosSolares.get(chaveSolar)
      : undefined;

    const ano = nascimento?.getFullYear();

    const dia = nascimento
      ? this.registosDia[String(nascimento.getDate())]
      : undefined;

    const chines = ano === undefined
      ? undefined
      : this.registosChineses.find(
          registo => Array.isArray(registo.anos) &&
            registo.anos.includes(ano)
        );

    const tipoEneagrama = Number(pessoa.eneagrama_tipo);

    const eneagrama = tipoEneagrama > 0
      ? this.registosEneagrama.find(
          registo => Number(registo.tipo) === tipoEneagrama
        )
      : undefined;

    const numeroSetenio = idade === null
      ? null
      : Math.floor(idade / 7) + 1;

    const setenioRegisto = numeroSetenio === null
      ? undefined
      : this.registosSetenios.find(
          registo => Number(registo.id) === numeroSetenio
        );

    const fontes = [dia, solar, chines].filter(
      (registo): registo is RegistoRelacional => !!registo
    );

    const ferida = this.unirUnicos(
      fontes.map(registo => registo.ferida)
    );

    const necessidade = this.unirUnicos([
      solar?.objetivo,
      dia?.questao_sistemica
    ]);

    const defesa = this.unirUnicos([
      ...(eneagrama?.dificuldades || [])
    ]);

    const valores = this.unirValores(
      fontes.map(registo => registo.valores)
    );

    const questao = this.unirUnicos(
      fontes.map(registo => registo.questao_sistemica)
    );

    const afirmacao = this.unirUnicos(
      fontes.map(registo => registo.afirmacao)
    );

    const fraseMatriz = this.unirUnicos(
      fontes.map(registo => registo.frase_matriz)
    );

    const temas = this.extrairTemas([
      ferida,
      necessidade,
      defesa,
      valores,
      questao,
      solar?.objetivo,
      solar?.personalidade,
      dia?.descricao,
      chines?.descricao
    ]);

    return {
      idade,
      signoSolar: solar?.signo || this.nomeSigno(chaveSolar),
      signoChines: chines
        ? [chines.signo, chines.elemento].filter(Boolean).join(' — ')
        : '',

      setenio: setenioRegisto?.nome
        ? setenioRegisto.nome
        : numeroSetenio !== null
          ? `${numeroSetenio}º seténio`
          : '',

      setenioId: numeroSetenio,
      setenioDescricao: setenioRegisto?.descricao || '',

      ferida,
      necessidade,
      defesa,
      valores,
      questao,
      afirmacao,
      fraseMatriz,
      temas,
      fontes: fontes.map(registo =>
        registo.signo || registo.nome || 'Dados de nascimento'
      )
    };
  }

  private analiseVazia(): AnalisePerfil {
    return {
      idade: null,
      signoSolar: '',
      signoChines: '',
      setenio: '',
      setenioId: null,
      setenioDescricao: '',
      ferida: '',
      necessidade: '',
      defesa: '',
      valores: '',
      questao: '',
      afirmacao: '',
      fraseMatriz: '',
      temas: [],
      fontes: []
    };
  }

  // =========================================================
  // ANÁLISE RELACIONAL DOS SETÉNIOS — CAMADA 5
  // =========================================================

  /**
   * Cruza as descrições existentes no setenios.json.
   *
   * Não pressupõe que um seténio seja compatível ou incompatível
   * com outro. Identifica apenas temas presentes nas descrições.
   */
  analiseSeteniosRelacional(
    pessoaA: Pessoa | null,
    pessoaB: Pessoa | null
  ): AnaliseSeteniosRelacional {
    const a = this.analiseDe(pessoaA);
    const b = this.analiseDe(pessoaB);

    const temasA = this.extrairTemasSetenio(a.setenioDescricao);
    const temasB = this.extrairTemasSetenio(b.setenioDescricao);

    const temasComuns = temasA.filter(
      tema => temasB.includes(tema)
    );

    const temasDiferentes = [
      ...temasA.filter(tema => !temasB.includes(tema)),
      ...temasB.filter(tema => !temasA.includes(tema))
    ];

    const temDados = !!(
      a.setenioDescricao.trim() ||
      b.setenioDescricao.trim()
    );

    let titulo = 'Ainda não é possível cruzar os dois seténios';
    let descricao =
      'É necessário existir uma descrição de seténio para pelo menos uma das pessoas.';

    if (temDados) {
      if (temasComuns.length && temasDiferentes.length) {
        titulo = 'Temas partilhados e percursos diferentes';

        descricao =
          `As descrições partilham temas como ${temasComuns.join(', ')}. ` +
          `Também apresentam focos diferentes: ${temasDiferentes.join(', ')}. ` +
          'Esta combinação pode servir para explorar o que aproxima as duas pessoas e aquilo que cada uma valoriza de forma diferente.';
      } else if (temasComuns.length) {
        titulo = 'Possíveis pontos de encontro';

        descricao =
          `As descrições dos dois seténios incluem temas como ${temasComuns.join(', ')}. ` +
          'Estes temas podem constituir um ponto de partida para diálogo, cooperação ou compreensão mútua.';
      } else if (temasDiferentes.length) {
        titulo = 'Focos de desenvolvimento diferentes';

        descricao =
          `As descrições salientam focos diferentes: ${temasDiferentes.join(', ')}. ` +
          'Isso não significa incompatibilidade. Pode ser útil compreender o que é importante para cada pessoa nesta fase da vida.';
      } else {
        titulo = 'Leitura conjunta das fases de vida';

        descricao =
          'Existem descrições disponíveis, mas não foram encontrados temas suficientes para estabelecer uma comparação temática clara. A leitura direta das descrições continua a ser útil.';
      }
    }

    let pergunta =
      'Que aspetos da fase de vida de cada pessoa merecem ser compreendidos com mais atenção?';

    if (temasComuns.length && temasDiferentes.length) {
      pergunta =
        `Como podem aproveitar o tema comum ${temasComuns[0]} ` +
        `e respeitar as diferenças em torno de ${temasDiferentes[0]}?`;
    } else if (temasComuns.length) {
      pergunta =
        `Como podem transformar o tema partilhado ${temasComuns[0]} ` +
        'numa oportunidade concreta de compreensão e cooperação?';
    } else if (temasDiferentes.length) {
      pergunta =
        `Como podem respeitar os diferentes focos de vida, ` +
        `incluindo ${temasDiferentes[0]}, sem exigir que ambos estejam na mesma fase?`;
    }

    return {
      temDados,
      titulo,
      descricao,
      setenioA: a.setenio,
      setenioB: b.setenio,
      descricaoA: a.setenioDescricao,
      descricaoB: b.setenioDescricao,
      temasA,
      temasB,
      temasComuns,
      temasDiferentes,
      pergunta
    };
  }

  /**
   * Extrai temas amplos das descrições dos seténios.
   * Os nomes dos temas são categorias de leitura desta aplicação;
   * não são campos nem classificações fornecidos pelo JSON.
   */
  private extrairTemasSetenio(descricao: string): string[] {
    if (!descricao || !descricao.trim()) {
      return [];
    }

    const texto = this.normalizarTexto(descricao);

    const dicionario: Record<string, string[]> = {
      'Autonomia e independência': [
        'autonomia',
        'independencia',
        'independente',
        'liberdade',
        'sair de casa'
      ],
      'Família e vínculos': [
        'familia',
        'familiar',
        'filhos',
        'pais',
        'mae',
        'pai',
        'antepassados',
        'descendentes'
      ],
      'Trabalho e carreira': [
        'trabalho',
        'profissao',
        'carreira',
        'profissional',
        'lideranca',
        'administracao',
        'administrar'
      ],
      'Recursos e prosperidade': [
        'financeiro',
        'financas',
        'prosperidade',
        'dinheiro',
        'poupanca',
        'recursos',
        'bens'
      ],
      'Responsabilidade e prudência': [
        'responsabilidade',
        'prudencia',
        'esforco',
        'conduta',
        'dever'
      ],
      'Comunicação e partilha': [
        'comunicacao',
        'verbal',
        'expressao',
        'escuta',
        'partilha',
        'conhecimento'
      ],
      'Relações sociais': [
        'social',
        'amizade',
        'amigos',
        'grupos',
        'colaboracao',
        'cooperacao',
        'socializar'
      ],
      'Espiritualidade e reflexão': [
        'espiritual',
        'espiritualidade',
        'meditacao',
        'filosofico',
        'filosofia',
        'reflexao'
      ],
      'Cuidado e serviço': [
        'cuidar',
        'cuidado',
        'ajudar',
        'servico',
        'generosidade',
        'caridade',
        'filantropia'
      ],
      'Harmonia e respeito': [
        'harmonia',
        'respeito',
        'paz',
        'convivencia'
      ],
      'Criatividade e expressão': [
        'artistico',
        'arte',
        'criatividade',
        'expressao'
      ],
      'Mudança e adaptação': [
        'mudanca',
        'transformacao',
        'reestruturar',
        'reorganizar',
        'adaptacao',
        'reformular'
      ],
      'Simplicidade e desapego': [
        'simplicidade',
        'material',
        'desapego',
        'reducao material'
      ],
      'Alegria e lazer': [
        'alegria',
        'jogos',
        'entretenimento',
        'diversao',
        'lazer'
      ],
      'Aprendizagem e desenvolvimento': [
        'desenvolvimento',
        'aprendizagem',
        'aprender',
        'estudo',
        'estudos',
        'ensinar'
      ],
      'Organização e estrutura': [
        'organizacao',
        'estrutura',
        'organizar',
        'planeamento',
        'administracao'
      ]
    };

    return Object.entries(dicionario)
      .filter(([, palavras]) =>
        palavras.some(palavra => texto.includes(palavra))
      )
      .map(([tema]) => tema);
  }

  private normalizarTexto(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // =========================================================
  // DATAS
  // =========================================================

  private lerData(valor: string | undefined): Date | null {
    if (!valor) {
      return null;
    }

    const correspondencia = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);

    let data: Date;

    if (correspondencia) {
      data = new Date(
        Number(correspondencia[1]),
        Number(correspondencia[2]) - 1,
        Number(correspondencia[3])
      );
    } else {
      data = new Date(valor);
    }

    return Number.isNaN(data.getTime()) ? null : data;
  }

  private calcularIdade(nascimento: Date): number {
    const hoje = new Date();

    let idade = hoje.getFullYear() - nascimento.getFullYear();

    const aindaNaoFezAnos =
      hoje.getMonth() < nascimento.getMonth() ||
      (
        hoje.getMonth() === nascimento.getMonth() &&
        hoje.getDate() < nascimento.getDate()
      );

    if (aindaNaoFezAnos) {
      idade--;
    }

    return idade;
  }

  private formatarData(valor: string): string {
    const data = this.lerData(valor);

    if (!data) {
      return valor;
    }

    return new Intl.DateTimeFormat('pt-PT').format(data);
  }

  private getSignoSolarKeyPorDataNascimento(
    dateStr: string
  ): string | null {
    const d = this.lerData(dateStr);

    if (!d) {
      return null;
    }

    const mmdd = (d.getMonth() + 1) * 100 + d.getDate();

    if (mmdd >= 321 && mmdd <= 419) return 'carneiro';
    if (mmdd >= 420 && mmdd <= 520) return 'touro';
    if (mmdd >= 521 && mmdd <= 620) return 'gemeos';
    if (mmdd >= 621 && mmdd <= 722) return 'caranguejo';
    if (mmdd >= 723 && mmdd <= 822) return 'leao';
    if (mmdd >= 823 && mmdd <= 922) return 'virgem';
    if (mmdd >= 923 && mmdd <= 1022) return 'balanca';
    if (mmdd >= 1023 && mmdd <= 1121) return 'escorpiao';
    if (mmdd >= 1122 && mmdd <= 1221) return 'sagitario';
    if (mmdd >= 1222 && mmdd <= 1231) return 'capricornio';
    if (mmdd >= 101 && mmdd <= 120) return 'capricornio';
    if (mmdd >= 121 && mmdd <= 219) return 'aquario';
    if (mmdd >= 220 && mmdd <= 320) return 'peixes';

    return null;
  }

  private nomeSigno(chave: string | null): string {
    const nomes: Record<string, string> = {
      carneiro: 'Carneiro',
      touro: 'Touro',
      gemeos: 'Gémeos',
      caranguejo: 'Caranguejo',
      leao: 'Leão',
      virgem: 'Virgem',
      balanca: 'Balança',
      escorpiao: 'Escorpião',
      sagitario: 'Sagitário',
      capricornio: 'Capricórnio',
      aquario: 'Aquário',
      peixes: 'Peixes'
    };

    return chave ? nomes[chave] || '' : '';
  }

  // =========================================================
  // DEDUPLICAÇÃO DE VALORES
  // =========================================================

  /**
   * Junta valores sem repetir textos iguais.
   * Mantém a ordem original e ignora diferenças de maiúsculas,
   * minúsculas e espaços repetidos.
   */
  private unirUnicos(valores: any[]): string {
    const resultado: string[] = [];
    const chaves = new Set<string>();

    valores.forEach(valor => {
      const itens = Array.isArray(valor) ? valor : [valor];

      itens.forEach(item => {
        if (typeof item !== 'string') {
          return;
        }

        const texto = item.trim().replace(/\s+/g, ' ');
        const chave = texto.toLocaleLowerCase('pt');

        if (texto && !chaves.has(chave)) {
          chaves.add(chave);
          resultado.push(texto);
        }
      });
    });

    return resultado.join(' · ');
  }

  /**
   * Junta valores separados por · ou ; e elimina repetições.
   */
  private unirValores(valores: any[]): string {
    const resultado: string[] = [];
    const chaves = new Set<string>();

    valores.forEach(valor => {
      const itens = Array.isArray(valor) ? valor : [valor];

      itens.forEach(item => {
        if (typeof item !== 'string') {
          return;
        }

        item.split(/[·;]/).forEach(parte => {
          const texto = parte.trim().replace(/\s+/g, ' ');
          const chave = texto.toLocaleLowerCase('pt');

          if (texto && !chaves.has(chave)) {
            chaves.add(chave);
            resultado.push(texto);
          }
        });
      });
    });

    return resultado.join(' · ');
  }

  private extrairTemas(valores: any[]): string[] {
    const texto = valores
      .filter(v => typeof v === 'string' && v.trim())
      .join(' ')
      .toLocaleLowerCase('pt');

    const dicionario: Record<string, string[]> = {
      controlo: ['controlo', 'controlar', 'controlo excessivo', 'rigidez'],
      autonomia: ['autonomia', 'independência', 'liberdade', 'autónom'],
      reconhecimento: ['reconhecimento', 'valorização', 'ser visto', 'aprovação'],
      confiança: ['confiança', 'confiar', 'segurança', 'insegurança'],
      aceitação: ['aceitação', 'aceitar', 'perfeccionismo', 'perfeito'],
      pertença: ['pertença', 'pertencer', 'exclusão', 'rejeição'],
      responsabilidade: ['responsabilidade', 'dever', 'obrigação'],
      comunicação: ['comunicação', 'expressão', 'escuta', 'silêncio'],
      cooperação: ['cooperação', 'colaboração', 'partilha', 'ajuda'],
      limites: ['limites', 'limite', 'respeito', 'invasão'],
      mudança: ['mudança', 'transformação', 'adaptação', 'perda'],
      paz: ['paz', 'harmonia', 'serenidade', 'conflito'],
      perfeccionismo: ['perfeccionismo', 'perfeccionista', 'exigência', 'erro'],
      proximidade: ['proximidade', 'intimidade', 'distância', 'abandono']
    };

    return Object.entries(dicionario)
      .filter(([, palavras]) => palavras.some(p => texto.includes(p)))
      .map(([tema]) => tema);
  }

  // =========================================================
  // CLASSIFICAÇÃO VISUAL DOS TIPOS DE RELAÇÃO
  // =========================================================

  classeTipoRelacao(tipo: string): string {
    const encontrado = this.legendaTiposRelacao.find(
      item => item.nome === tipo
    );

    return encontrado?.classe || 'tipo-neutro';
  }

  estiloTipoRelacao(tipo: string): Record<string, string> {
    const encontrado = this.legendaTiposRelacao.find(
      item => item.nome === tipo
    );

    return encontrado
      ? {
          color: encontrado.cor,
          backgroundColor: encontrado.fundo,
          borderColor: encontrado.cor
        }
      : {
          color: '#555555',
          backgroundColor: '#EEEEEE',
          borderColor: '#999999'
        };
  }

  descricaoTipoRelacao(tipo: string): string {
    return this.legendaTiposRelacao.find(
      item => item.nome === tipo
    )?.descricao ||
      'Os dados disponíveis não permitem uma interpretação mais específica.';
  }

  // =========================================================
  // MAPA RELACIONAL
  // =========================================================

  mapaRelacional(
    pessoaA: Pessoa | null,
    pessoaB: Pessoa | null
  ): MapaRelacional {
    const a = this.analiseDe(pessoaA);
    const b = this.analiseDe(pessoaB);

    const temasA = a.temas;
    const temasB = b.temas;

    const temasComuns = temasA.filter(tema => temasB.includes(tema));
    const temasOpostos = this.obterTemasOpostos(temasA, temasB);

    const valoresA = this.normalizarLista(a.valores);
    const valoresB = this.normalizarLista(b.valores);

    const valoresComuns = valoresA.filter(valor =>
      valoresB.some(outro => this.saoSemelhantes(valor, outro))
    );

    const afinidade = this.percentagem(
      temasComuns.length + valoresComuns.length,
      Math.max(
        temasA.length + temasB.length +
        valoresA.length + valoresB.length,
        1
      )
    );

    const complementaridadeNivel = this.percentagem(
      temasOpostos.length,
      Math.max(temasA.length + temasB.length, 1)
    );

    const temInformacao = [
      a.ferida, b.ferida,
      a.necessidade, b.necessidade,
      a.valores, b.valores,
      a.questao, b.questao
    ].some(Boolean);

    const ativacaoPadroes = this.calcularAtivacao(
      a,
      b,
      temasComuns,
      temasOpostos
    );

    const potencialCrescimento = Math.round(
      (complementaridadeNivel * 0.45) +
      (ativacaoPadroes * 0.35) +
      (temasComuns.length > 0 ? 20 : 5)
    );

    const tipoRelacao: string[] = [];

    if (temasComuns.length > 0 || valoresComuns.length > 0) {
      tipoRelacao.push('Espelho');
    }

    if (temasOpostos.length > 0) {
      tipoRelacao.push('Complementar');
    }

    if (ativacaoPadroes >= 55) {
      tipoRelacao.push('Ativadora');
    } else if (ativacaoPadroes >= 30) {
      tipoRelacao.push('Desafiante');
    }

    if (valoresComuns.length > 0 && ativacaoPadroes < 55) {
      tipoRelacao.push('Facilitadora');
    }

    if (!temInformacao) {
      tipoRelacao.push('Dados insuficientes');
    } else if (tipoRelacao.length === 0) {
      tipoRelacao.push('Em exploração');
    }

    const nomeA = this.nomeCompleto(pessoaA) || 'A';
    const nomeB = this.nomeCompleto(pessoaB) || 'B';

    const resumoComum = temasComuns.length
      ? `Os temas que surgem em ambos incluem: ${temasComuns.join(', ')}.`
      : valoresComuns.length
        ? 'Há valores descritos que parecem aproximar os dois perfis.'
        : 'Os dados disponíveis não revelam temas comuns claros. Isso não significa ausência de afinidade na relação real.';

    const espelhamento = temasComuns.length
      ? `${nomeA} e ${nomeB} apresentam temas semelhantes: ${temasComuns.join(', ')}. Estes pontos podem facilitar o reconhecimento mútuo ou tornar certas sensibilidades mais visíveis.`
      : 'Não foram encontrados temas simbólicos comuns suficientes para sugerir um espelho específico.';

    const complementaridade = temasOpostos.length
      ? `Foram identificadas diferenças temáticas em torno de ${temasOpostos.join(', ')}. Podem representar perspetivas complementares, desde que exista respeito e negociação.`
      : 'Não há diferenças temáticas suficientemente claras nos dados para apontar complementaridade específica.';

    const ativacao = this.descreverAtivacao(
      a,
      b,
      nomeA,
      nomeB,
      temasComuns,
      temasOpostos
    );

    const risco = ativacaoPadroes >= 55
      ? 'Se as diferenças forem vividas como ameaça, pode surgir um ciclo de defesa e contra-defesa. Observa comportamentos reais antes de concluir que este padrão existe.'
      : ativacaoPadroes >= 30
        ? 'Podem surgir momentos de desconforto ou mal-entendidos. A forma como ambos comunicam será mais importante do que os perfis em si.'
        : 'Os dados não sugerem uma ativação elevada. Ainda assim, conflitos reais podem existir mesmo quando os perfis parecem semelhantes.';

    const integracao = this.descreverIntegracao(
      temasOpostos,
      temasComuns
    );

    const pergunta = temasComuns.length
      ? `Quando surge o tema ${temasComuns[0]}, como podem falar sobre ele sem se julgarem?`
      : temasOpostos.length
        ? `Como podem respeitar as diferenças em torno de ${temasOpostos[0]} sem tentar mudar um ao outro?`
        : 'Que comportamento concreto de cada um ajuda esta relação a tornar-se mais segura, respeitosa e verdadeira?';

    const cicloProvavel = this.construirCiclo(temasOpostos);

    return {
      espelhamento,
      resumoComum,
      complementaridade,
      ativacao,
      risco,
      integracao,
      temasA,
      temasB,
      temasComuns,
      temasOpostos,
      pergunta,

      tipoRelacao,
      afinidade: temInformacao ? afinidade : 0,
      complementaridadeNivel: temInformacao ? complementaridadeNivel : 0,
      potencialCrescimento: temInformacao
        ? Math.min(100, potencialCrescimento)
        : 0,
      ativacaoPadroes: temInformacao ? ativacaoPadroes : 0,

      explicacaoAfinidade: temasComuns.length || valoresComuns.length
        ? `Foram encontrados ${temasComuns.length} tema(s) comum(ns) e ${valoresComuns.length} valor(es) semelhante(s).`
        : 'A informação atual não permite estimar afinidade com confiança.',

      explicacaoComplementaridade: temasOpostos.length
        ? `As diferenças identificadas envolvem: ${temasOpostos.join(', ')}.`
        : 'Não foram encontrados contrastes temáticos claros.',

      explicacaoCrescimento: potencialCrescimento >= 60
        ? 'Existem diferenças ou temas partilhados que podem servir de ponto de partida para aprendizagem, se ambos estiverem disponíveis para refletir.'
        : 'O potencial de crescimento deve ser confirmado pela experiência real e pela disponibilidade de ambos para aprender.',

      explicacaoAtivacao: ativacaoPadroes >= 55
        ? 'Há indicadores temáticos que justificam explorar possíveis reações defensivas. Não são prova de conflito.'
        : 'Não há indicadores temáticos suficientes para sugerir ativação elevada.',

      cicloProvavel,
      passosIntegracao: this.construirPassosIntegracao(
        temasOpostos,
        temasComuns
      )
    };
  }

  private calcularAtivacao(
    a: AnalisePerfil,
    b: AnalisePerfil,
    temasComuns: string[],
    temasOpostos: string[]
  ): number {
    let pontos = 10;

    if (a.ferida && b.ferida) pontos += 20;
    if (a.questao && b.questao) pontos += 15;
    if (a.necessidade && b.necessidade) pontos += 10;
    if (temasComuns.length >= 2) pontos += 15;
    if (temasOpostos.length >= 1) pontos += 10;

    const textoA =
      `${a.ferida} ${a.questao} ${a.necessidade}`.toLowerCase();

    const textoB =
      `${b.ferida} ${b.questao} ${b.necessidade}`.toLowerCase();

    const paresSensíveis = [
      ['controlo', 'autonomia'],
      ['controlo', 'liberdade'],
      ['reconhecimento', 'rejeição'],
      ['proximidade', 'distância'],
      ['confiança', 'insegurança'],
      ['perfeccionismo', 'erro']
    ];

    if (paresSensíveis.some(([x, y]) =>
      (textoA.includes(x) && textoB.includes(y)) ||
      (textoA.includes(y) && textoB.includes(x))
    )) {
      pontos += 20;
    }

    return Math.min(100, pontos);
  }

  private descreverAtivacao(
    a: AnalisePerfil,
    b: AnalisePerfil,
    nomeA: string,
    nomeB: string,
    temasComuns: string[],
    temasOpostos: string[]
  ): string {
    const textoA =
      `${a.ferida} ${a.necessidade} ${a.questao}`.toLowerCase();

    const textoB =
      `${b.ferida} ${b.necessidade} ${b.questao}`.toLowerCase();

    if (
      textoA.includes('controlo') &&
      (textoB.includes('autonomia') || textoB.includes('liberdade'))
    ) {
      return `${nomeA} pode procurar mais controlo ou previsibilidade, enquanto ${nomeB} pode valorizar autonomia. Se esta diferença existir no quotidiano, ${nomeA} poderá interpretar a autonomia como afastamento e ${nomeB} poderá sentir o controlo como limitação. É uma hipótese a confirmar, não uma conclusão sobre estas pessoas.`;
    }

    if (
      textoB.includes('controlo') &&
      (textoA.includes('autonomia') || textoA.includes('liberdade'))
    ) {
      return `${nomeB} pode procurar mais controlo ou previsibilidade, enquanto ${nomeA} pode valorizar autonomia. Se esta diferença existir no quotidiano, ${nomeB} poderá interpretar a autonomia como afastamento e ${nomeA} poderá sentir o controlo como limitação. É uma hipótese a confirmar, não uma conclusão sobre estas pessoas.`;
    }

    if (temasComuns.length) {
      return `Os temas comuns (${temasComuns.join(', ')}) podem facilitar a compreensão mútua, mas também tornar certas sensibilidades mais visíveis. Vale a pena observar como cada pessoa reage quando estes assuntos surgem.`;
    }

    if (temasOpostos.length) {
      return `As diferenças em torno de ${temasOpostos.join(', ')} podem originar mal-entendidos se cada pessoa interpretar a perspetiva da outra como uma ameaça. A comunicação e os limites acordados podem transformar a diferença numa oportunidade de aprendizagem.`;
    }

    return 'Os dados disponíveis não permitem descrever um ciclo específico de ativação. Para o compreender, seria necessário observar situações concretas, reações e consequências entre as duas pessoas.';
  }

  private descreverIntegracao(
    temasOpostos: string[],
    temasComuns: string[]
  ): string {
    if (temasOpostos.length) {
      return `A integração pode começar por reconhecer as diferenças em ${temasOpostos.join(', ')}, formular necessidades sem acusar e negociar comportamentos concretos. O objetivo não é eliminar o conflito, mas evitar que se transforme num ciclo repetitivo.`;
    }

    if (temasComuns.length) {
      return `Os temas partilhados (${temasComuns.join(', ')}) podem servir de base para criar confiança. Cada pessoa pode explicar o que sente, ouvir a outra e verificar se compreendeu antes de responder.`;
    }

    return 'Comecem por escolher uma situação real, identificar o que cada um sentiu e precisava, e combinar uma pequena mudança observável. Reavaliem depois se essa mudança ajudou.';
  }

  private construirCiclo(temasOpostos: string[]): string[] {
    if (
      temasOpostos.includes('controlo') &&
      temasOpostos.includes('autonomia')
    ) {
      return [
        'Uma pessoa tenta aumentar o controlo.',
        'A outra sente a sua autonomia limitada.',
        'A pessoa limitada procura afastamento ou maior independência.',
        'O afastamento pode aumentar a insegurança inicial.',
        'O ciclo pode repetir-se se não for reconhecido.'
      ];
    }

    if (temasOpostos.length) {
      return [
        'Surge uma diferença ou situação sensível.',
        'Cada pessoa interpreta a situação a partir da sua própria perspetiva.',
        'As reações podem ser entendidas como crítica ou rejeição.',
        'O mal-entendido aumenta se não houver esclarecimento.',
        'A pausa, a escuta e a negociação podem interromper o ciclo.'
      ];
    }

    return [
      'Surge uma situação emocionalmente significativa.',
      'Cada pessoa procura compreender o que aconteceu.',
      'Uma pergunta aberta pode esclarecer a interpretação de cada um.',
      'Ambos podem combinar uma resposta mais consciente.'
    ];
  }

  private construirPassosIntegracao(
    temasOpostos: string[],
    temasComuns: string[]
  ): string[] {
    const passos = [
      'Descrever o comportamento observado sem atribuir intenções.',
      'Identificar o sentimento e a necessidade de cada pessoa.',
      'Ouvir a perspetiva do outro sem preparar imediatamente uma defesa.'
    ];

    if (temasOpostos.length) {
      passos.push(
        `Negociar um acordo concreto sobre ${temasOpostos.join(', ')}.`
      );
    } else if (temasComuns.length) {
      passos.push(
        `Usar o tema comum (${temasComuns[0]}) como ponto de partida para o diálogo.`
      );
    }

    passos.push(
      'Rever o acordo mais tarde e perceber o que mudou na prática.'
    );

    return passos;
  }

  private obterTemasOpostos(
    temasA: string[],
    temasB: string[]
  ): string[] {
    const pares: [string, string][] = [
      ['controlo', 'autonomia'],
      ['controlo', 'limites'],
      ['proximidade', 'autonomia'],
      ['reconhecimento', 'aceitação'],
      ['confiança', 'limites'],
      ['responsabilidade', 'autonomia']
    ];

    const resultado: string[] = [];

    pares.forEach(([x, y]) => {
      if (
        (temasA.includes(x) && temasB.includes(y)) ||
        (temasA.includes(y) && temasB.includes(x))
      ) {
        if (!resultado.includes(x)) resultado.push(x);
        if (!resultado.includes(y)) resultado.push(y);
      }
    });

    return resultado;
  }

  private normalizarLista(valor: string): string[] {
    return valor
      .split(/[·,;]/)
      .map(item => item.trim().toLocaleLowerCase('pt'))
      .filter(Boolean);
  }

  private saoSemelhantes(a: string, b: string): boolean {
    return a === b || a.includes(b) || b.includes(a);
  }

  private percentagem(numerador: number, denominador: number): number {
    return Math.min(
      100,
      Math.round((numerador / denominador) * 100)
    );
  }
}
