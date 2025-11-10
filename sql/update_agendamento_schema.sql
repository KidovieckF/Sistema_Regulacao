-- Adicionar as colunas necessárias para o agendamento
ALTER TABLE pedidos_regulacao
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20) AFTER nome_paciente,
ADD COLUMN IF NOT EXISTS status_agendamento ENUM(
    'Pendente', 
    'Em tentativa de contato', 
    'Agendado', 
    'Cancelado por não contato'
) DEFAULT 'Pendente',
ADD COLUMN IF NOT EXISTS tentativas_contato INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_agendamento DATETIME;

-- Criar tabela para histórico de tentativas de contato se não existir
CREATE TABLE IF NOT EXISTS tentativas_contato (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    data_hora DATETIME NOT NULL,
    resultado ENUM('Atendeu', 'Não atendeu', 'Número incorreto', 'Caixa postal') NOT NULL,
    observacao TEXT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos_regulacao(id)
);

-- Atualizar pedidos existentes para status inicial
UPDATE pedidos_regulacao 
SET status_agendamento = 'Pendente',
    tentativas_contato = 0
WHERE status_agendamento IS NULL;