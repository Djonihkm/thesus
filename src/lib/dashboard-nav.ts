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
  BookOpen,
  TrendingUp,
  UserCircle, 
  type LucideIcon,
} from "lucide-react";
import { Role } from "@prisma/client";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const STUDENT_NAV: NavItem[] = [
  {
    label: "Tableau de bord",
    href: "/dashboard/etudiant",
    icon: LayoutDashboard,
  },
  {
    label: "Mes mémoires",
    href: "/dashboard/etudiant/memoires",
    icon: BookOpen,
  },
  {
    label: "Évaluation",
    href: "/dashboard/etudiant/evaluation",
    icon: ClipboardCheck,
  },
  {
    label: "Progression",
    href: "/dashboard/etudiant/progression",
    icon: TrendingUp,
  },
  {
    label: "Mon compte",
    href: "/dashboard/etudiant/mon-compte",
    icon: UserCircle,
  },
];

const JURY_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/jury", icon: LayoutDashboard },
  { label: "Mémoires à évaluer", href: "/dashboard/jury/memoires", icon: FileText },
  { label: "Grilles de notation", href: "/dashboard/jury/grilles", icon: ClipboardCheck },
];

const INSTITUTION_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/etablissement", icon: LayoutDashboard },
  { label: "Étudiants", href: "/dashboard/etablissement/etudiants", icon: Users },
  { label: "Jurys", href: "/dashboard/etablissement/jurys", icon: Building2 },
  { label: "Statistiques", href: "/dashboard/etablissement/stats", icon: BarChart3 },
  { label: "Paramètres", href: "/dashboard/etablissement/parametres", icon: Settings },
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

//Fonction permettant de savoir si un item du menu est actif ou non, en fonction du pathname actuel et de l'item du menu
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;

  const isDashboardRoot = /^\/dashboard\/(etudiant|jury|etablissement)$/.test(href);
  if (isDashboardRoot) return false;

  return pathname.startsWith(`${href}/`);
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