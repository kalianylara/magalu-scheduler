<p align="center">
  <img src="https://img.shields.io/badge/Node.js-9e9e9e?style=for-the-badge&logo=node.js&color=555555" />
  <img src="https://img.shields.io/badge/EXPRESS-9e9e9e?style=for-the-badge&logo=express&color=555555" />
  <img src="https://img.shields.io/badge/Javascript-9e9e9e?style=for-the-badge&logo=javascript&logoColor=white&color=555555" />
  <img src="https://img.shields.io/badge/Prisma-9e9e9e?style=for-the-badge&logo=prisma&color=555555" />
  <img src="https://img.shields.io/badge/MySQL-9e9e9e?style=for-the-badge&logo=mysql&logoColor=white&color=555555" />
  <img src="https://img.shields.io/badge/Jest-9e9e9e?style=for-the-badge&logo=jest&color=555555" />
</p>

<h1 align="center"><strong>Magalu Scheduler</strong></h1>
<p align="center"><em>Sistema backend para agendamento e envio de mensagens para clientes Magalu</em></p>

<p align="center">
  <a href="#comecar">🚀 Início</a> • 
  <a href="#rotas">📌 Endpoints</a> • 
  <a href="#testes">🧪 Testes</a> • 
</p>

<p align="center">
  <b>API RESTful para agendamento, consulta e gerenciamento de envios de mensagens (email, SMS, push, WhatsApp) para clientes Magalu. Desenvolvido em Node.js com Express, Prisma e MySQL.</b>
</p>

## Tecnologias e Ferramentas

- **Node.js** – Ambiente de execução JavaScript no backend
- **Express.js** – Framework minimalista para rotas e middlewares
- **Prisma ORM** – Mapeamento objeto-relacional para interação com o MySQL
- **MySQL** – Banco de dados relacional
- **Jest** – Framework de testes para validação de funcionalidades
- **Supertest** – Biblioteca para testar requisições HTTP

<h2 id="comecar"> Como começar</h2>

Esta seção descreve os passos necessários para executar o projeto localmente.

<h3>Pré-requisitos</h3>

Antes de iniciar, certifique-se de que as seguintes ferramentas estejam instaladas:

- [Node.js (versão 16 ou superior)](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [MySQL (versão 8 ou superior)](https://www.mysql.com/)

<h3>Setup Rápido</h3>

1. **Clone e acesse o projeto:**
```bash
git clone https://github.com/kalianylara/magalu-scheduler.git
cd magalu-scheduler
```

<h3>Banco de Dados</h3>

Você pode utilizar o MySQL de duas formas: via Docker (forma mais rápida e portátil) ou com uma instalação local existente.

#### Opção 1: Utilizando Docker (recomendado)

Se você **não possui o MySQL instalado** localmente, execute o comando abaixo para subir uma instância rapidamente:

```bash
docker run --name mysql-magalu \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=magalu_scheduler \
  -p 3306:3306 \
  -d mysql:8.0
```

Isso criará um banco com as seguintes credenciais:

- **Usuário**: `root`
- **Senha**: `root`
- **Banco de dados**: `magalu_scheduler`
- **Porta**: `3306`

Depois, configure sua variável `DATABASE_URL` no arquivo `.env` com:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/magalu_scheduler"
```

#### Opção 2: Utilizando MySQL instalado localmente

Se você **já possui o MySQL instalado**, configure sua variável `DATABASE_URL` no arquivo `.env`, e execute o comando abaixo — o banco de dados será criado automaticamente se ainda não existir:

```bash
npx prisma migrate dev --name init
npx prisma generate
```

<h3>Variáveis de Ambiente</h3>

Copie o arquivo `.env.example` para `.env` e configure as variáveis necessárias:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/nome_do_banco"
```

<h3>Instalando as dependências</h3>

Instale as dependências do projeto com o comando:

```bash
npm install
```

<h3>Executando a aplicação</h3>

Para iniciar o servidor localmente, utilize:

```bash
npm start
```

<h2 id="rotas">Endpoints da API</h2>

Abaixo estão listadas as principais rotas da API Magalu Scheduler, junto com exemplos esperados de requisição e resposta.

| Rota                         | Descrição                                                  |
|------------------------------|------------------------------------------------------------|
| <kbd>POST /api/schedules</kbd>        | Cria um novo agendamento                          |
| <kbd>GET /api/schedules/:id</kbd>     | Busca um agendamento pelo ID                      |
| <kbd>PUT /api/schedules/:id</kbd>     | Atualiza um agendamento existente                 |
| <kbd>DELETE /api/schedules/:id</kbd>  | Cancela (exclui) um agendamento                   |
| <kbd>GET /api/schedules</kbd>         | Lista todos os agendamentos com filtros opcionais |

<h3 id="post-schedule">POST /api/schedules</h3>

**REQUISIÇÃO**
```json
{
  "recipient": "usuario@example.com",
  "message": "Mensagem teste",
  "channel": "email",
  "scheduledAt": "2025-07-01T12:00:00.000Z"
}
```

**RESPOSTA**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "recipient": "usuario@example.com",
  "message": "Mensagem teste",
  "channel": "email",
  "scheduledAt": "2025-07-01T12:00:00.000Z",
  "createdAt": "2025-06-25T14:00:00.000Z"
}
```

<h3 id="get-schedule">GET /api/schedules/:id</h3>

**RESPOSTA**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "recipient": "usuario@example.com",
  "message": "Mensagem teste",
  "channel": "email",
  "scheduledAt": "2025-07-01T12:00:00.000Z",
  "status": "pendente",
  "createdAt": "2025-06-25T14:00:00.000Z"
}
```

<h3 id="put-schedule">PUT /api/schedules/:id</h3>

**REQUISIÇÃO**
```json
{
  "message": "Mensagem atualizada",
  "status": "enviado"
}
```

**RESPOSTA**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "message": "Mensagem atualizada",
  "status": "enviado"
}
```

<h3 id="delete-schedule">DELETE /api/schedules/:id</h3>

**RESPOSTA**
```json
{
  "message": "Agendamento cancelado com sucesso.",
  "deleted": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

<h3 id="get-all-schedules">GET /api/schedules</h3>

**Parâmetros de consulta opcionais**
- `status`: Filtra por status (`pendente`, `enviado`, `cancelado`)
- `page`: Página (padrão: 1)
- `limit`: Itens por página (padrão: 10)

**RESPOSTA**
```json
{
  "total": 25,
  "page": 1,
  "limit": 10,
  "schedules": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "recipient": "usuario@example.com",
      "message": "Mensagem teste",
      "status": "pendente"
    }
  ]
}
```

<h2 id="testes">Testes</h2>

Para executar os testes automatizados, utilize:

```bash
npm test
```

<h3 id="cobertura">Cobertura de Testes</h3>
A cobertura de testes será exibida automaticamente, pois o script `test` está configurado com `--coverage`.

### Princípios Aplicados
- **Injeção de Dependências**: Container customizado para gerenciamento
- **Separação de Responsabilidades**: Cada classe tem uma única responsabilidade
- **Testabilidade**: Testes unitários isolados com 89% de cobertura
- **Manutenibilidade**: Código modular e bem estruturado

---
📄 Licença: MIT  
💼 Desenvolvido por [Kaliany Lara](https://github.com/kalianylara)
