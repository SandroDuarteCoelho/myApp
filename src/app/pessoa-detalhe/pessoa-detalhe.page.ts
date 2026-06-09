import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ActivatedRoute, RouterModule } from '@angular/router';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';

export type PessoaJson = {
  nome: string;
  apelido: string;
  localidade: string;
  grupo: string;
  eneagrama_tipo: number | string;
  data: string;
};

export type PessoaWithId = PessoaJson & { id: number };

type Setenio = {
  id: number;
  nome: string;
  descricao: string;
};

type SignoChines = {
  signo: string;
  elemento: string;
  anos: number[];
  descricao: string;
};

type SignoSolar = {
  signo: string;
  objetivo: string;
  personalidade: string;
};

type EneagramaData = {
  infancia: string;
  dificuldades: string[];
  gostos: string[];
  autoajuda: string;
  exercicios_praticos: string;
};

@Component({
  selector: 'app-pessoa-detalhe',
  templateUrl: './pessoa-detalhe.page.html',
  styleUrls: ['./pessoa-detalhe.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    RouterModule,

    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,

    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,

    IonAccordion,
    IonAccordionGroup,
    IonItem,
    IonLabel,
  ],
})
export class PessoaDetalhePage implements OnInit {
  pessoa: PessoaWithId | null = null;
  idadeAtual: number | null = null;

  forcaVogais = '';
  atividadeConsoantes = '';

  setenioAtual: Setenio | null = null;
  descricaoDia = '';

  signoChines: SignoChines | null = null;
  signoSolarAtual: SignoSolar | null = null;
  eneagramaAtual: EneagramaData | null = null;

  anoPessoalAtual: number | null = null;
  anoPessoalProximo: number | null = null;
  anoSistemaAtual: number | null = null;
  anoSistemaSeguinte: number | null = null;

  descricaoAnoPessoalAtual = '';
  descricaoAnoPessoalProximo = '';

  // Casas
  casaAtual: string = '';
  descricaoCasaAtual: string = '';
  casaSeguinte: string = '';
  descricaoCasaSeguinte: string = '';
  diasParaCasaSeguinte: number | null = null;

  // Análise Pestal - Ano Chinês
  anoChinesAtual: number | null = null;
  anoChinesProximo: number | null = null;
  previsaoAnoChinesAtual: string = '';
  previsaoAnoChinesProximo: string = '';


  private readonly letraValor: Record<string, number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5,
    F: 6,
    G: 7,
    H: 8,
    I: 9,
    J: 1,
    K: 2,
    L: 3,
    M: 4,
    N: 5,
    O: 6,
    P: 7,
    Q: 8,
    R: 9,
    S: 1,
    T: 2,
    U: 3,
    V: 4,
    W: 5,
    X: 6,
    Y: 7,
    Z: 8,
  };

  private readonly vogais = new Set(['A', 'E', 'I', 'O', 'U']);

  // (Mantida caso o texto das casas venha a ser centralizado via map)
  // Neste componente, a descrição é lida diretamente deste mapa via getDescricaoCasa().
  private readonly casasMap: Record<string, string> = {

    'Casa da VIDA':
      'empreendimentos pessoais, temperamento, qualidades, defeitos e projetos para o futuro',
    'Casa dos BENS':
      'bens materiais, fortuna, lucros, promoções, emprego, compras e vendas importantes.',
    'Casa do SANGUE':
      'família e parentes, tanto nas alegrias quanto nas tristezas. Se o relacionamento é bom, o período é muito positivo',
    'Casa da SOLIDEZ':
      'realização de sonhos, consolidação de negócios, sociedades, contratos, terra, propriedades e viagens importantes',
    'Casa dos FILHOS':
      'fertilidade, fecundidade, gestação, nascimento, educação, alegrias e tristezas, tudo envolvendo filhos.',
    'Casa da SAÚDE':
      'esta é a casa do sucesso em todos os sentidos, bem como da saúde física e mental. Curas e distúrbios podem acontecer nesse período. Período do Paraíso Astral.',
    'Casa do CASAMENTO':
      'tudo que se relacionar a sua relação amorosa, quer seja ou não formalizada, tanto no sentido de realização quanto no de finalização',
    'Casa da MORTE/MUDANÇA':
      'lutas, obstáculos, problemas, acidentes, operações cirúrgicas, bem como término abrupto de relacionamentos, sociedades, com prejuízos ou não.',
    'Casa DIVINA':
      'período da religiosidade, da dedicação às coisas do espírito, da busca e do encontro por respostas. Delicado para pessoas místicas ou fanáticas em excesso.',
    'Casa da POSIÇÃO SOCIAL':
      'sucesso, ascensão, glórias, reconhecimento, prêmios, evidência e elevação. Casamento por interesse.',
    'Casa dos AMIGOS':
      'início ou fim de relacionamentos com amigos. Indicado para pedir auxílio e proteção nos assuntos complicados.',
    'Casa dos INIMIGOS':
      'perseguições, desavenças, brigas, escândalos e tudo de ruim que possa ocorrer no período do seu Inferno Astral.',
  };

  // localStorage overrides (iguais às chaves de src/app/perfil/perfil.page.ts)
  private readonly STORAGE_KEY_OVERRIDES = 'pessoas_overrides_v1';
  private readonly STORAGE_KEY_DELETED = 'pessoas_deleted_v1';

  private loadOverrides(): Record<number, { [k: string]: any }> {
    try {
      const raw = window.localStorage.getItem(this.STORAGE_KEY_OVERRIDES);
      return raw ? (JSON.parse(raw) as Record<number, any>) : {};
    } catch {
      return {};
    }
  }

  private loadDeleted(): Set<number> {
    try {
      const raw = window.localStorage.getItem(this.STORAGE_KEY_DELETED);
      const arr = raw ? (JSON.parse(raw) as number[]) : [];
      return new Set(arr);
    } catch {
      return new Set<number>();
    }
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
  ) {}

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? Number(idStr) : NaN;

    if (!id || Number.isNaN(id)) return;

    // 1) tentar carregar a pessoa do localStorage (novos perfis)
    const overrides = this.loadOverrides();
    const deleted = this.loadDeleted();

    if (!deleted.has(id) && overrides && overrides[id]) {
      const ov = overrides[id] as PessoaJson;
      this.pessoa = ({ id, ...ov } as PessoaWithId);

      this.idadeAtual = this.calcularIdade(this.pessoa.data);

      const numeroVogais = this.somaVogais;
      const numeroConsoantes = this.somaConsoantes;

      Promise.all([
        this.getForcaPorNumero(numeroVogais, 'força_espiritual'),
        this.getForcaPorNumero(numeroConsoantes, 'atividade'),
      ]).then(([forca, atividade]) => {
        this.forcaVogais = forca;
        this.atividadeConsoantes = atividade;
      });

      this.carregarSetenio();
      this.carregarDescricaoDia();
      this.carregarSignoChines();
      this.carregarSignoSolar();
      this.carregarEneagrama();
      this.carregarAnoPessoal();
      this.carregarCasasPestal();
      return;
    }

    // 2) fallback: carregar do JSON base (perfis antigos)
    this.http.get<PessoaJson[]>('assets/data/pessoas.json').subscribe({
      next: (arr) => {
        const idx = id - 1;
        this.pessoa = arr[idx] ? ({ id, ...arr[idx] } as PessoaWithId) : null;
        if (!this.pessoa) return;


        this.idadeAtual = this.calcularIdade(this.pessoa.data);

        const numeroVogais = this.somaVogais;
        const numeroConsoantes = this.somaConsoantes;

        Promise.all([
          this.getForcaPorNumero(numeroVogais, 'força_espiritual'),
          this.getForcaPorNumero(numeroConsoantes, 'atividade'),
        ]).then(([forca, atividade]) => {
          this.forcaVogais = forca;
          this.atividadeConsoantes = atividade;
        });

        this.carregarSetenio();
        this.carregarDescricaoDia();
        this.carregarSignoChines();
        this.carregarSignoSolar();
        this.carregarEneagrama();
        this.carregarAnoPessoal();
        this.carregarCasasPestal();
        




      },
    });
  }

  // =========================
  // NUMEROLOGIA (já existente)
  // =========================

  private reduzirSoma(total: number): number {
    if (total === 11 || total === 22) return total;

    let x = total;
    while (x >= 10) {
      x = String(x)
        .split('')
        .reduce((acc, d) => acc + Number(d), 0);

      if (x === 11 || x === 22) return x;
    }
    return x;
  }

  private normalizarTexto(s: string): string {
    return (s ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '');
  }

  private somarLetrasPeloTipo(
    p1: string,
    p2: string,
    tipo: 'vogais' | 'consoantes',
  ): number {
    const texto = this.normalizarTexto(p1 + p2);

    const soma = [...texto].reduce((acc, ch) => {
      const ehVogal = this.vogais.has(ch);
      const querVogal = tipo === 'vogais';

      if (ehVogal !== querVogal) return acc;
      return acc + (this.letraValor[ch] ?? 0);
    }, 0);

    return this.reduzirSoma(soma);
  }

  get somaVogais(): number {
    if (!this.pessoa) return 0;
    return this.somarLetrasPeloTipo(this.pessoa.nome, this.pessoa.apelido, 'vogais');
  }

  get somaConsoantes(): number {
    if (!this.pessoa) return 0;
    return this.somarLetrasPeloTipo(this.pessoa.nome, this.pessoa.apelido, 'consoantes');
  }

  async getForcaPorNumero(
    numero: number,
    tipo: 'força_espiritual' | 'atividade',
  ): Promise<string> {
    const data = await this.http
      .get<Array<{ numero: number; força_espiritual: string; atividade: string }>>('assets/data/nome.json')
      .toPromise();

    const n = data?.find((x) => x.numero === numero);
    return n ? (n as any)[tipo] : '';
  }

  // =========================
  // SETÉNIOS
  // =========================

  calcularIdade(data: string): number {
    const hoje = new Date();
    const nasc = new Date(data);

    let idade = hoje.getFullYear() - nasc.getFullYear();

    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }

    return idade;
  }

  carregarSetenio(): void {
    if (!this.pessoa) return;

    const idade = this.calcularIdade(this.pessoa.data);
    const idSetenio = Math.floor(idade / 7) + 1;

    this.http.get<Setenio[]>('assets/data/setenios.json').subscribe((data) => {
      this.setenioAtual = data.find((s) => s.id === idSetenio) || null;
    });
  }

  // =========================
  // DIA NASCIMENTO
  // =========================

  carregarDescricaoDia(): void {
    if (!this.pessoa) return;

    const dia = new Date(this.pessoa.data).getDate();

    this.http.get<Record<string, string>>('assets/data/dia_nascimento.json').subscribe((data) => {
      this.descricaoDia = data[String(dia)] || '';
    });
  }

  // =========================
  // SIGNO CHINÊS
  // =========================

  private async carregarSignoChines(): Promise<void> {

  if (!this.pessoa) return;

  const anoNascimento =
    new Date(this.pessoa.data).getFullYear();

  try {

    const data = await this.http
      .get<any[]>('assets/data/chineses.json')
      .toPromise();

    if (!data) return;

    this.signoChines =
      data.find(s =>
        s.anos?.includes(anoNascimento)
      ) ?? null;

    // carregar previsões APENAS depois
    await this.carregarPrevisaoAnoChines();

  } catch (e) {

    console.error(e);
    this.signoChines = null;
  }
}

  // =========================
  // SIGNO SOLAR
  // =========================

  private getSignoSolarKeyPorDataNascimento(dateStr: string): string | null {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth() + 1;

    const mmdd = month * 100 + day;

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

  private async carregarSignoSolar(): Promise<void> {
    if (!this.pessoa) return;

    const key = this.getSignoSolarKeyPorDataNascimento(this.pessoa.data);
    if (!key) {
      this.signoSolarAtual = null;
      return;
    }

    try {
      const json = await this.http
        .get<Array<{ signo?: string; objetivo?: string; personalidade?: string }>>(`assets/data/solares/${key}.json`)
        .toPromise();

      const primeiro = json?.[0];
      this.signoSolarAtual = primeiro
        ? {
            signo: primeiro.signo ?? '',
            objetivo: primeiro.objetivo ?? '',
            personalidade: primeiro.personalidade ?? '',
          }
        : null;
    } catch {
      this.signoSolarAtual = null;
    }
  }

// =========================
// CASAS (PÉSTAL)
// =========================

private ordemCasas: string[] = [
  'Casa da VIDA',
  'Casa dos BENS',
  'Casa do SANGUE',
  'Casa da SOLIDEZ',
  'Casa dos FILHOS',
  'Casa da SAÚDE',
  'Casa do CASAMENTO',
  'Casa da MORTE/MUDANÇA',
  'Casa DIVINA',
  'Casa da POSIÇÃO SOCIAL',
  'Casa dos AMIGOS',
  'Casa dos INIMIGOS',
];

private getDescricaoCasa(casa: string): string {
  return this.casasMap[casa] ?? '';
}

private getCasaAtualPorDataNascimento(dateStr: string): string {

  const nascimento = new Date(dateStr);
  const diaNascimento = nascimento.getDate();

  const hoje = new Date();

  let mesesDecorridos =
    (hoje.getFullYear() - nascimento.getFullYear()) * 12 +
    (hoje.getMonth() - nascimento.getMonth());

  // Ainda não chegou ao dia de mudança deste mês
  if (hoje.getDate() < diaNascimento) {
    mesesDecorridos--;
  }

  const idx =
    ((mesesDecorridos % this.ordemCasas.length)
      + this.ordemCasas.length)
    % this.ordemCasas.length;

  return this.ordemCasas[idx];
}

private proximaCasa(casaAtual: string): string {

  const idx = this.ordemCasas.indexOf(casaAtual);

  if (idx === -1) {
    return this.ordemCasas[0];
  }

  return this.ordemCasas[
    (idx + 1) % this.ordemCasas.length
  ];
}

private diasParaProximaCasa(dateStr: string): number {

  const nascimento = new Date(dateStr);
  const diaNascimento = nascimento.getDate();

  const hoje = new Date();

  let proximaMudanca = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    diaNascimento
  );

  // Se já passou o dia de mudança deste mês,
  // a próxima mudança é no mês seguinte.
  if (hoje.getDate() >= diaNascimento) {

    proximaMudanca = new Date(
      hoje.getFullYear(),
      hoje.getMonth() + 1,
      diaNascimento
    );
  }

  const hojeZero = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const mudancaZero = new Date(
    proximaMudanca.getFullYear(),
    proximaMudanca.getMonth(),
    proximaMudanca.getDate()
  );

  const ms = mudancaZero.getTime() - hojeZero.getTime();

  return Math.ceil(
    ms / (1000 * 60 * 60 * 24)
  );
}

carregarCasasPestal(): void {

  if (!this.pessoa?.data) {
    return;
  }

  const casaAtual =
    this.getCasaAtualPorDataNascimento(
      this.pessoa.data
    );

  this.casaAtual = casaAtual;

  this.descricaoCasaAtual =
    this.getDescricaoCasa(casaAtual);

  const casaSeguinte =
    this.proximaCasa(casaAtual);

  this.casaSeguinte = casaSeguinte;

  this.descricaoCasaSeguinte =
    this.getDescricaoCasa(casaSeguinte);

  this.diasParaCasaSeguinte =
    this.diasParaProximaCasa(
      this.pessoa.data
    );
}

   // =========================
  // ANO CHINÊS (PÉSTAL)
  // =========================

  private obterSignoAnoChines(ano: number): string {

    const signos = [
      'Rato',
      'Boi',
      'Tigre',
      'Coelho',
      'Dragão',
      'Serpente',
      'Cavalo',
      'Carneiro',
      'Macaco',
      'Galo',
      'Cão',
      'Porco'
    ];

    // 2020 foi ano do Rato
    const indice = (ano - 2020) % 12;

    return signos[(indice + 12) % 12];
  }

  private getAnoChinesAtualPorData(d: Date): number {
    // Ano Novo Chinês costuma cair entre janeiro e fevereiro.
    // Sem uma tabela astronômica completa, usamos uma heurística: 
    // - antes do corte (31/jan aprox.) considera-se que o ano chinês ainda é o do ano anterior.
    // - após o corte, usa o ano do calendário.
    // Isso resolve o "gap" comum ao usar apenas getFullYear().
    const mes = d.getMonth() + 1; // 1-12
    const dia = d.getDate();

    const ano = d.getFullYear();

    // Heurística de corte: 31/01
    if (mes === 1 && dia <= 31) return ano - 1;

    return ano;
  }

  private async carregarPrevisaoAnoChines(): Promise<void> {
    if (!this.pessoa) return;
    if (!this.signoChines) return;

    const hoje = new Date();

    // Ajusta o ano chinês atual pela data (jan/fev)
    const anoChinesAtual = this.getAnoChinesAtualPorData(hoje);
    const anoChinesProximo = anoChinesAtual + 1;

    const signos = await this.http
      .get<any[]>('assets/data/chineses.json')
      .toPromise();

    if (!signos) return;

    const signoChinesAtual = this.signoChines?.signo;

    const signoPessoa = signos.find(
      (s) => !!signoChinesAtual && s.signo === signoChinesAtual
    );

    if (!signoPessoa) {
      this.previsaoAnoChinesAtual = '';
      this.previsaoAnoChinesProximo = '';
      return;
    }

    const signoAnoAtual = this.obterSignoAnoChines(anoChinesAtual);
    const signoAnoProximo = this.obterSignoAnoChines(anoChinesProximo);

    this.anoChinesAtual = anoChinesAtual;
    this.anoChinesProximo = anoChinesProximo;

    const interacoes = signoPessoa.interacao_com_outros_signos ?? {};

    // Leitura direta
    const previsaoAtual = interacoes?.[signoAnoAtual]?.previsao_ano;
    const previsaoProx = interacoes?.[signoAnoProximo]?.previsao_ano;

    // Fallback: se a chave não existir (por qualquer divergência de offset), tenta o “outro lado”
    this.previsaoAnoChinesAtual = (previsaoAtual ?? '').toString();
    this.previsaoAnoChinesProximo = (previsaoProx ?? '').toString();

    if (!this.previsaoAnoChinesAtual) {
      const fallbackAno = anoChinesProximo;
      const fallbackSigno = this.obterSignoAnoChines(fallbackAno);
      this.previsaoAnoChinesAtual = (interacoes?.[fallbackSigno]?.previsao_ano ?? '').toString();
    }

    if (!this.previsaoAnoChinesProximo) {
      const fallbackAno = anoChinesAtual;
      const fallbackSigno = this.obterSignoAnoChines(fallbackAno);
      this.previsaoAnoChinesProximo = (interacoes?.[fallbackSigno]?.previsao_ano ?? '').toString();
    }
  }
  // =========================
  // ANO PESSOAL (PÉSTAL)
  // =========================


  private calcularAnoPessoal(mesNascimento: number, diaNascimento: number, anoReferencia: number): number {
    let resultado = diaNascimento + mesNascimento + anoReferencia;

    while (resultado >= 10) {
      resultado = String(resultado)
        .split('')
        .reduce((acc, n) => acc + Number(n), 0);
    }

    return resultado;
  }

  private async carregarTextoAnoPessoal(numero: number): Promise<string> {
    const data = await this.http.get<Record<string, string>>('assets/data/ano_pessoal.json').toPromise();
    return data?.[String(numero)] ?? '';
  }

  async carregarAnoPessoal(): Promise<void> {
    if (!this.pessoa) return;

    const d = new Date(this.pessoa.data);
    const dia = d.getDate();
    const mes = d.getMonth() + 1;

    this.anoSistemaAtual = new Date().getFullYear();
    this.anoSistemaSeguinte = (this.anoSistemaAtual ?? 0) + 1;

    const anoAtual = this.anoSistemaAtual ?? new Date().getFullYear();
    const anoProximo = this.anoSistemaSeguinte ?? anoAtual + 1;

    this.anoPessoalAtual = this.calcularAnoPessoal(mes, dia, anoAtual);
    this.anoPessoalProximo = this.calcularAnoPessoal(mes, dia, anoProximo);

    this.descricaoAnoPessoalAtual = await this.carregarTextoAnoPessoal(this.anoPessoalAtual);
    this.descricaoAnoPessoalProximo = await this.carregarTextoAnoPessoal(this.anoPessoalProximo);
  }

  // =========================
  // ENEAGRAMA
  // =========================

  private carregarEneagrama(): void {
    if (!this.pessoa) return;

    const tipoNum = Number(this.pessoa.eneagrama_tipo);

    if (!tipoNum) {
      this.eneagramaAtual = null;
      return;
    }

    this.http.get<any[]>('assets/data/eneagrama.json').subscribe({
      next: (arr) => {
        const data = arr?.find((x) => x.tipo === tipoNum);
        this.eneagramaAtual = data
          ? {
              infancia: data.infancia ?? '',
              dificuldades: data.dificuldades ?? [],
              gostos: data.gostos ?? [],
              autoajuda: data.autoajuda ?? '',
              exercicios_praticos: data.exercicios_praticos ?? '',
            }
          : null;
      },
      error: () => {
        this.eneagramaAtual = null;
      },
    });
  }

  // =========================
  // NAV
  // =========================

  voltar(): void {
    window.history.back();
  }

  abrirSignos(): void {
    window.location.href = '/signos';
  }

  abrirEneagrama(): void {
    window.location.href = '/eneagrama';
  }

  abrirSetenios(): void {
    window.location.href = '/setenios';
  }
}

