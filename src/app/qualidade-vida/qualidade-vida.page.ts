
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertController,
  IonicModule
} from '@ionic/angular';
import { Directory, Filesystem } from '@capacitor/filesystem';

type TipoReflexao = 'diaria' | 'semanal' | 'mensal' | 'anual';

interface Animal {
  id: string;
  nome: string;
  foto?: string;
}

interface RegistoAvaliacao {
  animalId: string;
  [chave: string]: unknown;
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
export class QualidadeVidaPage {

  animais: Animal[] = [];

  private readonly CHAVE_ANIMAIS = 'qualidade_vida_animais_v1';
  private readonly CHAVE_HISTORICO = 'avaliacao_animal_historico_v1';

  constructor(
    private router: Router,
    private alertController: AlertController
  ) {
    this.carregarAnimais();
  }

  voltar(): void {
    this.router.navigate(['/oracao-perdao']);
  }

  abrirReflexao(tipo: TipoReflexao): void {
    this.router.navigate(['/reflexao'], {
      queryParams: { tipo }
    });
  }

  abrirAnimal(animal: Animal): void {
    this.router.navigate(['/ficha-animal', animal.id]);
  }

  async adicionarAnimal(): Promise<void> {
    const alert = await this.alertController.create({
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

    await alert.present();
  }

  async removerAnimal(index: number, event?: Event): Promise<void> {
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
    // Tenta apagar a fotografia guardada antes de eliminar o registo.
    await this.apagarFotoGuardada(animal.foto);

    // Remove todas as avaliações associadas ao animal.
    try {
      const dadosHistorico = localStorage.getItem(this.CHAVE_HISTORICO);

      if (dadosHistorico) {
        const historico: unknown = JSON.parse(dadosHistorico);

        if (Array.isArray(historico)) {
          const atualizado = historico.filter((registo) => {
            return !(
              registo &&
              typeof registo === 'object' &&
              'animalId' in registo &&
              (registo as RegistoAvaliacao).animalId === animal.id
            );
          });

          localStorage.setItem(
            this.CHAVE_HISTORICO,
            JSON.stringify(atualizado)
          );
        }
      }
    } catch (erro) {
      console.error('Não foi possível atualizar o histórico:', erro);

      await this.mostrarMensagem(
        'Não foi possível eliminar o histórico de avaliações. O animal não foi retirado da lista.'
      );

      return;
    }

    // Retira o animal da lista e guarda os restantes.
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
      // Fotografias antigas guardadas diretamente em Base64.
      if (referencia.startsWith('data:image/')) {
        return;
      }

      // Fotografias guardadas no sistema de ficheiros do dispositivo.
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

      // Fotografias guardadas na IndexedDB do navegador.
      if (referencia.startsWith('idb:')) {
        const chave = referencia
          .slice(4)
          .split('|')[0];

        if (chave) {
          await this.apagarFotoIndexedDB(chave);
        }
      }
    } catch (erro) {
      // A eliminação dos restantes dados deve continuar,
      // mesmo se o ficheiro já não existir ou não puder ser apagado.
      console.warn('Não foi possível apagar o ficheiro da fotografia:', erro);
    }
  }

  private apagarFotoIndexedDB(chave: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const pedido = indexedDB.open('fotos_animais_v1');

      pedido.onerror = () => reject(pedido.error);

      pedido.onsuccess = () => {
        const baseDados = pedido.result;

        if (!baseDados.objectStoreNames.contains('fotos')) {
          baseDados.close();
          resolve();
          return;
        }

        const transacao = baseDados.transaction('fotos', 'readwrite');
        const pedidoApagar = transacao.objectStore('fotos').delete(chave);

        pedidoApagar.onerror = () => {
          baseDados.close();
          reject(pedidoApagar.error);
        };

        transacao.oncomplete = () => {
          baseDados.close();
          resolve();
        };

        transacao.onerror = () => {
          baseDados.close();
          reject(transacao.error);
        };
      };
    });
  }

  private criarId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private carregarAnimais(): void {
    try {
      const dados = localStorage.getItem(this.CHAVE_ANIMAIS);

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
        .filter(item => typeof item === 'string' || (
          item !== null &&
          typeof item === 'object' &&
          'nome' in item
        ))
        .map((item, index): Animal => {
          // Compatibilidade com os nomes guardados pela versão anterior.
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
      console.error('Não foi possível carregar os animais:', erro);
      this.animais = [];
    }
  }

  private guardarAnimais(): void {
    localStorage.setItem(
      this.CHAVE_ANIMAIS,
      JSON.stringify(this.animais)
    );
  }

  private async mostrarMensagem(mensagem: string): Promise<void> {
    const alerta = await this.alertController.create({
      message: mensagem,
      buttons: ['OK']
    });

    await alerta.present();
  }
}
