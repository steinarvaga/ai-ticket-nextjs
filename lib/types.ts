export type Role = "user" | "admin" | "moderator";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  skills?: string[];
  createdAt?: string; // ISO
}

export type TicketStatus = "todo" | "in_progress" | "completed";
export type TicketPriority = "low" | "medium" | "high";

export interface Ticket {
  _id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  creator?: { _id: string; name: string };
  assignee?: { _id: string; name: string } | null;
  skills?: string[];
  createdAt?: string; // ISO
  deadline?: string | null; // ISO
}
