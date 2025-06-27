const CommunicationRepository = require('../repository/communicationRepository');
const CommunicationService = require('../services/communicationServices');
const CommunicationController = require('../controllers/communicationController');

class DependencyContainer {
  constructor() {
    this.dependencies = new Map();
    this.singletons = new Map();
  }

  // Registra uma dependência
  register(name, factory, options = {}) {
    this.dependencies.set(name, {
      factory,
      singleton: options.singleton || false
    });
  }

  // Resolve uma dependência
  resolve(name) {
    const dependency = this.dependencies.get(name);
    
    if (!dependency) {
      throw new Error(`Dependência '${name}' não encontrada`);
    }

    // Se for singleton e já foi criado, retorna a instância existente
    if (dependency.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    const instance = dependency.factory(this);

    // Se for singleton, armazena a instância
    if (dependency.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  // Método para limpar singletons (útil para testes)
  clear() {
    this.singletons.clear();
  }
}

// Configuração das dependências
function setupDependencies() {
  const container = new DependencyContainer();

  // Registra o Repository como singleton
  container.register('repository', () => {
    return new CommunicationRepository();
  }, { singleton: true });

  // Registra o Service como singleton
  container.register('service', (container) => {
    const repository = container.resolve('repository');
    return new CommunicationService(repository);
  }, { singleton: true });

  // Registra o Controller como singleton
  container.register('controller', (container) => {
    const service = container.resolve('service');
    return new CommunicationController(service);
  }, { singleton: true });

  return container;
}

// Instância global do container (padrão singleton)
let globalContainer = null;

function getContainer() {
  if (!globalContainer) {
    globalContainer = setupDependencies();
  }
  return globalContainer;
}

// Função de conveniência para criar o módulo de comunicação
function createCommunicationModule() {
  const container = getContainer();
  
  return {
    repository: container.resolve('repository'),
    service: container.resolve('service'),
    controller: container.resolve('controller')
  };
}

module.exports = {
  DependencyContainer,
  setupDependencies,
  getContainer,
  createCommunicationModule
};
