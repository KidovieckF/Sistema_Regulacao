-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 10/11/2025 às 19:42
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `regulacao_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `exames`
--

CREATE TABLE `exames` (
  `id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `exige_altura` tinyint(1) DEFAULT 0,
  `exige_peso` tinyint(1) DEFAULT 0,
  `ativo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `exames`
--

INSERT INTO `exames` (`id`, `nome`, `exige_altura`, `exige_peso`, `ativo`) VALUES
(1, 'Ressonância Magnética de Coluna', 1, 1, 1),
(2, 'Hemograma Completo', 0, 0, 1),
(3, 'Ultrassonografia Abdominal', 1, 0, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `pedidos_regulacao`
--

CREATE TABLE `pedidos_regulacao` (
  `id` int(11) NOT NULL,
  `protocolo` varchar(20) NOT NULL,
  `unidade_id` int(11) NOT NULL,
  `Nome_paciente` varchar(80) NOT NULL,
  `exame_id` int(11) NOT NULL,
  `prioridade` enum('P1','P2') NOT NULL,
  `altura` decimal(5,2) DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `status` enum('Enviado ao malote','Encaminhado ao médico regulador','Reprovado','Enviado para agendamento','Agendado','Pedido cancelado') DEFAULT 'Enviado ao malote',
  `data_registro` datetime DEFAULT current_timestamp(),
  `separacao` enum('Cross/Estadual','Município') DEFAULT NULL,
  `anexo` varchar(255) DEFAULT NULL,
  `status_agendamento` enum('Pendente','Em tentativa de contato','Agendado','Cancelado por não contato') DEFAULT 'Pendente',
  `data_agendamento` datetime DEFAULT NULL,
  `tentativas_contato` int(11) DEFAULT 0,
  `telefone` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `pedidos_regulacao`
--

INSERT INTO `pedidos_regulacao` (`id`, `protocolo`, `unidade_id`, `Nome_paciente`, `exame_id`, `prioridade`, `altura`, `peso`, `observacoes`, `status`, `data_registro`, `separacao`, `anexo`, `status_agendamento`, `data_agendamento`, `tentativas_contato`, `telefone`) VALUES
(19, 'R-2025-000001', 1, 'João Silva', 1, 'P1', 175.00, 70.00, 'Paciente com dor torácica', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11840063906'),
(20, 'R-2025-000002', 2, 'Maria Oliveira', 2, 'P2', 160.00, 60.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11527826008'),
(21, 'R-2025-000003', 3, 'Carlos Souza', 3, 'P1', 180.00, 85.00, 'Aguardando retorno', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11918938350'),
(22, 'R-2025-000004', 1, 'Ana Paula', 2, 'P1', 168.00, 65.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11211213754'),
(23, 'R-2025-000005', 2, 'Ricardo Santos', 1, 'P2', 170.00, 72.00, 'Paciente diabético', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11899253748'),
(24, 'R-2025-000006', 3, 'Fernanda Lima', 3, 'P1', 162.00, 59.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11162627506'),
(25, 'R-2025-000007', 1, 'Marcos Almeida', 1, 'P2', 178.00, 80.00, 'Exame solicitado após check-up', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11715376313'),
(26, 'R-2025-000008', 2, 'Patrícia Nunes', 2, 'P1', 158.00, 55.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Em tentativa de contato', NULL, 1, '11288999074'),
(27, 'R-2025-000009', 3, 'Fábio Costa', 3, 'P2', 183.00, 92.00, 'Pressão alta', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11998866462'),
(28, 'R-2025-000010', 1, 'Juliana Rocha', 2, 'P2', 165.00, 63.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11427335115'),
(29, 'R-2025-000011', 2, 'Paulo Henrique', 1, 'P1', 172.00, 68.00, 'Histórico familiar de cardiopatia', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11840076217'),
(30, 'R-2025-000012', 3, 'Camila Ferreira', 3, 'P1', 159.00, 54.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11118375769'),
(31, 'R-2025-000013', 1, 'Rafael Pinto', 2, 'P2', 177.00, 74.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11671650222'),
(32, 'R-2025-000014', 2, 'Tatiane Gomes', 1, 'P1', 163.00, 57.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11203123831'),
(33, 'R-2025-000015', 3, 'Lucas Almeida', 3, 'P2', 181.00, 88.00, 'Paciente atleta', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11700668517'),
(34, 'R-2025-000016', 1, 'Carla Mendes', 2, 'P2', 169.00, 64.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11993971119'),
(35, 'R-2025-000017', 2, 'Eduardo Ramos', 1, 'P1', 176.00, 79.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11967850072'),
(36, 'R-2025-000018', 3, 'Simone Vieira', 3, 'P2', 161.00, 56.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11857337030'),
(37, 'R-2025-000019', 1, 'André Castro', 1, 'P1', 180.00, 82.00, 'Paciente com arritmia', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11383134964'),
(38, 'R-2025-000020', 2, 'Beatriz Lopes', 2, 'P1', 155.00, 50.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11143663758'),
(39, 'R-2025-000021', 3, 'Rodrigo Silva', 3, 'P2', 179.00, 78.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11368913926'),
(40, 'R-2025-000022', 1, 'Sabrina Souza', 2, 'P1', 164.00, 62.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11413578385'),
(41, 'R-2025-000023', 2, 'Gustavo Almeida', 1, 'P1', 182.00, 86.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11861150175'),
(42, 'R-2025-000024', 3, 'Larissa Cunha', 3, 'P2', 167.00, 61.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11265015748'),
(43, 'R-2025-000025', 1, 'Pedro Henrique', 1, 'P1', 175.00, 73.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11441628242'),
(44, 'R-2025-000026', 2, 'Vanessa Rocha', 2, 'P2', 162.00, 59.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11413093996'),
(45, 'R-2025-000027', 3, 'Felipe Carvalho', 3, 'P1', 184.00, 90.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11640585280'),
(46, 'R-2025-000028', 1, 'Natália Pires', 2, 'P2', 158.00, 53.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11963644442'),
(47, 'R-2025-000029', 2, 'Thiago Martins', 1, 'P1', 177.00, 75.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11996466400'),
(48, 'R-2025-000030', 3, 'Amanda Ribeiro', 3, 'P1', 163.00, 58.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11191398698'),
(49, 'R-2025-000031', 1, 'Lucas Pereira', 1, 'P2', 179.00, 81.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11567594321'),
(50, 'R-2025-000032', 2, 'Mariana Faria', 2, 'P1', 160.00, 52.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11363775540'),
(51, 'R-2025-000033', 3, 'Daniel Fernandes', 3, 'P2', 182.00, 89.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11916094762'),
(52, 'R-2025-000034', 1, 'Tatiane Santos', 2, 'P1', 168.00, 66.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11689147221'),
(53, 'R-2025-000035', 2, 'Alexandre Souza', 1, 'P1', 174.00, 78.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11597451846'),
(54, 'R-2025-000036', 3, 'Patrícia Martins', 3, 'P2', 162.00, 58.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11819817597'),
(55, 'R-2025-000037', 1, 'Bruno Oliveira', 2, 'P1', 180.00, 84.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11406732475'),
(56, 'R-2025-000038', 2, 'Carolina Nogueira', 1, 'P2', 164.00, 60.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11374209611'),
(57, 'R-2025-000039', 3, 'Rafaela Dias', 3, 'P2', 159.00, 55.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11550850658'),
(58, 'R-2025-000040', 1, 'Diego Costa', 1, 'P1', 183.00, 91.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11631624487'),
(59, 'R-2025-000041', 2, 'Aline Mendes', 2, 'P2', 161.00, 56.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11505570487'),
(60, 'R-2025-000042', 3, 'Eduarda Lima', 3, 'P1', 165.00, 63.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11532979005'),
(61, 'R-2025-000043', 1, 'Marcelo Rocha', 1, 'P2', 178.00, 83.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11148183590'),
(62, 'R-2025-000044', 2, 'Gabriela Souza', 2, 'P1', 159.00, 54.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11841980965'),
(63, 'R-2025-000045', 3, 'Anderson Silva', 3, 'P1', 185.00, 92.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11965354083'),
(64, 'R-2025-000046', 1, 'Juliana Lima', 2, 'P1', 167.00, 62.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11400827549'),
(65, 'R-2025-000047', 2, 'Felipe Souza', 1, 'P2', 176.00, 79.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11808075523'),
(66, 'R-2025-000048', 3, 'Isabela Carvalho', 3, 'P1', 161.00, 57.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11937894997'),
(67, 'R-2025-000049', 1, 'Renato Almeida', 1, 'P2', 182.00, 88.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11365248444'),
(68, 'R-2025-000050', 2, 'Sônia Ribeiro', 2, 'P1', 156.00, 52.00, '', 'Enviado para agendamento', '2025-11-07 15:54:11', NULL, NULL, 'Pendente', NULL, 0, '11712557256'),
(69, 'R-2025-000051', 1, 'Leonardo Alves', 1, 'P1', 178.00, 82.00, 'Suspeita de anemia', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11567040975'),
(70, 'R-2025-000052', 2, 'Renata Gomes', 1, 'P1', 160.00, 55.00, 'Avaliação pré-operatória', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11597533136'),
(71, 'R-2025-000053', 3, 'André Fernandes', 1, 'P1', 172.00, 70.00, 'Controle de tratamento', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11286542783'),
(72, 'R-2025-000054', 1, 'Sabrina Costa', 1, 'P1', 166.00, 61.00, 'Paciente com fadiga constante', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11440114534'),
(73, 'R-2025-000055', 2, 'Marcelo Araújo', 1, 'P1', 180.00, 88.00, 'Revisão de rotina', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11340944351'),
(74, 'R-2025-000056', 3, 'Juliana Martins', 1, 'P1', 162.00, 59.00, 'Análise clínica geral', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11284378181'),
(75, 'R-2025-000057', 1, 'Fernando Barros', 1, 'P1', 176.00, 77.00, 'Exame solicitado em triagem', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11299057878'),
(76, 'R-2025-000058', 2, 'Bianca Lima', 1, 'P1', 159.00, 54.00, 'Anemia recorrente', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11542154875'),
(77, 'R-2025-000059', 3, 'Carlos Nogueira', 1, 'P1', 184.00, 90.00, 'Avaliação médica de rotina', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11813600772'),
(78, 'R-2025-000060', 1, 'Daniela Ribeiro', 1, 'P1', 168.00, 63.00, 'Paciente em acompanhamento clínico', 'Enviado para agendamento', '2025-11-07 15:55:15', NULL, NULL, 'Pendente', NULL, 0, '11541539263'),
(79, 'R-2025-000061', 2, 'Vieck', 2, 'P1', NULL, NULL, '', 'Enviado para agendamento', '2025-11-10 13:41:21', 'Cross/Estadual', '/uploads/exames/20251110134121_cd9ffaea496d4a459c92589b984812ea_Requisitos.pdf', 'Pendente', NULL, 0, '11166894028'),
(80, 'R-2025-000062', 2, 'Lala', 2, 'P1', NULL, NULL, '', 'Encaminhado ao médico regulador', '2025-11-10 13:46:25', 'Município', '/uploads/exames/20251110134625_e324a4c2c68d4a0a96a8972043961639_Desafio1_Equipe4.pdf', 'Pendente', NULL, 0, '11909852376');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tentativas_contato`
--

CREATE TABLE `tentativas_contato` (
  `id` int(11) NOT NULL,
  `pedido_id` int(11) NOT NULL,
  `data_hora` datetime NOT NULL,
  `resultado` enum('Atendeu','Não atendeu','Número incorreto','Caixa postal') NOT NULL,
  `observacao` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `tentativas_contato`
--

INSERT INTO `tentativas_contato` (`id`, `pedido_id`, `data_hora`, `resultado`, `observacao`) VALUES
(1, 26, '2025-11-10 15:39:22', 'Não atendeu', 'isso mesmo');

-- --------------------------------------------------------

--
-- Estrutura para tabela `unidades_saude`
--

CREATE TABLE `unidades_saude` (
  `id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `codigo_unidade` varchar(20) DEFAULT NULL,
  `municipio` varchar(100) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `unidades_saude`
--

INSERT INTO `unidades_saude` (`id`, `nome`, `codigo_unidade`, `municipio`, `ativo`) VALUES
(1, 'Unidade Básica de Saúde Central', 'UBS001', 'Porto Alegre', 1),
(2, 'Hospital Municipal São Lucas', 'HMSL002', 'Canoas', 1),
(3, 'Posto de Saúde Vila Esperança', 'PSVE003', 'Gravataí', 1);

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `exames`
--
ALTER TABLE `exames`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `pedidos_regulacao`
--
ALTER TABLE `pedidos_regulacao`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `protocolo` (`protocolo`),
  ADD KEY `unidade_id` (`unidade_id`),
  ADD KEY `exame_id` (`exame_id`);

--
-- Índices de tabela `tentativas_contato`
--
ALTER TABLE `tentativas_contato`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pedido_id` (`pedido_id`);

--
-- Índices de tabela `unidades_saude`
--
ALTER TABLE `unidades_saude`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo_unidade` (`codigo_unidade`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `exames`
--
ALTER TABLE `exames`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `pedidos_regulacao`
--
ALTER TABLE `pedidos_regulacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- AUTO_INCREMENT de tabela `tentativas_contato`
--
ALTER TABLE `tentativas_contato`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `unidades_saude`
--
ALTER TABLE `unidades_saude`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `pedidos_regulacao`
--
ALTER TABLE `pedidos_regulacao`
  ADD CONSTRAINT `pedidos_regulacao_ibfk_1` FOREIGN KEY (`unidade_id`) REFERENCES `unidades_saude` (`id`),
  ADD CONSTRAINT `pedidos_regulacao_ibfk_2` FOREIGN KEY (`exame_id`) REFERENCES `exames` (`id`);

--
-- Restrições para tabelas `tentativas_contato`
--
ALTER TABLE `tentativas_contato`
  ADD CONSTRAINT `tentativas_contato_ibfk_1` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos_regulacao` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
