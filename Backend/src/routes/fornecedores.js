import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { autenticar } from "../middleware/auth.js";

const router = Router();

router.use(autenticar);

router.get("/", async (req, res, next) => {
  try {
    const { busca, ativo } = req.query;
    const where = {};

    if (ativo === "true") where.ativo = true;
    if (ativo === "false") where.ativo = false;

    if (busca) {
      where.OR = [
        { nome: { contains: busca, mode: "insensitive" } },
        { email: { contains: busca, mode: "insensitive" } },
        { contato: { contains: busca, mode: "insensitive" } },
        { telefone: { contains: busca, mode: "insensitive" } },
      ];
    }

    const fornecedores = await prisma.fornecedor.findMany({
      where,
      orderBy: { nome: "asc" },
    });

    res.json(fornecedores);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { nome, email, telefone, contato, observacao } = req.body;

    if (!nome?.trim()) {
      return res.status(400).json({ erro: "Nome do fornecedor e obrigatorio" });
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome: nome.trim(),
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        contato: contato?.trim() || null,
        observacao: observacao?.trim() || null,
      },
    });

    res.status(201).json(fornecedor);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { nome, email, telefone, contato, observacao, ativo } = req.body;

    const fornecedor = await prisma.fornecedor.update({
      where: { id },
      data: {
        nome: nome?.trim(),
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        contato: contato?.trim() || null,
        observacao: observacao?.trim() || null,
        ativo: ativo !== undefined ? Boolean(ativo) : undefined,
      },
    });

    res.json(fornecedor);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.fornecedor.update({
      where: { id },
      data: { ativo: false },
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
