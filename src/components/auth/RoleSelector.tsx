"use client";

import { TabSelect } from "@/components/auth/TabSelect";
import { ROLE_LABELS, type Role } from "@/lib/validation";

const ROLE_OPTIONS = (Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => ({
  value,
  label,
}));

export function RoleSelector({
  value,
  onChange,
}: {
  value: Role;
  onChange: (role: Role) => void;
}) {
  return <TabSelect ariaLabel="Profil" value={value} onChange={onChange} options={ROLE_OPTIONS} />;
}
