"use client";

import { useOrganization } from "@clerk/nextjs";
import { Building, Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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

interface StationAccessManagerProps {
  /** ID utilisateur Clerk pour qui gérer les accès */
  userId: string;
  /** Nom de l'utilisateur pour l'affichage */
  userName: string;
  /** Rôle de l'utilisateur dans l'org */
  userRole?: string;
}

/**
 * @deprecated Avec l'architecture 1 Org = 1 Station, les accès sont gérés via Clerk Organizations.
 * Ce composant affiche un message informatif.
 */
export function StationAccessManager({ userName }: StationAccessManagerProps) {
  const { organization } = useOrganization();

  if (!organization) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Building className="mr-2 h-4 w-4" />
          Gérer les stations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Accès de {userName}</DialogTitle>
          <DialogDescription>Gestion des accès aux stations</DialogDescription>
        </DialogHeader>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Architecture 1 Org = 1 Station</AlertTitle>
          <AlertDescription>
            Les accès aux stations sont maintenant gérés via les organisations Clerk.
            <br />
            <br />
            Chaque membre de l&apos;organisation <strong>{organization.name}</strong> a automatiquement accès à la
            station de cette organisation.
            <br />
            <br />
            Pour modifier les accès, utilisez la gestion des membres dans les paramètres de l&apos;organisation.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => {}}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
