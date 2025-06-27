const CommunicationRepository = require('../../repository/communicationRepository');
const { DatabaseError } = require('../../utils/errors');
const { TestDataFactory, TEST_CONSTANTS } = require('../helpers/testHelpers');

// Criação de mock do PrismaClient para simular operações de banco
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

// Substitui o PrismaClient real pelo mock
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrismaClient)
}));

describe('CommunicationRepository', () => {
  let repository;

  // Antes de cada teste, instancia o repositório e limpa os mocks
  beforeEach(() => {
    repository = new CommunicationRepository(mockPrismaClient);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('deve usar o cliente Prisma fornecido', () => {
      const customClient = { test: 'client' };
      const repo = new CommunicationRepository(customClient);
      expect(repo.prisma).toBe(customClient);
    });

    it('deve criar um novo cliente Prisma se nenhum for fornecido', () => {
      const repo = new CommunicationRepository();
      expect(repo.prisma).toBeDefined();
    });
  });

  describe('create', () => {
    it('deve criar um agendamento com sucesso', async () => {
      const scheduleData = TestDataFactory.createValidScheduleData();
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      
      mockPrismaClient.communication.create.mockResolvedValue(expectedResult);

      const result = await repository.create(scheduleData);

      // Verifica se os dados corretos foram enviados para o Prisma
      expect(mockPrismaClient.communication.create).toHaveBeenCalledWith({
        data: {
          recipient: scheduleData.recipient,
          message: scheduleData.message,
          channel: scheduleData.channel,
          scheduledAt: scheduleData.scheduledAt,
          status: 'pendente'
        }
      });
      expect(result).toEqual(expectedResult);
    });

    it('deve usar status fornecido se presente', async () => {
      const scheduleData = TestDataFactory.createValidScheduleData({ status: 'enviado' });
      
      mockPrismaClient.communication.create.mockResolvedValue({});

      await repository.create(scheduleData);

      expect(mockPrismaClient.communication.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'enviado'
        })
      });
    });

    it('deve lançar DatabaseError quando Prisma falha', async () => {
      const scheduleData = TestDataFactory.createValidScheduleData();
      const prismaError = new Error('Prisma error');
      
      mockPrismaClient.communication.create.mockRejectedValue(prismaError);

      await expect(repository.create(scheduleData)).rejects.toThrow(DatabaseError);
      await expect(repository.create(scheduleData)).rejects.toThrow('Falha ao criar agendamento no banco de dados');
    });
  });

  // Demais testes seguem o mesmo padrão, todos testando sucesso e falha
  describe('findById', () => {
    it('deve buscar agendamento por ID com sucesso', async () => {
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      
      mockPrismaClient.communication.findUnique.mockResolvedValue(expectedResult);

      const result = await repository.findById(TEST_CONSTANTS.VALID_UUID);

      expect(mockPrismaClient.communication.findUnique).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.VALID_UUID }
      });
      expect(result).toEqual(expectedResult);
    });

    it('deve retornar null quando agendamento não encontrado', async () => {
      mockPrismaClient.communication.findUnique.mockResolvedValue(null);

      const result = await repository.findById(TEST_CONSTANTS.VALID_UUID);

      expect(result).toBeNull();
    });

    it('deve lançar DatabaseError quando Prisma falha', async () => {
      const prismaError = new Error('Prisma error');
      
      mockPrismaClient.communication.findUnique.mockRejectedValue(prismaError);

      await expect(repository.findById(TEST_CONSTANTS.VALID_UUID)).rejects.toThrow(DatabaseError);
    });
  });

  describe('update', () => {
    it('deve atualizar agendamento com sucesso', async () => {
      const updateData = { message: 'Nova mensagem' };
      const expectedResult = TestDataFactory.createValidScheduleResponse(updateData);
      
      mockPrismaClient.communication.update.mockResolvedValue(expectedResult);

      const result = await repository.update(TEST_CONSTANTS.VALID_UUID, updateData);

      expect(mockPrismaClient.communication.update).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.VALID_UUID },
        data: updateData
      });
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar DatabaseError quando Prisma falha', async () => {
      const prismaError = new Error('Prisma error');
      
      mockPrismaClient.communication.update.mockRejectedValue(prismaError);

      await expect(repository.update(TEST_CONSTANTS.VALID_UUID, {})).rejects.toThrow(DatabaseError);
    });
  });

  describe('delete', () => {
    it('deve deletar agendamento com sucesso', async () => {
      const expectedResult = TestDataFactory.createValidScheduleResponse();
      
      mockPrismaClient.communication.delete.mockResolvedValue(expectedResult);

      const result = await repository.delete(TEST_CONSTANTS.VALID_UUID);

      expect(mockPrismaClient.communication.delete).toHaveBeenCalledWith({
        where: { id: TEST_CONSTANTS.VALID_UUID }
      });
      expect(result).toEqual(expectedResult);
    });

    it('deve lançar DatabaseError quando Prisma falha', async () => {
      const prismaError = new Error('Prisma error');
      
      mockPrismaClient.communication.delete.mockRejectedValue(prismaError);

      await expect(repository.delete(TEST_CONSTANTS.VALID_UUID)).rejects.toThrow(DatabaseError);
    });
  });

  describe('findMany', () => {
    it('deve buscar agendamentos com filtros padrão', async () => {
      const expectedResult = [TestDataFactory.createValidScheduleResponse()];
      
      mockPrismaClient.communication.findMany.mockResolvedValue(expectedResult);

      const result = await repository.findMany();

      expect(mockPrismaClient.communication.findMany).toHaveBeenCalledWith({
        where: {},
        skip: undefined,
        take: undefined,
        orderBy: { createdAt: 'desc' }
      });
      expect(result).toEqual(expectedResult);
    });

    it('deve aplicar filtros fornecidos', async () => {
      const filters = {
        status: 'pendente',
        skip: 10,
        take: 5,
        orderBy: { scheduledAt: 'asc' }
      };
      
      mockPrismaClient.communication.findMany.mockResolvedValue([]);

      await repository.findMany(filters);

      expect(mockPrismaClient.communication.findMany).toHaveBeenCalledWith({
        where: { status: 'pendente' },
        skip: 10,
        take: 5,
        orderBy: { scheduledAt: 'asc' }
      });
    });

    it('deve lançar DatabaseError quando Prisma falha', async () => {
      const prismaError = new Error('Prisma error');
      
      mockPrismaClient.communication.findMany.mockRejectedValue(prismaError);

      await expect(repository.findMany()).rejects.toThrow(DatabaseError);
    });
  });

  describe('count', () => {
    it('deve contar agendamentos sem filtros', async () => {
      mockPrismaClient.communication.count.mockResolvedValue(5);

      const result = await repository.count();

      expect(mockPrismaClient.communication.count).toHaveBeenCalledWith({
        where: {}
      });
      expect(result).toBe(5);
    });

    it('deve aplicar filtros de status', async () => {
      mockPrismaClient.communication.count.mockResolvedValue(3);

      const result = await repository.count({ status: 'pendente' });

      expect(mockPrismaClient.communication.count).toHaveBeenCalledWith({
        where: { status: 'pendente' }
      });
      expect(result).toBe(3);
    });

    it('deve lançar DatabaseError quando Prisma falha', async () => {
      const prismaError = new Error('Prisma error');
      
      mockPrismaClient.communication.count.mockRejectedValue(prismaError);

      await expect(repository.count()).rejects.toThrow(DatabaseError);
    });
  });

  describe('disconnect', () => {
    it('deve desconectar do banco com sucesso', async () => {
      mockPrismaClient.$disconnect.mockResolvedValue();

      await repository.disconnect();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
    });

    it('deve lidar com erros de desconexão graciosamente', async () => {
      const disconnectError = new Error('Disconnect error');
      mockPrismaClient.$disconnect.mockRejectedValue(disconnectError);

      // Não deve lançar erro
      await expect(repository.disconnect()).resolves.toBeUndefined();
    });
  });

  describe('healthCheck', () => {
    it('deve retornar status healthy quando banco está acessível', async () => {
      mockPrismaClient.$queryRaw.mockResolvedValue([{ '1': 1 }]);

      const result = await repository.healthCheck();

      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(mockPrismaClient.$queryRaw).toHaveBeenCalled();
    });

    it('deve retornar status unhealthy quando banco falha', async () => {
      const dbError = new Error('Database connection failed');
      mockPrismaClient.$queryRaw.mockRejectedValue(dbError);

      const result = await repository.healthCheck();

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe(dbError.message);
      expect(result.timestamp).toBeDefined();
    });
  });
});
