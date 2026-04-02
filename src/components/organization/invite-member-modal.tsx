"use client";

import { useState } from "react";

import { useAuth, useOrganization } from "@clerk/nextjs";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Clerk Free Plan: uniquement les rôles built-in org:admin et org:member
type InviteRole = "org:admin" | "org:member";

interface InviteMemberModalProps {
  trigger?: React.ReactNode;
  allowedRoles?: InviteRole[];
}

export function InviteMemberModal({ trigger, allowedRoles = ["org:admin", "org:member"] }: InviteMemberModalProps) {
  const { organization, isLoaded } = useOrganization();
  const { orgRole } = useAuth();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteRole>("org:member");
  const [isLoading, setIsLoading] = useState(false);

  // Seuls les admins peuvent inviter (Clerk Free Plan limitation)
  const getAvailableRoles = (): InviteRole[] => {
    if (orgRole === "org:admin") {
      return allowedRoles;
    }
    // Les membres ne peuvent pas inviter
    return [];
  };

  const availableRoles = getAvailableRoles();

  const roleLabels: Record<InviteRole, { label: string; description: string }> = {
    "org:admin": {
      label: "Admin",
      description: "Tous les droits, peut gérer les membres",
    },
    "org:member": {
      label: "Membre",
      description: "Accès complet aux données de la station",
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
      setRole("org:member");
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
            <UserPlus className="mr-2 h-4 w-4" />
            Inviter
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>
            Invitez un nouveau membre dans votre organisation. Un email d&apos;invitation lui sera envoyé.
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
                      <span className="text-muted-foreground text-xs">{roleLabels[r].description}</span>
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
