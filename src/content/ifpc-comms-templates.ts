/**
 * One-click starting points for the communication types the spec calls for
 * that have no automated trigger (no scheduler exists in this deployment —
 * see communications/page.tsx). Admin picks one, it fills subject/body,
 * they review/edit and send via the existing bulk-email flow.
 */
export interface CommsTemplate {
  id: string;
  label: string;
  subject: string;
  body: string;
}

export const IFPC_COMMS_TEMPLATES: CommsTemplate[] = [
  {
    id: "event-start",
    label: "Event starting soon",
    subject: "{{eventTitle}} begins soon — what to know",
    body: `Dear {{name}},

{{eventTitle}} is almost here. A few things before you arrive:

- Please carry a valid photo ID and your registration confirmation.
- Registration and badge collection opens at the NIMHANS Convention Centre from 8:00 AM.
- Your delegate badge and QR code are available in your dashboard under "My Registrations" — you can also collect a printed badge on-site.

We look forward to seeing you.

Warm regards,
IFPC 2026 Organising Team`,
  },
  {
    id: "workshop-reminder",
    label: "Workshop / session reminder",
    subject: "Reminder: your session at {{eventTitle}}",
    body: `Dear {{name}},

This is a reminder about the workshop/session you signed up for at {{eventTitle}}. Please check the Scientific Programme in your dashboard for the exact hall and timing, and arrive a few minutes early as seats are limited.

See you there,
IFPC 2026 Organising Team`,
  },
  {
    id: "schedule-update",
    label: "Schedule update",
    subject: "Schedule update — {{eventTitle}}",
    body: `Dear {{name}},

There has been an update to the schedule for {{eventTitle}}. Please review the latest Scientific Programme in your dashboard for the current session times and halls.

We apologise for any inconvenience.

IFPC 2026 Organising Team`,
  },
  {
    id: "venue-announcement",
    label: "Venue announcement",
    subject: "Venue information — {{eventTitle}}",
    body: `Dear {{name}},

A quick venue update for {{eventTitle}} at the NIMHANS Convention Centre, Hosur Road, Bengaluru. Please see the Venue & Travel section of the site for directions, parking and nearby facilities.

IFPC 2026 Organising Team`,
  },
  {
    id: "accommodation-info",
    label: "Accommodation information",
    subject: "Accommodation for {{eventTitle}}",
    body: `Dear {{name}},

If you haven't already, please let us know your accommodation requirement from your dashboard under "Accommodation" — whether you need a room, your preferred sharing (single / two-sharing / three-sharing), and your check-in/check-out dates. This helps us and our partner hotels plan ahead.

IFPC 2026 Organising Team`,
  },
  {
    id: "important-instructions",
    label: "Important instructions",
    subject: "Important instructions for {{eventTitle}}",
    body: `Dear {{name}},

A few important instructions ahead of {{eventTitle}}:

- Carry a valid photo ID and your registration confirmation/badge.
- Presenters: please upload your final slides at least 48 hours before your session, and open every talk with a Conflict of Interest slide.
- The provided hall laptop must be used for presentations; personal laptops are not permitted.

Thank you for your cooperation.

IFPC 2026 Organising Team`,
  },
  {
    id: "feedback-request",
    label: "Feedback request",
    subject: "We'd value your feedback — {{eventTitle}}",
    body: `Dear {{name}},

Thank you for being part of {{eventTitle}}. We'd be grateful if you could share your feedback on the sessions, workshops and overall experience — it takes just a couple of minutes and genuinely shapes how we plan the next conference. You'll find the feedback form in your dashboard.

Thank you,
IFPC 2026 Organising Team`,
  },
  {
    id: "post-conference",
    label: "Post-conference thank you",
    subject: "Thank you for attending {{eventTitle}}",
    body: `Dear {{name}},

Thank you for being part of {{eventTitle}}. It was a pleasure hosting you. Your certificate of attendance (and presentation certificate, where applicable) is available in your dashboard under "My Certificates."

We hope to see you at the next edition.

Warm regards,
IFPC 2026 Organising Team`,
  },
];
