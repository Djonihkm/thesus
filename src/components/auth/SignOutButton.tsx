import { Button } from "@/components/ui/Button";
import { signOutAction } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" tone="light" variant="outline">
        Se déconnecter
      </Button>
    </form>
  );
}
