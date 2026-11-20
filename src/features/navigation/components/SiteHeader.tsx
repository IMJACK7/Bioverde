
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/features/cart/context/CartContext";

const navigationItems = [
  { label: "Inicio", href: "/" },
  { label: "Productos", href: "/products" },
  { label: "Arma tu Kit", href: "/arma-tu-kit" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { totalItems, isReady } = useCart();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-[0_3px_18px_rgba(48,44,37,0.05)] backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-5 md:px-8">

        {/* LOGOTIPO */}
        <Link
          href="/"
          aria-label="BioVerde - Inicio"
          className="group flex shrink-0 items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-border bg-surface shadow-sm transition-transform duration-300 group-hover:scale-105 sm:h-14 sm:w-14">
            <Image
              src="/images/brand/bioverde-logo.jpeg"
              alt="Logotipo de BioVerde"
              width={64}
              height={64}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div className="hidden sm:block">
            <span className="block text-xl font-bold tracking-tight text-primary">
              BioVerde
            </span>

            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-earth">
              Recicla, nutre, renace
            </span>
          </div>
        </Link>

        {/* NAVEGACIÓN */}
        <nav
          aria-label="Navegación principal"
          className="flex min-w-0 items-center gap-2 text-xs font-medium sm:gap-4 sm:text-sm lg:gap-6"
        >
          {navigationItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  active ? "page" : undefined
                }
                className={`group relative whitespace-nowrap py-2 transition-colors duration-200 ${
                  active
                    ? "font-semibold text-primary"
                    : "text-earth hover:text-primary"
                }`}
              >
                {item.label}

                <span
                  aria-hidden="true"
                  className={`absolute bottom-0 left-0 h-[2px] rounded-full bg-terracotta transition-all duration-300 ${
                    active
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}

          {/* CARRITO */}
          <Link
            href="/cart"
            aria-label="Carrito de compras"
            aria-current={
              isActive("/cart") ? "page" : undefined
            }
            className={`relative ml-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-200 sm:h-11 sm:w-11 ${
              isActive("/cart")
                ? "border-primary bg-primary text-white shadow-sm"
                : "border-border bg-surface text-primary hover:border-primary hover:bg-primary-light"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.61L22 7H5" />
            </svg>

            {/* CONTADOR */}
            {isReady && totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-terracotta px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* ACCESO ADMINISTRATIVO */}
          <Link
            href="/admin/login"
            aria-label="Iniciar sesión como administrador"
            title="Login Admin"
            aria-current={
              isActive("/admin") ? "page" : undefined
            }
            className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-2.5 font-semibold transition-all duration-200 sm:h-11 sm:px-3 ${
              isActive("/admin")
                ? "border-primary bg-primary text-white"
                : "border-primary/30 bg-surface text-primary hover:border-primary hover:bg-primary-light"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect
                x="4"
                y="11"
                width="16"
                height="10"
                rx="2"
              />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>

            <span className="hidden lg:inline">
              Login Admin
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
