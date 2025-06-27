const { PrismaClient } = require('@prisma/client');
const { DatabaseError } = require('../utils/errors');

class CommunicationRepository {
  constructor(prismaClient = null) {
    this.prisma = prismaClient || new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
      errorFormat: 'pretty'
    });
  }

  async create(data) {
    try {
      return await this.prisma.communication.create({
        data: {
          recipient: data.recipient,
          message: data.message,
          channel: data.channel,
          scheduledAt: data.scheduledAt,
          status: data.status || 'pendente'
        }
      });
    } catch (error) {
      console.error('Erro no repositório ao criar:', error);
      throw new DatabaseError('Falha ao criar agendamento no banco de dados', error);
    }
  }

  async findById(id) {
    try {
      return await this.prisma.communication.findUnique({
        where: { id }
      });
    } catch (error) {
      console.error('Erro no repositório ao buscar por ID:', error);
      throw new DatabaseError('Falha ao buscar agendamento no banco de dados', error);
    }
  }

  async update(id, data) {
    try {
      return await this.prisma.communication.update({
        where: { id },
        data
      });
    } catch (error) {
      console.error('Erro no repositório ao atualizar:', error);
      throw new DatabaseError('Falha ao atualizar agendamento no banco de dados', error);
    }
  }

  async delete(id) {
    try {
      return await this.prisma.communication.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Erro no repositório ao deletar:', error);
      throw new DatabaseError('Falha ao deletar agendamento no banco de dados', error);
    }
  }

  async findMany(filters = {}) {
    try {
      const { status, skip, take, orderBy } = filters;
      
      const where = status ? { status } : {};
      
      return await this.prisma.communication.findMany({
        where,
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' }
      });
    } catch (error) {
      console.error('Erro no repositório ao listar:', error);
      throw new DatabaseError('Falha ao listar agendamentos no banco de dados', error);
    }
  }

  async count(filters = {}) {
    try {
      const { status } = filters;
      const where = status ? { status } : {};
      
      return await this.prisma.communication.count({ where });
    } catch (error) {
      console.error('Erro no repositório ao contar:', error);
      throw new DatabaseError('Falha ao contar agendamentos no banco de dados', error);
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
    } catch (error) {
      console.error('Erro ao desconectar do banco:', error);
    }
  }

  // Método para verificar a saúde da conexão
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      console.error('Health check falhou:', error);
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }
}

module.exports = CommunicationRepository;
