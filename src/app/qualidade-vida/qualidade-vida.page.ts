import {
  Component,
  OnDestroy
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  AlertController,
  IonicModule
} from '@ionic/angular';

import {
  Directory,
  Filesystem
} from '@capacitor/filesystem';

type TipoReflexao =
  | 'diaria'
  | 'semanal'
  | 'mensal'
  | 'anual';

interface Animal {
  id: string;
  nome: string;
  foto?: string;
}

interface RegistoAvaliacao {
  animalId: string;
  [chave: string]: unknown;
}

interface ContadorReflexao {
  dias: number;
  horas: string;
  minutos: string;
  segundos: string;
  terminado: boolean;
  descricaoPrazo: string;
}

@Component({
  selector: 'app-qualidade-vida',
  standalone: true,
  templateUrl: './qualidade-vida.page.html',
  styleUrls: ['./qualidade-vida.page.scss'],
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class QualidadeVidaPage implements OnDestroy {

  animais: Animal[] = [];

  contadores: Record<TipoReflexao, ContadorReflexao> = {
    diaria: this.contadorInicial(),
    semanal: this.contadorInicial(),
    mensal: this.contadorInicial(),
    anual: this.contadorInicial()
  };

  private intervalo?: ReturnType<typeof setInterval>;

  private readonly CHAVE_ANIMAIS =
    'qualidade_vida_animais_v1';

  private readonly CHAVE_HISTORICO =
    'avaliacao_animal_historico_v1';

  constructor(
    private router: Router,
    private alertController: AlertController
  ) {
    this.carregarAnimais();
    this.atualizarContadores();

    this.intervalo = setInterval(() => {
      this.atualizarContadores();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  // --------------------------------------------------
  // CONTADORES DOS PRAZOS
  // --------------------------------------------------

  private contadorInicial(): ContadorReflexao {
    return {
      dias: 0,
      horas: '00',
      minutos: '00',
      segundos: '00',
      terminado: false,
      descricaoPrazo: ''
    };
  }

  private atualizarContadores(): void {
    const agora = new Date();

    this.contadores = {
      diaria: this.calcularContador('diaria', agora),
      semanal: this.calcularContador('semanal', agora),
      mensal: this.calcularContador('mensal', agora),
      anual: this.calcularContador('anual', agora)
    };
  }

  private calcularContador(
    tipo: TipoReflexao,
    agora: Date
  ): ContadorReflexao {

    const prazo = this.obterPrazo(tipo, agora);
    const diferenca = prazo.getTime() - agora.getTime();

    const terminado = diferenca <= 0;

    if (terminado) {
      return {
        dias: 0,
        horas: '00',
        minutos: '00',
        segundos: '00',
        terminado: true,
        descricaoPrazo: `Limite: ${this.formatarDataHora(prazo)}`
      };
    }

    const totalSegundos = Math.floor(
      diferenca / 1000
    );

    const dias = Math.floor(
      totalSegundos / 86400
    );

    const horas = Math.floor(
      (totalSegundos % 86400) / 3600
    );

    const minutos = Math.floor(
      (totalSegundos % 3600) / 60
    );

    const segundos = totalSegundos % 60;

    return {
      dias,
      horas: this.doisDigitos(horas),
      minutos: this.doisDigitos(minutos),
      segundos: this.doisDigitos(segundos),
      terminado: false,
      descricaoPrazo: `Limite: ${this.formatarDataHora(prazo)}`
    };
  }

  private obterPrazo(
    tipo: TipoReflexao,
    agora: Date
  ): Date {

    const ano = agora.getFullYear();
    const mes = agora.getMonth();
    const dia = agora.getDate();

    if (tipo === 'diaria') {
      const prazo = new Date(
        ano, mes, dia, 21, 0, 0, 0
      );

      return prazo;
    }

    if (tipo === 'semanal') {
      const diasAteDomingo =
        (7 - agora.getDay()) % 7;

      return new Date(
        ano,
        mes,
        dia + diasAteDomingo,
        20, 0, 0, 0
      );
    }

    if (tipo === 'mensal') {
      const ultimoDia = new Date(
        ano,
        mes + 1,
        0
      ).getDate();

      return new Date(
        ano,
        mes,
        ultimoDia,
        20, 0, 0, 0
      );
    }

    return new Date(
      ano,
      11,
      31,
      18, 0, 0, 0
    );
  }

  private doisDigitos(valor: number): string {
    return String(valor).padStart(2, '0');
  }

  private formatarDataHora(data: Date): string {
    return new Intl.DateTimeFormat('pt-PT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(data);
  }

  // --------------------------------------------------
  // NAVEGAÇÃO
  // --------------------------------------------------

  voltar(): void {
    void this.router.navigate(['/oracao-perdao']);
  }

  abrirReflexao(tipo: TipoReflexao): void {
    void this.router.navigate(['/reflexao'], {
      queryParams: { tipo }
    });
  }

  abrirAnimal(animal: Animal): void {
    void this.router.navigate([
      '/ficha-animal',
      animal.id
    ]);
  }

  // --------------------------------------------------
  // ADICIONAR ANIMAL
  // --------------------------------------------------

  async adicionarAnimal(): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Animal de estimação',
      message: 'Qual é o nome do animal?',
      inputs: [
        {
          name: 'nome',
          type: 'text',
          placeholder: 'Nome do animal'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Adicionar',
          handler: (dados) => {
            const nome = dados.nome?.trim();

            if (!nome) {
              return false;
            }

            const animal: Animal = {
              id: this.criarId(),
              nome
            };

            this.animais.push(animal);
            this.guardarAnimais();

            return true;
          }
        }
      ]
    });

    await alerta.present();
  }

  // --------------------------------------------------
  // REMOVER ANIMAL E OS DADOS ASSOCIADOS
  // --------------------------------------------------

  async removerAnimal(
    index: number,
    event?: Event
  ): Promise<void> {

    event?.stopPropagation();

    const animal = this.animais[index];

    if (!animal) {
      return;
    }

    const alerta = await this.alertController.create({
      header: 'Eliminar definitivamente?',
      message:
        `Vais eliminar "${animal.nome}", a sua fotografia e todas as avaliações associadas. ` +
        'Esta ação não pode ser anulada.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar definitivamente',
          role: 'destructive',
          handler: () => {
            void this.eliminarAnimalDefinitivamente(animal);
          }
        }
      ]
    });

    await alerta.present();
  }

  private async eliminarAnimalDefinitivamente(
    animal: Animal
  ): Promise<void> {

    await this.apagarFotoGuardada(animal.foto);

    try {
      const dadosHistorico = localStorage.getItem(
        this.CHAVE_HISTORICO
      );

      if (dadosHistorico) {
        const historico: unknown = JSON.parse(
          dadosHistorico
        );

        if (Array.isArray(historico)) {
          const atualizado = historico.filter(
            (registo: unknown) => {
              if (
                !registo ||
                typeof registo !== 'object' ||
                !('animalId' in registo)
              ) {
                return true;
              }

              return (
                (registo as RegistoAvaliacao).animalId
                !== animal.id
              );
            }
          );

          localStorage.setItem(
            this.CHAVE_HISTORICO,
            JSON.stringify(atualizado)
          );
        }
      }
    } catch (erro) {
      console.error(
        'Não foi possível atualizar o histórico:',
        erro
      );

      await this.mostrarMensagem(
        'Não foi possível eliminar o histórico de avaliações. O animal não foi retirado da lista.'
      );

      return;
    }

    this.animais = this.animais.filter(
      item => item.id !== animal.id
    );

    this.guardarAnimais();

    await this.mostrarMensagem(
      `Os dados de "${animal.nome}" foram eliminados.`
    );
  }

  private async apagarFotoGuardada(
    referencia?: string
  ): Promise<void> {

    if (!referencia) {
      return;
    }

    try {
      if (referencia.startsWith('data:image/')) {
        return;
      }

      if (referencia.startsWith('fs:')) {
        const caminho = referencia
          .slice(3)
          .split('|')[0];

        if (caminho) {
          await Filesystem.deleteFile({
            path: caminho,
            directory: Directory.Data
          });
        }

        return;
      }

      if (referencia.startsWith('idb:')) {
        const chave = referencia
          .slice(4)
          .split('|')[0];

        if (chave) {
          await this.apagarFotoIndexedDB(chave);
        }
      }
    } catch (erro) {
      console.warn(
        'Não foi possível apagar a fotografia:',
        erro
      );
    }
  }

  private apagarFotoIndexedDB(
    chave: string
  ): Promise<void> {

    return new Promise((resolve, reject) => {
      const pedido = indexedDB.open(
        'fotos_animais_v1'
      );

      pedido.onerror = () => {
        reject(pedido.error);
      };

      pedido.onsuccess = () => {
        const baseDados = pedido.result;

        if (
          !baseDados.objectStoreNames.contains('fotos')
        ) {
          baseDados.close();
          resolve();
          return;
        }

        const transacao = baseDados.transaction(
          'fotos',
          'readwrite'
        );

        transacao.objectStore('fotos').delete(chave);

        transacao.oncomplete = () => {
          baseDados.close();
          resolve();
        };

        transacao.onerror = () => {
          baseDados.close();
          reject(transacao.error);
        };

        transacao.onabort = () => {
          baseDados.close();
          reject(transacao.error);
        };
      };
    });
  }

  // --------------------------------------------------
  // ARMAZENAMENTO DOS ANIMAIS
  // --------------------------------------------------

  private criarId(): string {
    return `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
  }

  private carregarAnimais(): void {
    try {
      const dados = localStorage.getItem(
        this.CHAVE_ANIMAIS
      );

      if (!dados) {
        this.animais = [];
        return;
      }

      const guardados: unknown = JSON.parse(dados);

      if (!Array.isArray(guardados)) {
        this.animais = [];
        return;
      }

      this.animais = guardados
        .filter(item =>
          typeof item === 'string' ||
          (
            item !== null &&
            typeof item === 'object' &&
            'nome' in item
          )
        )
        .map((item, index): Animal => {
          if (typeof item === 'string') {
            return {
              id: `animal-antigo-${index}`,
              nome: item
            };
          }

          const antigo = item as Partial<Animal>;

          return {
            id: antigo.id || `animal-antigo-${index}`,
            nome: String(antigo.nome ?? ''),
            foto: antigo.foto
          };
        })
        .filter(animal => animal.nome.trim() !== '');

      this.guardarAnimais();
    } catch (erro) {
      console.error(
        'Não foi possível carregar os animais:',
        erro
      );

      this.animais = [];
    }
  }

  private guardarAnimais(): void {
    localStorage.setItem(
      this.CHAVE_ANIMAIS,
      JSON.stringify(this.animais)
    );
  }

  private async mostrarMensagem(
    mensagem: string
  ): Promise<void> {

    const alerta = await this.alertController.create({
      message: mensagem,
      buttons: ['OK']
    });

    await alerta.present();
  }
}