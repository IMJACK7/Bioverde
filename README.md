# 🌱 BioVerde

### Plataforma web de comercio electrónico para jardinería y kits de cultivo

BioVerde es una aplicación web **full stack** desarrollada con Next.js, React, TypeScript, Prisma y PostgreSQL. Su propósito es ofrecer una experiencia digital para explorar productos de jardinería, configurar kits de cultivo y gestionar pedidos e inventarios.

El proyecto integra una interfaz de compra para clientes y un módulo administrativo para la gestión de productos, existencias y pedidos.

**Estado del proyecto:** desarrollo funcional, con compilación de producción verificada y base de datos preparada en Neon PostgreSQL. Despliegue público pendiente.

**Repositorio:** https://github.com/IMJACK7/Bioverde

---

## 📋 Descripción del proyecto

BioVerde surge como una propuesta de comercio electrónico orientada a productos para jardinería y cultivo doméstico.

La aplicación reúne funcionalidades comerciales y administrativas en una misma plataforma, permitiendo gestionar productos, variantes y componentes utilizados en la elaboración de kits.

Su desarrollo también contempla la organización modular del código, el manejo de datos relacionales y la preparación de infraestructura para un futuro despliegue.

## ✨ Funcionalidades principales

### 🛍️ Tienda y catálogo

- Catálogo de productos organizado por categorías.
- Páginas individuales de productos.
- Manejo de variantes, precios y existencias.
- Carrito de compras.
- Proceso de checkout.
- Registro de pedidos.

### 🌿 Configurador de kits

- Sección «Arma tu kit».
- Selección de componentes de jardinería.
- Gestión de componentes y cantidades.
- Recetas que relacionan kits y componentes.
- Integración del configurador con el flujo comercial.

### 🔐 Administración

- Módulo de inicio de sesión administrativo.
- Gestión de productos.
- Administración de inventarios.
- Consulta y gestión de pedidos.
- Operaciones del servidor para productos, pedidos y movimientos de inventario.

Estas funcionalidades corresponden a los módulos identificados en el proyecto. Su comportamiento completo en un entorno público requiere validación después del despliegue.

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| Next.js 16 | Framework full stack y App Router |
| React 19 | Interfaces de usuario |
| TypeScript | Desarrollo tipado |
| Tailwind CSS 4 | Estilos |
| Prisma ORM 7 | Acceso y modelado de datos |
| PostgreSQL | Base de datos relacional |
| Neon | PostgreSQL administrado en la nube |
| Auth.js 5 | Autenticación |
| Argon2 | Funciones de hashing de contraseñas |
| Zod | Validación de datos |
| Git y GitHub | Control de versiones |
| Vitest | Herramienta de pruebas incluida en el proyecto |

## 🏗️ Arquitectura

BioVerde utiliza Next.js App Router y una organización modular que separa las rutas, las funcionalidades de interfaz y los módulos del servidor.

```text
bioverde/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed-kit-components.ts
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── admin/
│   │   ├── api/
│   │   ├── arma-tu-kit/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── products/
│   │
│   ├── features/
│   │   ├── admin/
│   │   ├── cart/
│   │   ├── catalog/
│   │   ├── checkout/
│   │   ├── home/
│   │   ├── kit-builder/
│   │   └── navigation/
│   │
│   ├── generated/
│   │   └── prisma/
│   │
│   ├── scripts/
│   │
│   └── server/
│       ├── db/
│       └── modules/
│           ├── auth/
│           ├── inventory/
│           ├── kit-components/
│           ├── orders/
│           └── products/
│
├── package.json
├── prisma7.config.ts
└── README.md
```

### Responsabilidades

**`src/app`**

Define las páginas y los endpoints API de la aplicación.

**`src/features`**

Agrupa componentes y lógica de interfaz por funcionalidad.

**`src/server`**

Contiene el acceso a la base de datos y los módulos relacionados con las operaciones del servidor.

**`prisma`**

Almacena el esquema de datos, las migraciones y los scripts de carga inicial.

## 🗄️ Base de datos

La aplicación utiliza PostgreSQL mediante Prisma ORM y el adaptador `@prisma/adapter-pg`.

El modelo contempla entidades relacionadas con categorías, productos, variantes, componentes de kits, recetas, pedidos y administración.

### Migración a Neon PostgreSQL

Durante la preparación del despliegue se realizaron las siguientes actividades:

- Aplicación de 14 migraciones de Prisma.
- Exportación selectiva del catálogo desde PostgreSQL local.
- Importación transaccional de registros.
- Conservación de identificadores y relaciones.
- Verificación de precios, existencias y cantidades.

Se transfirieron y verificaron los siguientes datos:

| Entidad | Registros |
|---|---:|
| Categorías | 3 |
| Productos | 4 |
| Variantes | 7 |
| Componentes de kits | 15 |
| Relaciones de recetas | 27 |
| **Total** | **56** |

Los pedidos de prueba y las cuentas administrativas no se incluyeron en esta transferencia.

## 🚀 Instalación y ejecución local

### Requisitos

- Node.js compatible con Next.js 16.
- pnpm.
- PostgreSQL accesible, local o remoto.
- Variables de entorno configuradas.

### 1. Clonar el repositorio

```bash
git clone https://github.com/IMJACK7/Bioverde.git
cd Bioverde
```

### 2. Instalar dependencias

```bash
corepack pnpm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

Ejemplo ilustrativo:

```dotenv
DATABASE_URL="postgresql://usuario:password@localhost:5432/bioverde_db"
DIRECT_URL="postgresql://usuario:password@localhost:5432/bioverde_db"
AUTH_SECRET="reemplazar_con_un_secreto_aleatorio_seguro"
```

`DATABASE_URL` es obligatoria para el acceso a la base de datos desde la aplicación.

`DIRECT_URL` es opcional y se utiliza prioritariamente en la configuración de Prisma CLI cuando está definida.

Las variables adicionales necesarias para autenticación y despliegue deben verificarse en la configuración correspondiente.

**Nunca publicar el archivo `.env` ni credenciales reales en GitHub.**

### 4. Generar Prisma Client

```bash
corepack pnpm exec prisma generate --config prisma7.config.ts
```

### 5. Aplicar migraciones

Para una base de datos de desarrollo:

```bash
corepack pnpm exec prisma migrate dev --config prisma7.config.ts
```

Para aplicar migraciones existentes en un entorno de despliegue:

```bash
corepack pnpm exec prisma migrate deploy --config prisma7.config.ts
```

**Precaución:** utilizar una base de datos propia para desarrollo. No ejecutar scripts de carga inicial ni migraciones de desarrollo contra la base de datos de producción sin revisar previamente sus efectos.

### 6. Iniciar la aplicación

```bash
corepack pnpm dev
```

Abrir:

http://localhost:3000

### 7. Compilar para producción

```bash
corepack pnpm build
```

El comando ejecuta `prisma generate` y posteriormente `next build`.

## 🧪 Validaciones realizadas

- Compilación de producción exitosa.
- Comprobación de TypeScript.
- Generación de Prisma Client.
- Aplicación de migraciones en Neon.
- Verificación de integridad de los datos importados.
- Validación de precios y existencias del catálogo.

La ejecución de una suite completa de pruebas automatizadas no está documentada como verificada.

## 📸 Capturas de pantalla

Pendiente de incorporar capturas reales de:

- Página principal.
- Catálogo de productos.
- Configurador «Arma tu kit».
- Carrito de compras.
- Panel administrativo.

## 📌 Estado y próximos pasos

BioVerde se encuentra en una fase de preparación para su publicación.

**Completado:**
- Desarrollo de módulos comerciales y administrativos.
- Configuración de Prisma y PostgreSQL.
- Preparación de la base de datos en Neon.
- Compilación de producción.

**Pendiente:**
- Publicación del aplicativo.
- Configuración segura de las variables de producción.
- Creación de una cuenta administrativa de producción.
- Pruebas funcionales en el entorno desplegado.
- Incorporación de capturas reales al README.

## 👨‍💻 Autor

**IMJACK7**

Proyecto académico y de portafolio orientado al desarrollo de aplicaciones web full stack, la gestión de datos y la arquitectura modular.

GitHub: https://github.com/IMJACK7

---

Desarrollado como parte del aprendizaje y la aplicación práctica de tecnologías web modernas.