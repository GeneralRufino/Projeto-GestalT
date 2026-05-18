import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { autenticar } from "../middleware/auth.js";

const router = Router();

router.use(autenticar);

router.get("/", async (req, res, next) => {
  try {
    const { busca, categoriaId, estoqueBaixo } = req.query;

    const where = {};

    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: "insensitive" } },
      ];
    }

    if (categoriaId) {
      where.categoriaId = Number(categoriaId);
    }

    let materiais = await prisma.material.findMany({
      where,
      include: { categoria: true },
      orderBy: { nome: "asc" },
    });

    if (estoqueBaixo === "true") {
      materiais = materiais.filter(
        (m) => m.quantidadeAtual <= m.estoqueMinimo
      );
    }

    res.json(materiais);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const material = await prisma.material.findUnique({
      where: { id },
      include: {
        categoria: true,
        movimentacoes: {
          take: 20,
          orderBy: { data: "desc" },
          include: { usuario: { select: { id: true, nome: true } } },
        },
      },
    });

    if (!material) {
      return res.status(404).json({ erro: "Material nao encontrado" });
    }

    res.json(material);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      nome,
      unidade,
      quantidadeAtual,
      estoqueMinimo,
      categoriaId,
    } = req.body;

    if (!nome || !unidade || !categoriaId) {
      return res.status(400).json({
        erro: "Nome, unidade e categoria sao obrigatorios",
      });
    }

    const material = await prisma.material.create({
      data: {
        nome,
        unidade,
        quantidadeAtual: Number(quantidadeAtual) || 0,
        estoqueMinimo: Number(estoqueMinimo) || 10,
        categoriaId: Number(categoriaId),
      },
      include: { categoria: true },
    });

    res.status(201).json(material);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const {
      nome,
      unidade,
      estoqueMinimo,
      categoriaId,
    } = req.body;

    const material = await prisma.material.update({
      where: { id },
      data: {
        nome,
        unidade,
        estoqueMinimo: estoqueMinimo !== undefined ? Number(estoqueMinimo) : undefined,
        categoriaId: categoriaId !== undefined ? Number(categoriaId) : undefined,
      },
      include: { categoria: true },
    });

    res.json(material);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.material.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
