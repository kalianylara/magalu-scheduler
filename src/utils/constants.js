const validChannels = ['email', 'sms', 'push', 'whatsapp'];

const allowedStatuses = ['pendente', 'enviado', 'cancelado'];

const errorMessages = {
  invalidChannel: 'Canal de comunicação inválido. Use: email, sms, push ou whatsapp.',
  requiredFields: 'Todos os campos são obrigatórios.',
  invalidId: 'ID inválido. Esperado UUID v4.',
  scheduleNotFound: 'Agendamento não encontrado.',
  internalError: 'Erro interno do servidor.',
  invalidChannelFormat: 'Formato do canal inválido. Deve ser uma string.',
  invalidStatus: 'Status inválido. Use: pendente, enviado ou cancelado.'
};

module.exports = {
  validChannels,
  allowedStatuses,
  errorMessages
};
