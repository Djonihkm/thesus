import { LogOut } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";

// Rendu comme item du menu de profil (voir ProfileMenu) — plus comme un bouton pilule
// isolé dans le header, seul appelant de ce composant.
export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-muted transition hover:bg-flag-soft hover:text-flag"
      >
        <LogOut size={15} strokeWidth={1.8} />
        Se déconnecter
      </button>
    </form>
  );
}
