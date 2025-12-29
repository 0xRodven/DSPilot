"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useOrganization } from "@clerk/nextjs";
import { toast } from "sonner";
import { Building, Trash2, UserPlus, Shield, Eye } from "lucide-react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AccessRole = "manager" | "viewer";

interface StationAccessManagerProps {
  /** ID utilisateur Clerk pour qui gérer les accès */
  userId: string;
  /** Nom de l'utilisateur pour l'affichage */
  userName: string;
  /** Rôle de l'utilisateur dans l'org */
  userRole?: string;
}

export function StationAccessManager({
  userId,
  userName,
  userRole,
}: StationAccessManagerProps) {
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AccessRole>("viewer");
  const [isLoading, setIsLoading] = useState(false);

  // Récupérer toutes les stations de l'org
  const stations = useQuery(api.stations.listUserStations) ?? [];

  // Récupérer les accès existants
  const allAccess = useQuery(api.stations.listAllStationAccess) ?? [];
  const userAccess = allAccess.filter((a) => a.userId === userId);

  // Mutations
  const grantAccess = useMutation(api.stations.grantStationAccess);
  const revokeAccess = useMutation(api.stations.revokeStationAccess);

  // Stations déjà attribuées à cet utilisateur
  const assignedStationIds = new Set(userAccess.map((a) => a.stationId));
  const availableStations = stations.filter((s) => !assignedStationIds.has(s._id));

  const handleGrantAccess = async () => {
    if (!selectedStation) return;

    setIsLoading(true);
    try {
      await grantAccess({
        stationId: selectedStation as Id<"stations">,
        userId,
        role: selectedRole,
      });

      toast.success("Accès accordé avec succès");
      setSelectedStation("");
      setSelectedRole("viewer");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'attribution de l'accès");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeAccess = async (stationId: Id<"stations">) => {
    try {
      await revokeAccess({
        stationId,
        userId,
      });
      toast.success("Accès révoqué");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la révocation");
    }
  };

  const getStationName = (stationId: Id<"stations">) => {
    const station = stations.find((s) => s._id === stationId);
    return station ? `${station.name} (${station.code})` : "Station inconnue";
  };

  const roleLabels: Record<AccessRole, { label: string; icon: React.ReactNode }> = {
    manager: {
      label: "Manager",
      icon: <Shield className="h-3 w-3" />,
    },
    viewer: {
      label: "Viewer",
      icon: <Eye className="h-3 w-3" />,
    },
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Building className="h-4 w-4 mr-2" />
          Gérer les stations
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Stations de {userName}</DialogTitle>
          <DialogDescription>
            Gérez les stations accessibles par cet utilisateur.
            {userRole && (
              <span className="block mt-1 text-sm">
                Rôle dans l&apos;organisation: <Badge variant="outline">{userRole}</Badge>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Stations actuellement attribuées */}
          <div>
            <h4 className="text-sm font-medium mb-2">Stations attribuées</h4>
            {userAccess.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune station attribuée
              </p>
            ) : (
              <div className="space-y-2">
                {userAccess.map((access) => (
                  <Card key={access._id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {getStationName(access.stationId)}
                        </span>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {roleLabels[access.role].icon}
                          {roleLabels[access.role].label}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRevokeAccess(access.stationId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Ajouter une station */}
          <div>
            <h4 className="text-sm font-medium mb-2">Ajouter une station</h4>
            {availableStations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Toutes les stations sont déjà attribuées
              </p>
            ) : (
              <div className="flex gap-2">
                <Select
                  value={selectedStation}
                  onValueChange={setSelectedStation}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner une station" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStations.map((station) => (
                      <SelectItem key={station._id} value={station._id}>
                        {station.name} ({station.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as AccessRole)}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleGrantAccess}
                  disabled={!selectedStation || isLoading}
                  size="icon"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
