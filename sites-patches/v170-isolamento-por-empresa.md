# Correção de isolamento por empresa — Site v170

Aplicada sobre o artefato publicado da versão 169.

## Regra corrigida

O e-mail do proprietário do Site só concede privilégios administrativos quando a identidade vem do cabeçalho autenticado do próprio Sites (`trustedSiteUser`).

Uma conta normal do Supabase com o mesmo e-mail não é mais promovida automaticamente a administradora. Ela passa a obedecer exclusivamente aos vínculos ativos em `company_members`.

## Alterações no servidor

Em `isPlatformAdmin`, `ensureUserAccess` e `canAccessCompany`:

```diff
- SITE_OWNER_EMAILS.has(email)
+ user.trustedSiteUser && SITE_OWNER_EMAILS.has(email)
```

## Resultado esperado

- administrador geral: continua vendo todas as empresas e a área de usuários;
- usuário de cliente com uma empresa: entra diretamente na empresa autorizada;
- usuário de cliente com várias empresas: visualiza somente as empresas vinculadas;
- usuário não vinculado: acesso recusado.
