// Configuração global para ambiente de testes

// Mock console.error para manter logs limpos, durante os testes
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
};

// Mock da classe Date para garantir datas fixas e previsíveis nos testes
const RealDate = Date;

global.mockDate = (dateString) => {
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        return new RealDate(dateString);
      }
      return new RealDate(...args);
    }
    
    static now() {
      return new RealDate(dateString).getTime();
    }
  };
};

global.restoreDate = () => {
  global.Date = RealDate;
};

// Preparação antes de cada teste
beforeEach(() => {
  // Limpa os mocks de console
  console.error.mockClear();
  console.warn.mockClear();
});


// Limpeza após cada teste
afterEach(() => {
  // Restaura a classe Date original se ela tiver sido alterada
  global.restoreDate();
  
  // Limpar todos os mocks
  jest.clearAllMocks();
});

// Define o tempo máximo de execução dos testes para 10 segundos
jest.setTimeout(10000); 

// Define variáveis de ambiente para execução em modo de teste
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
