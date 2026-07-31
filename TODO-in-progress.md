# TODO - Corrigir interpretação de resultados na autoavaliacao-raiz

- [x] 1. Editar `autoavaliacao-raiz.page.ts`:
  - Adicionar mapa `totais` à componente
  - Popular `totais` em `calcularResultado()`
  - Tornar `gerarInterpretacoes()` defensivo (verificar se `resultados` carregou)
- [x] 2. Editar `autoavaliacao-raiz.page.html`:
  - Substituir `{{ resultados.totais[item] }}` por `{{ totais[item] }}`
- [x] 3. Verificar build/compilação

