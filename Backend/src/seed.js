import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma.js";

async function main() {
  console.log("Iniciando seed...");

  // Usuario admin padrao
  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const senhaOperador = await bcrypt.hash("operador123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@escola.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@escola.com",
      senha: senhaAdmin,
      perfil: "ADMIN",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "operador@escola.com" },
    update: {},
    create: {
      nome: "Operador Almoxarifado",
      email: "operador@escola.com",
      senha: senhaOperador,
      perfil: "OPERADOR",
    },
  });

  // Categorias
  const categorias = [
    { nome: "Material de Escritorio", descricao: "Papel, canetas, grampeadores" },
    { nome: "Suprimentos de Informatica", descricao: "Toners, cabos, mouses" },
    { nome: "Material Pedagogico", descricao: "Livros didaticos, apostilas" },
    { nome: "Equipamentos de Laboratorio", descricao: "Vidrarias, reagentes" },
    { nome: "Limpeza", descricao: "Produtos e utensilios de limpeza" },
  ];

  for (const cat of categorias) {
    await prisma.categoria.upsert({
      where: { nome: cat.nome },
      update: {},
      create: cat,
    });
  }

  const catsCriadas = await prisma.categoria.findMany();
  const getCat = (nome) => catsCriadas.find((c) => c.nome === nome);

  // Fornecedores
  const fornecedores = [
    {
      nome: "Papelaria Alfa",
      email: "contato@papelariaalfa.com",
      telefone: "(11) 3000-1000",
      contato: "Maria Souza",
      observacao: "Fornecedor recorrente de papelaria",
    },
    {
      nome: "Tech Suprimentos",
      email: "vendas@techsuprimentos.com",
      telefone: "(11) 3222-4500",
      contato: "Carlos Lima",
      observacao: "Informatica e periféricos",
    },
    {
      nome: "Lab Escolar Equipamentos",
      email: "comercial@labescolar.com",
      telefone: "(11) 3999-2200",
      contato: "Renata Alves",
      observacao: "Materiais para laboratório",
    },
  ];

  for (const f of fornecedores) {
    const existente = await prisma.fornecedor.findFirst({
      where: { nome: f.nome },
    });
    if (!existente) {
      await prisma.fornecedor.create({ data: f });
    }
  }

  // Materiais
  const materiais = [
    { nome: "Papel A4 75g - Resma 500fls", unidade: "PCT", quantidadeAtual: 45, estoqueMinimo: 10, categoria: "Material de Escritorio" },
    { nome: "Caneta Esferografica Azul", unidade: "UN", quantidadeAtual: 120, estoqueMinimo: 30, categoria: "Material de Escritorio" },
    { nome: "Caneta Esferografica Preta", unidade: "UN", quantidadeAtual: 85, estoqueMinimo: 30, categoria: "Material de Escritorio" },
    { nome: "Grampeador Medio", unidade: "UN", quantidadeAtual: 8, estoqueMinimo: 5, categoria: "Material de Escritorio" },
    { nome: "Toner HP CF283A", unidade: "UN", quantidadeAtual: 4, estoqueMinimo: 5, categoria: "Suprimentos de Informatica" },
    { nome: "Mouse USB", unidade: "UN", quantidadeAtual: 12, estoqueMinimo: 5, categoria: "Suprimentos de Informatica" },
    { nome: "Cabo HDMI 2m", unidade: "UN", quantidadeAtual: 6, estoqueMinimo: 4, categoria: "Suprimentos de Informatica" },
    { nome: "Livro Didatico Matematica 6ano", unidade: "UN", quantidadeAtual: 150, estoqueMinimo: 50, categoria: "Material Pedagogico" },
    { nome: "Livro Didatico Portugues 6ano", unidade: "UN", quantidadeAtual: 140, estoqueMinimo: 50, categoria: "Material Pedagogico" },
    { nome: "Becker 250ml", unidade: "UN", quantidadeAtual: 20, estoqueMinimo: 10, categoria: "Equipamentos de Laboratorio" },
    { nome: "Proveta 100ml", unidade: "UN", quantidadeAtual: 3, estoqueMinimo: 8, categoria: "Equipamentos de Laboratorio" },
    { nome: "Detergente Neutro 5L", unidade: "UN", quantidadeAtual: 15, estoqueMinimo: 6, categoria: "Limpeza" },
    { nome: "Papel Higienico Rolao", unidade: "CX", quantidadeAtual: 9, estoqueMinimo: 10, categoria: "Limpeza" },
  ];

  for (const m of materiais) {
    const existente = await prisma.material.findFirst({ where: { nome: m.nome } });
    if (existente) continue;
    await prisma.material.create({
      data: {
        nome: m.nome,
        unidade: m.unidade,
        quantidadeAtual: m.quantidadeAtual,
        estoqueMinimo: m.estoqueMinimo,
        categoriaId: getCat(m.categoria).id,
      },
    });
  }

  // Movimentacoes de exemplo (ultimos meses) para alimentar os graficos
  const admin = await prisma.usuario.findUnique({ where: { email: "admin@escola.com" } });
  const todosMateriais = await prisma.material.findMany();

  const jaTemMov = await prisma.movimentacao.count();
  if (jaTemMov === 0) {
    const hoje = new Date();
    for (let i = 5; i >= 0; i--) {
      const base = new Date(hoje.getFullYear(), hoje.getMonth() - i, 10);
      for (const mat of todosMateriais) {
        const qtdEntrada = Math.floor(Math.random() * 20) + 5;
        const qtdSaida = Math.floor(Math.random() * 15) + 1;

        await prisma.movimentacao.create({
          data: {
            tipo: "ENTRADA",
            quantidade: qtdEntrada,
            materialId: mat.id,
            usuarioId: admin.id,
            data: new Date(base.getFullYear(), base.getMonth(), 5 + Math.floor(Math.random() * 10)),
            observacao: "Reposicao mensal",
          },
        });

        await prisma.movimentacao.create({
          data: {
            tipo: "SAIDA",
            quantidade: qtdSaida,
            materialId: mat.id,
            usuarioId: admin.id,
            data: new Date(base.getFullYear(), base.getMonth(), 15 + Math.floor(Math.random() * 10)),
            observacao: "Retirada para uso",
          },
        });
      }
    }
  }

  console.log("Seed finalizado!");
  console.log("Login admin:    admin@escola.com / admin123");
  console.log("Login operador: operador@escola.com / operador123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
