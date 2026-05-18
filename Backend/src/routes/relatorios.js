import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { autenticar } from "../middleware/auth.js";

const router = Router();

router.use(autenticar);

// Dashboard geral: cards + base dos graficos
router.get("/dashboard", async (req, res, next) => {
  try {
    const [
      totalMateriais,
      totalCategorias,
      totalMovimentacoes,
      materiaisAtivos,
    ] = await Promise.all([
      prisma.material.count(),
      prisma.categoria.count(),
      prisma.movimentacao.count(),
      prisma.material.findMany({
        select: { quantidadeAtual: true, estoqueMinimo: true },
      }),
    ]);

    const estoqueBaixo = materiaisAtivos.filter(
      (m) => m.quantidadeAtual <= m.estoqueMinimo
    ).length;

    const totalItensEstoque = materiaisAtivos.reduce(
      (acc, m) => acc + m.quantidadeAtual,
      0
    );

    res.json({
      totalMateriais,
      totalCategorias,
      totalMovimentacoes,
      estoqueBaixo,
      totalItensEstoque,
    });
  } catch (err) {
    next(err);
  }
});

// Grafico rosca - distribuicao de materiais por categoria
router.get("/por-categoria", async (req, res, next) => {
  try {
    const categorias = await prisma.categoria.findMany({
      include: {
        materiais: {
          select: { quantidadeAtual: true },
        },
      },
    });

    const dados = categorias.map((c) => ({
      categoria: c.nome,
      totalMateriais: c.materiais.length,
      totalItens: c.materiais.reduce((acc, m) => acc + m.quantidadeAtual, 0),
    }));

    res.json(dados);
  } catch (err) {
    next(err);
  }
});

// Grafico linhas multiplas - entradas x saidas por mes (ultimos 6 meses)
router.get("/movimentacoes-mensais", async (req, res, next) => {
  try {
    const meses = Number(req.query.meses) || 6;
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - meses);
    dataLimite.setDate(1);
    dataLimite.setHours(0, 0, 0, 0);

    const movimentacoes = await prisma.movimentacao.findMany({
      where: { data: { gte: dataLimite } },
      select: { tipo: true, quantidade: true, data: true },
    });

    const mapa = {};
    for (let i = meses - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      mapa[chave] = { mes: chave, entrada: 0, saida: 0 };
    }

    for (const mov of movimentacoes) {
      const d = new Date(mov.data);
      const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!mapa[chave]) continue;
      if (mov.tipo === "ENTRADA") mapa[chave].entrada += mov.quantidade;
      else mapa[chave].saida += mov.quantidade;
    }

    res.json(Object.values(mapa));
  } catch (err) {
    next(err);
  }
});

// Top materiais mais movimentados (saidas)
router.get("/top-materiais", async (req, res, next) => {
  try {
    const limite = Number(req.query.limite) || 5;

    const agrupado = await prisma.movimentacao.groupBy({
      by: ["materialId"],
      where: { tipo: "SAIDA" },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: limite,
    });

    const materiais = await prisma.material.findMany({
      where: { id: { in: agrupado.map((a) => a.materialId) } },
      select: { id: true, nome: true, unidade: true },
    });

    const resultado = agrupado.map((a) => {
      const mat = materiais.find((m) => m.id === a.materialId);
      return {
        materialId: a.materialId,
        nome: mat?.nome || "?",
        unidade: mat?.unidade || "",
        totalSaidas: a._sum.quantidade || 0,
      };
    });

    res.json(resultado);
  } catch (err) {
    next(err);
  }
});

// Materiais com estoque abaixo do minimo
router.get("/estoque-baixo", async (req, res, next) => {
  try {
    const materiais = await prisma.material.findMany({
      include: { categoria: { select: { nome: true } } },
      orderBy: { quantidadeAtual: "asc" },
    });

    const abaixo = materiais.filter(
      (m) => m.quantidadeAtual <= m.estoqueMinimo
    );

    res.json(abaixo);
  } catch (err) {
    next(err);
  }
});

// Materiais sem giro em N meses (padrao: 6)
router.get("/sem-giro", async (req, res, next) => {
  try {
    const meses = Number(req.query.meses) || 6;
    const dataLimite = new Date();
    dataLimite.setMonth(dataLimite.getMonth() - meses);

    const materiais = await prisma.material.findMany({
      include: {
        categoria: { select: { nome: true } },
        movimentacoes: {
          orderBy: { data: "desc" },
          take: 1,
          select: { data: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    const semGiro = materiais.filter((m) => {
      if (!m.movimentacoes.length) return true;
      return new Date(m.movimentacoes[0].data) < dataLimite;
    });

    res.json(
      semGiro.map((m) => ({
        id: m.id,
        nome: m.nome,
        categoria: m.categoria?.nome || "-",
        quantidadeAtual: m.quantidadeAtual,
        ultimaMovimentacao: m.movimentacoes[0]?.data || null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Exportacao CSV de estoque
router.get("/exportar/estoque.csv", async (req, res, next) => {
  try {
    const materiais = await prisma.material.findMany({
      include: { categoria: { select: { nome: true } } },
      orderBy: { nome: "asc" },
    });

    const header = "id,nome,categoria,unidade,quantidadeAtual,estoqueMinimo,status";
    const linhas = materiais.map((m) => {
      const status = m.quantidadeAtual <= m.estoqueMinimo ? "ESTOQUE_BAIXO" : "OK";
      return [
        m.id,
        `"${(m.nome || "").replace(/"/g, '""')}"`,
        `"${(m.categoria?.nome || "").replace(/"/g, '""')}"`,
        m.unidade,
        m.quantidadeAtual,
        m.estoqueMinimo,
        status,
      ].join(",");
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="estoque.csv"');
    res.send([header, ...linhas].join("\n"));
  } catch (err) {
    next(err);
  }
});

// Exportacao CSV de movimentacoes
router.get("/exportar/movimentacoes.csv", async (req, res, next) => {
  try {
    const movimentacoes = await prisma.movimentacao.findMany({
      include: {
        material: { select: { nome: true } },
        usuario: { select: { nome: true } },
      },
      orderBy: { data: "desc" },
      take: 5000,
    });

    const header = "id,data,tipo,material,quantidade,usuario,observacao";
    const linhas = movimentacoes.map((m) =>
      [
        m.id,
        new Date(m.data).toISOString(),
        m.tipo,
        `"${(m.material?.nome || "").replace(/"/g, '""')}"`,
        m.quantidade,
        `"${(m.usuario?.nome || "").replace(/"/g, '""')}"`,
        `"${(m.observacao || "").replace(/"/g, '""')}"`,
      ].join(",")
    );

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="movimentacoes.csv"');
    res.send([header, ...linhas].join("\n"));
  } catch (err) {
    next(err);
  }
});

export default router;
