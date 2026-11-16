
import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no configurada");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Componentes disponibles para los kits y el configurador.
// Los precios son valores de venta simulados en COP.
const components = [
  {
    slug: "semillas-tomate-cherry",
    name: "Semillas de tomate cherry",
    type: "SEED" as const,
    price: 5000,
    stock: 100,
  },
  {
    slug: "semillas-zanahoria",
    name: "Semillas de zanahoria",
    type: "SEED" as const,
    price: 5000,
    stock: 100,
  },
  {
    slug: "semillas-lechuga",
    name: "Semillas de lechuga",
    type: "SEED" as const,
    price: 5000,
    stock: 100,
  },
  {
    slug: "semillas-manzanilla",
    name: "Semillas de manzanilla",
    type: "SEED" as const,
    price: 5000,
    stock: 100,
  },
  {
    slug: "semillas-menta",
    name: "Semillas de menta",
    type: "SEED" as const,
    price: 5000,
    stock: 100,
  },
  {
    slug: "semillas-albahaca",
    name: "Semillas de albahaca",
    type: "SEED" as const,
    price: 5000,
    stock: 100,
  },
  {
    slug: "abono-organico-1kg",
    name: "Abono orgánico BioVerde 1 kg",
    type: "FERTILIZER" as const,
    price: 6000,
    stock: 100,
  },
  {
    slug: "abono-organico-5kg",
    name: "Abono orgánico BioVerde 5 kg",
    type: "FERTILIZER" as const,
    price: 15000,
    stock: 50,
  },
  {
    slug: "sustrato-1kg",
    name: "Sustrato para cultivo 1 kg",
    type: "SUBSTRATE" as const,
    price: 8000,
    stock: 100,
  },
  {
    slug: "maceta-mediana",
    name: "Maceta plástica mediana",
    type: "POT" as const,
    price: 8000,
    stock: 50,
  },
  {
    slug: "pala-jardineria",
    name: "Pala pequeña de jardinería",
    type: "TOOL" as const,
    price: 8000,
    stock: 50,
  },
  {
    slug: "rastrillo-jardineria",
    name: "Rastrillo pequeño de jardinería",
    type: "TOOL" as const,
    price: 8000,
    stock: 50,
  },
  {
    slug: "trasplantador-jardineria",
    name: "Trasplantador de jardinería",
    type: "TOOL" as const,
    price: 8000,
    stock: 50,
  },
  {
    slug: "guia-siembra",
    name: "Guía básica de siembra BioVerde",
    type: "GUIDE" as const,
    price: 3000,
    stock: 100,
  },
];

// Recetas simuladas de los kits.
// Cada cantidad representa unidades o presentaciones completas.
const recipes = [
  {
    productSlug: "kit-inicio-bioverde",
    variantSlug: "cocina",
    items: [
      ["semillas-tomate-cherry", 1],
      ["semillas-zanahoria", 1],
      ["semillas-lechuga", 1],
      ["abono-organico-1kg", 1],
      ["sustrato-1kg", 1],
      ["maceta-mediana", 1],
      ["pala-jardineria", 1],
      ["rastrillo-jardineria", 1],
      ["guia-siembra", 1],
    ] as [string, number][],
  },
  {
    productSlug: "kit-inicio-bioverde",
    variantSlug: "bienestar",
    items: [
      ["semillas-manzanilla", 1],
      ["semillas-menta", 1],
      ["semillas-albahaca", 1],
      ["abono-organico-1kg", 1],
      ["sustrato-1kg", 1],
      ["maceta-mediana", 1],
      ["pala-jardineria", 1],
      ["rastrillo-jardineria", 1],
      ["guia-siembra", 1],
    ] as [string, number][],
  },
  {
    productSlug: "kit-recarga-bioverde",
    variantSlug: "balcon",
    items: [
      ["semillas-tomate-cherry", 1],
      ["semillas-lechuga", 1],
      ["abono-organico-1kg", 1],
      ["sustrato-1kg", 1],
    ] as [string, number][],
  },
  {
    productSlug: "kit-recarga-bioverde",
    variantSlug: "patio",
    items: [
      ["semillas-tomate-cherry", 1],
      ["semillas-zanahoria", 1],
      ["semillas-lechuga", 1],
      ["abono-organico-5kg", 1],
      ["sustrato-1kg", 2],
    ] as [string, number][],
  },
];

async function main() {
  console.log("Registrando componentes de BioVerde...");

  // 1. Crear o actualizar componentes.
  for (const component of components) {
    await prisma.kitComponent.upsert({
      where: { slug: component.slug },
      update: {
        name: component.name,
        type: component.type,
        price: component.price,
        isActive: true,
      },
      create: {
        ...component,
        isActive: true,
      },
    });
  }

  console.log(`${components.length} componentes procesados.`);

  // 2. Registrar las recetas de cada variante.
  for (const recipe of recipes) {
    const variant = await prisma.productVariant.findFirst({
      where: {
        slug: recipe.variantSlug,
        product: {
          slug: recipe.productSlug,
        },
      },
    });

    if (!variant) {
      throw new Error(
        `Variante no encontrada: ${recipe.productSlug}/${recipe.variantSlug}`
      );
    }

    for (const [componentSlug, quantity] of recipe.items) {
      const component = await prisma.kitComponent.findUnique({
        where: { slug: componentSlug },
      });

      if (!component) {
        throw new Error(
          `Componente no encontrado: ${componentSlug}`
        );
      }

      await prisma.kitRecipeItem.upsert({
        where: {
          variantId_componentId: {
            variantId: variant.id,
            componentId: component.id,
          },
        },
        update: {
          quantity,
        },
        create: {
          variantId: variant.id,
          componentId: component.id,
          quantity,
        },
      });
    }

    console.log(
      `Receta registrada: ${recipe.productSlug} / ${recipe.variantSlug}`
    );
  }

  console.log("Componentes y recetas procesados correctamente.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
