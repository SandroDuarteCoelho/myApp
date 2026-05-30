# TODO

## PESTAL - corrigir casas por perfil
- [ ] Ler/confirmar como `casa_pessoal.json` deve ser usada para calcular casa atual/seguinte com base na data de nascimento.
- [ ] Implementar função no `src/app/pessoa-detalhe/pessoa-detalhe.page.ts` que determine casa atual e casa seguinte a partir de `pessoa.data`.
- [ ] Atualizar `diasParaCasaSeguinte` coerentemente com a nova regra.

## Análise Pestal - previsões Ano Chinês
- [ ] Adicionar no `pessoa-detalhe.page.ts` campos/estado para `anoChinesAtual`, `anoChinesProximo` e respetiva `previsao` (texto `previsao_ano`).
- [ ] Implementar cálculo de ano chinês atual e seguinte com base no signo chinês do perfil (`signoChines.signo`).
- [ ] Buscar em `chineses.json` a previsão dentro de `interacao_com_outros_signos` para o ano atual e o ano seguinte.
- [ ] Atualizar `pessoa-detalhe.page.html` para mostrar as novas secções após “Ano pessoal atual/próximo”.

## Validação
- [ ] Rodar `npm run build` e confirmar que não existem erros/erros de template/compilação.

