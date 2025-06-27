const request = require('supertest');
const express = require('express');
const { createCommunicationModule } = require('../../config/dependencies');
const CommunicationRoutes = require('../../routes/communicationRoutes');
const { TestDataFactory, AssertionHelpers, TEST_CONSTANTS } = require('../helpers/testHelpers');

// Simula o comportamento do PrismaClient para os testes 
const mockPrismaClient = {
  communication: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  $disconnect: jest.fn(),
  $queryRaw: jest.fn()
};

// Substitui o PrismaClient original pelo mock durante os testes (injeção no lugar do real)
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient)
}));

describe('Integration Tests - Communication API', () => {
  let app;
  let communicationRoutes;

  // Recria a aplicação Express e configura rotas/middlewares antes de cada teste
  beforeEach(() => {

    app = express();
    app.use(express.json());

    communicationRoutes = new CommunicationRoutes();
    app.use('/api', communicationRoutes.getRouter());

    jest.clearAllMocks();
  });

  describe('POST /api/schedules', () => {
    it('deve criar agendamento com sucesso - fluxo completo', async () => {
      const scheduleData = TestDataFactory.createValidScheduleData();
      const expectedResponse = TestDataFactory.createValidScheduleResponse();
      
      mockPrismaClient.communication.create.mockResolvedValue(expectedResponse);

      const response = await request(app)
        .post('/api/schedules')
        .send(scheduleData);

      AssertionHelpers.expectSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.message).toBe('Agendamento criado com sucesso');
      
      // Verifica se o método create foi chamado com os dados esperados
      expect(mockPrismaClient.communication.create).toHaveBeenCalledWith({
        data: {
          recipient: scheduleData.recipient,
          message: scheduleData.message,
          channel: scheduleData.channel.toLowerCase(),
          scheduledAt: expect.any(Date),
          status: 'pendente'
        }
      });
    });

    it('deve normalizar canal para minúsculas', async () => {
      const scheduleData = TestDataFactory.createValidScheduleData({ channel: 'EMAIL' });
      mockPrismaClient.communication.create.mockResolvedValue(TestDataFactory.createValidScheduleResponse());

      const response = await request(app)
        .post('/api/schedules')
        .send(scheduleData);

      AssertionHelpers.expectSuccessResponse(response, 201);
      // Verifica se o canal foi convertido para minúsculo antes de persistir
      expect(mockPrismaClient.communication.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channel: 'email'
        })
      });
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/schedules')
        .send({});

      AssertionHelpers.expectValidationError(response);
      expect(mockPrismaClient.communication.create).not.toHaveBeenCalled();
    });

    it('deve validar formato do canal', async () => {
      const invalidData = TestDataFactory.createInvalidScheduleData('invalid_channel_type');

      const response = await request(app)
        .post('/api/schedules')
        .send(invalidData);

      AssertionHelpers.expectValidationError(response, 'channel');
    });

    it('deve rejeitar data no passado', async () => {
      const invalidData = TestDataFactory.createInvalidScheduleData('past_date');

      const response = await request(app)
        .post('/api/schedules')
        .send(invalidData);

      AssertionHelpers.expectValidationError(response, 'scheduledAt');
    });
  });

  describe('GET /api/schedules/:id', () => {
    it('deve buscar agendamento por ID com sucesso', async () => {
      const expectedSchedule = TestDataFactory.createValidScheduleResponse();
      mockPrismaClient.communication.findUnique.mockResolvedValue(expectedSchedule);

      const response = await request(app)
        .get(`/api/schedules/${TEST_CONSTANTS.VALID_UUID}`);

      AssertionHelpers.expectSuccessResponse(response);
      AssertionHelpers.expectDataToMatch(response.body.data, expectedSchedule);
      expect(mockPrismaClient.communication.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.VALID_UUID }
      });
    });

    it('deve retornar 404 para agendamento não encontrado', async () => {
      mockPrismaClient.communication.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/schedules/${TEST_CONSTANTS.VALID_UUID}`);

      AssertionHelpers.expectNotFoundError(response);
    });

    it('deve validar formato do UUID', async () => {
      const response = await request(app)
        .get(`/api/schedules/${TEST_CONSTANTS.INVALID_UUID}`);

      AssertionHelpers.expectValidationError(response, 'id');
    });
  });

  describe('PUT /api/schedules/:id', () => {
    beforeEach(() => {
      mockPrismaClient.communication.findUnique.mockResolvedValue(
        TestDataFactory.createValidScheduleResponse()
      );
    });

    it('deve atualizar agendamento com sucesso', async () => {
      const updateData = { message: 'Nova mensagem', channel: 'SMS' };
      const updatedSchedule = TestDataFactory.createValidScheduleResponse(updateData);
      
      mockPrismaClient.communication.update.mockResolvedValue(updatedSchedule);

      const response = await request(app)
        .put(`/api/schedules/${TEST_CONSTANTS.VALID_UUID}`)
        .send(updateData);

      AssertionHelpers.expectSuccessResponse(response);
      AssertionHelpers.expectDataToMatch(response.body.data, updatedSchedule);
      expect(response.body.message).toBe('Agendamento atualizado com sucesso');
      
      expect(mockPrismaClient.communication.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.VALID_UUID },
        data: {
          message: 'Nova mensagem',
          channel: 'sms'
        }
      });
    });

    it('deve validar canal na atualização', async () => {
      const response = await request(app)
        .put(`/api/schedules/${TEST_CONSTANTS.VALID_UUID}`)
        .send({ channel: 'invalid-channel' });

      AssertionHelpers.expectValidationError(response, 'channel');
    });

    it('deve retornar 404 para agendamento inexistente', async () => {
      mockPrismaClient.communication.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/schedules/${TEST_CONSTANTS.VALID_UUID}`)
        .send({ message: 'Nova mensagem' });

      AssertionHelpers.expectNotFoundError(response);
    });
  });

  describe('DELETE /api/schedules/:id', () => {
    beforeEach(() => {
      mockPrismaClient.communication.findUnique.mockResolvedValue(
        TestDataFactory.createValidScheduleResponse({ status: 'pendente' })
      );
    });

    it('deve cancelar agendamento com sucesso', async () => {
      const deletedSchedule = TestDataFactory.createValidScheduleResponse();
      mockPrismaClient.communication.delete.mockResolvedValue(deletedSchedule);

      const response = await request(app)
        .delete(`/api/schedules/${TEST_CONSTANTS.VALID_UUID}`);

      expect(response.status).toBe(204);           
      expect(response.body).toEqual({});           
      expect(response.text).toBe('');            
      expect(mockPrismaClient.communication.delete).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.VALID_UUID }
      });
    });

    it('deve impedir cancelamento de agendamento enviado', async () => {
      mockPrismaClient.communication.findUnique.mockResolvedValue(
        TestDataFactory.createValidScheduleResponse({ status: 'enviado' })
      );

      const response = await request(app)
        .delete(`/api/schedules/${TEST_CONSTANTS.VALID_UUID}`);

      AssertionHelpers.expectValidationError(response, 'status');
      expect(mockPrismaClient.communication.delete).not.toHaveBeenCalled();
    });

    it('deve retornar 404 para agendamento inexistente', async () => {
      mockPrismaClient.communication.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/schedules/${TEST_CONSTANTS.VALID_UUID}`);

      AssertionHelpers.expectNotFoundError(response);
    });
  });

  describe('GET /api/schedules', () => {
    it('deve listar agendamentos com paginação padrão', async () => {
      const schedules = [TestDataFactory.createValidScheduleResponse()];
      mockPrismaClient.communication.findMany.mockResolvedValue(schedules);
      mockPrismaClient.communication.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/schedules');

      AssertionHelpers.expectPaginatedResponse(response, 1);
      AssertionHelpers.expectDataToMatch(response.body.data, schedules);
      expect(response.body.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      });
    });

    it('deve aplicar filtros de paginação', async () => {
      mockPrismaClient.communication.findMany.mockResolvedValue([]);
      mockPrismaClient.communication.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/schedules?page=2&limit=5');

      AssertionHelpers.expectSuccessResponse(response);
      expect(mockPrismaClient.communication.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('deve aplicar filtro de status', async () => {
      mockPrismaClient.communication.findMany.mockResolvedValue([]);
      mockPrismaClient.communication.count.mockResolvedValue(0);

      const response = await request(app)
        .get('/api/schedules?status=pendente');

      AssertionHelpers.expectSuccessResponse(response);
      expect(mockPrismaClient.communication.findMany).toHaveBeenCalledWith({
        where: { status: 'pendente' },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' }
      });
    });

    it('deve validar parâmetros de paginação', async () => {
      const response = await request(app)
        .get('/api/schedules?page=0');

      AssertionHelpers.expectValidationError(response, 'page');
    });

    it('deve validar status de filtro', async () => {
      const response = await request(app)
        .get('/api/schedules?status=invalid-status');

      AssertionHelpers.expectValidationError(response, 'status');
    });
  });

  // Executa o fluxo completo: criar, buscar, atualizar, listar e cancelar um agendamento
  describe('Fluxo completo de agendamento', () => {
    it('deve executar CRUD completo com sucesso', async () => {
      const scheduleData = TestDataFactory.createValidScheduleData();
      const createdSchedule = TestDataFactory.createValidScheduleResponse();
      
      // 1. Criar agendamento
      mockPrismaClient.communication.create.mockResolvedValue(createdSchedule);
      
      const createResponse = await request(app)
        .post('/api/schedules')
        .send(scheduleData);
      
      AssertionHelpers.expectSuccessResponse(createResponse, 201);
      const scheduleId = createResponse.body.data.id;

      // 2. Buscar agendamento criado
      mockPrismaClient.communication.findUnique.mockResolvedValue(createdSchedule);
      
      const getResponse = await request(app)
        .get(`/api/schedules/${scheduleId}`);
      
      AssertionHelpers.expectSuccessResponse(getResponse);

      // 3. Atualizar agendamento
      const updatedData = { message: 'Mensagem atualizada' };
      const updatedSchedule = TestDataFactory.createValidScheduleResponse(updatedData);
      
      mockPrismaClient.communication.update.mockResolvedValue(updatedSchedule);
      
      const updateResponse = await request(app)
        .put(`/api/schedules/${scheduleId}`)
        .send(updatedData);
      
      AssertionHelpers.expectSuccessResponse(updateResponse);

      // 4. Listar agendamentos
      mockPrismaClient.communication.findMany.mockResolvedValue([updatedSchedule]);
      mockPrismaClient.communication.count.mockResolvedValue(1);
      
      const listResponse = await request(app)
        .get('/api/schedules');
      
      AssertionHelpers.expectPaginatedResponse(listResponse, 1);

      // 5. Cancelar agendamento
      mockPrismaClient.communication.delete.mockResolvedValue(updatedSchedule);
      
      const deleteResponse = await request(app)
        .delete(`/api/schedules/${scheduleId}`);
      
      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.text).toBe('');
    });
  });
});
