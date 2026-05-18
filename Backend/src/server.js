import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import usuariosRoutes from "./routes/usuarios.js";
import categoriasRoutes from "./routes/categorias.js";
import materiaisRoutes from "./routes/materiais.js";
import movimentacoesRoutes from "./routes/movimentacoes.js";
import relatoriosRoutes from "./routes/relatorios.js";
import fornecedoresRoutes from "./routes/fornecedores.js";
import { autenticar, autorizarAdmin } from "./middleware/auth.js";
import { prisma } from "./lib/prisma.js";

import { tratadorDeErro } from "./middleware/erro.js";

const app = express();

const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    nome: "almox_escola API",
    versao: "1.0.0",
    status: "online",
  });
});

app.get("/api/teste-db", autenticar, autorizarAdmin, async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ erro: "Rota nao encontrada" });
  }

  try {
    const count = await prisma.usuario.count();

    res.json({
      sucesso: true,
      mensagem: "Conexao com banco OK",
      totalUsuarios: count,
    });
  } catch (error) {
    res.status(500).json({
      sucesso: false,
      erro: "Erro ao acessar a tabela de usuários.",
      detalhes: error.message,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/materiais", materiaisRoutes);
app.use("/api/movimentacoes", movimentacoesRoutes);
app.use("/api/relatorios", relatoriosRoutes);
app.use("/api/fornecedores", fornecedoresRoutes);

app.use((req, res) => {
  res.status(404).json({ erro: "Rota nao encontrada" });
});

app.use(tratadorDeErro);

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`API almox_escola rodando em http://localhost:${PORT}`);
});

