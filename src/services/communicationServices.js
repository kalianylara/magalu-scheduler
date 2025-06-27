const validator = require('validator');
const { validChannels, allowedStatuses, errorMessages } = require('../utils/constants');
const { ValidationError, NotFoundError, DatabaseError } = require('../utils/errors');

class CommunicationService {
  constructor(repository) {
    this.repository = repository;
  }

  // Validações de entrada
  validateRequiredFields(data) {
    const { recipient, message, scheduledAt } = data;
    const missingFields = [];
    
    if (!recipient) missingFields.push('recipient');
    if (!message) missingFields.push('message');
    if (!scheduledAt) missingFields.push('scheduledAt');
    
    if (missingFields.length > 0) {
      throw new ValidationError(
        `Campos obrigatórios ausentes: ${missingFields.join(', ')}`,
        missingFields
      );
    }
  }

  validateChannel(channel) {
    if (!channel) {
      throw new ValidationError('Canal de comunicação é obrigatório', 'channel');
    }

    if (typeof channel !== 'string') {
      throw new ValidationError(errorMessages.invalidChannelFormat, 'channel');
    }
    
    const normalizedChannel = channel.toLowerCase().trim();
    
    if (!validChannels.includes(normalizedChannel)) {
      throw new ValidationError(
        `${errorMessages.invalidChannel} Canais válidos: ${validChannels.join(', ')}`,
        'channel'
      );
    }
    
    return normalizedChannel;
  }

  validateId(id) {
    if (!id) {
      throw new ValidationError('ID é obrigatório', 'id');
    }

    if (!validator.isUUID(id)) {
      throw new ValidationError(errorMessages.invalidId, 'id');
    }
  }

  validateStatus(status) {
    if (status && !allowedStatuses.includes(status.toLowerCase())) {
      throw new ValidationError(
        `${errorMessages.invalidStatus} Status válidos: ${allowedStatuses.join(', ')}`,
        'status'
      );
    }
  }

  validateScheduledAt(scheduledAt) {
    if (!scheduledAt) return;
    
    const date = new Date(scheduledAt);
    
    if (isNaN(date.getTime())) {
      throw new ValidationError('Data de agendamento inválida', 'scheduledAt');
    }

    // Validar se a data não é no passado
    if (date < new Date()) {
      throw new ValidationError('Data de agendamento não pode ser no passado', 'scheduledAt');
    }

    return date;
  }

  // Regras de negócio
  async createSchedule(data) {
    try {
      this.validateRequiredFields(data);
      
      const scheduleData = {
        recipient: data.recipient.trim(),
        message: data.message.trim(),
        channel: this.validateChannel(data.channel),
        scheduledAt: this.validateScheduledAt(data.scheduledAt)
      };

      return await this.repository.create(scheduleData);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Erro ao criar agendamento', error);
    }
  }

  async getScheduleById(id) {
    try {
      this.validateId(id);
      
      const schedule = await this.repository.findById(id);
      
      if (!schedule) {
        throw new NotFoundError('Agendamento');
      }
      
      return schedule;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Erro ao buscar agendamento', error);
    }
  }

  async updateSchedule(id, data) {
    try {
      this.validateId(id);
      
      // Verificar se o agendamento existe
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Agendamento');
      }

      const updateData = {};

      // Validar e preparar dados para atualização
      if (data.recipient !== undefined) {
        if (!data.recipient || !data.recipient.trim()) {
          throw new ValidationError('Destinatário não pode estar vazio', 'recipient');
        }
        updateData.recipient = data.recipient.trim();
      }
      
      if (data.message !== undefined) {
        if (!data.message || !data.message.trim()) {
          throw new ValidationError('Mensagem não pode estar vazia', 'message');
        }
        updateData.message = data.message.trim();
      }
      
      if (data.channel !== undefined) {
        updateData.channel = this.validateChannel(data.channel);
      }
      
      if (data.scheduledAt !== undefined) {
        updateData.scheduledAt = this.validateScheduledAt(data.scheduledAt);
      }
      
      if (data.status !== undefined) {
        this.validateStatus(data.status);
        updateData.status = data.status.toLowerCase();
      }

      return await this.repository.update(id, updateData);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Erro ao atualizar agendamento', error);
    }
  }

  async cancelSchedule(id) {
    try {
      this.validateId(id);
      
      // Verificar se o agendamento existe
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new NotFoundError('Agendamento');
      }

      // Verificar se o agendamento pode ser cancelado
      if (existing.status === 'enviado') {
        throw new ValidationError('Não é possível cancelar um agendamento já enviado', 'status');
      }

      return await this.repository.delete(id);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Erro ao cancelar agendamento', error);
    }
  }

  async listSchedules(filters = {}) {
    try {
      const { status, page = 1, limit = 10 } = filters;
      
      // Validações
      if (status) {
        this.validateStatus(status);
      }

      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      if (pageNumber < 1) {
        throw new ValidationError('Página deve ser maior que 0', 'page');
      }

      if (limitNumber < 1 || limitNumber > 100) {
        throw new ValidationError('Limite deve estar entre 1 e 100', 'limit');
      }

      const take = limitNumber;
      const skip = (pageNumber - 1) * take;

      const repositoryFilters = {
        status: status ? status.toLowerCase() : undefined,
        skip,
        take
      };

      const [schedules, total] = await Promise.all([
        this.repository.findMany(repositoryFilters),
        this.repository.count({ status: repositoryFilters.status })
      ]);

      return {
        total,
        page: pageNumber,
        limit: take,
        totalPages: Math.ceil(total / take),
        schedules
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Erro ao listar agendamentos', error);
    }
  }
}

module.exports = CommunicationService;
