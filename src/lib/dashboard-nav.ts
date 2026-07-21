// src/lib/dashboard-nav.ts
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  ListChecks,
  Users,
  ClipboardCheck,
  Building2,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@prisma/client";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const STUDENT_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/etudiant", icon: LayoutDashboard },
  { label: "Mon mémoire", href: "/dashboard/etudiant/memoire", icon: FileText },
  { label: "Audit", href: "/dashboard/etudiant/audit", icon: ClipboardCheck },
  { label: "Anti-plagiat", href: "/dashboard/etudiant/plagiat", icon: ShieldCheck },
  { label: "Quiz", href: "/dashboard/etudiant/quiz", icon: ListChecks },
  { label: "Simulation jury", href: "/dashboard/etudiant/jury", icon: Users },
];

const JURY_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/jury", icon: LayoutDashboard },
  { label: "Mémoires à évaluer", href: "/dashboard/jury/memoires", icon: FileText },
  { label: "Grilles de notation", href: "/dashboard/jury/grilles", icon: ClipboardCheck },
];

const INSTITUTION_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/institution", icon: LayoutDashboard },
  { label: "Étudiants", href: "/dashboard/institution/etudiants", icon: Users },
  { label: "Jurys", href: "/dashboard/institution/jurys", icon: Building2 },
  { label: "Statistiques", href: "/dashboard/institution/stats", icon: BarChart3 },
  { label: "Paramètres", href: "/dashboard/institution/parametres", icon: Settings },
];

export function getNavForRole(role: Role): NavItem[] {
  switch (role) {
    case "STUDENT":
      return STUDENT_NAV;
    case "JURY":
      return JURY_NAV;
    case "INSTITUTION":
      return INSTITUTION_NAV;
  }
}

export function getRoleLabel(role: Role): string {
  switch (role) {
    case "STUDENT":
      return "Espace étudiant";
    case "JURY":
      return "Espace jury";
    case "INSTITUTION":
      return "Espace établissement";
  }
}