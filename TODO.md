# TODO - Corrigir página Chacra Raiz (linguagem-corpo-detalhe/raiz)

- [x] Analisar o problema (cache[item.id] indefinido no carregamento)
- [x] Reestruturar `raiz.page.html`: mover o botão do vídeo e o significado para dentro do `<ng-container *ngIf="cache[item.id]">`
- [x] Verificar que a página carrega sem erros e que o botão de vídeo aparece apenas quando existe `link`

