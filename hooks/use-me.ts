"use client";

import { useQuery } from "@tanstack/react-query";
import { api, Me } from "@/lib/api";

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: () => api<Me>("/me") });
