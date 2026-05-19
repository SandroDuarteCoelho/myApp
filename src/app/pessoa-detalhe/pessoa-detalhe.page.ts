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

  forcaVogais = '';
  atividadeConsoantes = '';

  setenioAtual: Setenio | null = null;
  descricaoDia = '';

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

    this.http.get<PessoaJson[]>('assets/data/pessoas.json').subscribe({
      next: (arr) => {

        const idx = id - 1;
        this.pessoa = arr[idx] ? ({ id, ...arr[idx] } as PessoaWithId) : null;

        if (!this.pessoa) return;

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
      }
    });
  }

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

      const map = this.letraValor[ch];

      return acc + (map ?? 0);

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

  async getForcaPorNumero(numero: number, tipo: 'força_espiritual' | 'atividade'): Promise<string> {

    const data = await this.http
      .get<Array<{ numero: number; força_espiritual: string; atividade: string }>>(
        'assets/data/nome.json'
      )
      .toPromise();

    const n = data?.find(x => x.numero === numero);

    return n ? n[tipo] : '';
  }

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

  carregarDescricaoDia(): void {

    if (!this.pessoa) return;

    const dia = new Date(this.pessoa.data).getDate();

    this.http.get<Record<string, string>>('assets/data/dia_nascimento.json')
      .subscribe(data => {
        this.descricaoDia = data[String(dia)] || '';
      });
  }

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