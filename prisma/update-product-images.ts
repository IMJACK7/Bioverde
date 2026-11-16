
import "dotenv/config";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no configurada");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const images = [
  {
    slug: "kit-huerto-bienestar",
    imageUrl: "/images/products/kit-bienestar.jpeg",
  },
  {
    slug: "kit-huerto-cocina",
    imageUrl: "/images/products/kit-cocina.jpeg",
  },
  {
    slug: "abono-organico-1kg",
    imageUrl: "/images/products/abono-1kg.jpeg ",
  },
  {
    slug: "abono-organico-5kg",
    imageUrl: "/images/products/abono-5kg.jpeg",
  },
  {
    slug: "abono-organico-10kg",
    imageUrl: "/images/products/abono-10kg.jpeg",
  },
];

async function main() {
  for (const image of images) {
    await prisma.product.update({
      where: { slug: image.slug },
      data: { imageUrl: image.imageUrl },
    });
  }

  console.log("Imágenes de BioVerde actualizadas.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
