/*
  Warnings:

  - You are about to drop the `categorias` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `materiais` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `movimentacoes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROFESSOR', 'COORDENADOR');

-- DropForeignKey
ALTER TABLE "public"."materiais" DROP CONSTRAINT "materiais_categoriaId_fkey";

-- DropForeignKey
ALTER TABLE "public"."movimentacoes" DROP CONSTRAINT "movimentacoes_materialId_fkey";

-- DropForeignKey
ALTER TABLE "public"."movimentacoes" DROP CONSTRAINT "movimentacoes_usuarioId_fkey";

-- DropTable
DROP TABLE "public"."categorias";

-- DropTable
DROP TABLE "public"."materiais";

-- DropTable
DROP TABLE "public"."movimentacoes";

-- DropTable
DROP TABLE "public"."usuarios";

-- DropEnum
DROP TYPE "public"."PerfilUsuario";

-- DropEnum
DROP TYPE "public"."TipoMovimentacao";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" "Role" NOT NULL DEFAULT 'PROFESSOR',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "nome_material" TEXT NOT NULL,
    "unidade_medida" TEXT NOT NULL,
    "estoque_atual" INTEGER NOT NULL DEFAULT 0,
    "estoque_minimo" INTEGER NOT NULL DEFAULT 5,
    "categoria" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "data_hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "tipo_formato" TEXT NOT NULL,
    "data_geracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
