import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

type TipoReflexao = 'diaria' | 'semanal' | 'mensal' | 'anual';

@Component({
  selector: 'app-reflexao',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './reflexao.page.html',
  styleUrls: ['./reflexao.page.scss']
})
export class ReflexaoPage {
  tipo: TipoReflexao = 'diaria';

  private titulos: Record<TipoReflexao, string> = {
    diaria: 'Reflexão Diária',
    semanal: 'Reflexão Semanal',
    mensal: 'Reflexão Mensal',
    anual: 'Reflexão Anual'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.queryParamMap.subscribe(params => {
      const valor = params.get('tipo');

      if (
        valor === 'diaria' ||
        valor === 'semanal' ||
        valor === 'mensal' ||
        valor === 'anual'
      ) {
        this.tipo = valor;
      }
    });
  }

  get titulo(): string {
    return this.titulos[this.tipo];
  }

  voltar(): void {
    this.router.navigate(['/qualidade-vida']);
  }
}