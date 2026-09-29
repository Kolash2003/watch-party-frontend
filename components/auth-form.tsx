"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

const schema = z.object({
  name: z.string().min(1, "Enter your name").max(50).optional(),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type Values = z.infer<typeof schema>;

function Form({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const qc = useQueryClient();
  const next = useSearchParams().get("next");
  const signup = mode === "signup";
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(signup ? schema.required({ name: true }) : schema),
  });

  const onSubmit = async (v: Values) => {
    try {
      await api(`/auth/${mode}`, { method: "POST", json: v });
      await qc.invalidateQueries({ queryKey: ["me"] });
      // only follow same-site relative redirects
      router.replace(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (e) {
      const msg = (e as Error).message;
      toast.error(msg);
      setError("root", { message: msg });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{signup ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>{signup ? "Start hosting watch parties." : "Sign in to your WatchParty."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {signup && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete={signup ? "new-password" : "current-password"} aria-invalid={!!errors.password} {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>{signup ? "Sign up" : "Sign in"}</Button>
          <p className="text-center text-sm text-muted-foreground">
            {signup ? "Already have an account?" : "New here?"}{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href={{ pathname: signup ? "/login" : "/signup", query: next ? { next } : {} }}>
              {signup ? "Sign in" : "Create an account"}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export const AuthForm = (p: { mode: "login" | "signup" }) => <Suspense><Form {...p} /></Suspense>;
