const express = require('express');
const { createCommunicationModule } = require('../config/dependencies');

class CommunicationRoutes {
  constructor() {
    this.router = express.Router();
    this.controller = null;
    this.initializeRoutes();
  }

  initializeRoutes() {
    const { controller } = createCommunicationModule();
    this.controller = controller;
    this.setupRoutes();
  }

  setupRoutes() {
    if (!this.controller) {
      throw new Error('Controller não foi inicializado');
    }
    
    // Bind dos métodos para manter o contexto da classe
    this.router.post('/schedules', this.controller.createSchedule.bind(this.controller));
    this.router.get('/schedules/:id', this.controller.getScheduleById.bind(this.controller));
    this.router.delete('/schedules/:id', this.controller.cancelSchedule.bind(this.controller));
    this.router.put('/schedules/:id', this.controller.updateSchedule.bind(this.controller));
    this.router.get('/schedules', this.controller.listSchedules.bind(this.controller));
  }

  getRouter() {
    return this.router;
  }
}

module.exports = CommunicationRoutes;
