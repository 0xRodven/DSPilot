"use client";

import { useEffect, useState } from "react";

import { useOrganization } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, ArrowRightLeft, Building2, Calendar, CheckCircle2, Loader2, Lock, Save } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/lib/store";
import { withToast } from "@/lib/utils/mutation";

export function StationSettings() {
  const { selectedStation, setSelectedStation } = useDashboardStore();
  const { organization } = useOrganization();

  // Get station from Convex
  const station = useQuery(
    api.stations.getStationByCode,
    selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  // Update form when station loads
  useEffect(() => {
    if (station) {
      setName(station.name);
      setCode(station.code);
    }
  }, [station]);

  // Force reassign state
  const [forceCode, setForceCode] = useState("");
  const [isForceReassigning, setIsForceReassigning] = useState(false);

  // Mutations
  const updateStation = useMutation(api.stations.updateStation);
  const migrateStations = useMutation(api.stations.migrateStationsToOrganization);
  const forceReassign = useMutation(api.stations.forceReassignStationToCurrentOrg);

  const handleForceReassign = async () => {
    if (!organization || !forceCode.trim()) return;

    setIsForceReassigning(true);
    try {
      const result = await forceReassign({ stationCode: forceCode.trim().toUpperCase() });
      if (result.success) {
        setForceCode("");
        // Refresh the page to pick up the new station
        window.location.reload();
      }
    } catch (error) {
      console.error("Force reassign error:", error);
    } finally {
      setIsForceReassigning(false);
    }
  };

  const handleMigrate = async () => {
    if (!organization) return;

    setIsMigrating(true);
    try {
      const result = await migrateStations();
      if (result.totalMigrated > 0) {
        // Success - station is now linked to org
      }
    } catch (error) {
      console.error("Migration error:", error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleSave = async () => {
    if (!station) return;

    setIsSaving(true);
    const updated = await withToast(
      updateStation({
        stationId: station._id as Id<"stations">,
        name: name !== station.name ? name : undefined,
        code: code !== station.code ? code : undefined,
      }),
      {
        loading: "Enregistrement...",
        success: "Station mise à jour",
        error: (err) => err.message || "Erreur lors de la mise à jour",
      },
    );

    if (updated) {
      setSelectedStation({
        id: updated._id,
        name: updated.name,
        code: updated.code,
      });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleCancel = () => {
    if (station) {
      setName(station.name);
      setCode(station.code);
    }
    setIsEditing(false);
  };

  const hasChanges = station && (name !== station.name || code !== station.code);

  // Check if station needs to be linked to current org
  const needsMigration = organization && station && !station.organizationId;
  const isLinkedToCurrentOrg = organization && station?.organizationId === organization.id;

  // Distinguish "loading" from "query skipped"
  const isQuerySkipped = !selectedStation.code;

  // Loading state - only show skeleton if we're actually querying
  if (station === undefined && !isQuerySkipped) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // No station selected - show force reassign option
  if (!station) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-medium text-lg">Aucune station sélectionnée</h3>
            <p className="text-muted-foreground">Importez des données pour créer votre première station.</p>
          </CardContent>
        </Card>

        {/* Force Reassign - pour récupérer une station coincée dans une autre org */}
        {organization && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Récupérer une station existante
              </CardTitle>
              <CardDescription>
                Si vous avez une station qui n&apos;apparaît pas car elle est liée à une autre organisation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Code station (ex: DIF1)"
                  value={forceCode}
                  onChange={(e) => setForceCode(e.target.value.toUpperCase())}
                  disabled={isForceReassigning}
                />
                <Button onClick={handleForceReassign} disabled={!forceCode.trim() || isForceReassigning}>
                  {isForceReassigning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      En cours...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Lier à {organization.name}
                    </>
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                Entrez le code de votre station pour la lier à l&apos;organisation &quot;{organization.name}&quot;. Vous
                devez être le propriétaire original de la station.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Station Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations de la station
          </CardTitle>
          <CardDescription>Modifiez les informations de base de votre station</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stationCode">Code Station</Label>
              <Input
                id="stationCode"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setIsEditing(true);
                }}
                placeholder="Ex: DIF1"
                disabled={isSaving}
              />
              <p className="text-muted-foreground text-xs">Code unique de la station (ex: DIF1, DLY2)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stationName">Nom Station</Label>
              <Input
                id="stationName"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsEditing(true);
                }}
                placeholder="Ex: Paris Denfert"
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Read-only info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="h-3 w-3" />
                Plan
              </Label>
              <div className="flex items-center gap-2 rounded-md bg-muted p-2">
                <span className="font-medium text-sm capitalize">{station.plan}</span>
                {station.plan === "free" && <span className="text-muted-foreground text-xs">(Limité)</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                Créée le
              </Label>
              <div className="rounded-md bg-muted p-2 text-sm">
                {new Date(station.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            {isEditing && (
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                Annuler
              </Button>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Migration / Organisation Link */}
      {organization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Organisation
            </CardTitle>
            <CardDescription>Lien entre cette station et votre organisation</CardDescription>
          </CardHeader>
          <CardContent>
            {isLinkedToCurrentOrg ? (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-500">Station liée</AlertTitle>
                <AlertDescription>
                  Cette station est liée à l&apos;organisation &quot;{organization.name}&quot;. Tous les membres de
                  cette organisation peuvent y accéder.
                </AlertDescription>
              </Alert>
            ) : needsMigration ? (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Migration requise</AlertTitle>
                  <AlertDescription>
                    Cette station n&apos;est pas encore liée à votre organisation &quot;{organization.name}&quot;.
                    Cliquez sur le bouton ci-dessous pour la lier.
                  </AlertDescription>
                </Alert>
                <Button onClick={handleMigrate} disabled={isMigrating}>
                  {isMigrating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Migration en cours...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Lier à {organization.name}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Autre organisation</AlertTitle>
                <AlertDescription>Cette station appartient à une autre organisation.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Station ID (for debugging/support) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informations techniques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">ID Station</Label>
            <code className="block break-all rounded bg-muted p-2 font-mono text-xs">{station._id}</code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
