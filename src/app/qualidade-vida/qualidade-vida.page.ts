import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AlertController,
  IonicModule
} from '@ionic/angular';

type TipoReflexao = 'diaria' | 'semanal' | 'mensal' | 'anual';

interface Animal {
  id: string;
  nome: string;
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
            nome: nome
          };

          this.animais.push(animal);
          this.guardarAnimais();

          // Não abrir a ficha neste momento.
          return true;
        }
      }
    ]
  });

  await alert.present();
}

  removerAnimal(index: number, event?: Event): void {
    event?.stopPropagation();

    this.animais.splice(index, 1);
    this.guardarAnimais();
  }

  private criarId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private carregarAnimais(): void {
    try {
      const dados = localStorage.getItem('qualidade_vida_animais_v1');

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
            nome: String(antigo.nome ?? '')
          };
        })
        .filter(animal => animal.nome.trim() !== '');

      this.guardarAnimais();
    } catch {
      this.animais = [];
    }
  }

  private guardarAnimais(): void {
    localStorage.setItem(
      'qualidade_vida_animais_v1',
      JSON.stringify(this.animais)
    );
  }
}