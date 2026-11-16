
import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no configurada");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 1. Categorías
  const categoryData = [
    {
      name: "Kits prediseñados",
      slug: "kits-predisenados",
    },
    {
      name: "Abonos y nutrición",
      slug: "abonos-organicos",
    },
    {
      name: "Herramientas y accesorios",
      slug: "herramientas-accesorios",
    },
  ];

  const categories = new Map<string, string>();

  for (const category of categoryData) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });

    categories.set(category.slug, saved.id);
  }

  const kitsCategoryId = categories.get("kits-predisenados")!;
  const fertilizersCategoryId = categories.get("abonos-organicos")!;
  const toolsCategoryId = categories.get("herramientas-accesorios")!;

  // 2. Kit de Inicio
  const starterKit = await prisma.product.upsert({
    where: { slug: "kit-inicio-bioverde" },
    update: {
      name: "Kit de Inicio BioVerde",
      price: 60000,
      categoryId: kitsCategoryId,
      isActive: true,
    },
    create: {
      name: "Kit de Inicio BioVerde",
      slug: "kit-inicio-bioverde",
      description:
        "Kit completo para comenzar un huerto en casa. Incluye semillas, abono orgánico, sustrato, maceta, herramientas y guía de siembra.",
      price: 60000,
      stock: 20,
      type: "PREBUILT_KIT",
      categoryId: kitsCategoryId,
      isActive: true,
    },
  });

  for (const variant of [
    {
      name: "Línea Cocina",
      slug: "cocina",
      description: "Semillas de tomate cherry, zanahoria y lechuga.",
    },
    {
      name: "Línea Bienestar",
      slug: "bienestar",
      description: "Semillas de manzanilla, menta y albahaca.",
    },
  ]) {
    await prisma.productVariant.upsert({
      where: {
        productId_slug: {
          productId: starterKit.id,
          slug: variant.slug,
        },
      },
      update: {
        name: variant.name,
        description: variant.description,
        price: 60000,
        isActive: true,
      },
      create: {
        ...variant,
        productId: starterKit.id,
        price: 60000,
        stock: 20,
      },
    });
  }

  // 3. Kit de Recarga
  const refillKit = await prisma.product.upsert({
    where: { slug: "kit-recarga-bioverde" },
    update: {
      name: "Kit de Recarga BioVerde",
      price: 29900,
      categoryId: kitsCategoryId,
      isActive: true,
    },
    create: {
      name: "Kit de Recarga BioVerde",
      slug: "kit-recarga-bioverde",
      description:
        "Kit para renovar los insumos de tu huerto sin comprar nuevamente herramientas reutilizables.",
      price: 29900,
      stock: 20,
      type: "PREBUILT_KIT",
      categoryId: kitsCategoryId,
      isActive: true,
    },
  });

  for (const variant of [
    {
      name: "Balcón",
      slug: "balcon",
      description: "Recarga para huertos pequeños con abono de 1 kg.",
      price: 29900,
    },
    {
      name: "Patio",
      slug: "patio",
      description: "Recarga para huertos medianos con abono de 5 kg.",
      price: 49900,
    },
  ]) {
    await prisma.productVariant.upsert({
      where: {
        productId_slug: {
          productId: refillKit.id,
          slug: variant.slug,
        },
      },
      update: {
        name: variant.name,
        description: variant.description,
        price: variant.price,
        isActive: true,
      },
      create: {
        ...variant,
        productId: refillKit.id,
        stock: 20,
      },
    });
  }

  // 4. Abono Orgánico
  const fertilizer = await prisma.product.upsert({
    where: { slug: "abono-organico-bioverde" },
    update: {
      name: "Abono Orgánico BioVerde",
      price: 6000,
      categoryId: fertilizersCategoryId,
      isActive: true,
    },
    create: {
      name: "Abono Orgánico BioVerde",
      slug: "abono-organico-bioverde",
      description:
        "Abono orgánico para complementar la nutrición del suelo. Disponible en presentaciones de 1, 5 y 10 kg.",
      price: 6000,
      stock: 30,
      type: "FERTILIZER",
      categoryId: fertilizersCategoryId,
      isActive: true,
    },
  });

  for (const variant of [
    { name: "1 kg", slug: "1kg", price: 6000, stock: 30 },
    { name: "5 kg", slug: "5kg", price: 15000, stock: 20 },
    { name: "10 kg", slug: "10kg", price: 25000, stock: 15 },
  ]) {
    await prisma.productVariant.upsert({
      where: {
        productId_slug: {
          productId: fertilizer.id,
          slug: variant.slug,
        },
      },
      update: {
        name: variant.name,
        price: variant.price,
        stock: variant.stock,
        isActive: true,
      },
      create: {
        ...variant,
        productId: fertilizer.id,
      },
    });
  }

  // 5. Herramientas
  await prisma.product.upsert({
    where: { slug: "set-herramientas-basicas" },
    update: {
      name: "Set de Herramientas Básicas",
      price: 20000,
      categoryId: toolsCategoryId,
      isActive: true,
    },
    create: {
      name: "Set de Herramientas Básicas",
      slug: "set-herramientas-basicas",
      description:
        "Set de herramientas para jardinería doméstica: pala, rastrillo y trasplantador.",
      price: 20000,
      stock: 20,
      type: "ACCESSORY",
      categoryId: toolsCategoryId,
      isActive: true,
    },
  });

  // 6. Desactivar productos anteriores
  const legacySlugs = [
    "kit-huerto-cocina",
    "kit-huerto-bienestar",
    "abono-organico-1kg",
    "abono-organico-5kg",
    "abono-organico-10kg",
  ];

  await prisma.product.updateMany({
    where: { slug: { in: legacySlugs } },
    data: { isActive: false },
  });

  console.log("BioVerde: catálogo y variantes actualizados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
