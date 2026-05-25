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
  descricaoAnoPessoalAtual = '';
  descricaoAnoPessoalProximo = '';

  private readonly letraValor: Record<string, number> = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
    J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
    S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
  };

  private readonly vogais = new Set(['A', 'E', 'I', 'O', 'U']);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    const idStr = this.route.snapshot.paramMap.get('id');
    const id = idStr ? Number(idStr) : NaN;

    if (!id || Number.isNaN(id)) return;

    this.http.get<PessoaJson[]>('assets/data/pessoas.json')
      .subscribe({
        next: (arr) => {
          const idx = id - 1;
          this.pessoa = arr[idx]
            ? ({ id, ...arr[idx] } as PessoaWithId)
            : null;

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

        }
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

  private somarLetrasPeloTipo(p1: string, p2: string, tipo: 'vogais' | 'consoantes'): number {
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
    tipo: 'força_espiritual' | 'atividade'
  ): Promise<string> {
    const data = await this.http
      .get<Array<{ numero: number; força_espiritual: string; atividade: string }>>(
        'assets/data/nome.json'
      )
      .toPromise();

    const n = data?.find(x => x.numero === numero);
    return n ? n[tipo] : '';
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

    this.http.get<Setenio[]>('assets/data/setenios.json')
      .subscribe(data => {
        this.setenioAtual = data.find(s => s.id === idSetenio) || null;
      });
  }

  // =========================
  // DIA NASCIMENTO
  // =========================

  carregarDescricaoDia(): void {
    if (!this.pessoa) return;

    const dia = new Date(this.pessoa.data).getDate();

    this.http.get<Record<string, string>>('assets/data/dia_nascimento.json')
      .subscribe(data => {
        this.descricaoDia = data[String(dia)] || '';
      });
  }

  // =========================
  // SIGNO CHINÊS
  // =========================

  carregarSignoChines(): void {
    if (!this.pessoa) return;

    const ano = new Date(this.pessoa.data).getFullYear();

    this.http.get<SignoChines[]>('assets/data/chineses.json')
      .subscribe(data => {
        this.signoChines = data.find(s => s.anos.includes(ano)) || null;
      });
  }

  // =========================
  // SIGNO SOLAR
  // =========================

  private getSignoSolarKeyPorDataNascimento(dateStr: string): string | null {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.getMonth() + 1; // 1-12

    // Usando o mapeamento tropical (por mês/dia) com wrap conforme sua regra:
    // Capricórnio: 22/12 a 20/01 (inclui 01/01-20/01)
    // Aquário: 21/01 a 19/02

    const mmdd = month * 100 + day;

    // Carneiro 21/03-19/04
    if (mmdd >= 321 && mmdd <= 419) return 'carneiro';
    // Touro 20/04-20/05
    if (mmdd >= 420 && mmdd <= 520) return 'touro';
    // Gémeos 21/05-20/06
    if (mmdd >= 521 && mmdd <= 620) return 'gemeos';
    // Caranguejo 21/06-22/07
    if (mmdd >= 621 && mmdd <= 722) return 'caranguejo';
    // Leão 23/07-22/08
    if (mmdd >= 723 && mmdd <= 822) return 'leao';
    // Virgem 23/08-22/09
    if (mmdd >= 823 && mmdd <= 922) return 'virgem';
    // Balança 23/09-22/10
    if (mmdd >= 923 && mmdd <= 1022) return 'balanca';
    // Escorpião 23/10-21/11
    if (mmdd >= 1023 && mmdd <= 1121) return 'escorpiao';
    // Sagitário 22/11-21/12
    if (mmdd >= 1122 && mmdd <= 1221) return 'sagitario';
    // Capricórnio 22/12-31/12 + 01/01-20/01
    if (mmdd >= 1222 && mmdd <= 1231) return 'capricornio';
    if (mmdd >= 101 && mmdd <= 120) return 'capricornio';
    // Aquário 21/01-19/02
    if (mmdd >= 121 && mmdd <= 219) return 'aquario';
    // Peixes 20/02-20/03
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
        .get<Array<{ signo?: string; objetivo?: string; personalidade?: string }>>(
          `assets/data/solares/${key}.json`
        )
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
// ANO PESSOAL (PÉSTAL)
// =========================

private calcularAnoPessoal(
  mesNascimento: number,
  diaNascimento: number,
  anoReferencia: number
): number {

  // Soma inicial
  let resultado = diaNascimento + mesNascimento + anoReferencia;

  // Reduzir até ficar apenas 1 algarismo
  while (resultado >= 10) {
    resultado = String(resultado)
      .split('')
      .reduce((acc, n) => acc + Number(n), 0);
  }

  return resultado;
}

private async carregarTextoAnoPessoal(numero: number): Promise<string> {

  const data = await this.http
    .get<Record<string, string>>(
      'assets/data/ano_pessoal.json'
    )
    .toPromise();

  return data?.[String(numero)] ?? '';
}

async carregarAnoPessoal(): Promise<void> {

  if (!this.pessoa) return;

  const d = new Date(this.pessoa.data);

  const dia = d.getDate();
  const mes = d.getMonth() + 1;

  const anoAtual = new Date().getFullYear();
  const anoProximo = anoAtual + 1;

  // Calcular anos pessoais
  this.anoPessoalAtual =
    this.calcularAnoPessoal(mes, dia, anoAtual);

  this.anoPessoalProximo =
    this.calcularAnoPessoal(mes, dia, anoProximo);

  // Carregar textos do JSON
  this.descricaoAnoPessoalAtual =
    await this.carregarTextoAnoPessoal(
      this.anoPessoalAtual
    );

  this.descricaoAnoPessoalProximo =
    await this.carregarTextoAnoPessoal(
      this.anoPessoalProximo
    );
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

  this.http
    .get<any[]>('assets/data/eneagrama.json')
    .subscribe({
      next: (arr) => {
        const data = arr?.find(x => x.tipo === tipoNum);

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
      }
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

