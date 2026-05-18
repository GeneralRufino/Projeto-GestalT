-- ENTREGA 03 - Criacao e populacao do banco escola_db
-- Sistema: almox_escola

-- CREATE DATABASE escola_db;
-- \c escola_db;

DO $$ BEGIN
  CREATE TYPE perfil_usuario AS ENUM ('ADMIN', 'OPERADOR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE tipo_movimentacao AS ENUM ('ENTRADA', 'SAIDA');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  perfil perfil_usuario NOT NULL DEFAULT 'OPERADOR',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  descricao VARCHAR(255),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fornecedores (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160),
  telefone VARCHAR(30),
  contato VARCHAR(120),
  observacao VARCHAR(255),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "criadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materiais (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(500),
  unidade VARCHAR(20) NOT NULL,
  "quantidadeAtual" INTEGER NOT NULL DEFAULT 0,
  "estoqueMinimo" INTEGER NOT NULL DEFAULT 10,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "categoriaId" INTEGER NOT NULL REFERENCES categorias(id),
  "criadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id SERIAL PRIMARY KEY,
  tipo tipo_movimentacao NOT NULL,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  observacao VARCHAR(500),
  "materialId" INTEGER NOT NULL REFERENCES materiais(id),
  "usuarioId" INTEGER NOT NULL REFERENCES usuarios(id),
  data TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (nome, email, senha, perfil)
SELECT * FROM (
  VALUES
    ('Administrador', 'admin@escola.com', '$2a$10$KJOkfM/HE7J7VrY0PEhP5eW5Al2QjLw8ZzTRhS4vtR6.kRfbR8nQS', 'ADMIN'::perfil_usuario),
    ('Operador Almoxarifado', 'operador@escola.com', '$2a$10$kpjdbMnDGutgLUIblFUoiuQ9g5aX3HDxACIdPD9Q7KKk4eETICaRG', 'OPERADOR'::perfil_usuario),
    ('Auxiliar Escolar', 'auxiliar@escola.com', '$2a$10$kpjdbMnDGutgLUIblFUoiuQ9g5aX3HDxACIdPD9Q7KKk4eETICaRG', 'OPERADOR'::perfil_usuario)
) AS v(nome, email, senha, perfil)
WHERE NOT EXISTS (SELECT 1 FROM usuarios u WHERE u.email = v.email);

INSERT INTO categorias (nome, descricao)
SELECT * FROM (
  VALUES
    ('Material de Escritorio', 'Papel, canetas e itens de escritorio'),
    ('Suprimentos de Informatica', 'Toners, cabos e periféricos'),
    ('Material Pedagogico', 'Livros e materiais didaticos')
) AS v(nome, descricao)
WHERE NOT EXISTS (SELECT 1 FROM categorias c WHERE c.nome = v.nome);

INSERT INTO fornecedores (nome, email, telefone, contato, observacao)
SELECT * FROM (
  VALUES
    ('Papelaria Alfa', 'contato@papelariaalfa.com', '(11) 3000-1000', 'Maria Souza', 'Fornecedor de papelaria'),
    ('Tech Suprimentos', 'vendas@techsuprimentos.com', '(11) 3222-4500', 'Carlos Lima', 'Fornecedor de informatica'),
    ('Lab Escolar Equipamentos', 'comercial@labescolar.com', '(11) 3999-2200', 'Renata Alves', 'Fornecedor de laboratorio')
) AS v(nome, email, telefone, contato, observacao)
WHERE NOT EXISTS (SELECT 1 FROM fornecedores f WHERE f.nome = v.nome);

INSERT INTO materiais (nome, descricao, unidade, "quantidadeAtual", "estoqueMinimo", "categoriaId")
SELECT v.nome, v.descricao, v.unidade, v.qtd_atual, v.qtd_min, c.id
FROM (
  VALUES
    ('Papel A4', 'Resma com 500 folhas', 'PCT', 45, 10, 'Material de Escritorio'),
    ('Caneta Azul', 'Caneta esferografica azul', 'UN', 120, 30, 'Material de Escritorio'),
    ('Toner HP CF283A', 'Cartucho de toner para impressora', 'UN', 4, 5, 'Suprimentos de Informatica')
) AS v(nome, descricao, unidade, qtd_atual, qtd_min, categoria_nome)
JOIN categorias c ON c.nome = v.categoria_nome
WHERE NOT EXISTS (SELECT 1 FROM materiais m WHERE m.nome = v.nome);

INSERT INTO movimentacoes (tipo, quantidade, observacao, "materialId", "usuarioId", data)
SELECT v.tipo, v.quantidade, v.observacao, m.id, u.id, v.data
FROM (
  VALUES
    ('ENTRADA'::tipo_movimentacao, 20, 'Reposicao mensal', 'Papel A4', 'Administrador', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    ('SAIDA'::tipo_movimentacao, 12, 'Uso no setor pedagógico', 'Caneta Azul', 'Operador Almoxarifado', CURRENT_TIMESTAMP - INTERVAL '7 days'),
    ('SAIDA'::tipo_movimentacao, 2, 'Troca de toner da secretaria', 'Toner HP CF283A', 'Auxiliar Escolar', CURRENT_TIMESTAMP - INTERVAL '3 days')
) AS v(tipo, quantidade, observacao, material_nome, usuario_nome, data)
JOIN materiais m ON m.nome = v.material_nome
JOIN usuarios u ON u.nome = v.usuario_nome
WHERE NOT EXISTS (
  SELECT 1
  FROM movimentacoes mv
  WHERE mv.tipo = v.tipo
    AND mv.quantidade = v.quantidade
    AND mv."materialId" = m.id
    AND mv."usuarioId" = u.id
);
