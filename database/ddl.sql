CREATE DATABASE IF NOT EXISTS prog_diplomas;
USE prog_diplomas;

CREATE TABLE IF NOT EXISTS diplomas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_aluno VARCHAR(255),
    data_conclusao DATE,
    nome_curso VARCHAR(255),
    nacionalidade VARCHAR(255),
    naturalidade VARCHAR(255),
    data_nascimento DATE,
    numero_rg VARCHAR(20),
    data_emissao DATE,
    template_diploma TEXT
);

CREATE TABLE IF NOT EXISTS assinaturas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    diploma_id INT,
    cargo VARCHAR(255),
    nome VARCHAR(255),
    FOREIGN KEY (diploma_id) REFERENCES diplomas(id)
);