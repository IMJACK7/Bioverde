
import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/server/db/prisma";

/**
 * Recupera un administrador autenticado
 * y comprueba que su cuenta siga activa.
 *
 * Devuelve null si no existe una sesión
 * válida o el administrador está inactivo.
 */
export async function requireActiveAdmin() {
  const session = await auth();

  const adminId = session?.user?.id;

  if (!adminId) {
    return null;
  }

  const administrator = await prisma.adminUser.findUnique({
    where: {
      id: adminId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  if (!administrator || !administrator.isActive) {
    return null;
  }

  return {
    id: administrator.id,
    name: administrator.name,
    email: administrator.email,
  };
}
