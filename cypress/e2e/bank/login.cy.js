/// <reference types="cypress" />

const CLIENTE = {
  id: '100200300',
  senha: 'Bank@123',
  resposta: 'greenwood',
};

function preencherCredenciais(senha = CLIENTE.senha) {
  cy.findByLabelText('Customer ID')
    .clear()
    .type(CLIENTE.id);

  cy.get('#bank-password')
    .clear()
    .type(senha, { log: false });

  cy.contains('button', /^Continue$/).click();
}

function fazerLogin() {
  cy.visit('/apps/bank');

  preencherCredenciais();

  cy.get('[data-testid="security-question"]')
    .should('be.visible');

  cy.findByLabelText('Your answer')
    .type(CLIENTE.resposta, { log: false });

  cy.contains('button', /^Sign in$/).click();

  cy.location('pathname')
    .should('match', /\/apps\/bank\/dashboard\/?$/);

  cy.get('[data-testid="customer-name"]')
    .should('be.visible')
    .and('contain.text', 'Amir Khan');
}

describe('TrustBank | Autenticação', () => {
  it('CT-001 | Login em duas etapas com sucesso', () => {
    fazerLogin();
  });

  it('CT-002 | Senha incorreta apresenta erro', () => {
    cy.visit('/apps/bank');

    preencherCredenciais('SenhaIncorreta@123');

    cy.get('[data-testid="login-error"]')
      .should('be.visible');

    cy.get('[data-testid="security-question"]')
      .should('not.exist');

    cy.location('pathname')
      .should('not.include', '/dashboard');
  });

  it('CT-003 | Bloqueia após três senhas incorretas', () => {
    cy.visit('/apps/bank');

    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      preencherCredenciais('SenhaIncorreta@123');

      if (tentativa < 3) {
        cy.get('[data-testid="login-error"]')
          .should('be.visible');
      }
    }

    cy.get('[data-testid="reset-lock"]')
      .should('be.visible');
  });

  it('CT-004 | Resposta de segurança incorreta impede login', () => {
    cy.visit('/apps/bank');

    preencherCredenciais();

    cy.get('[data-testid="security-question"]')
      .should('be.visible');

    cy.findByLabelText('Your answer')
      .type('resposta-errada');

    cy.contains('button', /^Sign in$/).click();

    cy.get('[data-testid="security-question"]')
      .should('be.visible');

    cy.location('pathname')
      .should('not.include', '/dashboard');
  });

  it('CT-005 | Dashboard exige autenticação', () => {
    cy.visit('/apps/bank/dashboard');

    cy.findByLabelText('Customer ID')
      .should('be.visible');

    cy.location('pathname')
      .should('not.include', '/dashboard');
  });
});