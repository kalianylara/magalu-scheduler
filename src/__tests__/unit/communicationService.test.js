const CommunicationService = require('../../services/communicationServices');
const { ValidationError, NotFoundError, DatabaseError } = require('../../utils/errors');
const { TestDataFactory, MockHelpers, TEST_CONSTANTS } = require('../helpers/testHelpers');

describe('CommunicationService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = MockHelpers.createMockRepository();
    service = new CommunicationService(mockRepository);
  });

  describe('constructor', () => {
    it('deve inicializar com repository', () => {
      expect(service.repository).toBe(mockRepository);
    });
  });

  describe('validateRequiredFields', () => {
    it('deve passar quando todos os campos obrigatórios estão presentes', () => {
      const data = TestDataFactory.createValidScheduleData();
      
      expect(() => service.validateRequiredFields(data)).not.toThrow();
    });

    it('deve lançar ValidationError quando recipient está ausente', () => {
      const data = TestDataFactory.createInvalidScheduleData('missing_recipient');
      
      expect(() => service.validateRequiredFields(data)).toThrow(ValidationError);
      expect(() => service.validateRequiredFields(data)).toThrow('recipient');
    });

    it('deve lançar ValidationError quando message está ausente', () => {
      const data = TestDataFactory.createInvalidScheduleData('missing_message');
      
      expect(() => service.validateRequiredFields(data)).toThrow(ValidationError);
      expect(() => service.validateRequiredFields(data)).toThrow('message');
    });

    it('deve lançar ValidationError quando scheduledAt está ausente', () => {
      const data = TestDataFactory.createInvalidScheduleData('missing_scheduledAt');
      
      expect(() => service.validateRequiredFields(data)).toThrow(ValidationError);
      expect(() => service.validateRequiredFields(data)).toThrow('scheduledAt');
    });

    it('deve listar todos os campos ausentes', () => {
      expect(() => service.validateRequiredFields({})).toThrow('recipient, message, scheduledAt');
    });
  });

  describe('validateChannel', () => {
    it('deve retornar canal normalizado para canais válidos', () => {
      TEST_CONSTANTS.VALID_CHANNELS.forEach(channel => {
        expect(service.validateChannel(channel)).toBe(channel);
        expect(service.validateChannel(channel.toUpperCase())).toBe(channel);
      });
    });

    it('deve lançar ValidationError para canal inválido', () => {
      expect(() => service.validateChannel(TEST_CONSTANTS.INVALID_CHANNEL))
        .toThrow(ValidationError);
    });

    it('deve lançar ValidationError para tipo inválido', () => {
      expect(() => service.validateChannel(123)).toThrow(ValidationError);
      expect(() => service.validateChannel(null)).toThrow(ValidationError);
      expect(() => service.validateChannel(undefined)).toThrow(ValidationError);
    });

    it('deve remover espaços em branco', () => {
      expect(service.validateChannel('  email  ')).toBe('email');
    });
  });

  describe('validateId', () => {
    it('deve passar para UUID válido', () => {
      expect(() => service.validateId(TEST_CONSTANTS.VALID_UUID)).not.toThrow();
    });

    it('deve lançar ValidationError para UUID inválido', () => {
      expect(() => service.validateId(TEST_CONSTANTS.INVALID_UUID)).toThrow(ValidationError);
      expect(() => service.validateId('123')).toThrow(ValidationError);
    });

    it('deve lançar ValidationError para ID ausente', () => {
      expect(() => service.validateId(null)).toThrow(ValidationError);
      expect(() => service.validateId(undefined)).toThrow(ValidationError);
      expect(() => service.validateId('')).toThrow(ValidationError);
    });
  });

  describe('validateStatus', () => {
    it('deve passar para status válidos', () => {
      TEST_CONSTANTS.VALID_STATUSES.forEach(status => {
        expect(() => service.validateStatus(status)).not.toThrow();
        expect(() => service.validateStatus(status.toUpperCase())).not.toThrow();
      });
    });

    it('deve lançar ValidationError para status inválido', () => {
      expect(() => service.validateStatus(TEST_CONSTANTS.INVALID_STATUS)).toThrow(ValidationError);
    });

    it('deve permitir status undefined', () => {
      expect(() => service.validateStatus(undefined)).not.toThrow();
    });
  });

  describe('validateScheduledAt', () => {
    it('deve retornar data válida para data futura', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = service.validateScheduledAt(futureDate.toISOString());
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBeCloseTo(futureDate.getTime(), -3);
    });

    it('deve lançar ValidationError para data no passado', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      expect(() => service.validateScheduledAt(pastDate.toISOString()))
        .toThrow(ValidationError);
    });

    it('deve lançar ValidationError para data inválida', () => {
      expect(() => service.validateScheduledAt('invalid-date')).toThrow(ValidationError);
    });

    it('deve permitir scheduledAt undefined', () => {
      expect(service.validateScheduledAt(undefined)).toBeUndefined();
    });
  });
  
  describe('createSchedule', () => {
    it('deve criar agendamento com sucesso', async () => {
      const scheduleData = TestDataFactory.createValidScheduleData();
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      
      mockRepository.create.mockResolvedValue(expectedResult);

      const result = await service.createSchedule(scheduleData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        recipient: scheduleData.recipient.trim(),
        message: scheduleData.message.trim(),
        channel: scheduleData.channel.toLowerCase(),
        scheduledAt: expect.any(Date)
      });
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar ValidationError para dados inválidos', async () => {
      const invalidData = TestDataFactory.createInvalidScheduleData('missing_recipient');
      
      await expect(service.createSchedule(invalidData)).rejects.toThrow(ValidationError);
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve lançar DatabaseError quando repository falha', async () => {
      const scheduleData = TestDataFactory.createValidScheduleData();
      const repositoryError = new Error('Repository error');
      
      mockRepository.create.mockRejectedValue(repositoryError);

      await expect(service.createSchedule(scheduleData)).rejects.toThrow(DatabaseError);
    });
  });

  describe('getScheduleById', () => {
    it('deve retornar agendamento quando encontrado', async () => {
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      
      mockRepository.findById.mockResolvedValue(expectedResult);

      const result = await service.getScheduleById(TEST_CONSTANTS.VALID_UUID);

      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar NotFoundError quando agendamento não encontrado', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getScheduleById(TEST_CONSTANTS.VALID_UUID))
        .rejects.toThrow(NotFoundError);
    });

    it('deve lançar ValidationError para ID inválido', async () => {
      await expect(service.getScheduleById(TEST_CONSTANTS.INVALID_UUID))
        .rejects.toThrow(ValidationError);
      
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('deve lançar DatabaseError quando repository falha', async () => {
      const repositoryError = new Error('Repository error');
      mockRepository.findById.mockRejectedValue(repositoryError);

      await expect(service.getScheduleById(TEST_CONSTANTS.VALID_UUID))
        .rejects.toThrow(DatabaseError);
    });
  });

  describe('updateSchedule', () => {
    beforeEach(() => {
      mockRepository.findById.mockResolvedValue(TestDataFactory.createValidScheduleResponse());
    });

    it('deve atualizar agendamento com sucesso', async () => {
      const updateData = { message: 'Nova mensagem' };
      const expectedResult = TestDataFactory.createValidScheduleResponse(updateData);
      
      mockRepository.update.mockResolvedValue(expectedResult);

      const result = await service.updateSchedule(TEST_CONSTANTS.VALID_UUID, updateData);

      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID);
      expect(mockRepository.update).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID, {
        message: 'Nova mensagem'
      });
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar NotFoundError quando agendamento não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.updateSchedule(TEST_CONSTANTS.VALID_UUID, {}))
        .rejects.toThrow(NotFoundError);
      
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('deve validar canal quando fornecido', async () => {
      const updateData = { channel: 'SMS' };
      mockRepository.update.mockResolvedValue({});

      await service.updateSchedule(TEST_CONSTANTS.VALID_UUID, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID, {
        channel: 'sms'
      });
    });

    it('deve validar data quando fornecida', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const updateData = { scheduledAt: futureDate.toISOString() };
      mockRepository.update.mockResolvedValue({});

      await service.updateSchedule(TEST_CONSTANTS.VALID_UUID, updateData);

      expect(mockRepository.update).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID, {
        scheduledAt: expect.any(Date)
      });
    });

    it('deve lançar ValidationError para dados inválidos', async () => {
      const updateData = { channel: 'invalid' };

      await expect(service.updateSchedule(TEST_CONSTANTS.VALID_UUID, updateData))
        .rejects.toThrow(ValidationError);
      
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('cancelSchedule', () => {
    it('deve cancelar agendamento com sucesso', async () => {
      const schedule = TestDataFactory.createValidScheduleResponse({ status: 'pendente' });
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      
      mockRepository.findById.mockResolvedValue(schedule);
      mockRepository.delete.mockResolvedValue(expectedResult);

      const result = await service.cancelSchedule(TEST_CONSTANTS.VALID_UUID);

      expect(mockRepository.findById).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID);
      expect(mockRepository.delete).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID);
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar NotFoundError quando agendamento não existe', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.cancelSchedule(TEST_CONSTANTS.VALID_UUID))
        .rejects.toThrow(NotFoundError);
      
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('deve lançar ValidationError para agendamento já enviado', async () => {
      const schedule = TestDataFactory.createValidScheduleResponse({ status: 'enviado' });
      mockRepository.findById.mockResolvedValue(schedule);

      await expect(service.cancelSchedule(TEST_CONSTANTS.VALID_UUID))
        .rejects.toThrow(ValidationError);
      
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('listSchedules', () => {
    it('deve listar agendamentos com filtros padrão', async () => {
      const schedules = [TestDataFactory.createValidScheduleResponse()];
      
      mockRepository.findMany.mockResolvedValue(schedules);
      mockRepository.count.mockResolvedValue(1);

      const result = await service.listSchedules();

      expect(mockRepository.findMany).toHaveBeenCalledWith({
        status: undefined,
        skip: 0,
        take: 10
      });
      expect(mockRepository.count).toHaveBeenCalledWith({ status: undefined });
      expect(result).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        schedules
      });
    });

    it('deve aplicar filtros de paginação', async () => {
      const filters = { page: 2, limit: 5 };
      
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await service.listSchedules(filters);

      expect(mockRepository.findMany).toHaveBeenCalledWith({
        status: undefined,
        skip: 5,
        take: 5
      });
    });

    it('deve aplicar filtro de status', async () => {
      const filters = { status: 'pendente' };
      
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await service.listSchedules(filters);

      expect(mockRepository.findMany).toHaveBeenCalledWith({
        status: 'pendente',
        skip: 0,
        take: 10
      });
    });

    it('deve lançar ValidationError para página inválida', async () => {
      await expect(service.listSchedules({ page: 0 })).rejects.toThrow(ValidationError);
      await expect(service.listSchedules({ page: -1 })).rejects.toThrow(ValidationError);
    });

    it('deve lançar ValidationError para limite inválido', async () => {
      await expect(service.listSchedules({ limit: 0 })).rejects.toThrow(ValidationError);
      await expect(service.listSchedules({ limit: 101 })).rejects.toThrow(ValidationError);
    });

    it('deve calcular totalPages corretamente', async () => {
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(25);

      const result = await service.listSchedules({ limit: 10 });

      expect(result.totalPages).toBe(3);
    });

    it('deve atualizar recipient com sucesso', async () => {
      mockRepository.findById.mockResolvedValue(TestDataFactory.createValidScheduleResponse());

      await service.updateSchedule(TEST_CONSTANTS.VALID_UUID, {
        recipient: 'novo@example.com',
      });

      expect(mockRepository.update).toHaveBeenCalledWith(
        TEST_CONSTANTS.VALID_UUID,
        { recipient: 'novo@example.com' }
      );
    });

    it('deve atualizar status com sucesso', async () => {
      mockRepository.findById.mockResolvedValue(TestDataFactory.createValidScheduleResponse());

      await service.updateSchedule(TEST_CONSTANTS.VALID_UUID, {
        status: 'enviado',
      });

      expect(mockRepository.update).toHaveBeenCalledWith(
        TEST_CONSTANTS.VALID_UUID,
        { status: 'enviado' }
      );
    });

    it('deve lançar DatabaseError se update falhar', async () => {
      mockRepository.findById.mockResolvedValue(TestDataFactory.createValidScheduleResponse());
      mockRepository.update.mockRejectedValue(new Error('Erro no banco'));

      await expect(service.updateSchedule(TEST_CONSTANTS.VALID_UUID, {
        message: 'Falhar',
      })).rejects.toThrow(DatabaseError);
    });

  });
});
