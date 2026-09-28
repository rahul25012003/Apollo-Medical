import type { FoodMenus } from "@/lib/tenant/types";

/** Conference days that have lunch and dinner: Day 1-4. */
export const IFPC_MENU_DAYS = ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"] as const;

export function emptyFoodMenus(): FoodMenus {
  const meal = () => ({ veg: [], nonVeg: [], link: "" });
  return { days: IFPC_MENU_DAYS.map((date) => ({ date, lunch: meal(), dinner: meal() })) };
}

/** Saved menus laid over the empty frame, so every day and meal is present. */
export function menusWithAllDays(saved: FoodMenus | undefined | null): FoodMenus {
  const base = emptyFoodMenus();
  if (!saved?.days) return base;
  return { days: base.days.map((d) => saved.days.find((s) => s.date === d.date) ?? d) };
}
