
import "dotenv/config";

import { input, password } from "@inquirer/prompts";
import { hash, argon2id } from "argon2";

import { prisma } from "../server/db/prisma";

/**
 * Crea administradores de BioVerde
 * desde una terminal interactiva.
 *
 * No expone una ruta pública de registro.
 */
async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error(
      "Este script debe ejecutarse desde una terminal interactiva."
    );
  }

  console.log("\n=== Crear administrador BioVerde ===\n");

  try {
    // 1. Solicitar el nombre.
    const name = (
      await input({
        message: "Nombre del administrador:",
        validate(value) {
          const normalized = value.trim();

          return normalized.length >= 3 &&
            normalized.length <= 120
            ? true
            : "El nombre debe tener entre 3 y 120 caracteres.";
        },
      })
    ).trim();

    // 2. Solicitar el correo.
    const email = (
      await input({
        message: "Correo electrónico:",
        validate(value) {
          const normalized = value.trim();

          return normalized.length <= 254 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
              normalized
            )
            ? true
            : "Ingresa un correo electrónico válido.";
        },
      })
    )
      .trim()
      .toLowerCase();

    // 3. Comprobar que el correo no esté registrado.
    const existingAdmin =
      await prisma.adminUser.findUnique({
        where: { email },
      });

    if (existingAdmin) {
      throw new Error(
        "Ya existe un administrador con ese correo."
      );
    }

    // 4. Solicitar la contraseña de forma oculta.
    const adminPassword = await password({
      message: "Contraseña del administrador:",
      mask: "*",
      validate(value) {
        return value.length >= 12 &&
          value.length <= 128
          ? true
          : "La contraseña debe tener entre 12 y 128 caracteres.";
      },
    });

    // 5. Confirmar la contraseña.
    const confirmation = await password({
      message: "Confirma la contraseña:",
      mask: "*",
    });

    if (adminPassword !== confirmation) {
      throw new Error(
        "Las contraseñas no coinciden. No se creó el administrador."
      );
    }

    // 6. Generar el hash con Argon2id.
    const passwordHash = await hash(adminPassword, {
      type: argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    // 7. Registrar el administrador.
    const administrator =
      await prisma.adminUser.create({
        data: {
          name,
          email,
          passwordHash,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

    console.log(
      "\nAdministrador creado correctamente."
    );
    console.log("ID:", administrator.id);
    console.log("Nombre:", administrator.name);
    console.log("Correo:", administrator.email);
    console.log(
      "\nLa contraseña se almacenó mediante un hash Argon2id."
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    "\nNo se pudo crear el administrador:",
    error instanceof Error
      ? error.message
      : "Error desconocido."
  );

  process.exitCode = 1;
});
