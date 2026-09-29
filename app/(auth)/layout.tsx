import { Clapperboard, MessageCircle, RefreshCw, Users } from "lucide-react";

const FEATURES = [
  { icon: RefreshCw, text: "Frame-accurate sync for everyone" },
  { icon: MessageCircle, text: "Live chat and emoji reactions" },
  { icon: Users, text: "Invite friends with a single link" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid flex-1 overflow-hidden lg:grid-cols-2">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="animate-blob absolute top-1/4 left-1/5 size-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="animate-blob absolute bottom-1/5 left-1/3 size-80 rounded-full bg-[var(--brand-2)]/25 blur-3xl [animation-delay:-5s]" />
        <div className="animate-blob absolute top-1/6 right-1/4 size-72 rounded-full bg-[var(--brand-3)]/20 blur-3xl [animation-delay:-9s]" />
      </div>
      <section className="relative hidden flex-col justify-center gap-8 p-12 lg:flex">
        <div className="enter flex items-center gap-3">
          <span className="bg-brand grid size-12 place-items-center rounded-xl shadow-xl shadow-primary/40"><Clapperboard className="size-6 text-white" /></span>
          <span className="text-gradient text-3xl font-bold tracking-tight">WatchParty</span>
        </div>
        <h1 className="enter max-w-md text-5xl leading-tight font-bold tracking-tight [--i:1]">Movie night,<br />wherever you are.</h1>
        <ul className="flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, text }, i) => (
            <li key={text} className="enter flex items-center gap-3 text-muted-foreground" style={{ "--i": i + 2 } as React.CSSProperties}>
              <span className="glass grid size-9 place-items-center rounded-lg"><Icon className="size-4 text-primary" /></span>
              {text}
            </li>
          ))}
        </ul>
      </section>
      <section className="relative flex items-center justify-center p-4">{children}</section>
    </main>
  );
}
