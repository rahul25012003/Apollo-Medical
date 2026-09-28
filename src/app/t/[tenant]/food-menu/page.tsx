"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { UtensilsCrossed, ExternalLink, Sun, Moon } from "lucide-react";
import { IFPC_TENANT_SLUG } from "@/lib/ifpc-constants";
import { useTenant } from "@/lib/tenant/context";
import { conferenceDay } from "@/lib/ifpc-eoi";
import { menusWithAllDays } from "@/lib/ifpc-food-menu";
import type { FoodMeal } from "@/lib/tenant/types";
import { DelegatePageShell } from "@/components/ifpc/DelegatePageShell";
import { cn } from "@/lib/utils";
import "@/components/ifpc/food-preference.css";

/** Daily lunch and dinner menus, Day 1-4. Public, like the other venue pages. */
export default function FoodMenuPage() {
  const params = useParams();
  if ((params.tenant as string) !== IFPC_TENANT_SLUG) notFound();

  const { tenant } = useTenant();
  const accent = tenant?.theme?.primaryColor || "#2582A1";
  const menus = menusWithAllDays(tenant?.foodMenus);

  // Open on today during the conference, otherwise Day 1.
  const [day, setDay] = useState(menus.days[0].date);
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    if (menus.days.some((d) => d.date === today)) setDay(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const current = menus.days.find((d) => d.date === day) ?? menus.days[0];

  return (
    <DelegatePageShell title="Food Menu" icon={UtensilsCrossed}>
      <div role="tablist" aria-label="Conference days" className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {menus.days.map((d) => {
          const active = d.date === day;
          return (
            <button
              key={d.date}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDay(d.date)}
              className={cn(
                "flex min-w-[88px] flex-none flex-col items-center rounded-xl border px-3 py-2 text-center transition-colors",
                active ? "border-transparent text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
              style={active ? { background: accent } : undefined}
            >
              <span className="text-xs font-semibold uppercase tracking-wide opacity-80">Day {conferenceDay(d.date)}</span>
              <span className="text-sm font-bold">{format(parseISO(d.date), "EEE d MMM")}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        <MealCard title="Lunch" icon={Sun} meal={current.lunch} />
        <MealCard title="Dinner" icon={Moon} meal={current.dinner} />
      </div>
    </DelegatePageShell>
  );
}

function MealCard({ title, icon: Icon, meal }: { title: string; icon: typeof Sun; meal: FoodMeal }) {
  const empty = meal.veg.length === 0 && meal.nonVeg.length === 0;
  return (
    <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Icon className="h-5 w-5 text-amber-500" /> {title}
        </h2>
        {meal.link && (
          <a href={meal.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
            Full menu <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {empty ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
          Menu to be announced{meal.link ? " — see the full menu link above" : ""}.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <DishList kind="veg" dishes={meal.veg} />
          <DishList kind="nonVeg" dishes={meal.nonVeg} />
        </div>
      )}
    </section>
  );
}

// Same green/red mark as the delegate's own food choice.
function DishList({ kind, dishes }: { kind: "veg" | "nonVeg"; dishes: string[] }) {
  const nonVeg = kind === "nonVeg";
  return (
    <div>
      <span className={cn("ifpc-food ifpc-food--readout mb-2", nonVeg && "ifpc-food--nonveg")} data-selected="true">
        <span className="ifpc-food-mark" aria-hidden="true" /> {nonVeg ? "Non-Veg" : "Veg"}
      </span>
      {dishes.length === 0 ? (
        <p className="text-sm text-slate-400">Not served</p>
      ) : (
        <ul className="space-y-1.5">
          {dishes.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-800">
              <span className={cn("mt-1.5 h-1.5 w-1.5 flex-none rounded-full", nonVeg ? "bg-red-600" : "bg-green-700")} aria-hidden="true" />
              {d}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
