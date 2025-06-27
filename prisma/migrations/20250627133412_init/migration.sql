-- CreateTable
CREATE TABLE `Communication` (
    `id` VARCHAR(191) NOT NULL,
    `destinatario_email` VARCHAR(191) NOT NULL,
    `mensagem_conteudo` VARCHAR(191) NOT NULL,
    `canal_comunicacao` VARCHAR(191) NOT NULL,
    `data_agendada_envio` DATETIME(3) NOT NULL,
    `status_envio` VARCHAR(191) NOT NULL DEFAULT 'pendente',
    `data_criacao` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
