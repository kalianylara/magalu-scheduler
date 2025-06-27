const CommunicationRoutes = require('../../routes/communicationRoutes');

describe('communicationRoutes', () => {
  it('deve lançar erro se o controller não for inicializado', () => {
    // Mocka o método initializeRoutes para evitar execução real durante o teste
    CommunicationRoutes.prototype.initializeRoutes = jest.fn();

    const routes = new CommunicationRoutes();
    routes.controller = null;

    expect(() => routes.setupRoutes()).toThrow('Controller não foi inicializado');
  });
});
