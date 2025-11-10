-- Criar tabela para histórico de tentativas de contato
CREATE TABLE IF NOT EXISTS tentativas_contato (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    data_hora DATETIME NOT NULL,
    resultado ENUM('Atendeu', 'Não atendeu', 'Número incorreto', 'Caixa postal') NOT NULL,
    observacao TEXT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos_regulacao(id)
);

-- Adicionar campos necessários na tabela pedidos_regulacao
ALTER TABLE pedidos_regulacao
ADD COLUMN IF NOT EXISTS status_agendamento ENUM(
    'Pendente', 
    'Em tentativa de contato', 
    'Agendado', 
    'Cancelado por não contato'
) DEFAULT 'Pendente',
ADD COLUMN IF NOT EXISTS data_agendamento DATETIME,
ADD COLUMN IF NOT EXISTS tentativas_contato INT DEFAULT 0;