
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      aria-label="Bienvenida a BioVerde"
      className="bg-[#f7f5eb]"
    >
      <div className="relative mx-auto w-full max-w-[1600px]">
        <Image
          src="/images/banners/bioverde-hero.jpeg"
          alt="BioVerde: Cultiva tu propio alimento en casa. Kits de huertos ecológicos para una vida más sana y natural."
          width={1600}
          height={640}
          priority
          sizes="100vw"
          className="block h-auto w-full"
        />

        <Link
          href="/products"
          aria-label="Explorar los productos y kits de BioVerde"
          className="absolute bottom-[19%] left-[4%] h-[10%] w-[14%] rounded-full focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-green-800"
        >
          <span className="sr-only">
            Explorar productos
          </span>
        </Link>
      </div>
    </section>
  );
}
