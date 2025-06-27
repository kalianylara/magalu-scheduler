// Classe base para erros customizados da aplicação

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Captura o stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Erro de validação (400)
class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

// Erro de recurso não encontrado (404)
class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}


// Erro de conflito (409)
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}


//Erro de autorização (401)
class UnauthorizedError extends AppError {
  constructor(message = 'Acesso não autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// Erro de permissão (403)
class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Erro de banco de dados
class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  DatabaseError
};
