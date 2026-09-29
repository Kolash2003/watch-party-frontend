"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
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
      setError("root", { message: msg });
    }
  };

  return (
    <Card className="glass enter w-full max-w-sm shadow-2xl shadow-primary/10 [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-2xl font-bold tracking-tight">{signup ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>{signup ? "Start hosting watch parties." : "Sign in to your WatchParty."}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {errors.root && (
              <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1"><CircleAlert /><AlertDescription>{errors.root.message}</AlertDescription></Alert>
            )}
            {signup && (
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" autoComplete="name" placeholder="Alex" aria-invalid={!!errors.name} {...register("name")} />
                <FieldError className="animate-in fade-in slide-in-from-top-1 text-xs" errors={[errors.name]} />
              </Field>
            )}
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register("email")} />
              <FieldError className="animate-in fade-in slide-in-from-top-1 text-xs" errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" autoComplete={signup ? "new-password" : "current-password"} aria-invalid={!!errors.password} {...register("password")} />
              {signup && !errors.password && <FieldDescription className="text-xs">At least 8 characters.</FieldDescription>}
              <FieldError className="animate-in fade-in slide-in-from-top-1 text-xs" errors={[errors.password]} />
            </Field>
            <Button type="submit" size="lg" disabled={isSubmitting} className="bg-brand h-10 text-white shadow-lg shadow-primary/30 transition hover:shadow-primary/50 hover:brightness-110 active:scale-[0.98]">
              {isSubmitting && <Spinner />}{signup ? "Create account" : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {signup ? "Already have an account?" : "New here?"}{" "}
              <Link className="text-primary underline-offset-4 hover:underline" href={{ pathname: signup ? "/login" : "/signup", query: next ? { next } : {} }}>
                {signup ? "Sign in" : "Create an account"}
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

export const AuthForm = (p: { mode: "login" | "signup" }) => <Suspense><Form {...p} /></Suspense>;
