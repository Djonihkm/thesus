"use client";

import { TabSelect } from "@/components/auth/TabSelect";
import { ROLE_LABELS, type Role } from "@/lib/validation";

// Le rôle Jury n'est plus auto-inscriptible : les comptes jury sont désormais créés
// exclusivement par l'établissement (voir src/lib/actions/jury-accounts.ts), avec mot de
// passe temporaire envoyé par email.
const REGISTRABLE_ROLES: Role[] = ["STUDENT", "INSTITUTION"];

const ROLE_OPTIONS = (Object.entries(ROLE_LABELS) as [Role, string][])
  .filter(([value]) => REGISTRABLE_ROLES.includes(value))
  .map(([value, label]) => ({ value, label }));

export function RoleSelector({
  value,
  onChange,
}: {
  value: Role;
  onChange: (role: Role) => void;
}) {
  return <TabSelect ariaLabel="Profil" value={value} onChange={onChange} options={ROLE_OPTIONS} />;
}
