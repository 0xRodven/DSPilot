"use client";

import { useState } from "react";
import { useOrganization, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InviteRole = "org:admin" | "org:manager" | "org:viewer";

interface InviteMemberModalProps {
  trigger?: React.ReactNode;
  allowedRoles?: InviteRole[];
}

export function InviteMemberModal({
  trigger,
  allowedRoles = ["org:admin", "org:manager", "org:viewer"],
}: InviteMemberModalProps) {
  const { organization, isLoaded } = useOrganization();
  const { orgRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("org:viewer");
  const [isLoading, setIsLoading] = useState(false);

  // Filtrer les rôles selon les permissions de l'utilisateur
  const getAvailableRoles = (): InviteRole[] => {
    if (orgRole === "org:admin") {
      return allowedRoles;
    }
    if (orgRole === "org:manager") {
      // Les managers peuvent seulement inviter des viewers
      return allowedRoles.filter((r) => r === "org:viewer");
    }
    return [];
  };

  const availableRoles = getAvailableRoles();

  const roleLabels: Record<InviteRole, { label: string; description: string }> = {
    "org:admin": {
      label: "Owner",
      description: "Tous les droits, peut gérer les membres",
    },
    "org:manager": {
      label: "Manager",
      description: "Lecture + écriture sur stations attribuées",
    },
    "org:viewer": {
      label: "Viewer",
      description: "Lecture seule sur stations attribuées",
    },
  };

  const handleInvite = async () => {
    if (!organization || !email) return;

    setIsLoading(true);
    try {
      await organization.inviteMember({
        emailAddress: email,
        role: role,
      });

      toast.success(`Invitation envoyée à ${email}`);
      setEmail("");
      setRole("org:viewer");
      setOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'invitation:", error);
      toast.error("Erreur lors de l'envoi de l'invitation");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || !organization || availableRoles.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Invitez un nouveau membre dans votre organisation. Un email
            d&apos;invitation lui sera envoyé.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as InviteRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    <div className="flex flex-col">
                      <span className="font-medium">{roleLabels[r].label}</span>
                      <span className="text-xs text-muted-foreground">
                        {roleLabels[r].description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleInvite} disabled={!email || isLoading}>
            {isLoading ? "Envoi..." : "Envoyer l'invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
