CREATE DATABASE IF NOT EXISTS prog_diplomas;
USE prog_diplomas;

CREATE TABLE IF NOT EXISTS diplomas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_aluno VARCHAR(255),
    data_conclusao DATE,
    nome_curso VARCHAR(255),
    data_emissao DATE,
    template_diploma TEXT
);
