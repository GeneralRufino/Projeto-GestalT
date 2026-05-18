export function tratadorDeErro(err, req, res, next) {
  console.error("[ERRO]", {
    mensagem: err.message,
    codigo: err.code,
    caminho: req.originalUrl,
    metodo: req.method,
  });

  if (err.code === "P2002") {
    return res
      .status(409)
      .json({ erro: "Registro duplicado", detalhe: err.meta?.target });
  }

  if (err.code === "P2025") {
    return res.status(404).json({ erro: "Registro nao encontrado" });
  }

  return res
    .status(err.status || 500)
    .json({ erro: err.message || "Erro interno do servidor" });
}
