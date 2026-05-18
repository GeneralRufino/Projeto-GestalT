import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { autenticar } from "../middleware/auth.js";

const router = Router();

router.use(autenticar);

router.get("/", async (req, res, next) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nome: "asc" },
      include: { _count: { select: { materiais: true } } },
    });
    res.json(categorias);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: { materiais: true },
    });

    if (!categoria) {
      return res.status(404).json({ erro: "Categoria nao encontrada" });
    }

    res.json(categoria);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { nome, descricao } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: "Nome e obrigatorio" });
    }

    const categoria = await prisma.categoria.create({
      data: { nome, descricao },
    });

    res.status(201).json(categoria);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { nome, descricao } = req.body;

    const categoria = await prisma.categoria.update({
      where: { id },
      data: { nome, descricao },
    });

    res.json(categoria);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.categoria.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
