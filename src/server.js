const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const CommunicationRoutes = require('./routes/communicationRoutes');

dotenv.config();

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupMiddlewares();
    this.setupRoutes();
  }

  // Configura os middlewares globais da aplicação
  setupMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  setupRoutes() {
    // Rota básica para verificar se a API está online
    this.app.get('/', (req, res) => {
      res.json({ 
        message: 'API Magalu Scheduler rodando!',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    // Rotas principais da API (comunicação/agendamentos)
    const communicationRoutes = new CommunicationRoutes();
    this.app.use('/api', communicationRoutes.getRouter());

    // Middleware para rotas não encontradas
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Rota não encontrada',
        path: req.originalUrl
      });
    });

    // Middleware global de tratamento de erros
    this.app.use((error, req, res, next) => {
      console.error('Erro não tratado:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Algo deu errado'
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🚀 Servidor rodando na porta ${this.port}`);
      console.log(`📊 Health check: http://localhost:${this.port}/`);
      console.log(`🔗 API: http://localhost:${this.port}/api`);
    });
  }

  getApp() {
    return this.app;
  }
}

// Inicializar o servidor apenas se este arquivo for executado diretamente
if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;
