export type Priority = "low" | "medium" | "high";

export interface RuleInputs {
  title: string;
  description: string;
  deadline?: Date | string | null;
}

const RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2 };

const HIGH_TERMS = [
  "outage",
  "down",
  "cannot login",
  "data loss",
  "security",
  "breach",
  "payment failed",
  "billing error",
  "leak",
];

const MEDIUM_TERMS = ["degraded", "timeout", "slow", "intermittent"];

function hoursUntil(d?: Date | string | null): number | null {
  if (!d) return null;
  const when = new Date(d).getTime();
  if (Number.isNaN(when)) return null;
  return (when - Date.now()) / (1000 * 60 * 60);
}

export function rulePriority(input: RuleInputs): Priority {
  const text = `${input.title} ${input.description}`.toLowerCase();

  // Deadline-based urgency
  const hrs = hoursUntil(input.deadline);
  if (hrs !== null) {
    if (hrs <= 24) return "high";
    if (hrs <= 72) return "medium";
  }

  // Keyword severity
  if (HIGH_TERMS.some((t) => text.includes(t))) return "high";
  if (MEDIUM_TERMS.some((t) => text.includes(t))) return "medium";

  return "low";
}

export function pickHigher(a: Priority, b: Priority): Priority {
  return RANK[a] >= RANK[b] ? a : b;
}
