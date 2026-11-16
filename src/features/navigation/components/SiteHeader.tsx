
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
    <header className="sticky top-0 z-50 border-b border-green-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-3 sm:px-5 md:px-8">
        {/* Logotipo */}
        <Link
          href="/"
          aria-label="BioVerde - Inicio"
          className="flex shrink-0 items-center gap-3"
        >
          <Image
            src="/images/brand/bioverde-logo.jpeg"
            alt="Logotipo de BioVerde"
            width={64}
            height={64}
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
            priority
          />

          <div className="hidden sm:block">
            <span className="block text-xl font-bold tracking-tight text-[#52730E]">
              BioVerde
            </span>

            <span className="block text-[10px] uppercase tracking-widest text-gray-500">
              Recicla, nutre, renace
            </span>
          </div>
        </Link>

        {/* Navegación principal */}
        <nav
          aria-label="Navegación principal"
          className="flex min-w-0 items-center gap-3 text-xs font-medium sm:gap-5 sm:text-sm"
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
                className={`relative whitespace-nowrap py-2 transition-colors ${
                  active
                    ? "font-semibold text-[#52730E]"
                    : "text-gray-700 hover:text-[#52730E]"
                }`}
              >
                {item.label}

                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[#52730E]"
                  />
                )}
              </Link>
            );
          })}

          {/* Acceso al carrito */}
          <Link
            href="/cart"
            aria-label={
              isReady
                ? `Carrito de compras, ${totalItems} unidades`
                : "Carrito de compras"
            }
            aria-current={
              isActive("/cart") ? "page" : undefined
            }
            className={`relative ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors ${
              isActive("/cart")
                ? "border-[#52730E] bg-green-50 text-[#52730E]"
                : "border-green-100 text-gray-700 hover:bg-green-50 hover:text-[#52730E]"
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

            {isReady && totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#52730E] px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
