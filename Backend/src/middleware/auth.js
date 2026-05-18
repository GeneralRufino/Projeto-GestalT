import jwt from "jsonwebtoken";

export function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ erro: "Token nao informado" });
  }

  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ erro: "Formato de token invalido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ erro: "Token invalido ou expirado" });
  }
}

export function autorizarAdmin(req, res, next) {
  if (req.usuario?.perfil !== "ADMIN") {
    return res.status(403).json({ erro: "Acesso restrito a administradores" });
  }
  return next();
}