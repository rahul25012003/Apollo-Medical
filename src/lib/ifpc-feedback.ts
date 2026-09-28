// IFPC structured feedback — what can be rated. Pure data, safe to import on
// the client and the server alike.
import { IFPC_MENU_DAYS } from "@/lib/ifpc-food-menu";

export const FEEDBACK_DAYS = IFPC_MENU_DAYS;
export const MEALS = ["lunch", "dinner"] as const;
export type Meal = (typeof MEALS)[number];

export const foodKey = (date: string, meal: Meal) => `${date}:${meal}`;
export const isFoodKey = (key: string) => {
  const [date, meal] = key.split(":");
  return (FEEDBACK_DAYS as readonly string[]).includes(date) && (MEALS as readonly string[]).includes(meal);
};

/** Scientific sessions open for feedback, in programme order. */
export const SCIENTIFIC_ITEMS = [
  { key: "plenary-1", label: "Plenary 1" },
  { key: "plenary-2", label: "Plenary 2" },
  { key: "plenary-3", label: "Plenary 3" },
  { key: "plenary-4", label: "Plenary 4" },
  { key: "session-1", label: "Session 1" },
  { key: "session-2", label: "Session 2" },
] as const;
export const isScientificKey = (key: string) => SCIENTIFIC_ITEMS.some((i) => i.key === key);

export type FeedbackKind = "food" | "workshop" | "scientific";

export interface SubmittedFeedback {
  vegRating: number | null;
  nonVegRating: number | null;
  rating: number | null;
  comment: string | null;
}
