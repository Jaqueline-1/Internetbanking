/// <reference types="cypress" />

// Dados demonstrativos do laboratório TrustBank.
const CLIENTE = {
  id: '100200300',
  senha: 'Bank@123',
  resposta: 'greenwood',
};

const BENEFICIARIO = {
  nome: 'Ravi Kumar',
  conta: '123456789012',
  ifsc: 'TRST0001234',
};

function fazerLogin() {
  cy.visit('/apps/bank');

  cy.findByLabelText('Customer ID')
    .clear()
    .type(CLIENTE.id);

  cy.get('#bank-password')
    .clear()
    .type(CLIENTE.senha, { log: false });

  cy.contains('button', /^Continue$/).click();

  cy.get('[data-testid="security-question"]')
    .should('be.visible');

  cy.findByLabelText('Your answer')
    .type(CLIENTE.resposta, { log: false });

  cy.contains('button', /^Sign in$/).click();

  cy.location('pathname')
    .should('match', /\/apps\/bank\/dashboard\/?$/);

  cy.get('[data-testid="customer-name"]')
    .should('contain.text', 'Amir Khan');
}

function prepararTransferencia() {
  fazerLogin();

  cy.get('[data-testid="action-transfer"]').click();

  cy.location('pathname')
    .should('match', /\/apps\/bank\/transfer\/?$/);

  cy.findByRole('combobox', { name: 'From account' })
    .select('savings');

  cy.get('[data-testid="add-payee"]').click();

  cy.get('#payee-name').type(BENEFICIARIO.nome);

  cy.findByLabelText('Account number', { exact: true })
    .type(BENEFICIARIO.conta);

  // Simula digitação: a aplicação bloqueia colagem neste campo.
  cy.get('#payee-confirm-account')
    .type(BENEFICIARIO.conta);

  cy.findByLabelText('IFSC code')
    .type(BENEFICIARIO.ifsc);

  cy.contains('button', /^Save payee$/).click();

  cy.get('#amount').type('2500');

  cy.get('[data-testid="mode-imps"]').click();

  cy.findByLabelText('Remarks (optional)')
    .type('Rent');

  cy.contains('button', /^Review transfer$/).click();

  cy.get('[data-testid="review-payee"]')
    .should('contain.text', BENEFICIARIO.nome);

  cy.contains('button', /^Confirm$/).click();

  cy.get('#otp-input').should('be.visible');
}

describe('TrustBank | Transferência E2E', () => {
    
  it('E2E-01 | Conclui transferência com OTP válido', () => {
    prepararTransferencia();

    cy.get('#otp-input').type('246810');

    cy.contains('button', /^Verify & transfer$/).click();

    cy.get('[data-testid="transfer-success"]')
      .should('be.visible');

    cy.get('[data-testid="transfer-amount"]')
      .should('contain.text', '2,500.00');

    cy.get('[data-testid="new-balance"]')
      .should('contain.text', '1,22,930.50');
  });

  it('E2E-02 | OTP incorreto impede a transferência', () => {
    prepararTransferencia();

    cy.get('#otp-input').type('000000');

    cy.contains('button', /^Verify & transfer$/).click();

    cy.get('[data-testid="otp-error"]')
      .should('be.visible');

    // Confere ausência de um comprovante visível,
    // independentemente de estar oculto ou ausente do DOM.
    cy.get('body')
      .find('[data-testid="transfer-success"]:visible')
      .should('not.exist');

    cy.get('#otp-input').should('be.visible');

    // Corrige o OTP e conclui o mesmo fluxo.
    cy.get('#otp-input')
      .clear()
      .type('246810');

    cy.contains('button', /^Verify & transfer$/).click();

    cy.get('[data-testid="transfer-success"]')
      .should('be.visible');

    cy.get('[data-testid="transfer-amount"]')
      .should('contain.text', '2,500.00');
  });
});