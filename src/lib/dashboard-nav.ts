// src/lib/dashboard-nav.ts
import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  UserCircle,
  Lightbulb,
  Users,
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
    label: "Thème",
    href: "/dashboard/etudiant/themes",
    icon: Lightbulb,
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
  { label: "Mon compte", href: "/dashboard/jury/mon-compte", icon: UserCircle },
];

const INSTITUTION_NAV: NavItem[] = [
  { label: "Tableau de bord", href: "/dashboard/etablissement", icon: LayoutDashboard },
  { label: "Thèmes", href: "/dashboard/etablissement/themes", icon: Lightbulb },
  { label: "Mémoires", href: "/dashboard/etablissement/memoires", icon: FileText },
  { label: "Jurys", href: "/dashboard/etablissement/jurys", icon: Users },
  { label: "Mon compte", href: "/dashboard/etablissement/mon-compte", icon: UserCircle },
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