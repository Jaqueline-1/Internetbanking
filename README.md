# TrustBank — Cypress e JavaScript

Projeto de estudos de automação de testes com Cypress e JavaScript,
utilizando o laboratório público Practice QA Automation.

## Cenários implementados

### Autenticação
- Login em duas etapas.
- Senha incorreta.
- Bloqueio após três tentativas inválidas.
- Resposta de segurança incorreta.
- Proteção do dashboard sem autenticação.

### Transferência E2E
- Cadastro de beneficiário e transferência com OTP válido.
- Rejeição de OTP incorreto e recuperação do fluxo.

### Network Mocking
- Erro HTTP 500 e recuperação.
- Resposta lenta e indicador de carregamento.
- Lista vazia.
- Dados personalizados de perfil e produtos.
- Falha de conexão.
- Filtro por categoria.
- Alteração de resposta real.
- Erros HTTP 401 e 429.
- JSON inválido e estrutura inesperada.

## Tecnologias

- JavaScript
- Cypress
- Cypress Testing Library
- Node.js e npm

## Como executar

Instale as dependências:

```bash
npm ci
```

Abra o Cypress:

```bash
npx cypress open
```

Execute todos os testes pelo terminal:

```bash
npx cypress run
```

## Aplicação utilizada

https://www.practiceqaautomation.com

Os dados de acesso presentes nos testes são demonstrativos do laboratório.