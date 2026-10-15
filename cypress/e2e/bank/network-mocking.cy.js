/// <reference types="cypress" />

const PAGINA = '/dynamic/network-mocking';
const PRODUTOS = '**/mock/products.json*';
const PERFIL = '**/mock/profile.json*';

const seletor = (id) => `[data-testid="${id}"]`;

function validarAlerta(mensagem) {
  cy.get(seletor('net-app'))
    .find('[role="alert"]')
    .should('be.visible')
    .and('contain.text', mensagem);
}

function tentarNovamente() {
  cy.contains('button', /^Try again$/).click();
}

describe('Network Mocking | Cypress e JavaScript', () => {
  it('NM-01 | Erro 500 seguido de recuperação', () => {
    let total = 0;

    cy.intercept('GET', PRODUTOS, (req) => {
      total += 1;

      if (total === 1) {
        req.reply({
          statusCode: 500,
          body: 'Internal Server Error',
          headers: {
            'content-type': 'text/plain',
          },
        });
      } else {
        req.continue();
      }
    }).as('produtos');

    cy.visit(PAGINA);

    cy.wait('@produtos')
      .its('response.statusCode')
      .should('eq', 500);

    validarAlerta('The server had a problem (500)');

    tentarNovamente();

    cy.wait('@produtos')
      .its('response.statusCode')
      .should('eq', 200);

    cy.get(seletor('net-item'))
      .should('have.length', 8);

    cy.then(() => {
      expect(total).to.equal(2);
    });
  });

  it('NM-02 | Resposta lenta apresenta loading', () => {
    cy.intercept('GET', PRODUTOS, (req) => {
      req.continue((res) => {
        res.setDelay(2000);
      });
    }).as('produtosLentos');

    cy.visit(PAGINA);

    cy.get(seletor('net-loading'))
      .should('be.visible');

    cy.wait('@produtosLentos');

    cy.get(seletor('net-item'))
      .should('have.length', 8);

    cy.get(`${seletor('net-loading')}:visible`)
      .should('not.exist');
  });

  it('NM-03 | Lista vazia apresenta estado vazio', () => {
    cy.intercept('GET', PRODUTOS, {
      statusCode: 200,
      body: [],
    }).as('produtosVazios');

    cy.visit(PAGINA);

    cy.wait('@produtosVazios');

    cy.get(seletor('net-empty'))
      .should('be.visible')
      .and('have.text', 'No products found.');

    cy.get(seletor('net-item'))
      .should('not.exist');
  });

  it('NM-04 | Controla os dados de perfil e produtos', () => {
    cy.intercept('GET', PERFIL, {
      statusCode: 200,
      body: {
        name: 'Jaqueline QA',
        plan: 'Free',
      },
    }).as('perfil');

    cy.intercept('GET', PRODUTOS, {
      statusCode: 200,
      body: [
        {
          id: 987,
          name: 'Produto de teste QA',
          price: 1,
          category: 'electronics',
        },
      ],
    }).as('produtoPersonalizado');

    cy.visit(PAGINA);

    cy.wait(['@perfil', '@produtoPersonalizado']);

    cy.get(seletor('net-profile'))
      .should('have.text', 'Hi, Jaqueline QA · Free plan');

    cy.get(seletor('net-item'))
      .should('have.length', 1)
      .and('contain.text', 'Produto de teste QA');
  });

  it('NM-05 | Falha de conexão apresenta mensagem', () => {
    cy.intercept('GET', PRODUTOS, {
      forceNetworkError: true,
    });

    cy.visit(PAGINA);

    validarAlerta("Can't reach the server");
  });

  it('NM-06 | Filtro envia a categoria books', () => {
    cy.intercept('GET', PRODUTOS).as('produtos');

    cy.visit(PAGINA);

    cy.wait('@produtos');

    cy.get(seletor('net-item'))
      .should('have.length', 8);

    cy.findByLabelText('Category').select('books');

    cy.wait('@produtos').then(({ request }) => {
      const url = new URL(request.url);

      expect(request.method).to.equal('GET');
      expect(url.searchParams.get('category'))
        .to.equal('books');
    });

    cy.get(seletor('net-item'))
      .should('have.length', 3);
  });

  it('NM-07 | Altera o preço na resposta real', () => {
    cy.intercept('GET', PRODUTOS, (req) => {
      // Solicita uma resposta completa, evitando resposta 304.
      delete req.headers['if-none-match'];
      delete req.headers['if-modified-since'];

      req.continue((res) => {
        expect(res.body).to.be.an('array').and.not.be.empty;

        res.body[0].price = 1;
      });
    }).as('precoAlterado');

    cy.visit(PAGINA);

    cy.wait('@precoAlterado');

    cy.get(seletor('net-item'))
      .should('have.length', 8);

    cy.get(seletor('net-item'))
      .first()
      .should('contain.text', '₹1');
  });

  it('NM-08 | Erro 401 apresenta sessão expirada', () => {
    cy.intercept('GET', PRODUTOS, {
      statusCode: 401,
      body: '',
    }).as('sessaoExpirada');

    cy.visit(PAGINA);

    cy.wait('@sessaoExpirada')
      .its('response.statusCode')
      .should('eq', 401);

    validarAlerta('Your session has expired');
  });

  it('NM-09 | Erro 429 informa tempo para nova tentativa', () => {
    cy.intercept('GET', PRODUTOS, {
      statusCode: 429,
      headers: {
        'Retry-After': '30',
      },
      body: '',
    }).as('limiteRequisicoes');

    cy.visit(PAGINA);

    cy.wait('@limiteRequisicoes')
      .its('response.statusCode')
      .should('eq', 429);

    validarAlerta('try again in 30 seconds');
  });

  it('NM-10 | JSON inválido apresenta erro de leitura', () => {
    cy.intercept('GET', PRODUTOS, {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
      },
      body: '{ not valid json',
    }).as('jsonInvalido');

    cy.visit(PAGINA);

    cy.wait('@jsonInvalido');

    validarAlerta("couldn't read");
  });

  it('NM-11 | Estrutura inesperada apresenta diagnóstico', () => {
    cy.intercept('GET', PRODUTOS, {
      statusCode: 200,
      body: {
        items: 'wrong shape',
      },
    }).as('estruturaInvalida');

    cy.visit(PAGINA);

    cy.wait('@estruturaInvalida');

    cy.get(seletor('net-last'))
      .should('contain.text', 'unexpected shape');
  });
});