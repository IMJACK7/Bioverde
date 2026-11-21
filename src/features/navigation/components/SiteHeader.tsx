
"use client";

import { useCallback, useEffect, useState } from "react";
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

  // Evitar diferencias de hidratación en el contador.
  const [isMounted, setIsMounted] = useState(false);

  const [isAdminAuthenticated, setIsAdminAuthenticated] =
    useState(false);

  const [isCheckingAdmin, setIsCheckingAdmin] =
    useState(true);

  // Marcar el componente como montado en el navegador.
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Consultar la sesión administrativa.
  const checkAdminSession = useCallback(async () => {
    setIsCheckingAdmin(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        setIsAdminAuthenticated(false);
        return;
      }

      const data: { authenticated?: boolean } =
        await response.json();

      setIsAdminAuthenticated(
        data.authenticated === true
      );
    } catch {
      setIsAdminAuthenticated(false);
    } finally {
      setIsCheckingAdmin(false);
    }
  }, []);

  // Consultar la sesión al cargar y cambiar de ruta.
  useEffect(() => {
    void checkAdminSession();
  }, [pathname, checkAdminSession]);

  // Actualizar la sesión al regresar a la pestaña.
  useEffect(() => {
    const handleFocus = () => {
      void checkAdminSession();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAdminSession]);

  // Identificar la ruta activa.
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  };

  // Mostrar el contador únicamente después del montaje.
  const showCartBadge =
    isMounted && isReady && totalItems > 0;

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
                aria-current={active ? "page" : undefined}
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

            {showCartBadge && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-background bg-terracotta px-1 text-[10px] font-bold text-white">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
          </Link>

          {/* ACCESO ADMINISTRATIVO */}
          {!isCheckingAdmin && (
            <Link
              href={
                isAdminAuthenticated
                  ? "/admin"
                  : "/admin/login"
              }
              aria-label={
                isAdminAuthenticated
                  ? "Ir al panel administrativo"
                  : "Iniciar sesión como administrador"
              }
              title={
                isAdminAuthenticated
                  ? "Panel Admin"
                  : "Login Admin"
              }
              className={`flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border px-2.5 font-semibold transition-all duration-200 sm:h-11 sm:px-3 ${
                pathname.startsWith("/admin")
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
                {isAdminAuthenticated ? (
                  <>
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                    />
                    <path d="M3 9h18M9 9v12" />
                  </>
                ) : (
                  <>
                    <rect
                      x="4"
                      y="11"
                      width="16"
                      height="10"
                      rx="2"
                    />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </>
                )}
              </svg>

              <span className="hidden lg:inline">
                {isAdminAuthenticated
                  ? "Panel Admin"
                  : "Login Admin"}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
