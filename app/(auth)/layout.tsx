import { Logo } from "@/components/logo";

const stickers = [
  { emoji: "🎉", className: "right-6 top-6 text-5xl [--tilt:12deg] md:right-10 md:top-10" },
  { emoji: "🎸", className: "right-24 top-20 text-4xl [--tilt:-14deg] [animation-delay:-3s] md:right-40 md:top-32" },
  { emoji: "🔥", className: "right-10 top-56 text-4xl [--tilt:-8deg] [animation-delay:-1.5s] max-md:hidden" },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-6 sm:py-12">
      <div className="card-pop grid w-full max-w-5xl overflow-hidden md:grid-cols-[1.1fr_1fr]">
        <section className="relative isolate flex min-h-52 flex-col justify-between overflow-hidden border-b-2 border-ink bg-violet p-6 text-white sm:p-10 md:min-h-[560px] md:border-r-2 md:border-b-0">
          <div className="absolute -top-16 -right-16 -z-10 size-56 rounded-full border-2 border-ink bg-lime md:size-72" aria-hidden />
          <div className="absolute -bottom-12 -left-12 -z-10 size-36 rounded-full border-2 border-ink bg-pink md:size-48" aria-hidden />
          {stickers.map((sticker) => (
            <span
              key={sticker.emoji}
              className={`animate-float absolute drop-shadow-[3px_3px_0_var(--color-ink)] ${sticker.className}`}
              aria-hidden
            >
              {sticker.emoji}
            </span>
          ))}

          <Logo className="self-start rounded-xl border-2 border-ink bg-white px-3 py-1.5 text-xl text-ink shadow-pop-sm" />

          <div className="mt-10 max-w-xs md:mt-0">
            <h2 className="text-4xl leading-[1.05] font-extrabold md:text-5xl">
              Your city.
              <br />
              Your plans.
            </h2>
            <p className="mt-3 text-white/90 max-md:hidden">
              Gigs, food walks, weekend workshops and everything in between, all in one place.
            </p>
          </div>
        </section>

        <section className="p-6 sm:p-10 md:self-center">{children}</section>
      </div>
    </main>
  );
}
