import Link from "next/link";

const footerLinks = [
  { label: "Productos", href: "/products" },
  { label: "Arma tu kit", href: "/arma-tu-kit" },
  { label: "Carrito", href: "/cart" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-surface-dark text-text-light">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-text-light transition-colors hover:text-sage"
          >
            BioVerde
          </Link>
          <p className="mt-2 text-sm text-text-light/75">
            Recicla, nutre, renace.
          </p>
        </div>

        <nav aria-label="Navegación del pie de página">
          <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="underline-offset-4 transition-colors hover:text-sage hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="flex items-center gap-2 text-xs text-text-light/70">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-terracotta"
          />
          Cultiva naturalmente
        </p>
      </div>
    </footer>
  );
}
