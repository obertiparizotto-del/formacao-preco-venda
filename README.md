# Formação do Preço de Venda – Parsecon

Cópia editável reconstruída a partir do painel publicado e da planilha original da Santo Brilho.

## Recursos

- Painel executivo de precificação
- Cadastro e pesquisa única de produtos
- Fichas técnicas, matérias-primas e embalagens
- Formação de preço por markup
- Simulações, tributos, GGF, tabelas e relatórios
- Layout responsivo

## Desenvolvimento

```bash
npm install
npm run dev
```

Os 373 registros recuperados estão divididos em `app/data/products-*.json`. As regras interativas e a navegação ficam em `app/page.tsx`.

## Persistência

- Supabase `Consultoria-Preço-Venga`: dados operacionais e arquivos privados.
- `app_states`: estados funcionais separados por empresa.
- `company-files`: planilhas e documentos importados em bucket privado.
- A base anterior da versão 121 é migrada gradualmente: o primeiro acesso copia o registro para o Supabase e mantém a origem anterior como contingência.

Variáveis de produção: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_APP_SECRET`. O segredo não deve ser commitado.
