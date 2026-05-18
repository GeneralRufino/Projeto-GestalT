import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { autenticar, autorizarAdmin } from "../middleware/auth.js";

const router = Router();

router.use(autenticar);

router.get("/", autorizarAdmin, async (req, res, next) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, nome: true, email: true, perfil: true },
      orderBy: { nome: "asc" },
    });
    res.json(
      usuarios.map((u) => ({
        ...u,
        ativo: true,
        criadoEm: new Date(),
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post("/", autorizarAdmin, async (req, res, next) => {
  try {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, email e senha sao obrigatorios" });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        perfil: perfil || "OPERADOR",
      },
      select: { id: true, nome: true, email: true, perfil: true },
    });

    res.status(201).json({ ...usuario, ativo: true });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", autorizarAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { nome, email, perfil, senha } = req.body;

    const data = { nome, email, perfil };

    if (senha) {
      data.senha = await bcrypt.hash(senha, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data,
      select: { id: true, nome: true, email: true, perfil: true },
    });

    res.json({ ...usuario, ativo: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", autorizarAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.usuario.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
