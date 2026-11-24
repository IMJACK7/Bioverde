
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      aria-label="Bienvenida a BioVerde"
      className="relative overflow-hidden bg-background"
    >
      <div className="relative mx-auto w-full max-w-[1600px]">
        {/* Banner principal */}
        <Image
          src="/images/banners/bioverde-hero1.png"
          alt="BioVerde: Cultiva tu propio alimento en casa. Kits de huertos ecológicos para una vida más sana y natural."
          width={1600}
          height={640}
          priority
          sizes="100vw"
          className="block h-auto w-full"
        />

        {/* Área interactiva sobre el botón del banner */}
        <Link
          href="/products"
          aria-label="Explorar los productos y kits de BioVerde"
          className="
            absolute
            bottom-[19%]
            left-[4%]
            h-[10%]
            w-[14%]
            min-w-0
            rounded-full
            transition-all
            duration-300
            hover:bg-white/10
            focus-visible:outline-4
            focus-visible:outline-offset-2
            focus-visible:outline-terracotta
          "
        >
          <span className="sr-only">
            Explorar productos
          </span>
        </Link>
      </div>

      {/* Transición visual hacia el contenido */}
      <div
        aria-hidden="true"
        className="h-3 w-full bg-gradient-to-b from-surface-muted to-background sm:h-5"
      />
    </section>
  );
}
