// Helpers para testes

// Dados de teste válidos
const validScheduleData = {
  recipient: 'teste@example.com',
  message: 'Mensagem de teste',
  channel: 'email',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Amanhã
};

const validScheduleResponse = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  recipient: 'teste@example.com',
  message: 'Mensagem de teste',
  channel: 'email',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  status: 'pendente',
  createdAt: new Date()
};

// Fábrica para gerar dados de teste 
class TestDataFactory {
  static createValidScheduleData(overrides = {}) {
    return {
      ...validScheduleData,
      ...overrides
    };
  }

  static createValidScheduleResponse(overrides = {}) {
    return {
      ...validScheduleResponse,
      ...overrides
    };
  }

  static createInvalidScheduleData(type) {
    const base = { ...validScheduleData };
    
    switch (type) {
      case 'missing_recipient':
        delete base.recipient;
        break;
      case 'missing_message':
        delete base.message;
        break;
      case 'missing_scheduledAt':
        delete base.scheduledAt;
        break;
      case 'invalid_channel':
        base.channel = 'invalid-channel';
        break;
      case 'invalid_channel_type':
        base.channel = 123;
        break;
      case 'past_date':
        base.scheduledAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // Ontem
        break;
      default:
        throw new Error(`Tipo de dados inválidos não reconhecido: ${type}`);
    }
    
    return base;
  }

  static createPaginationFilters(overrides = {}) {
    return {
      page: 1,
      limit: 10,
      status: undefined,
      ...overrides
    };
  }
}

// Mock helpers
class MockHelpers {
  static createMockRepository() {
    return {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      disconnect: jest.fn(),
      healthCheck: jest.fn()
    };
  }

  static createMockService() {
    return {
      createSchedule: jest.fn(),
      getScheduleById: jest.fn(),
      updateSchedule: jest.fn(),
      cancelSchedule: jest.fn(),
      listSchedules: jest.fn()
    };
  }

  static createMockExpressResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  }

  static createMockExpressRequest(overrides = {}) {
    return {
      body: {},
      params: {},
      query: {},
      ...overrides
    };
  }
}

// Utilitários para normalização de dados
class DataNormalizers {

  // Converte todas as datas em um objeto para strings ISO
  static normalizeDates(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => DataNormalizers.normalizeDates(item));
    }
    
    const normalized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value instanceof Date) {
        normalized[key] = value.toISOString();
      } else if (value && typeof value === 'object') {
        normalized[key] = DataNormalizers.normalizeDates(value);
      } else {
        normalized[key] = value;
      }
    }
    
    return normalized;
  }

  // Normaliza as respostas da API convertendo datas para strings
  static normalizeApiResponse(response) {
    if (response.body && response.body.data) {
      response.body.data = DataNormalizers.normalizeDates(response.body.data);
    }
    return response;
  }
}

// Assertion helpers
class AssertionHelpers {
  static expectValidationError(response, field = null) {
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('VALIDATION_ERROR');
    if (field) {
      expect(response.body.field).toBe(field);
    }
  }

  static expectNotFoundError(response) {
    expect(response.status).toBe(404);
    expect(response.body.code).toBe('NOT_FOUND');
  }

  static expectSuccessResponse(response, statusCode = 200) {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(true);
  }

  static expectPaginatedResponse(response, expectedTotal = 0) {
    AssertionHelpers.expectSuccessResponse(response);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.total).toBe(expectedTotal);
    expect(response.body.pagination.page).toBeDefined();
    expect(response.body.pagination.limit).toBeDefined();
    expect(response.body.pagination.totalPages).toBeDefined();
  }

  
  // Compara dados esperados com resposta da API, normalizando datas
  static expectDataToMatch(actualData, expectedData) {
    const normalizedActual = DataNormalizers.normalizeDates(actualData);
    const normalizedExpected = DataNormalizers.normalizeDates(expectedData);
    expect(normalizedActual).toEqual(normalizedExpected);
  }
}

// Constantes para testes
const TEST_CONSTANTS = {
  VALID_UUID: '123e4567-e89b-12d3-a456-426614174000',
  INVALID_UUID: 'invalid-uuid',
  VALID_CHANNELS: ['email', 'sms', 'push', 'whatsapp'],
  VALID_STATUSES: ['pendente', 'enviado', 'cancelado'],
  INVALID_CHANNEL: 'telegram',
  INVALID_STATUS: 'processing'
};

module.exports = {
  TestDataFactory,
  MockHelpers,
  AssertionHelpers,
  DataNormalizers,
  TEST_CONSTANTS,
  validScheduleData,
  validScheduleResponse
};
