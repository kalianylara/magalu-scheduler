const CommunicationController = require('../../controllers/communicationController');
const { ValidationError, NotFoundError, AppError } = require('../../utils/errors');
const { TestDataFactory, MockHelpers, TEST_CONSTANTS } = require('../helpers/testHelpers');

describe('CommunicationController', () => {
  let controller;
  let mockService;
  let mockRes;
  let mockReq;

  // Cria mocks para controller, request e response antes de cada teste
  beforeEach(() => {
    mockService = MockHelpers.createMockService();
    controller = new CommunicationController(mockService);
    mockRes = MockHelpers.createMockExpressResponse();
    mockReq = MockHelpers.createMockExpressRequest();
  });

  describe('constructor', () => {
    it('deve inicializar com service', () => {
      expect(controller.service).toBe(mockService);
    });
  });

  describe('handleError', () => {
    it('deve tratar ValidationError corretamente', () => {
      const error = new ValidationError('Erro de validação', 'field');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro de validação',
        field: 'field',
        code: 'VALIDATION_ERROR'
      });
    });

    it('deve tratar NotFoundError corretamente', () => {
      const error = new NotFoundError('Recurso');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Recurso não encontrado',
        code: 'NOT_FOUND'
      });
    });

    it('deve tratar AppError genérico corretamente', () => {
      const error = new AppError('Erro da aplicação', 422, 'CUSTOM_ERROR');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro da aplicação',
        code: 'CUSTOM_ERROR'
      });
    });

    it('deve tratar erro não conhecido como erro interno', () => {
      const error = new Error('Erro desconhecido');
      
      controller.handleError(error, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Erro interno do servidor.',
        code: 'INTERNAL_ERROR'
      });
    });
  });

  describe('createSchedule', () => {
    beforeEach(() => {
      mockReq.body = TestDataFactory.createValidScheduleData();
    });

    it('deve criar agendamento com sucesso', async () => {
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      mockService.createSchedule.mockResolvedValue(expectedResult);

      await controller.createSchedule(mockReq, mockRes);

      expect(mockService.createSchedule).toHaveBeenCalledWith(mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expectedResult,
        message: 'Agendamento criado com sucesso'
      });
    });

    it('deve tratar erro do service', async () => {
      const error = new ValidationError('Dados inválidos', 'recipient');
      mockService.createSchedule.mockRejectedValue(error);

      await controller.createSchedule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Dados inválidos',
        field: 'recipient',
        code: 'VALIDATION_ERROR'
      });
    });
  });

  describe('getScheduleById', () => {
    beforeEach(() => {
      mockReq.params = { id: TEST_CONSTANTS.VALID_UUID };
    });

    it('deve buscar agendamento com sucesso', async () => {
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      mockService.getScheduleById.mockResolvedValue(expectedResult);

      await controller.getScheduleById(mockReq, mockRes);

      expect(mockService.getScheduleById).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expectedResult
      });
    });

    it('deve tratar agendamento não encontrado', async () => {
      const error = new NotFoundError('Agendamento');
      mockService.getScheduleById.mockRejectedValue(error);

      await controller.getScheduleById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Agendamento não encontrado',
        code: 'NOT_FOUND'
      });
    });

    it('deve tratar ID inválido', async () => {
      const error = new ValidationError('ID inválido', 'id');
      mockService.getScheduleById.mockRejectedValue(error);

      await controller.getScheduleById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('cancelSchedule', () => {
    beforeEach(() => {
      mockReq.params = { id: TEST_CONSTANTS.VALID_UUID };
    });

    it('deve cancelar agendamento com sucesso', async () => {
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      mockService.cancelSchedule.mockResolvedValue(expectedResult);

      await controller.cancelSchedule(mockReq, mockRes);

      expect(mockService.cancelSchedule).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expectedResult,
        message: 'Agendamento cancelado com sucesso'
      });
    });

    it('deve tratar erro de cancelamento', async () => {
      const error = new ValidationError('Não é possível cancelar agendamento enviado', 'status');
      mockService.cancelSchedule.mockRejectedValue(error);

      await controller.cancelSchedule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateSchedule', () => {
    beforeEach(() => {
      mockReq.params = { id: TEST_CONSTANTS.VALID_UUID };
      mockReq.body = { message: 'Nova mensagem' };
    });

    it('deve atualizar agendamento com sucesso', async () => {
      const expectedResult = TestDataFactory.createValidScheduleResponse({ message: 'Nova mensagem' });
      mockService.updateSchedule.mockResolvedValue(expectedResult);

      await controller.updateSchedule(mockReq, mockRes);

      expect(mockService.updateSchedule).toHaveBeenCalledWith(TEST_CONSTANTS.VALID_UUID, mockReq.body);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expectedResult,
        message: 'Agendamento atualizado com sucesso'
      });
    });

    it('deve tratar erro de atualização', async () => {
      const error = new ValidationError('Canal inválido', 'channel');
      mockService.updateSchedule.mockRejectedValue(error);

      await controller.updateSchedule(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('listSchedules', () => {
    beforeEach(() => {
      mockReq.query = TestDataFactory.createPaginationFilters();
    });

    it('deve listar agendamentos com sucesso', async () => {
      const schedules = [TestDataFactory.createValidScheduleResponse()];
      const serviceResult = {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        schedules
      };
      
      mockService.listSchedules.mockResolvedValue(serviceResult);

      await controller.listSchedules(mockReq, mockRes);

      expect(mockService.listSchedules).toHaveBeenCalledWith(mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: schedules,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });
    });

    it('deve tratar erro de listagem', async () => {
      const error = new ValidationError('Status inválido', 'status');
      mockService.listSchedules.mockRejectedValue(error);

      await controller.listSchedules(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('deve listar com filtros personalizados', async () => {
      mockReq.query = { status: 'pendente', page: 2, limit: 5 };
      const serviceResult = {
        total: 10,
        page: 2,
        limit: 5,
        totalPages: 2,
        schedules: []
      };
      
      mockService.listSchedules.mockResolvedValue(serviceResult);

      await controller.listSchedules(mockReq, mockRes);

      expect(mockService.listSchedules).toHaveBeenCalledWith(mockReq.query);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: [],
        pagination: {
          total: 10,
          page: 2,
          limit: 5,
          totalPages: 2
        }
      });
    });
  });

  describe('context binding', () => {
    it('deve manter contexto quando método é chamado via bind', async () => {
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      mockService.createSchedule.mockResolvedValue(expectedResult);
      mockReq.body = TestDataFactory.createValidScheduleData();

      // Simula como seria chamado no Express com bind
      const boundMethod = controller.createSchedule.bind(controller);
      await boundMethod(mockReq, mockRes);

      expect(mockService.createSchedule).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });
});
