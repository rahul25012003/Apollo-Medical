/**
 * Default participant roles, session types, and certificate configs.
 * Used as fallback when event doesn't have custom config.
 * Admin can override per-event via JSON fields on Event model.
 */

// ============================================================================
// PARTICIPANT ROLES
// ============================================================================

export interface ParticipantRoleConfig {
  id: string;
  label: string;
  showOnPublicRegistration: boolean;
  certificate: {
    title: string;
    certificateType: string;
    bodyText: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      border: string;
    };
  };
}

export const DEFAULT_PARTICIPANT_ROLES: ParticipantRoleConfig[] = [
  {
    id: "DELEGATE",
    label: "Delegate",
    showOnPublicRegistration: true,
    certificate: {
      title: "Certificate of Attendance",
      certificateType: "ATTENDANCE",
      bodyText: "has successfully attended the",
      colors: { primary: "#1e3a5f", secondary: "#2563eb", accent: "#dbeafe", border: "#1e40af" },
    },
  },
  {
    id: "SPEAKER",
    label: "Speaker",
    showOnPublicRegistration: false,
    certificate: {
      title: "Speaker Certificate",
      certificateType: "SPEAKER_SESSION",
      bodyText: "has delivered a presentation at",
      colors: { primary: "#1e3a8a", secondary: "#3b82f6", accent: "#dbeafe", border: "#2563eb" },
    },
  },
  {
    id: "ORGANIZER",
    label: "Organizer",
    showOnPublicRegistration: false,
    certificate: {
      title: "Certificate of Organization",
      certificateType: "ORGANIZATION",
      bodyText: "has served as an organizer for",
      colors: { primary: "#581c87", secondary: "#8b5cf6", accent: "#ede9fe", border: "#7c3aed" },
    },
  },
  {
    id: "JUDGE",
    label: "Judge",
    showOnPublicRegistration: false,
    certificate: {
      title: "Certificate of Adjudication",
      certificateType: "JUDGE",
      bodyText: "has served as a judge/adjudicator at",
      colors: { primary: "#78350f", secondary: "#d97706", accent: "#fef3c7", border: "#b45309" },
    },
  },
  {
    id: "VOLUNTEER",
    label: "Volunteer",
    showOnPublicRegistration: true,
    certificate: {
      title: "Volunteer Certificate",
      certificateType: "VOLUNTEER",
      bodyText: "has volunteered at",
      colors: { primary: "#065f46", secondary: "#10b981", accent: "#d1fae5", border: "#059669" },
    },
  },
  {
    id: "CHAIRPERSON",
    label: "Chairperson",
    showOnPublicRegistration: false,
    certificate: {
      title: "Chairperson Certificate",
      certificateType: "CHAIRPERSON",
      bodyText: "has chaired sessions at",
      colors: { primary: "#1e3a5f", secondary: "#1d4ed8", accent: "#dbeafe", border: "#1e40af" },
    },
  },
];

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface SessionTypeConfig {
  id: string;
  label: string;
  icon: string;
  colors: {
    bg: string;
    border: string;
    badge: string;
  };
}

export const DEFAULT_SESSION_TYPES: SessionTypeConfig[] = [
  { id: "KEYNOTE", label: "Keynote", icon: "🎤", colors: { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" } },
  { id: "PLENARY", label: "Plenary", icon: "🏛️", colors: { bg: "bg-indigo-50", border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" } },
  { id: "WORKSHOP", label: "Workshop", icon: "🔬", colors: { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" } },
  { id: "PANEL", label: "Panel Discussion", icon: "👥", colors: { bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700" } },
  { id: "SEMINAR", label: "Seminar", icon: "📚", colors: { bg: "bg-cyan-50", border: "border-cyan-200", badge: "bg-cyan-100 text-cyan-700" } },
  { id: "SYMPOSIUM", label: "Symposium", icon: "🎓", colors: { bg: "bg-teal-50", border: "border-teal-200", badge: "bg-teal-100 text-teal-700" } },
  { id: "BREAK", label: "Break", icon: "☕", colors: { bg: "bg-amber-50/50", border: "border-amber-200/50", badge: "bg-amber-100 text-amber-700" } },
  { id: "OTHER", label: "Other", icon: "📋", colors: { bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100 text-slate-700" } },
];

// ============================================================================
// HELPERS — get config from event with fallback to defaults
// ============================================================================

export function getParticipantRoles(event?: { participantRoles?: unknown } | null): ParticipantRoleConfig[] {
  if (event?.participantRoles && Array.isArray(event.participantRoles)) {
    return event.participantRoles as ParticipantRoleConfig[];
  }
  return DEFAULT_PARTICIPANT_ROLES;
}

export function getSessionTypes(event?: { sessionTypes?: unknown } | null): SessionTypeConfig[] {
  if (event?.sessionTypes && Array.isArray(event.sessionTypes)) {
    return event.sessionTypes as SessionTypeConfig[];
  }
  return DEFAULT_SESSION_TYPES;
}

export function getRoleConfig(event: { participantRoles?: unknown } | null | undefined, roleId: string | null | undefined): ParticipantRoleConfig | undefined {
  const roles = getParticipantRoles(event);
  return roles.find(r => r.id === roleId?.toUpperCase()) || roles.find(r => r.id === "DELEGATE");
}

export function getCertConfigForRole(event: { participantRoles?: unknown } | null | undefined, roleId: string | null | undefined, eventTitle: string): { title: string; certificateType: string; bodyText: string; colors: ParticipantRoleConfig["certificate"]["colors"] } {
  const role = getRoleConfig(event, roleId);
  if (role) {
    return {
      title: `${role.certificate.title} - ${eventTitle}`,
      certificateType: role.certificate.certificateType,
      bodyText: role.certificate.bodyText,
      colors: role.certificate.colors,
    };
  }
  return {
    title: `Certificate of Attendance - ${eventTitle}`,
    certificateType: "ATTENDANCE",
    bodyText: "has successfully attended the",
    colors: { primary: "#1e3a5f", secondary: "#2563eb", accent: "#dbeafe", border: "#1e40af" },
  };
}

export function getSessionTypeConfig(event: { sessionTypes?: unknown } | null | undefined, typeId: string): SessionTypeConfig {
  const types = getSessionTypes(event);
  return types.find(t => t.id === typeId) || types.find(t => t.id === "OTHER") || DEFAULT_SESSION_TYPES[DEFAULT_SESSION_TYPES.length - 1];
}
