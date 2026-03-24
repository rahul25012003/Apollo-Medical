"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function DarkModeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        // Check localStorage or system preference
        const stored = localStorage.getItem("theme");
        if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
            setDark(true);
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggle = () => {
        const next = !dark;
        setDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    };

    return (
        <button
            onClick={toggle}
            className="relative p-2 rounded-xl hover:bg-muted/80 transition-all duration-300 group"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
        >
            <Sun className={`w-5 h-5 transition-all duration-300 absolute inset-0 m-auto ${dark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"} text-amber-500`} />
            <Moon className={`w-5 h-5 transition-all duration-300 ${dark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"} text-blue-400`} />
        </button>
    );
}
