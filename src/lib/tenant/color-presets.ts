// Pre-built color palette presets for tenant theming

export interface ColorPreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "medical-teal",
    name: "Medical Teal",
    primaryColor: "#0d9488",
    secondaryColor: "#0891b2",
    accentColor: "#10b981",
  },
  {
    id: "royal-blue",
    name: "Royal Blue",
    primaryColor: "#2563eb",
    secondaryColor: "#3b82f6",
    accentColor: "#6366f1",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    primaryColor: "#059669",
    secondaryColor: "#10b981",
    accentColor: "#14b8a6",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    primaryColor: "#ea580c",
    secondaryColor: "#f59e0b",
    accentColor: "#ef4444",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    primaryColor: "#7c3aed",
    secondaryColor: "#8b5cf6",
    accentColor: "#a855f7",
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    primaryColor: "#0284c7",
    secondaryColor: "#0ea5e9",
    accentColor: "#06b6d4",
  },
  {
    id: "crimson",
    name: "Crimson",
    primaryColor: "#dc2626",
    secondaryColor: "#e11d48",
    accentColor: "#f43f5e",
  },
  {
    id: "slate-professional",
    name: "Slate Professional",
    primaryColor: "#475569",
    secondaryColor: "#64748b",
    accentColor: "#94a3b8",
  },
];

export function findPresetByColors(
  primary: string,
  secondary: string,
  accent: string
): ColorPreset | undefined {
  return COLOR_PRESETS.find(
    (p) =>
      p.primaryColor.toLowerCase() === primary.toLowerCase() &&
      p.secondaryColor.toLowerCase() === secondary.toLowerCase() &&
      p.accentColor.toLowerCase() === accent.toLowerCase()
  );
}
