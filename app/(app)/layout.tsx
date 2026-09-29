"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Film, LogOut, Upload } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMe } from "@/hooks/use-me";
import { api } from "@/lib/api";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: me, isError } = useMe();
  const router = useRouter();
  const path = usePathname();
  const qc = useQueryClient();

  useEffect(() => {
    if (isError) router.replace(`/login?next=${encodeURIComponent(path)}`);
  }, [isError, path, router]);

  if (!me) return (
    <div className="flex flex-1 items-center justify-center">
      <Clapperboard className="size-10 animate-pulse text-primary" aria-label="Loading" />
    </div>
  );

  return (
    <>
      <header className="glass sticky top-0 z-40 flex items-center gap-3 border-x-0 border-t-0 px-4 py-2.5 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight">
          <span className="bg-brand grid size-8 place-items-center rounded-lg shadow-lg shadow-primary/30 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
            <Clapperboard className="size-4 text-white" />
          </span>
          <span className="text-gradient text-lg">WatchParty</span>
        </Link>
        <nav className="ml-4 flex gap-1">
          {[{ href: "/", label: "Library", icon: Film }, { href: "/upload", label: "Upload", icon: Upload }].map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={buttonVariants({ variant: "ghost", size: "sm", className: path === href ? "bg-accent text-foreground" : "text-muted-foreground" })}>
              <Icon /> <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="ml-auto rounded-full" aria-label="Account" />}>
            <Avatar className="size-8 ring-2 ring-primary/40 transition hover:ring-primary"><AvatarFallback className="bg-brand font-semibold text-white">{me.name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            {/* Base UI requires GroupLabel inside a Group, or the menu throws on open */}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex flex-col py-1.5">
                <span className="text-sm text-foreground">{me.name}</span>
                <span className="truncate font-normal">{me.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={async () => { await api("/auth/logout", { method: "POST" }).catch(() => {}); qc.clear(); router.replace("/login"); }}>
              <LogOut /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      {/* keyed on path so every navigation replays the entrance */}
      <main key={path} className="mx-auto w-full max-w-7xl flex-1 animate-in fade-in slide-in-from-bottom-2 p-4 duration-500 sm:p-6">{children}</main>
    </>
  );
}
