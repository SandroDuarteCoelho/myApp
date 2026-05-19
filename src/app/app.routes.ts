import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'outros',
    loadComponent: () => import('./outros/outros.page').then((m) => m.OutrosPage),
  },
  {
    path: 'oracao-perdao',
    loadComponent: () => import('./oracao-perdao/oracao-perdao.page').then((m) => m.OracaoPerdaoPage),
  },
  {
    path: 'linguagem-corpo',
    loadComponent: () => import('./linguagem-corpo/linguagem-corpo.page').then((m) => m.LinguagemCorpoPage),
  },
  {
    path: 'perfil',
    loadComponent: () => import('./perfil/perfil.page').then((m) => m.PerfilPage),
  },
  {
    path: 'signos',
    loadComponent: () => import('./signos/signos.page').then((m) => m.SignosPage),
  },
  {
    path: 'eneagrama',
    loadComponent: () => import('./eneagrama/eneagrama.page').then((m) => m.EneagramaPage),
  },
  {
    path: 'animais',
    loadComponent: () => import('./animais/animais.page').then((m) => m.AnimaisPage),
  },
  {
    path: 'valores',
    loadComponent: () => import('./valores/valores.page').then((m) => m.ValoresPage),
  },
  {
    path: 'meditacoes',
    loadComponent: () => import('./meditacoes/meditacoes.page').then((m) => m.MeditacoesPage),
  },
  {
    path: 'animal/:id',
    loadComponent: () => import('./animal-detalhe/animal-detalhe.page').then((m) => m.AnimalDetalhePage),
  },
  {
    path: 'pessoa/:id',
    loadComponent: () => import('./pessoa-detalhe/pessoa-detalhe.page').then((m) => m.PessoaDetalhePage),
  },
  {
    path: '',
    redirectTo: 'oracao-perdao',
    pathMatch: 'full',
  },
];
