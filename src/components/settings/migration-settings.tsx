"use client";

import { useState } from "react";

import { useOrganization } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { AlertCircle, ArrowRightLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MigrationSettings() {
  const { organization } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    migrated: string[];
    skipped: string[];
    totalMigrated: number;
    totalSkipped: number;
  } | null>(null);

  const migrateStations = useMutation(api.stations.migrateStationsToOrganization);

  const handleMigration = async () => {
    if (!organization) {
      toast.error("Vous devez d'abord créer ou rejoindre une organisation");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const res = await migrateStations();
      setResult(res);

      if (res.totalMigrated > 0) {
        toast.success(`${res.totalMigrated} station(s) migrée(s) avec succès`);
      } else if (res.totalSkipped > 0) {
        toast.info("Toutes les stations sont déjà associées à une organisation");
      } else {
        toast.info("Aucune station à migrer");
      }
    } catch (error) {
      console.error("Migration error:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la migration");
    } finally {
      setIsLoading(false);
    }
  };

  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Migration des Stations
          </CardTitle>
          <CardDescription>Associez vos stations existantes à votre organisation</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Organisation requise</AlertTitle>
            <AlertDescription>
              Vous devez d&apos;abord créer ou rejoindre une organisation pour migrer vos stations. Utilisez le
              sélecteur d&apos;organisation dans la sidebar.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Migration des Stations
        </CardTitle>
        <CardDescription>
          Associez vos stations existantes à l&apos;organisation &quot;{organization.name}&quot;
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          Cette action va lier toutes vos stations existantes (dont vous êtes propriétaire) à votre organisation
          actuelle. Cela permettra à vos managers et viewers d&apos;y accéder.
        </p>

        <Button onClick={handleMigration} disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migration en cours...
            </>
          ) : (
            <>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Migrer mes stations
            </>
          )}
        </Button>

        {result && (
          <div className="space-y-3 border-t pt-4">
            {result.totalMigrated > 0 && (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertTitle className="text-green-500">{result.totalMigrated} station(s) migrée(s)</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-inside list-disc text-sm">
                    {result.migrated.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.totalSkipped > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{result.totalSkipped} station(s) ignorée(s)</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-inside list-disc text-muted-foreground text-sm">
                    {result.skipped.map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {result.totalMigrated === 0 && result.totalSkipped === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Aucune station trouvée</AlertTitle>
                <AlertDescription>
                  Vous n&apos;avez pas de stations à migrer. Créez d&apos;abord une station en important des données.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
