import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { autenticar } from "../middleware/auth.js";

const router = Router();

router.use(autenticar);

router.get("/", async (req, res, next) => {
  try {
    const { tipo, materialId, dataInicio, dataFim, limite } = req.query;

    const where = {};
    if (tipo) where.tipo = tipo;
    if (materialId) where.materialId = Number(materialId);
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) {
        const fim = new Date(dataFim);
        fim.setHours(23, 59, 59, 999);
        where.data.lte = fim;
      }
    }

    const movimentacoes = await prisma.movimentacao.findMany({
      where,
      include: {
        material: { select: { id: true, nome: true, unidade: true } },
        usuario: { select: { id: true, nome: true } },
      },
      orderBy: { data: "desc" },
      take: limite ? Number(limite) : 100,
    });

    res.json(movimentacoes);
  } catch (err) {
    next(err);
  }
});

router.post("/entrada", async (req, res, next) => {
  try {
    const { materialId, quantidade, observacao } = req.body;
    const usuarioId = req.usuario.id;

    if (!materialId || !quantidade || Number(quantidade) <= 0) {
      return res.status(400).json({
        erro: "Material e quantidade (> 0) sao obrigatorios",
      });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const movimentacao = await tx.movimentacao.create({
        data: {
          tipo: "ENTRADA",
          quantidade: Number(quantidade),
          observacao,
          materialId: Number(materialId),
          usuarioId,
        },
        include: {
          material: true,
          usuario: { select: { id: true, nome: true } },
        },
      });

      await tx.material.update({
        where: { id: Number(materialId) },
        data: { quantidadeAtual: { increment: Number(quantidade) } },
      });

      return movimentacao;
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
});

router.post("/saida", async (req, res, next) => {
  try {
    const { materialId, quantidade, observacao } = req.body;
    const usuarioId = req.usuario.id;

    if (!materialId || !quantidade || Number(quantidade) <= 0) {
      return res.status(400).json({
        erro: "Material e quantidade (> 0) sao obrigatorios",
      });
    }

    const material = await prisma.material.findUnique({
      where: { id: Number(materialId) },
    });

    if (!material) {
      return res.status(404).json({ erro: "Material nao encontrado" });
    }

    if (material.quantidadeAtual < Number(quantidade)) {
      return res.status(400).json({
        erro: "Estoque insuficiente",
        disponivel: material.quantidadeAtual,
      });
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const movimentacao = await tx.movimentacao.create({
        data: {
          tipo: "SAIDA",
          quantidade: Number(quantidade),
          observacao,
          materialId: Number(materialId),
          usuarioId,
        },
        include: {
          material: true,
          usuario: { select: { id: true, nome: true } },
        },
      });

      await tx.material.update({
        where: { id: Number(materialId) },
        data: { quantidadeAtual: { decrement: Number(quantidade) } },
      });

      return movimentacao;
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
});

export default router;
