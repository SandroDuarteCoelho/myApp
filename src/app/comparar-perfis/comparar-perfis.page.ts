
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
  Forcas?: any;
  Fraquezas?: any;
  Oportunidades?: any;
  Ameacas?: any;
  [campo: string]: any;
}

interface EntradaDicionario {
  id?: string;
  nome?: string;
  sinonimos?: string[];
  opostos?: string[];
  complementares?: string[];
  categoria?: string;
  polaridade?: string;
  [campo: string]: any;
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
  forcas: string[];
  fraquezas: string[];
  oportunidades: string[];
  ameacas: string[];
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

type TipoDinamica =
  | 'controlo-autonomia'
  | 'proximidade-distancia'
  | 'reconhecimento-rejeicao'
  | 'perfeccionismo-critica';

type TipoRelacional =
  | 'Facilitadora'
  | 'Desafiante'
  | 'Ativadora'
  | 'Complementar'
  | 'Espelho';

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

  private registosSetenios: RegistoRelacional[] = [];
  private entradasDicionario: EntradaDicionario[] = [];

  readonly legendaTiposRelacao = [
    {
      nome: 'Facilitadora',
      classe: 'tipo-facilitadora',
      cor: '#237342',
      fundo: '#DDF3E4',
      descricao: 'Um recurso de uma pessoa pode ajudar a outra a reconhecer, trabalhar e integrar uma vulnerabilidade.'
    },
    {
      nome: 'Desafiante',
      classe: 'tipo-desafiante',
      cor: '#946300',
      fundo: '#FFF0C2',
      descricao: 'Uma vulnerabilidade pode ser tocada por uma oportunidade de aprendizagem ou desenvolvimento.'
    },
    {
      nome: 'Ativadora',
      classe: 'tipo-ativadora',
      cor: '#B42323',
      fundo: '#FBE0E0',
      descricao: 'A combinação de vulnerabilidades e fatores de ameaça pode reforçar mecanismos defensivos.'
    },
    {
      nome: 'Complementar',
      classe: 'tipo-complementar',
      cor: '#245DB0',
      fundo: '#DDEBFF',
      descricao: 'Recursos diferentes podem combinar-se e reforçar-se perante uma oportunidade comum.'
    },
    {
      nome: 'Espelho',
      classe: 'tipo-espelho',
      cor: '#7541A5',
      fundo: '#EDE0FF',
      descricao: 'As pessoas podem reconhecer na outra vulnerabilidades, padrões ou sensibilidades semelhantes.'
    }
  ];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  async ngOnInit(): Promise<void> {
    this.subscription.add(
      this.route.queryParamMap.subscribe(params => {
        this.eventoOrigem = params.get('evento') || '';
        this.dataEvento = params.get('data') || '';

        this.idsParticipantes = this.lerIdsParticipantes(
          params.get('participantesIds')
        );

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
      const [pessoasJson, seteniosJson, dicionarioJson] =
        await Promise.all([
          firstValueFrom(this.http.get<any>('assets/data/pessoas.json')),
          firstValueFrom(this.http.get<any>('assets/data/setenios.json')),
          firstValueFrom(this.http.get<any>('assets/data/dicionario.json'))
        ]);

      this.registosSetenios =
        this.normalizarListaRegistos(seteniosJson);

      this.entradasDicionario =
        this.normalizarDicionario(dicionarioJson);

      this.pessoas = this.aplicarOverrides(pessoasJson);

      this.atualizarFiltros();
      this.atualizarParticipantesEvento();
      this.atualizarSelecoes();

    } catch (error) {
      console.error('Erro ao carregar dados da comparação:', error);

      this.erro =
        'Não foi possível carregar os perfis, os seténios ou o dicionário. Confirma os ficheiros em assets/data.';

    } finally {
      this.carregando = false;
    }
  }

  private normalizarListaRegistos(dados: any): RegistoRelacional[] {
    if (Array.isArray(dados)) return dados;

    if (Array.isArray(dados?.setenios)) {
      return dados.setenios;
    }

    return [];
  }

  private normalizarDicionario(dados: any): EntradaDicionario[] {
    if (Array.isArray(dados)) return dados;

    if (Array.isArray(dados?.caracteristicas)) {
      return dados.caracteristicas;
    }

    if (
      dados?.caracteristicas &&
      typeof dados.caracteristicas === 'object'
    ) {
      return Object.entries(dados.caracteristicas).map(
        ([chave, valor]: [string, any]) => ({
          id: chave,
          ...(typeof valor === 'object'
            ? valor
            : { nome: String(valor) })
        })
      );
    }

    return [];
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

      if (!Number.isFinite(id) || eliminados.has(id)) return;

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
      ) return;

      porId.set(id, {
        ...override as Pessoa,
        id
      });
    });

    return Array.from(porId.values()).sort((a, b) =>
      this.nomeCompleto(a).localeCompare(
        this.nomeCompleto(b),
        'pt'
      )
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
  // FILTROS E SELEÇÃO
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
    if (!pessoa) return '';

    return [pessoa.nome, pessoa.apelido]
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .join(' ');
  }

  valor(
    pessoa: Pessoa | null | undefined,
    campo: 'data' | 'eneagrama_tipo'
  ): string {
    if (!pessoa) return '—';

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
    return !!this.pessoaA &&
      this.participantesEvento.length > 0;
  }

  private lerIdsParticipantes(valor: string | null): number[] {
    if (!valor) return [];

    try {
      const parsed: unknown = JSON.parse(valor);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item: unknown) => Number(item))
          .filter((item: number) => Number.isFinite(item));
      }
    } catch {
      // Também aceita uma lista separada por vírgulas.
    }

    return valor
      .split(',')
      .map((item: string) => Number(item.trim()))
      .filter((item: number) => Number.isFinite(item) && item > 0);
  }

  private atualizarParticipantesEvento(): void {
    const ids = new Set(this.idsParticipantes);

    this.participantesEvento = this.pessoas.filter(
      pessoa => ids.has(pessoa.id)
    );

    this.idsParticipantesNaoEncontrados =
      Array.from(ids).filter(
        id => !this.pessoas.some(pessoa => pessoa.id === id)
      );
  }

  // =========================================================
  // ANÁLISE INDIVIDUAL
  // =========================================================

  analiseDe(pessoa: Pessoa | null): AnalisePerfil {
    if (!pessoa) return this.analiseVazia();

    const nascimento = this.lerData(pessoa.data);
    const idade = nascimento
      ? this.calcularIdade(nascimento)
      : null;

    const setenioRegisto = idade === null
      ? undefined
      : this.encontrarSetenio(idade);

    const forcas = this.extrairListaSWOT(
      setenioRegisto,
      'Forcas'
    );

    const fraquezas = this.extrairListaSWOT(
      setenioRegisto,
      'Fraquezas'
    );

    const oportunidades = this.extrairListaSWOT(
      setenioRegisto,
      'Oportunidades'
    );

    const ameacas = this.extrairListaSWOT(
      setenioRegisto,
      'Ameacas'
    );

    const ferida = this.obterCampoPessoa(pessoa, [
      'ferida', 'feridas', 'vulnerabilidade', 'vulnerabilidades'
    ]);

    const necessidade = this.obterCampoPessoa(pessoa, [
      'necessidade', 'necessidades', 'objetivo', 'objetivos'
    ]);

    const defesa = this.obterCampoPessoa(pessoa, [
      'defesa', 'defesas', 'dificuldades', 'mecanismos_defesa'
    ]);

    const valores = this.obterCampoPessoa(pessoa, [
      'valores', 'valor'
    ]);

    const questao = this.obterCampoPessoa(pessoa, [
      'questao_sistemica', 'questao', 'questoes'
    ]);

    const afirmacao = this.obterCampoPessoa(pessoa, [
      'afirmacao', 'afirmacoes'
    ]);

    const fraseMatriz = this.obterCampoPessoa(pessoa, [
      'frase_matriz', 'frase'
    ]);

    const signoSolar = this.obterCampoPessoa(pessoa, [
      'signoSolar', 'signo_solar', 'signo'
    ]);

    const signoChines = this.obterCampoPessoa(pessoa, [
      'signoChines', 'signo_chines', 'signo_chinês'
    ]);

    const textoPerfil = [
      ferida,
      necessidade,
      defesa,
      valores,
      questao,
      afirmacao,
      fraseMatriz,
      this.obterCampoPessoa(pessoa, [
        'descricao',
        'personalidade',
        'caracteristicas',
        'observacoes'
      ])
    ].join(' ');

    const temasDicionario =
      this.extrairTemasDicionario(textoPerfil);

    const temasSWOT = this.unirListas([
      forcas,
      fraquezas,
      oportunidades,
      ameacas
    ]);

    const temas = this.unirListas([
      temasDicionario,
      temasSWOT
    ]);

    const fontes: string[] = ['Perfil pessoal'];

    if (setenioRegisto) fontes.push('Seténios');
    if (temasDicionario.length) fontes.push('Dicionário');

    return {
      idade,
      signoSolar,
      signoChines,
      setenio: setenioRegisto?.nome || '',
      setenioId: setenioRegisto
        ? Number(setenioRegisto.id) || null
        : null,
      setenioDescricao: setenioRegisto?.descricao || '',
      ferida,
      necessidade,
      defesa,
      valores,
      questao,
      afirmacao,
      fraseMatriz,
      temas,
      fontes,
      forcas,
      fraquezas,
      oportunidades,
      ameacas
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
      fontes: [],
      forcas: [],
      fraquezas: [],
      oportunidades: [],
      ameacas: []
    };
  }

  private obterCampoPessoa(
    pessoa: Pessoa,
    campos: string[]
  ): string {
    const resultado: string[] = [];

    campos.forEach(campo => {
      const valor = pessoa[campo];

      if (valor === undefined || valor === null) return;

      if (Array.isArray(valor)) {
        valor.forEach((item: unknown) => {
          if (
            typeof item === 'string' ||
            typeof item === 'number'
          ) {
            resultado.push(String(item));
          }
        });
      } else if (
        typeof valor === 'string' ||
        typeof valor === 'number'
      ) {
        resultado.push(String(valor));
      }
    });

    return this.unirUnicos(resultado);
  }

  // =========================================================
  // IDENTIFICAÇÃO DO SETÉNIO
  // =========================================================

  private encontrarSetenio(
    idade: number
  ): RegistoRelacional | undefined {
    if (idade < 0 || !this.registosSetenios.length) {
      return undefined;
    }

    return this.registosSetenios.find(registo =>
      this.idadePertenceAoSetenio(idade, registo)
    );
  }

  private idadePertenceAoSetenio(
    idade: number,
    registo: RegistoRelacional
  ): boolean {
    if (Array.isArray(registo.idades)) {
      return registo.idades.some(
        valor => Number(valor) === idade
      );
    }

    const inicio = this.obterNumeroCampo(registo, [
      'idade_inicio',
      'idadeInicial',
      'idade_minima',
      'idade_min',
      'inicio',
      'idadeDe'
    ]);

    const fim = this.obterNumeroCampo(registo, [
      'idade_fim',
      'idadeFinal',
      'idade_maxima',
      'idade_max',
      'fim',
      'idadeAte'
    ]);

    if (inicio !== null && fim !== null) {
      return idade >= inicio && idade <= fim;
    }

    const faixa = String(
      registo.faixa_etaria ||
      registo['intervalo'] ||
      registo['faixa'] ||
      ''
    );

    const correspondencia = faixa.match(
      /(\d+)\s*(?:a|até|-|–|—)\s*(\d+)/
    );

    if (correspondencia) {
      const minimo = Number(correspondencia[1]);
      const maximo = Number(correspondencia[2]);

      return idade >= minimo && idade <= maximo;
    }

    const nome = String(registo.nome || '');

    const intervaloNome = nome.match(
      /(\d+)\s*(?:a|até|-|–|—)\s*(\d+)/
    );

    if (intervaloNome) {
      const minimo = Number(intervaloNome[1]);
      const maximo = Number(intervaloNome[2]);

      return idade >= minimo && idade <= maximo;
    }

    // Não inventa intervalos quando o JSON não os identifica.
    return false;
  }

  private obterNumeroCampo(
    objeto: any,
    campos: string[]
  ): number | null {
    for (const campo of campos) {
      const valor = objeto?.[campo];

      if (
        valor !== undefined &&
        valor !== null &&
        String(valor).trim() !== '' &&
        Number.isFinite(Number(valor))
      ) {
        return Number(valor);
      }
    }

    return null;
  }

  private extrairListaSWOT(
    registo: RegistoRelacional | undefined,
    campo: 'Forcas' | 'Fraquezas' | 'Oportunidades' | 'Ameacas'
  ): string[] {
    if (!registo) return [];

    const valor: unknown = registo[campo];

    if (Array.isArray(valor)) {
      return this.unirListas([
        valor.map((item: unknown) => this.textoSWOT(item))
      ]);
    }

    if (typeof valor === 'string') {
      return valor
        .split(/[;,|]/)
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0);
    }

    return [];
  }

  private textoSWOT(valor: any): string {
    if (typeof valor === 'string') return valor.trim();
    if (typeof valor === 'number') return String(valor);

    if (valor && typeof valor === 'object') {
      const partes = [
        valor.nome,
        valor.titulo,
        valor.tema,
        valor.descricao,
        valor.texto,
        valor.valor
      ].filter(Boolean);

      return partes.join(' — ').trim();
    }

    return '';
  }

  // =========================================================
  // ANÁLISE RELACIONAL DOS SETÉNIOS
  // =========================================================

  analiseSeteniosRelacional(
    pessoaA: Pessoa | null,
    pessoaB: Pessoa | null
  ): AnaliseSeteniosRelacional {
    const a = this.analiseDe(pessoaA);
    const b = this.analiseDe(pessoaB);

    const temasA = this.unirListas([
      a.forcas, a.fraquezas, a.oportunidades, a.ameacas
    ]);

    const temasB = this.unirListas([
      b.forcas, b.fraquezas, b.oportunidades, b.ameacas
    ]);

    const temasComuns = temasA.filter(tema =>
      temasB.some(outro => this.saoSemelhantes(tema, outro))
    );

    const temasDiferentes = [
      ...temasA.filter(tema =>
        !temasComuns.some(comum =>
          this.saoSemelhantes(tema, comum)
        )
      ),
      ...temasB.filter(tema =>
        !temasComuns.some(comum =>
          this.saoSemelhantes(tema, comum)
        )
      )
    ];

    const temDados = !!(
      a.setenioDescricao ||
      b.setenioDescricao ||
      temasA.length ||
      temasB.length
    );

    let titulo = 'Ainda não é possível cruzar os dois seténios';

    let descricao =
      'É necessário existir informação de seténio para pelo menos uma das pessoas.';

    if (temDados) {
      if (temasComuns.length && temasDiferentes.length) {
        titulo = 'Temas partilhados e percursos diferentes';
        descricao =
          `Os dois perfis apresentam alguns temas semelhantes, como ${temasComuns.slice(0, 4).join(', ')}. ` +
          `Também existem focos diferentes, que incluem ${temasDiferentes.slice(0, 4).join(', ')}. ` +
          'Esta combinação permite explorar o que aproxima as pessoas e o que cada uma pode trazer de diferente à relação.';

      } else if (temasComuns.length) {
        titulo = 'Possíveis pontos de encontro';
        descricao =
          `Os dois seténios apresentam temas em comum, como ${temasComuns.slice(0, 4).join(', ')}. ` +
          'Estes pontos podem servir de base para diálogo e cooperação.';

      } else if (temasDiferentes.length) {
        titulo = 'Focos de desenvolvimento diferentes';
        descricao =
          `Os dois seténios apresentam focos diferentes, incluindo ${temasDiferentes.slice(0, 5).join(', ')}. ` +
          'Estas diferenças não significam incompatibilidade. Podem revelar prioridades distintas nesta fase da vida.';

      } else {
        titulo = 'Leitura conjunta das fases de vida';
        descricao =
          'Existem descrições de seténio disponíveis, mas não foram encontrados temas suficientes para estabelecer uma comparação temática clara.';
      }
    }

    let pergunta =
      'Que aspetos da fase de vida de cada pessoa merecem ser compreendidos com mais atenção?';

    if (temasComuns.length && temasDiferentes.length) {
      pergunta =
        `Como podem aproveitar o tema comum ${temasComuns[0]} e respeitar as diferenças em torno de ${temasDiferentes[0]}?`;
    } else if (temasComuns.length) {
      pergunta =
        `Como podem transformar o tema partilhado ${temasComuns[0]} numa oportunidade concreta de compreensão e cooperação?`;
    } else if (temasDiferentes.length) {
      pergunta =
        `Como podem respeitar os diferentes focos de vida, incluindo ${temasDiferentes[0]}, sem exigir que ambos estejam na mesma fase?`;
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

  // =========================================================
  // DICIONÁRIO DE CARACTERÍSTICAS
  // =========================================================

  private extrairTemasDicionario(textoOriginal: string): string[] {
    const texto = this.normalizarTexto(textoOriginal);
    if (!texto) return [];

    const encontrados: string[] = [];

    this.entradasDicionario.forEach(entrada => {
      const nome = String(entrada.nome || '').trim();

      const sinonimos = Array.isArray(entrada.sinonimos)
        ? entrada.sinonimos
        : [];

      const termos = [
        nome,
        String(entrada.id || '').replace(/[_-]/g, ' '),
        ...sinonimos
      ]
        .map(termo => this.normalizarTexto(String(termo)))
        .filter(Boolean);

      const corresponde = termos.some(termo =>
        this.textoContemTermo(texto, termo)
      );

      if (corresponde && nome) encontrados.push(nome);
    });

    return this.unirListas([encontrados]);
  }

  private textoContemTermo(
    texto: string,
    termo: string
  ): boolean {
    if (!texto || !termo) return false;

    if (termo.length <= 2) {
      return texto.split(/\s+/).includes(termo);
    }

    return texto.includes(termo);
  }

  private obterEntradaDicionario(
    nome: string
  ): EntradaDicionario | undefined {
    const chave = this.normalizarTexto(nome);

    return this.entradasDicionario.find(entrada => {
      const nomeEntrada = this.normalizarTexto(
        String(entrada.nome || '')
      );

      const idEntrada = this.normalizarTexto(
        String(entrada.id || '').replace(/[_-]/g, ' ')
      );

      const sinonimos = Array.isArray(entrada.sinonimos)
        ? entrada.sinonimos
        : [];

      return nomeEntrada === chave ||
        idEntrada === chave ||
        sinonimos.some(sinonimo =>
          this.normalizarTexto(String(sinonimo)) === chave
        );
    });
  }

  private resolverReferenciaDicionario(valor: string): string {
    const chave = this.normalizarTexto(valor);

    const entrada = this.entradasDicionario.find(item => {
      const id = this.normalizarTexto(
        String(item.id || '').replace(/[_-]/g, ' ')
      );

      const nome = this.normalizarTexto(String(item.nome || ''));

      return id === chave || nome === chave;
    });

    return entrada?.nome || valor;
  }

  private temasRelacionados(
    tema: string,
    tipo: 'opostos' | 'complementares'
  ): string[] {
    const entrada = this.obterEntradaDicionario(tema);
    if (!entrada) return [];

    const valores = entrada[tipo];
    if (!Array.isArray(valores)) return [];

    return valores
      .map(valor => this.resolverReferenciaDicionario(String(valor).trim()))
      .filter(Boolean);
  }

  private temasSaoOpostos(a: string, b: string): boolean {
    const opostosA = this.temasRelacionados(a, 'opostos')
      .map(valor => this.normalizarTexto(valor));

    const opostosB = this.temasRelacionados(b, 'opostos')
      .map(valor => this.normalizarTexto(valor));

    const chaveA = this.normalizarTexto(a);
    const chaveB = this.normalizarTexto(b);

    return opostosA.includes(chaveB) ||
      opostosB.includes(chaveA);
  }

  private temasSaoComplementares(a: string, b: string): boolean {
    const complementaresA = this.temasRelacionados(a, 'complementares')
      .map(valor => this.normalizarTexto(valor));

    const complementaresB = this.temasRelacionados(b, 'complementares')
      .map(valor => this.normalizarTexto(valor));

    const chaveA = this.normalizarTexto(a);
    const chaveB = this.normalizarTexto(b);

    return complementaresA.includes(chaveB) ||
      complementaresB.includes(chaveA);
  }

  // =========================================================
  // DATAS
  // =========================================================

  private lerData(valor: string | undefined): Date | null {
    if (!valor) return null;

    const correspondencia = valor.match(
      /^(\d{4})-(\d{2})-(\d{2})/
    );

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

    let idade =
      hoje.getFullYear() - nascimento.getFullYear();

    const aindaNaoFezAnos =
      hoje.getMonth() < nascimento.getMonth() ||
      (
        hoje.getMonth() === nascimento.getMonth() &&
        hoje.getDate() < nascimento.getDate()
      );

    if (aindaNaoFezAnos) idade--;

    return idade;
  }

  private formatarData(valor: string): string {
    const data = this.lerData(valor);
    if (!data) return valor;

    return new Intl.DateTimeFormat('pt-PT').format(data);
  }

  // =========================================================
  // NORMALIZAÇÃO E DEDUPLICAÇÃO
  // =========================================================

  private normalizarTexto(texto: string): string {
    return String(texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt')
      .replace(/[_-]/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private unirUnicos(valores: any[]): string {
    const resultado: string[] = [];
    const chaves = new Set<string>();

    valores.forEach(valor => {
      const itens = Array.isArray(valor) ? valor : [valor];

      itens.forEach((item: unknown) => {
        if (
          typeof item !== 'string' &&
          typeof item !== 'number'
        ) return;

        const texto = String(item)
          .trim()
          .replace(/\s+/g, ' ');

        const chave = this.normalizarTexto(texto);

        if (texto && !chaves.has(chave)) {
          chaves.add(chave);
          resultado.push(texto);
        }
      });
    });

    return resultado.join(' · ');
  }

  private unirListas(listas: string[][]): string[] {
    const resultado: string[] = [];
    const chaves = new Set<string>();

    listas.forEach(lista => {
      (lista || []).forEach(valor => {
        const texto = String(valor || '').trim();
        const chave = this.normalizarTexto(texto);

        if (texto && !chaves.has(chave)) {
          chaves.add(chave);
          resultado.push(texto);
        }
      });
    });

    return resultado;
  }

  private normalizarLista(valor: string): string[] {
    return String(valor || '')
      .split(/[·,;]/)
      .map((item: string) => item.trim())
      .filter((item: string) => item.length > 0);
  }

  private saoSemelhantes(a: string, b: string): boolean {
    const x = this.normalizarTexto(a);
    const y = this.normalizarTexto(b);

    if (!x || !y) return false;
    if (x === y) return true;

    const entradaA = this.obterEntradaDicionario(a);
    const entradaB = this.obterEntradaDicionario(b);

    if (
      entradaA &&
      entradaB &&
      entradaA.id &&
      entradaA.id === entradaB.id
    ) {
      return true;
    }

    const sinonimosA = [
      ...(entradaA?.sinonimos || []),
      entradaA?.nome || ''
    ].map(item => this.normalizarTexto(item));

    const sinonimosB = [
      ...(entradaB?.sinonimos || []),
      entradaB?.nome || ''
    ].map(item => this.normalizarTexto(item));

    return sinonimosA.includes(y) || sinonimosB.includes(x);
  }

  private percentagem(
    numerador: number,
    denominador: number
  ): number {
    if (denominador <= 0) return 0;

    return Math.min(
      100,
      Math.round((numerador / denominador) * 100)
    );
  }

  // =========================================================
  // CLASSIFICAÇÃO VISUAL
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
  ): any {
    const a = this.analiseDe(pessoaA);
    const b = this.analiseDe(pessoaB);

    const nomeA = this.nomeCompleto(pessoaA) || 'Pessoa A';
    const nomeB = this.nomeCompleto(pessoaB) || 'Pessoa B';

    const temasA = a.temas;
    const temasB = b.temas;

    const temasComuns = temasA.filter(tema =>
      temasB.some(outro => this.saoSemelhantes(tema, outro))
    );

    const temasOpostos = this.obterTemasOpostos(
      temasA,
      temasB
    );

    const valoresA = this.normalizarLista(a.valores);
    const valoresB = this.normalizarLista(b.valores);

    const valoresComuns = valoresA.filter(valor =>
      valoresB.some(outro => this.saoSemelhantes(valor, outro))
    );

    const forcasComuns = this.encontrarCorrespondencias(
      a.forcas,
      b.forcas
    );

    const vulnerabilidadesComuns =
      this.encontrarCorrespondencias(a.fraquezas, b.fraquezas);

    const oportunidadesComuns =
      this.encontrarCorrespondencias(
        a.oportunidades,
        b.oportunidades
      );

    const ameacasComuns = this.encontrarCorrespondencias(
      a.ameacas,
      b.ameacas
    );

    const recursosApoiamB = this.encontrarCorrespondencias(
      a.forcas,
      b.fraquezas
    );

    const recursosApoiamA = this.encontrarCorrespondencias(
      b.forcas,
      a.fraquezas
    );

    const recursosComplementares =
      this.encontrarComplementaridades(a.forcas, b.forcas);

    const dinamicas = this.detetarTiposRelacao(
      a,
      b,
      temasComuns,
      recursosApoiamA,
      recursosApoiamB
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
      recursosComplementares.length,
      Math.max(a.forcas.length + b.forcas.length, 1)
    );

    const temInformacao = [
      ...a.temas, ...b.temas,
      ...a.forcas, ...b.forcas,
      ...a.fraquezas, ...b.fraquezas,
      ...a.oportunidades, ...b.oportunidades,
      ...a.ameacas, ...b.ameacas
    ].length > 0;

    const dinamicasInteracao = this.detetarDinamicas(a, b);
    const dinamica = dinamicasInteracao[0] || null;

    const ativacaoPadroes = this.calcularAtivacao(
      a,
      b,
      temasComuns,
      temasOpostos,
      dinamicasInteracao
    );

    const potencialCrescimento = Math.round(
      (complementaridadeNivel * 0.35) +
      (ativacaoPadroes * 0.30) +
      (temasComuns.length > 0 ? 20 : 5) +
      (dinamicas.length > 0 ? 15 : 0)
    );

    const tipoRelacao: string[] = [...dinamicas];

    if (!temInformacao) {
      tipoRelacao.push('Dados insuficientes');
    } else if (!tipoRelacao.length) {
      tipoRelacao.push('Em exploração');
    }

    const resumoComum = temasComuns.length
      ? `Os temas que surgem em ambos incluem: ${temasComuns.join(', ')}.`
      : valoresComuns.length
        ? 'Há valores descritos que parecem aproximar os dois perfis.'
        : 'Os dados disponíveis não revelam temas comuns claros. Isso não significa ausência de afinidade na relação real.';

    const espelhamento = vulnerabilidadesComuns.length
      ? `${nomeA} e ${nomeB} apresentam vulnerabilidades ou padrões semelhantes relacionados com ${vulnerabilidadesComuns.join(', ')}. Estes pontos podem facilitar o reconhecimento mútuo, mas também tornar certas sensibilidades mais visíveis.`
      : temasComuns.length
        ? `Os dois perfis apresentam temas em comum: ${temasComuns.join(', ')}. A semelhança temática pode ser um ponto de reconhecimento, mas não prova que as pessoas vivam essas experiências da mesma forma.`
        : 'Não foram encontradas vulnerabilidades ou padrões comuns suficientemente claros para sugerir um espelho específico.';

    const complementaridade = recursosComplementares.length
      ? `Foram encontrados recursos diferentes que o dicionário associa como complementares: ${recursosComplementares.join(', ')}. Podem reforçar-se quando são colocados ao serviço de objetivos partilhados.`
      : recursosApoiamA.length || recursosApoiamB.length
        ? `Existem recursos de um perfil que podem apoiar vulnerabilidades do outro. A complementaridade pode ser explorada através de ${this.unirListas([recursosApoiamA, recursosApoiamB]).join(', ')}.`
        : 'Não foram identificados recursos complementares suficientes nos dados disponíveis. A diferença, por si só, não demonstra complementaridade.';

    const ativacao = this.descreverAtivacao(
      a,
      nomeA,
      nomeB,
      temasComuns,
      temasOpostos,
      dinamica
    );

    const risco = ameacasComuns.length || vulnerabilidadesComuns.length
      ? `Há aspetos que merecem atenção: vulnerabilidades semelhantes (${vulnerabilidadesComuns.join(', ') || 'não especificadas'}) e fatores de risco partilhados (${ameacasComuns.join(', ') || 'não especificados'}). Estes dados são hipóteses de reflexão, não uma previsão de conflito.`
      : dinamicas.includes('Ativadora')
        ? 'A combinação de vulnerabilidades e ameaças merece ser observada em situações reais. Não constitui uma previsão de conflito.'
        : 'Os dados disponíveis não permitem identificar fatores de risco relacionais específicos.';

    const integracao = this.descreverIntegracao(
      temasOpostos,
      temasComuns,
      dinamica,
      nomeA,
      nomeB
    );

    const pergunta = this.construirPerguntaCentral(
      dinamica,
      temasComuns,
      temasOpostos,
      nomeA,
      nomeB
    );

    const cicloProvavel = this.construirCiclo(
      a,
      nomeA,
      nomeB,
      dinamica
    );

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
      complementaridadeNivel: temInformacao
        ? complementaridadeNivel
        : 0,
      potencialCrescimento: temInformacao
        ? Math.min(100, potencialCrescimento)
        : 0,
      ativacaoPadroes: temInformacao
        ? ativacaoPadroes
        : 0,

      forcasA: a.forcas,
      forcasB: b.forcas,
      fraquezasA: a.fraquezas,
      fraquezasB: b.fraquezas,
      oportunidadesA: a.oportunidades,
      oportunidadesB: b.oportunidades,
      ameacasA: a.ameacas,
      ameacasB: b.ameacas,

      forcasComuns,
      recursosApoiamB,
      recursosApoiamA,
      recursosComplementares,
      vulnerabilidadesComuns,
      oportunidadesComuns,
      ameacasComuns,

      dinamicasInteracao,

      explicacaoAfinidade: temasComuns.length || valoresComuns.length
        ? `Foram encontrados ${temasComuns.length} tema(s) comum(ns) e ${valoresComuns.length} valor(es) semelhante(s).`
        : 'A informação atual não permite estimar afinidade com confiança.',

      explicacaoComplementaridade: recursosComplementares.length
        ? `Os recursos complementares identificados incluem: ${recursosComplementares.join(', ')}.`
        : 'Não foram encontrados recursos complementares claros.',

      explicacaoCrescimento: dinamicas.length
        ? 'As dinâmicas identificadas podem constituir oportunidades de aprendizagem, desde que cada pessoa reconheça a sua participação e esteja disponível para mudar comportamentos.'
        : 'O potencial de crescimento deve ser confirmado pela experiência real e pela disponibilidade de ambos para aprender.',

      explicacaoAtivacao: dinamicas.includes('Ativadora')
        ? 'A combinação de vulnerabilidades e ameaças sugere a possibilidade de reforço de mecanismos defensivos. Esta hipótese deve ser confrontada com situações reais.'
        : 'Não foram encontrados indicadores suficientes para sugerir uma ativação defensiva específica.',

      cicloProvavel,

      passosIntegracao: this.construirPassosIntegracao(
        temasOpostos,
        temasComuns,
        pessoaA,
        pessoaB,
        dinamica
      )
    };
  }

  // =========================================================
  // CORRESPONDÊNCIAS ENTRE TEMAS E RECURSOS
  // =========================================================

  private encontrarCorrespondencias(
    listaA: string[],
    listaB: string[]
  ): string[] {
    const resultado: string[] = [];

    listaA.forEach(a => {
      const correspondente = listaB.find(b =>
        this.saoSemelhantes(a, b)
      );

      if (correspondente) {
        resultado.push(`${a} ↔ ${correspondente}`);
      }
    });

    return this.unirListas([resultado]);
  }

  private encontrarComplementaridades(
    forcasA: string[],
    forcasB: string[]
  ): string[] {
    const resultado: string[] = [];

    forcasA.forEach(a => {
      forcasB.forEach(b => {
        if (
          !this.saoSemelhantes(a, b) &&
          this.temasSaoComplementares(a, b)
        ) {
          resultado.push(`${a} + ${b}`);
        }
      });
    });

    return this.unirListas([resultado]);
  }

  private encontrarOportunidadesPartilhadas(
    a: AnalisePerfil,
    b: AnalisePerfil
  ): string[] {
    return this.encontrarCorrespondencias(
      a.oportunidades,
      b.oportunidades
    );
  }

  // =========================================================
  // CINCO DINÂMICAS RELACIONAIS
  // =========================================================

  private detetarTiposRelacao(
    a: AnalisePerfil,
    b: AnalisePerfil,
    temasComuns: string[],
    recursosApoiamA: string[],
    recursosApoiamB: string[]
  ): TipoRelacional[] {
    const resultado: TipoRelacional[] = [];

    const vulnerabilidadesComuns =
      this.encontrarCorrespondencias(a.fraquezas, b.fraquezas);

    const oportunidadesComuns =
      this.encontrarOportunidadesPartilhadas(a, b);

    const ameacasComuns =
      this.encontrarCorrespondencias(a.ameacas, b.ameacas);

    const existemRecursosDeApoio =
      recursosApoiamA.length > 0 ||
      recursosApoiamB.length > 0;

    const existemVulnerabilidades =
      a.fraquezas.length > 0 ||
      b.fraquezas.length > 0;

    const existemAmeacas =
      a.ameacas.length > 0 ||
      b.ameacas.length > 0;

    const existemOportunidades =
      a.oportunidades.length > 0 ||
      b.oportunidades.length > 0;

    const recursosDiferentes =
      this.encontrarComplementaridades(a.forcas, b.forcas);

    // Facilitadora: recursos de uma pessoa apoiam vulnerabilidades da outra.
    if (
      existemRecursosDeApoio &&
      existemOportunidades
    ) {
      resultado.push('Facilitadora');
    }

    // Desafiante: vulnerabilidades encontram oportunidades de desenvolvimento.
    if (
      existemVulnerabilidades &&
      existemOportunidades
    ) {
      resultado.push('Desafiante');
    }

    // Ativadora: vulnerabilidades e ameaças têm correspondência entre perfis.
    if (
      vulnerabilidadesComuns.length > 0 &&
      (ameacasComuns.length > 0 || existemAmeacas)
    ) {
      resultado.push('Ativadora');
    }

    // Complementar: forças diferentes e oportunidades comuns.
    if (
      recursosDiferentes.length > 0 ||
      (
        a.forcas.length > 0 &&
        b.forcas.length > 0 &&
        oportunidadesComuns.length > 0
      )
    ) {
      resultado.push('Complementar');
    }

    // Espelho: vulnerabilidades ou ameaças semelhantes.
    if (
      vulnerabilidadesComuns.length > 0 ||
      ameacasComuns.length > 0 ||
      (
        temasComuns.length > 0 &&
        (
          a.fraquezas.length > 0 ||
          b.fraquezas.length > 0
        )
      )
    ) {
      resultado.push('Espelho');
    }

    return resultado;
  }

  // =========================================================
  // TEMAS OPOSTOS
  // =========================================================

  private obterTemasOpostos(
    temasA: string[],
    temasB: string[]
  ): string[] {
    const resultado: string[] = [];

    temasA.forEach(a => {
      temasB.forEach(b => {
        if (this.temasSaoOpostos(a, b)) {
          resultado.push(`${a} ↔ ${b}`);
        }
      });
    });

    return this.unirListas([resultado]);
  }

  // =========================================================
  // DETEÇÃO DE DINÂMICAS DE INTERAÇÃO
  // =========================================================

  private textoAnalise(a: AnalisePerfil): string {
    return this.normalizarTexto([
      a.ferida,
      a.necessidade,
      a.defesa,
      a.questao,
      a.valores,
      ...a.fraquezas
    ].join(' '));
  }

  private contemAlgum(
    texto: string,
    termos: string[]
  ): boolean {
    return termos.some(termo =>
      texto.includes(this.normalizarTexto(termo))
    );
  }

  private detetarDinamicas(
    a: AnalisePerfil,
    b: AnalisePerfil
  ): TipoDinamica[] {
    const textoA = this.textoAnalise(a);
    const textoB = this.textoAnalise(b);

    const resultado: TipoDinamica[] = [];

    const controlo = [
      'controlo',
      'controlar',
      'controlador',
      'rigidez',
      'necessidade de controlar',
      'previsibilidade'
    ];

    const autonomia = [
      'autonomia',
      'independencia',
      'liberdade',
      'espaco pessoal',
      'necessidade de espaco'
    ];

    if (
      (
        this.contemAlgum(textoA, controlo) &&
        this.contemAlgum(textoB, autonomia)
      ) ||
      (
        this.contemAlgum(textoB, controlo) &&
        this.contemAlgum(textoA, autonomia)
      )
    ) {
      resultado.push('controlo-autonomia');
    }

    const proximidade = [
      'proximidade',
      'intimidade',
      'abandono',
      'medo de perder',
      'medo de ficar sozinho',
      'ligacao emocional'
    ];

    const distancia = [
      'distancia',
      'afastamento',
      'independencia',
      'liberdade',
      'espaco pessoal',
      'necessidade de espaco'
    ];

    if (
      (
        this.contemAlgum(textoA, proximidade) &&
        this.contemAlgum(textoB, distancia)
      ) ||
      (
        this.contemAlgum(textoB, proximidade) &&
        this.contemAlgum(textoA, distancia)
      )
    ) {
      resultado.push('proximidade-distancia');
    }

    const reconhecimento = [
      'reconhecimento',
      'valorizacao',
      'aprovacao',
      'ser visto',
      'ser reconhecido',
      'validacao'
    ];

    const rejeicao = [
      'rejeicao',
      'exclusao',
      'abandono',
      'desvalorizacao',
      'nao ser aceite',
      'nao ser suficiente'
    ];

    if (
      (
        this.contemAlgum(textoA, reconhecimento) &&
        this.contemAlgum(textoB, rejeicao)
      ) ||
      (
        this.contemAlgum(textoB, reconhecimento) &&
        this.contemAlgum(textoA, rejeicao)
      )
    ) {
      resultado.push('reconhecimento-rejeicao');
    }

    const perfeccionismo = [
      'perfeccionismo',
      'perfeccionista',
      'exigencia',
      'erro',
      'medo de errar',
      'autocritica',
      'critica'
    ];

    const sensibilidadeCritica = [
      'critica',
      'julgamento',
      'inadequacao',
      'nao ser suficiente',
      'medo de falhar',
      'rejeicao',
      'desvalorizacao'
    ];

    if (
      (
        this.contemAlgum(textoA, perfeccionismo) &&
        this.contemAlgum(textoB, sensibilidadeCritica)
      ) ||
      (
        this.contemAlgum(textoB, perfeccionismo) &&
        this.contemAlgum(textoA, sensibilidadeCritica)
      )
    ) {
      resultado.push('perfeccionismo-critica');
    }

    return resultado;
  }

  // Mantém um método de compatibilidade para as descrições
  // que utilizam uma dinâmica principal.
  

  // =========================================================
  // INTENSIDADE DE ATIVAÇÃO
  // =========================================================

  private calcularAtivacao(
    a: AnalisePerfil,
    b: AnalisePerfil,
    temasComuns: string[],
    temasOpostos: string[],
    dinamicas: TipoDinamica[]
  ): number {
    let pontos = 0;

    const vulnerabilidadesComuns =
      this.encontrarCorrespondencias(a.fraquezas, b.fraquezas);

    const ameacasComuns =
      this.encontrarCorrespondencias(a.ameacas, b.ameacas);

    if (vulnerabilidadesComuns.length) pontos += 35;
    if (ameacasComuns.length) pontos += 25;

    if (
      vulnerabilidadesComuns.length &&
      ameacasComuns.length
    ) {
      pontos += 15;
    }

    if (temasComuns.length >= 2) pontos += 5;
    if (temasOpostos.length >= 1) pontos += 5;

    // Uma dinâmica isolada não representa automaticamente ativação.
    if (dinamicas.length) {
      pontos += Math.min(15, dinamicas.length * 5);
    }

    return Math.min(100, pontos);
  }

  // =========================================================
  // DESCRIÇÃO DA ATIVAÇÃO
  // =========================================================

  private descreverAtivacao(
    a: AnalisePerfil,
    nomeA: string,
    nomeB: string,
    temasComuns: string[],
    temasOpostos: string[],
    dinamica: TipoDinamica | null
  ): string {
    const textoA = this.textoAnalise(a);

    if (dinamica === 'controlo-autonomia') {
      const aControla = this.contemAlgum(textoA, [
        'controlo', 'controlar', 'controlador', 'rigidez',
        'previsibilidade'
      ]);

      const pessoaControlo = aControla ? nomeA : nomeB;
      const pessoaAutonomia = aControla ? nomeB : nomeA;

      return (
        `${pessoaControlo} apresenta indicadores associados à procura de segurança, previsibilidade ou controlo. ` +
        `${pessoaAutonomia} apresenta indicadores relacionados com autonomia, independência ou liberdade de decisão. ` +
        'Se estas tendências se manifestarem, poderá surgir tensão entre segurança e liberdade.'
      );
    }

    if (dinamica === 'proximidade-distancia') {
      const aProcuraProximidade = this.contemAlgum(textoA, [
        'proximidade', 'intimidade', 'abandono',
        'medo de perder', 'ligacao emocional'
      ]);

      const pessoaProximidade = aProcuraProximidade ? nomeA : nomeB;
      const pessoaEspaco = aProcuraProximidade ? nomeB : nomeA;

      return (
        `${pessoaProximidade} apresenta indicadores relacionados com proximidade ou segurança dos vínculos. ` +
        `${pessoaEspaco} apresenta indicadores associados à necessidade de espaço ou autonomia. ` +
        'Se estas necessidades forem ativadas, a aproximação poderá ser sentida como pressão e o afastamento como desinteresse.'
      );
    }

    if (dinamica === 'reconhecimento-rejeicao') {
      const aProcuraReconhecimento = this.contemAlgum(textoA, [
        'reconhecimento', 'valorizacao', 'aprovacao',
        'ser visto', 'ser reconhecido', 'validacao'
      ]);

      const pessoaReconhecimento = aProcuraReconhecimento ? nomeA : nomeB;
      const pessoaSensivelRejeicao = aProcuraReconhecimento ? nomeB : nomeA;

      return (
        `${pessoaReconhecimento} apresenta indicadores associados à necessidade de reconhecimento ou valorização. ` +
        `${pessoaSensivelRejeicao} apresenta indicadores de sensibilidade à rejeição ou desvalorização. ` +
        'Se estas sensibilidades se manifestarem, a procura de reconhecimento poderá ser sentida como exigência e uma reação defensiva como rejeição.'
      );
    }

    if (dinamica === 'perfeccionismo-critica') {
      const aExigente = this.contemAlgum(textoA, [
        'perfeccionismo', 'perfeccionista', 'exigencia',
        'erro', 'medo de errar', 'autocritica'
      ]);

      const pessoaExigente = aExigente ? nomeA : nomeB;
      const pessoaSensivel = aExigente ? nomeB : nomeA;

      return (
        `${pessoaExigente} apresenta indicadores relacionados com exigência, perfeccionismo ou preocupação com o erro. ` +
        `${pessoaSensivel} apresenta indicadores de sensibilidade à crítica ou ao julgamento. ` +
        'É importante distinguir a melhoria de um comportamento da avaliação do valor da pessoa.'
      );
    }

    if (temasComuns.length) {
      return (
        `Os perfis de ${nomeA} e ${nomeB} apresentam temas comuns relacionados com ${temasComuns.join(', ')}. ` +
        'Estes pontos podem facilitar o reconhecimento mútuo, mas também tornar certas sensibilidades mais visíveis.'
      );
    }

    if (temasOpostos.length) {
      return (
        `Os dados sugerem diferenças em torno de ${temasOpostos.join(', ')}. ` +
        'Estas diferenças podem representar perspetivas complementares ou originar mal-entendidos, dependendo da forma como são vividas.'
      );
    }

    return (
      `Os dados disponíveis não permitem identificar uma dinâmica específica entre ${nomeA} e ${nomeB}. ` +
      'A compreensão da relação deverá partir da observação de situações concretas.'
    );
  }

  // =========================================================
  // INTEGRAÇÃO
  // =========================================================

  private descreverIntegracao(
    temasOpostos: string[],
    temasComuns: string[],
    dinamica: TipoDinamica | null,
    nomeA: string,
    nomeB: string
  ): string {
    switch (dinamica) {
      case 'controlo-autonomia':
        return (
          `A integração passa por construir segurança sem controlo e autonomia sem afastamento. ` +
          `${nomeA} e ${nomeB} podem aprender a distinguir uma necessidade legítima de segurança de uma tentativa de controlar o outro.`
        );

      case 'proximidade-distancia':
        return (
          `A integração passa por encontrar um equilíbrio entre ligação e espaço individual. ` +
          `${nomeA} e ${nomeB} podem aprender a comunicar quando precisam de proximidade e quando precisam de tempo ou espaço.`
        );

      case 'reconhecimento-rejeicao':
        return (
          `A integração passa por expressar reconhecimento de forma clara e por aprender a não interpretar automaticamente uma diferença como rejeição. ` +
          `${nomeA} e ${nomeB} podem distinguir o valor pessoal dos comportamentos que precisam de ser conversados.`
        );

      case 'perfeccionismo-critica':
        return (
          `A integração passa por substituir a crítica pessoal por comunicação concreta e respeitosa. ` +
          `${nomeA} e ${nomeB} podem distinguir a intenção de melhorar uma situação da sensação de estar a ser julgado.`
        );
    }

    if (temasOpostos.length) {
      return (
        `A integração pode começar por reconhecer as diferenças em ${temasOpostos.join(', ')}, ` +
        'formular necessidades sem acusar e negociar comportamentos concretos.'
      );
    }

    if (temasComuns.length) {
      return (
        `Os temas partilhados (${temasComuns.join(', ')}) podem servir de base para criar confiança. ` +
        'Cada pessoa pode explicar o que sente, ouvir a outra e verificar se compreendeu antes de responder.'
      );
    }

    return (
      'Comecem por escolher uma situação real, identificar o que cada um sentiu e precisava, e combinar uma pequena mudança observável.'
    );
  }

  // =========================================================
  // CICLOS DE INTERAÇÃO
  // =========================================================

  private construirCiclo(
    a: AnalisePerfil,
    nomeA: string,
    nomeB: string,
    dinamica: TipoDinamica | null
  ): string[] {
    const textoA = this.textoAnalise(a);

    if (dinamica === 'controlo-autonomia') {
      const aControla = this.contemAlgum(textoA, [
        'controlo', 'controlar', 'controlador',
        'rigidez', 'previsibilidade'
      ]);

      const pessoaControlo = aControla ? nomeA : nomeB;
      const pessoaAutonomia = aControla ? nomeB : nomeA;

      return [
        `${pessoaControlo} procura aumentar o controlo ou a previsibilidade da situação.`,
        `${pessoaAutonomia} sente que a sua liberdade ou capacidade de decisão está a ser limitada.`,
        `${pessoaAutonomia} procura recuperar autonomia, podendo afastar-se ou resistir.`,
        `${pessoaControlo} poderá interpretar essa resistência como insegurança e intensificar a tentativa de controlar.`,
        'A reação de cada um pode acabar por reforçar a preocupação inicial do outro.'
      ];
    }

    if (dinamica === 'proximidade-distancia') {
      const aProcuraProximidade = this.contemAlgum(textoA, [
        'proximidade', 'intimidade', 'abandono',
        'medo de perder', 'ligacao emocional'
      ]);

      const pessoaProximidade = aProcuraProximidade ? nomeA : nomeB;
      const pessoaEspaco = aProcuraProximidade ? nomeB : nomeA;

      return [
        `${pessoaProximidade} procura maior proximidade ou confirmação da ligação.`,
        `${pessoaEspaco} sente necessidade de mais espaço individual.`,
        `${pessoaEspaco} afasta-se para recuperar autonomia ou tranquilidade.`,
        `${pessoaProximidade} poderá interpretar o afastamento como desinteresse e procurar ainda mais proximidade.`,
        'A procura de aproximação e a necessidade de espaço podem reforçar-se mutuamente.'
      ];
    }

    if (dinamica === 'reconhecimento-rejeicao') {
      const aProcuraReconhecimento = this.contemAlgum(textoA, [
        'reconhecimento', 'valorizacao', 'aprovacao',
        'ser visto', 'ser reconhecido', 'validacao'
      ]);

      const pessoaReconhecimento = aProcuraReconhecimento ? nomeA : nomeB;
      const pessoaSensivelRejeicao = aProcuraReconhecimento ? nomeB : nomeA;

      return [
        `${pessoaReconhecimento} procura reconhecimento ou confirmação de que o seu contributo é valorizado.`,
        `${pessoaSensivelRejeicao} poderá interpretar a forma como esse reconhecimento é pedido como pressão.`,
        `${pessoaSensivelRejeicao} reage defensivamente ou afasta-se.`,
        `${pessoaReconhecimento} poderá sentir essa reação como desvalorização.`,
        'A procura de validação e a reação defensiva podem reforçar-se mutuamente.'
      ];
    }

    if (dinamica === 'perfeccionismo-critica') {
      const aExigente = this.contemAlgum(textoA, [
        'perfeccionismo', 'perfeccionista', 'exigencia',
        'erro', 'medo de errar', 'autocritica'
      ]);

      const pessoaExigente = aExigente ? nomeA : nomeB;
      const pessoaSensivel = aExigente ? nomeB : nomeA;

      return [
        `${pessoaExigente} tenta corrigir, melhorar ou evitar um erro.`,
        `${pessoaSensivel} poderá sentir essa intervenção como crítica ou julgamento pessoal.`,
        `${pessoaSensivel} reage com defesa, retraimento ou resistência.`,
        `${pessoaExigente} poderá interpretar essa reação como falta de abertura.`,
        'A crítica percebida e a defesa podem alimentar-se mutuamente.'
      ];
    }

    return [];
  }

  // =========================================================
  // PASSOS DE INTEGRAÇÃO
  // =========================================================

  private construirPassosIntegracao(
    temasOpostos: string[],
    temasComuns: string[],
    pessoaA: Pessoa | null = this.pessoaA,
    pessoaB: Pessoa | null = this.pessoaB,
    dinamica: TipoDinamica | null = null
  ): string[] {
    const nomeA = this.nomeCompleto(pessoaA) || 'Pessoa A';
    const nomeB = this.nomeCompleto(pessoaB) || 'Pessoa B';

    const a = this.analiseDe(pessoaA);
    const textoA = this.textoAnalise(a);

    if (dinamica === 'controlo-autonomia') {
      const aControla = this.contemAlgum(textoA, [
        'controlo', 'controlar', 'controlador',
        'rigidez', 'previsibilidade'
      ]);

      const pessoaControlo = aControla ? nomeA : nomeB;
      const pessoaAutonomia = aControla ? nomeB : nomeA;

      return [
        `${pessoaControlo}: distinguir a necessidade de segurança da necessidade de controlar e permitir que o outro tenha espaço de decisão.`,
        `${pessoaAutonomia}: expressar a necessidade de autonomia de forma clara, sem transformar automaticamente a diferença numa luta.`,
        'Ambos: estabelecer limites e acordos que permitam segurança sem controlo e liberdade sem afastamento.',
        'Ambos: observar se as novas atitudes diminuem a tensão.'
      ];
    }

    if (dinamica === 'proximidade-distancia') {
      const aProcuraProximidade = this.contemAlgum(textoA, [
        'proximidade', 'intimidade', 'abandono',
        'medo de perder', 'ligacao emocional'
      ]);

      const pessoaProximidade = aProcuraProximidade ? nomeA : nomeB;
      const pessoaEspaco = aProcuraProximidade ? nomeB : nomeA;

      return [
        `${pessoaProximidade}: comunicar a necessidade de proximidade sem recorrer à insistência ou à pressão.`,
        `${pessoaEspaco}: comunicar a necessidade de espaço sem desaparecer ou deixar o outro na incerteza.`,
        'Ambos: combinar formas concretas de manter a ligação e respeitar o espaço individual.',
        'Ambos: distinguir um pedido de espaço de uma rejeição e um pedido de proximidade de uma tentativa de controlo.'
      ];
    }

    if (dinamica === 'reconhecimento-rejeicao') {
      const aProcuraReconhecimento = this.contemAlgum(textoA, [
        'reconhecimento', 'valorizacao', 'aprovacao',
        'ser visto', 'ser reconhecido', 'validacao'
      ]);

      const pessoaReconhecimento = aProcuraReconhecimento ? nomeA : nomeB;
      const pessoaSensivelRejeicao = aProcuraReconhecimento ? nomeB : nomeA;

      return [
        `${pessoaReconhecimento}: expressar diretamente o que gostaria de ver reconhecido.`,
        `${pessoaSensivelRejeicao}: distinguir um pedido de reconhecimento de uma crítica ao seu valor pessoal.`,
        'Ambos: reconhecer concretamente os contributos um do outro.',
        'Ambos: esclarecer o significado de uma reação antes de a interpretar como rejeição.'
      ];
    }

    if (dinamica === 'perfeccionismo-critica') {
      const aExigente = this.contemAlgum(textoA, [
        'perfeccionismo', 'perfeccionista', 'exigencia',
        'erro', 'medo de errar', 'autocritica'
      ]);

      const pessoaExigente = aExigente ? nomeA : nomeB;
      const pessoaSensivel = aExigente ? nomeB : nomeA;

      return [
        `${pessoaExigente}: substituir a crítica ou correção imediata por pedidos concretos, sem avaliar a pessoa.`,
        `${pessoaSensivel}: comunicar quando uma observação é sentida como crítica, procurando esclarecer a intenção.`,
        'Ambos: separar o comportamento que pode ser melhorado do valor e da dignidade de quem o praticou.',
        'Ambos: aceitar que o erro faz parte da aprendizagem.'
      ];
    }

    if (temasOpostos.length) {
      return [
        `${nomeA}: identificar o que sente e aquilo de que necessita quando surge uma diferença.`,
        `${nomeB}: procurar compreender a perspetiva de ${nomeA} sem assumir imediatamente uma intenção negativa.`,
        'Ambos: descrever comportamentos concretos em vez de atribuir intenções ao outro.',
        `Ambos: procurar um acordo que respeite as necessidades de ${nomeA} e ${nomeB}.`
      ];
    }

    if (temasComuns.length) {
      return [
        `${nomeA}: reconhecer os temas que partilha com ${nomeB}, sem presumir que ambos os vivem da mesma maneira.`,
        `${nomeB}: expressar a sua experiência individual e escutar a de ${nomeA}.`,
        'Ambos: transformar os pontos comuns em oportunidades de diálogo, confiança e cooperação.'
      ];
    }

    return [
      `${nomeA}: identificar o que sente e de que necessita numa situação concreta.`,
      `${nomeB}: partilhar a sua perspetiva e escutar a de ${nomeA}.`,
      'Ambos: procurar uma resposta que respeite as necessidades e os limites de cada pessoa.'
    ];
  }

  // =========================================================
  // PERGUNTA CENTRAL
  // =========================================================

  private construirPerguntaCentral(
    dinamica: TipoDinamica | null,
    temasComuns: string[],
    temasOpostos: string[],
    nomeA: string,
    nomeB: string
  ): string {
    switch (dinamica) {
      case 'controlo-autonomia':
        return (
          `Como podem ${nomeA} e ${nomeB} construir confiança, permitindo segurança sem controlo e autonomia sem afastamento?`
        );

      case 'proximidade-distancia':
        return (
          `Como podem ${nomeA} e ${nomeB} encontrar uma proximidade que respeite também a necessidade de espaço individual?`
        );

      case 'reconhecimento-rejeicao':
        return (
          `Como podem ${nomeA} e ${nomeB} expressar a necessidade de reconhecimento sem transformar uma diferença numa sensação de rejeição?`
        );

      case 'perfeccionismo-critica':
        return (
          `Como podem ${nomeA} e ${nomeB} falar sobre erros e melhorias sem que a conversa se transforme numa crítica ao valor pessoal?`
        );
    }

    if (temasComuns.length) {
      return (
        `Quando surge o tema ${temasComuns[0]}, como podem falar sobre ele sem se julgarem?`
      );
    }

    if (temasOpostos.length) {
      return (
        `Como podem respeitar as diferenças em torno de ${temasOpostos[0]} sem tentar mudar um ao outro?`
      );
    }

    return (
      'Que comportamento concreto de cada um ajuda esta relação a tornar-se mais segura, respeitosa e verdadeira?'
    );
  }
}
