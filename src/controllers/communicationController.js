const { AppError, ValidationError, NotFoundError } = require('../utils/errors');
const { errorMessages } = require('../utils/constants');

class CommunicationController {
  constructor(service) {
    this.service = service;
  }

  // Método auxiliar para tratamento de erros
  handleError(error, res) {
    console.error('Erro no controller:', error);

    if (error instanceof ValidationError) {
      return res.status(error.statusCode).json({
        error: error.message,
        field: error.field,
        code: error.code
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        error: error.message,
        code: error.code
      });
    }

    // Erro não tratado
    return res.status(500).json({
      error: errorMessages.internalError,
      code: 'INTERNAL_ERROR'
    });
  }

  // POST /api/schedules
  async createSchedule(req, res) {
    try {
      const created = await this.service.createSchedule(req.body);
      res.status(201).json({
        success: true,
        data: created,
        message: 'Agendamento criado com sucesso'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /api/schedules/:id
  async getScheduleById(req, res) {
    try {
      const { id } = req.params;
      const schedule = await this.service.getScheduleById(id);
      res.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // DELETE /api/schedules/:id
  async cancelSchedule(req, res) {
    try {
      const { id } = req.params;
      await this.service.cancelSchedule(id);

      res.sendStatus(204);
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // PUT /api/schedules/:id
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const updated = await this.service.updateSchedule(id, req.body);
      res.json({
        success: true,
        data: updated,
        message: 'Agendamento atualizado com sucesso'
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }

  // GET /api/schedules
  async listSchedules(req, res) {
    try {
      const result = await this.service.listSchedules(req.query);
      res.json({
        success: true,
        data: result.schedules,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      this.handleError(error, res);
    }
  }
}

module.exports = CommunicationController;
