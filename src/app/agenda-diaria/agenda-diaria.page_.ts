
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonInput,
  IonTextarea
} from '@ionic/angular/standalone';

interface EventoAgenda {
  texto: string;
  horaFim: string;
  recorrenciaId?: string;
}

interface AgendaDia {
  almoco: string;
  jantar: string;
  atividades: { [chave: string]: string | EventoAgenda };
}

interface EventoVisivel {
  texto: string;
  inicio: string;
  horaFim: string;
  continuacao: boolean;
}

interface LinhaAgenda {
  hora: string;
}

type PessoaAgenda = 'sandro' | 'joana';

interface RegraRecorrencia {
  id: string;
  pessoa: PessoaAgenda;
  texto: string;
  inicio: string;
  horaFim: string;
  dataInicio: string;
  dataFim?: string;
  diaSemana: number;
}

interface ArmazenamentoAgenda {
  [chave: string]: any;
  __recorrenciasAgenda?: RegraRecorrencia[];
}

@Component({
  selector: 'app-agenda-diaria',
  templateUrl: './agenda-diaria.page.html',
  styleUrls: ['./agenda-diaria.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonInput,
    IonTextarea
  ]
})
export class AgendaDiariaPage implements OnInit, OnDestroy {
  dataSelecionada = '';
  dataSelecionadaTexto = '';

  agendaAtual: AgendaDia = this.novaAgenda();

  readonly horas: string[] = Array.from(
    { length: 29 },
    (_, indice) => {
      const minutos = 7 * 60 + indice * 30;
      const hora = Math.floor(minutos / 60);
      const minuto = minutos % 60;

      return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
    }
  );

  eventoModalAberto = false;
  eventoPessoa: PessoaAgenda = 'sandro';
  eventoHora = '07:00';
  eventoHoraFim = '07:30';
  eventoTexto = '';
  mensagemEvento = '';

  eventoOrigemTexto = '';

  private eventoOrigemChave = '';
  private eventoOrigemRecorrenciaId = '';

  private backButtonSubscription?: Subscription;
  private routeSubscription?: Subscription;

  private readonly chaveArmazenamento = 'calendario_agenda_v1';
  private readonly chaveRecorrencias = '__recorrenciasAgenda';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private platform: Platform
  ) {}

  ngOnInit(): void {
    this.routeSubscription = this.route.queryParamMap.subscribe(params => {
      const data = params.get('data');

      this.dataSelecionada =
        data && this.dataValida(data)
          ? data
          : this.chaveData(new Date());

      // Limpa os registos antigos antes de carregar a agenda.
      this.limparHistoricoAntigo();

      this.atualizarDataTexto();
      this.agendaAtual = this.lerAgenda(this.dataSelecionada);
      this.cancelarEdicaoEvento();
    });
  }

  ionViewDidEnter(): void {
    this.backButtonSubscription?.unsubscribe();

    this.backButtonSubscription =
      this.platform.backButton.subscribeWithPriority(10000, () => {
        if (this.eventoModalAberto) {
          this.cancelarEdicaoEvento();
        } else {
          this.voltarCalendario();
        }
      });
  }

  ionViewWillLeave(): void {
    this.backButtonSubscription?.unsubscribe();
    this.backButtonSubscription = undefined;
  }

  ngOnDestroy(): void {
    this.backButtonSubscription?.unsubscribe();
    this.routeSubscription?.unsubscribe();
  }

  get linhasAgenda(): LinhaAgenda[] {
    const horasComEventos = new Set<string>();

    for (const chave of Object.keys(this.agendaAtual.atividades)) {
      if (!this.pessoaDaChave(chave)) {
        continue;
      }

      const inicio = chave.substring(0, 5);
      const evento = this.obterEvento(chave);

      if (!evento || !this.horaValida(inicio)) {
        continue;
      }

      const inicioMinutos = this.minutos(inicio);
      const fimMinutos = this.minutos(evento.horaFim);

      for (
        let minutos = inicioMinutos;
        minutos <= fimMinutos;
        minutos += 30
      ) {
        const hora =
          `${String(Math.floor(minutos / 60)).padStart(2, '0')}:` +
          `${String(minutos % 60).padStart(2, '0')}`;

        horasComEventos.add(hora);
      }
    }

    return Array.from(horasComEventos)
      .sort((a, b) => this.minutos(a) - this.minutos(b))
      .map(hora => ({ hora }));
  }

  // =====================================================
  // LIMPEZA AUTOMÁTICA DO HISTÓRICO COM MAIS DE 6 MESES
  // =====================================================

  /**
   * Calcula a data correspondente a seis meses antes de hoje.
   * Se o mês de destino tiver menos dias, utiliza o último
   * dia desse mês.
   */
  private dataLimiteHistorico(): string {
    const hoje = new Date();

    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();
    const diaAtual = hoje.getDate();

    const primeiroDiaMesDestino = new Date(
      anoAtual,
      mesAtual - 6,
      1,
      12
    );

    const anoDestino = primeiroDiaMesDestino.getFullYear();
    const mesDestino = primeiroDiaMesDestino.getMonth();

    const ultimoDiaMesDestino = new Date(
      anoDestino,
      mesDestino + 1,
      0,
      12
    ).getDate();

    const diaDestino = Math.min(diaAtual, ultimoDiaMesDestino);

    const dataLimite = new Date(
      anoDestino,
      mesDestino,
      diaDestino,
      12
    );

    return this.chaveData(dataLimite);
  }

  /**
   * Remove definitivamente os registos diários anteriores
   * à data-limite.
   *
   * Mantém:
   * - os registos dos últimos seis meses;
   * - as regras de recorrência ainda ativas;
   * - as regras terminadas cujo fim ainda está dentro
   *   do período de histórico conservado;
   * - outras propriedades que não sejam datas de agenda.
   *
   * As regras com datas inválidas são conservadas por
   * precaução, para evitar eliminar informação desconhecida.
   */
  private limparHistoricoAntigo(
    todas?: ArmazenamentoAgenda
  ): ArmazenamentoAgenda {
    const armazenamento = todas ?? this.lerTodasAgendas();
    const limite = this.dataLimiteHistorico();

    let alterado = false;

    // Apagar agendas diárias anteriores ao limite.
    for (const chave of Object.keys(armazenamento)) {
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(chave) &&
        this.dataValida(chave) &&
        chave < limite
      ) {
        delete armazenamento[chave];
        alterado = true;
      }
    }

    // Limpar regras de recorrência que já não são necessárias.
    const regras = armazenamento[this.chaveRecorrencias];

    if (Array.isArray(regras)) {
      const regrasConservadas = regras.filter(
        (regra: RegraRecorrencia) => {
          // Regras sem data de fim continuam ativas.
          if (!regra || !regra.dataFim) {
            return true;
          }

          // Não eliminar regras com datas desconhecidas ou inválidas.
          if (
            typeof regra.dataFim !== 'string' ||
            !this.dataValida(regra.dataFim)
          ) {
            return true;
          }

          // Manter regras que ainda são necessárias para
          // mostrar o histórico dos últimos seis meses.
          return regra.dataFim >= limite;
        }
      );

      if (regrasConservadas.length !== regras.length) {
        armazenamento[this.chaveRecorrencias] =
          regrasConservadas;

        alterado = true;
      }
    }

    // Se a limpeza foi chamada sem um armazenamento fornecido,
    // guardar imediatamente as alterações.
    if (!todas && alterado) {
      try {
        localStorage.setItem(
          this.chaveArmazenamento,
          JSON.stringify(armazenamento)
        );
      } catch (erro) {
        console.error(
          'Não foi possível limpar o histórico antigo da agenda.',
          erro
        );
      }
    }

    return armazenamento;
  }

  // =====================================================
  // DATAS
  // =====================================================

  private dataValida(data: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return false;
    }

    const partes = data.split('-').map(Number);
    const convertida = new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );

    return convertida.getFullYear() === partes[0] &&
      convertida.getMonth() === partes[1] - 1 &&
      convertida.getDate() === partes[2];
  }

  private atualizarDataTexto(): void {
    const [ano, mes, dia] = this.dataSelecionada.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);

    const texto = new Intl.DateTimeFormat('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(data);

    this.dataSelecionadaTexto =
      texto.charAt(0).toLocaleUpperCase('pt-PT') + texto.slice(1);
  }

  private chaveData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private diaSemana(data: string): number {
    const [ano, mes, dia] = data.split('-').map(Number);
    return new Date(ano, mes - 1, dia, 12).getDay();
  }

  private diaAnterior(data: string): string {
    const [ano, mes, dia] = data.split('-').map(Number);
    const anterior = new Date(ano, mes - 1, dia, 12);

    anterior.setDate(anterior.getDate() - 1);

    return this.chaveData(anterior);
  }

  voltarCalendario(): void {
    this.router.navigate(['/calendario']);
  }

  // =====================================================
  // GUARDAR A AGENDA DIÁRIA
  // =====================================================

  guardarAgenda(): void {
    if (!this.dataSelecionada) {
      return;
    }

    try {
      const todas = this.lerTodasAgendas();
      const atividadesGuardadas: AgendaDia['atividades'] = {};

      for (
        const [chave, valor] of Object.entries(
          this.agendaAtual.atividades
        )
      ) {
        if (this.eEventoRecorrente(valor)) {
          continue;
        }

        atividadesGuardadas[chave] = valor;
      }

      todas[this.dataSelecionada] = {
        almoco: this.agendaAtual.almoco,
        jantar: this.agendaAtual.jantar,
        atividades: atividadesGuardadas
      };

      // Impede que um registo antigo volte a ser guardado.
      this.limparHistoricoAntigo(todas);

      localStorage.setItem(
        this.chaveArmazenamento,
        JSON.stringify(todas)
      );
    } catch (erro) {
      console.error('Não foi possível guardar a agenda.', erro);
    }
  }

  // =====================================================
  // EVENTOS VISÍVEIS
  // =====================================================

  obterEventoVisivel(
    hora: string,
    pessoa: PessoaAgenda
  ): EventoVisivel | null {
    for (const chave of Object.keys(this.agendaAtual.atividades)) {
      if (this.pessoaDaChave(chave) !== pessoa) {
        continue;
      }

      const inicio = chave.substring(0, 5);
      const evento = this.obterEvento(chave);

      if (!evento) {
        continue;
      }

      if (
        this.minutos(hora) >= this.minutos(inicio) &&
        this.minutos(hora) < this.minutos(evento.horaFim)
      ) {
        return {
          texto: evento.texto,
          inicio,
          horaFim: evento.horaFim,
          continuacao: inicio !== hora
        };
      }
    }

    return null;
  }

  rowspanEvento(hora: string, pessoa: PessoaAgenda): number {
    const evento = this.obterEventoVisivel(hora, pessoa);

    if (!evento || evento.continuacao) {
      return 1;
    }

    const inicio = this.minutos(evento.inicio);
    const fim = this.minutos(evento.horaFim);

    return Math.max(1, Math.ceil((fim - inicio) / 30));
  }

  // =====================================================
  // CRIAR E EDITAR EVENTOS
  // =====================================================

  abrirNovoEvento(pessoa: PessoaAgenda): void {
    this.eventoPessoa = pessoa;
    this.eventoOrigemChave = '';
    this.eventoOrigemRecorrenciaId = '';
    this.eventoOrigemTexto = '';
    this.eventoTexto = '';
    this.mensagemEvento = '';

    const horaLivre = this.procurarHoraLivre(pessoa);

    this.eventoHora = horaLivre;
    this.eventoHoraFim = this.proximaHora(horaLivre);
    this.eventoModalAberto = true;
  }

  abrirEvento(hora: string, pessoa: PessoaAgenda): void {
    this.eventoPessoa = pessoa;

    const encontrado = this.encontrarEventoAtivo(hora, pessoa);

    if (!encontrado) {
      this.abrirNovoEvento(pessoa);
      return;
    }

    this.eventoOrigemChave = encontrado.chave;
    this.eventoOrigemRecorrenciaId =
      encontrado.evento.recorrenciaId || '';
    this.eventoOrigemTexto = encontrado.evento.texto;
    this.eventoHora = encontrado.inicio;
    this.eventoHoraFim = encontrado.evento.horaFim;
    this.eventoTexto = encontrado.evento.texto;
    this.mensagemEvento = '';
    this.eventoModalAberto = true;
  }

  selecionarHoraInicio(hora: string): void {
    this.eventoHora = hora;
    this.mensagemEvento = '';

    if (this.minutos(this.eventoHoraFim) <= this.minutos(hora)) {
      this.eventoHoraFim = this.proximaHora(hora);
    }
  }

  selecionarHoraFim(hora: string): void {
    this.eventoHoraFim = hora;
    this.mensagemEvento = '';
  }

  guardarEvento(): void {
    const texto = this.eventoTexto.trim();

    if (!texto) {
      this.mensagemEvento =
        'Escreve uma descrição para o evento.';
      return;
    }

    if (
      !this.horas.includes(this.eventoHora) ||
      !this.horas.includes(this.eventoHoraFim)
    ) {
      this.mensagemEvento = 'Seleciona horas válidas.';
      return;
    }

    if (
      this.minutos(this.eventoHoraFim) <=
      this.minutos(this.eventoHora)
    ) {
      this.mensagemEvento =
        'A hora de fim tem de ser posterior à hora de início.';
      return;
    }

    const novaChave = `${this.eventoHora}_${this.eventoPessoa}`;
    const inicioNovo = this.minutos(this.eventoHora);
    const fimNovo = this.minutos(this.eventoHoraFim);

    for (const chave of Object.keys(this.agendaAtual.atividades)) {
      if (
        chave === this.eventoOrigemChave ||
        this.pessoaDaChave(chave) !== this.eventoPessoa
      ) {
        continue;
      }

      const eventoExistente = this.obterEvento(chave);

      if (!eventoExistente) {
        continue;
      }

      const inicioExistente = this.minutos(chave.substring(0, 5));
      const fimExistente = this.minutos(eventoExistente.horaFim);

      if (
        inicioNovo < fimExistente &&
        fimNovo > inicioExistente
      ) {
        this.mensagemEvento =
          `Este horário sobrepõe-se a "${eventoExistente.texto}" ` +
          `(${chave.substring(0, 5)}–${eventoExistente.horaFim}). ` +
          'Escolhe outro horário.';

        return;
      }
    }

    const todas = this.lerTodasAgendas();
    const regras = this.lerRegras(todas);

    // Se o evento editado já era recorrente, terminar a regra
    // anterior no dia anterior à data selecionada.
    if (this.eventoOrigemRecorrenciaId) {
      const regraAnterior = regras.find(
        regra =>
          regra.id === this.eventoOrigemRecorrenciaId &&
          this.regraAtivaNaData(regra, this.dataSelecionada)
      );

      if (regraAnterior) {
        regraAnterior.dataFim =
          this.diaAnterior(this.dataSelecionada);
      }
    }

    if (this.eventoOrigemChave) {
      delete this.agendaAtual.atividades[
        this.eventoOrigemChave
      ];
    }

    // Os novos eventos continuam a repetir-se semanalmente.
    const novaRegra: RegraRecorrencia = {
      id: this.novoIdRecorrencia(),
      pessoa: this.eventoPessoa,
      texto,
      inicio: this.eventoHora,
      horaFim: this.eventoHoraFim,
      dataInicio: this.dataSelecionada,
      diaSemana: this.diaSemana(this.dataSelecionada)
    };

    regras.push(novaRegra);
    todas[this.chaveRecorrencias] = regras;

    this.agendaAtual.atividades[novaChave] = {
      texto,
      horaFim: this.eventoHoraFim,
      recorrenciaId: novaRegra.id
    };

    try {
      todas[this.dataSelecionada] = {
        almoco: this.agendaAtual.almoco,
        jantar: this.agendaAtual.jantar,
        atividades: this.atividadesSemRecorrencias(
          this.agendaAtual.atividades
        )
      };

      // Preserva as recorrências ativas e elimina o histórico antigo.
      this.limparHistoricoAntigo(todas);

      localStorage.setItem(
        this.chaveArmazenamento,
        JSON.stringify(todas)
      );
    } catch (erro) {
      console.error('Não foi possível guardar o evento.', erro);
      this.mensagemEvento =
        'Não foi possível guardar. Tenta novamente.';
      return;
    }

    this.cancelarEdicaoEvento();
  }

  // =====================================================
  // APAGAR EVENTOS
  // =====================================================

  apagarEvento(): void {
    if (!this.eventoOrigemChave) {
      this.cancelarEdicaoEvento();
      return;
    }

    const todas = this.lerTodasAgendas();

    if (this.eventoOrigemRecorrenciaId) {
      const regras = this.lerRegras(todas);

      const regra = regras.find(
        item =>
          item.id === this.eventoOrigemRecorrenciaId &&
          this.regraAtivaNaData(item, this.dataSelecionada)
      );

      if (regra) {
        regra.dataFim = this.diaAnterior(this.dataSelecionada);
      }

      todas[this.chaveRecorrencias] = regras;
    }

    delete this.agendaAtual.atividades[
      this.eventoOrigemChave
    ];

    try {
      todas[this.dataSelecionada] = {
        almoco: this.agendaAtual.almoco,
        jantar: this.agendaAtual.jantar,
        atividades: this.atividadesSemRecorrencias(
          this.agendaAtual.atividades
        )
      };

      this.limparHistoricoAntigo(todas);

      localStorage.setItem(
        this.chaveArmazenamento,
        JSON.stringify(todas)
      );
    } catch (erro) {
      console.error('Não foi possível apagar o evento.', erro);
    }

    this.cancelarEdicaoEvento();
  }

  cancelarEdicaoEvento(): void {
    this.eventoModalAberto = false;
    this.eventoTexto = '';
    this.mensagemEvento = '';
    this.eventoOrigemChave = '';
    this.eventoOrigemRecorrenciaId = '';
    this.eventoOrigemTexto = '';
    this.eventoHora = '07:00';
    this.eventoHoraFim = '07:30';
  }

  // =====================================================
  // FUNÇÕES AUXILIARES DOS EVENTOS
  // =====================================================

  private encontrarEventoAtivo(
    hora: string,
    pessoa: PessoaAgenda
  ): {
    chave: string;
    inicio: string;
    evento: EventoAgenda;
  } | null {
    const minuto = this.minutos(hora);

    for (const chave of Object.keys(this.agendaAtual.atividades)) {
      if (this.pessoaDaChave(chave) !== pessoa) {
        continue;
      }

      const inicio = chave.substring(0, 5);
      const evento = this.obterEvento(chave);

      if (
        evento &&
        minuto >= this.minutos(inicio) &&
        minuto < this.minutos(evento.horaFim)
      ) {
        return { chave, inicio, evento };
      }
    }

    return null;
  }

  private procurarHoraLivre(pessoa: PessoaAgenda): string {
    for (let i = 0; i < this.horas.length - 1; i++) {
      const inicio = this.horas[i];
      const fim = this.horas[i + 1];

      const sobreposto = Object.keys(
        this.agendaAtual.atividades
      ).some(chave => {
        if (this.pessoaDaChave(chave) !== pessoa) {
          return false;
        }

        const evento = this.obterEvento(chave);

        if (!evento) {
          return false;
        }

        const inicioExistente =
          this.minutos(chave.substring(0, 5));
        const fimExistente =
          this.minutos(evento.horaFim);

        return this.minutos(inicio) < fimExistente &&
          this.minutos(fim) > inicioExistente;
      });

      if (!sobreposto) {
        return inicio;
      }
    }

    return this.horas[0];
  }

  private proximaHora(hora: string): string {
    const indice = this.horas.indexOf(hora);

    if (indice >= 0 && indice < this.horas.length - 1) {
      return this.horas[indice + 1];
    }

    return hora;
  }

  private pessoaDaChave(chave: string): PessoaAgenda | null {
    if (chave.endsWith('_sandro')) {
      return 'sandro';
    }

    if (chave.endsWith('_joana')) {
      return 'joana';
    }

    return null;
  }

  private horaValida(hora: string): boolean {
    return /^\d{2}:\d{2}$/.test(hora) &&
      this.minutos(hora) >= 7 * 60 &&
      this.minutos(hora) <= 21 * 60;
  }

  private obterEvento(chave: string): EventoAgenda | null {
    const valor = this.agendaAtual.atividades[chave];

    if (!valor) {
      return null;
    }

    if (typeof valor === 'string') {
      return {
        texto: valor,
        horaFim: this.somarMeiaHora(chave.substring(0, 5))
      };
    }

    return valor;
  }

  private eEventoRecorrente(
    valor: string | EventoAgenda
  ): boolean {
    return typeof valor !== 'string' &&
      !!valor.recorrenciaId;
  }

  private atividadesSemRecorrencias(
    atividades: AgendaDia['atividades']
  ): AgendaDia['atividades'] {
    const resultado: AgendaDia['atividades'] = {};

    for (const [chave, valor] of Object.entries(atividades)) {
      if (!this.eEventoRecorrente(valor)) {
        resultado[chave] = valor;
      }
    }

    return resultado;
  }

  // =====================================================
  // CARREGAR A AGENDA E APLICAR RECORRÊNCIAS
  // =====================================================

  private lerAgenda(data: string): AgendaDia {
    const todas = this.lerTodasAgendas();
    const guardada = todas[data];

    const agenda: AgendaDia = guardada
      ? {
          almoco: guardada.almoco || '',
          jantar: guardada.jantar || '',
          atividades: { ...(guardada.atividades || {}) }
        }
      : this.novaAgenda();

    const diaSemana = this.diaSemana(data);

    for (const regra of this.lerRegras(todas)) {
      if (
        regra.diaSemana !== diaSemana ||
        !this.regraAtivaNaData(regra, data)
      ) {
        continue;
      }

      const chave = `${regra.inicio}_${regra.pessoa}`;

      if (!agenda.atividades[chave]) {
        agenda.atividades[chave] = {
          texto: regra.texto,
          horaFim: regra.horaFim,
          recorrenciaId: regra.id
        };
      }
    }

    return agenda;
  }

  private lerRegras(
    todas: ArmazenamentoAgenda
  ): RegraRecorrencia[] {
    const regras = todas[this.chaveRecorrencias];

    return Array.isArray(regras) ? regras : [];
  }

  private regraAtivaNaData(
    regra: RegraRecorrencia,
    data: string
  ): boolean {
    return data >= regra.dataInicio &&
      (!regra.dataFim || data <= regra.dataFim);
  }

  private novoIdRecorrencia(): string {
    return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  // =====================================================
  // HORAS E ARMAZENAMENTO
  // =====================================================

  private somarMeiaHora(hora: string): string {
    const [h, m] = hora.split(':').map(Number);
    const total = h * 60 + m + 30;

    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  private minutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  private novaAgenda(): AgendaDia {
    return {
      almoco: '',
      jantar: '',
      atividades: {}
    };
  }

  private lerTodasAgendas(): ArmazenamentoAgenda {
    try {
      const dados = localStorage.getItem(
        this.chaveArmazenamento
      );

      return dados ? JSON.parse(dados) : {};
    } catch (erro) {
      console.error('Não foi possível ler a agenda guardada.', erro);
      return {};
    }
  }
}
