import { Routes } from '@angular/router';

export const routes: Routes = [
  {
  path: 'linguagem-corpo-detalhe/lateralidade',
  loadComponent: () =>
    import('./linguagem-corpo-detalhe/chakras/lateralidade.page')
      .then(m => m.LateralidadePage)
},
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
    path: 'metade-sombra',
    loadComponent: () => import('./metade-sombra/metade-sombra.page').then((m) => m.MetadeSombraPage),
  },

  {
    path: 'linguagem-corpo-detalhe',
    loadComponent: () => import('./linguagem-corpo-detalhe/linguagem-corpo-detalhe.page').then((m) => m.LinguagemCorpoDetalhePage),
  },
  {
    path: 'linguagem-corpo-detalhe/coronario',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/coronario.page').then((m) => m.CoronarioPage),
  },
  {
    path: 'linguagem-corpo-detalhe/segundo-olho',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/segundo-olho.page').then((m) => m.SegundoOlhoPage),
  },
  {
    path: 'linguagem-corpo-detalhe/terceiro-olho',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/terceiro-olho.page').then((m) => m.TerceiroOlhoPage),
  },
  {
    path: 'linguagem-corpo-detalhe/garganta',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/garganta.page').then((m) => m.GargantaPage),
  },
  {
    path: 'linguagem-corpo-detalhe/cardiaco',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/cardiaco.page').then((m) => m.CardiacoPage),
  },
  {
    path: 'linguagem-corpo-detalhe/plexo-solar',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/plexo-solar.page').then((m) => m.PlexoSolarPage),
  },
  {
    path: 'linguagem-corpo-detalhe/sacral',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/sacral.page').then((m) => m.SacralPage),
  },
  {
    path: 'linguagem-corpo-detalhe/raiz',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/raiz.page').then((m) => m.RaizPage),
  },
  {
    path: 'linguagem-corpo-detalhe/outros',
    loadComponent: () => import('./linguagem-corpo-detalhe/chakras/outros.page').then((m) => m.OutrosPage),
  },
  {
    path: 'a-tua-casa',
    loadComponent: () => import('./a-tua-casa/a-tua-casa.page').then((m) => m.ATuaCasaPage),
  },

  {
    path: 'o-que-comes',
    loadComponent: () => import('./o-que-comes/o-que-comes.page').then((m) => m.OQueComesPage),
  },
  {
    path: 'o-que-ves',
    loadComponent: () => import('./o-que-ves/o-que-ves.page').then((m) => m.OQueVesPage),
  },
  {
    path: 'o-que-usas',
    loadComponent: () => import('./o-que-usas/o-que-usas.page').then((m) => m.OQueUsasPage),
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
    path: 'valor/:id',
    loadComponent: () => import('./valor-detalhe/valor-detalhe.page').then((m) => m.ValorDetalhePage),
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
    path: 'setenios',
    loadComponent: () => import('./setenios/setenios.page').then((m) => m.SeteniosPage),
  },

  {
    path: '',
    redirectTo: 'oracao-perdao',
    pathMatch: 'full',
  },
];
