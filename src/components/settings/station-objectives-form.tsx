"use client";

import { useEffect, useState } from "react";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Info, RotateCcw, Save, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/lib/store";
import { withToast } from "@/lib/utils/mutation";

const DEFAULTS = {
  dwcTarget: 92,
  iadcTarget: 65,
  dwcAlertDrop: 5,
  dnrDpmoMax: 1500,
  coachingMaxDays: 14,
};

type ObjectivesFormValues = typeof DEFAULTS;

interface FieldConfig {
  key: keyof ObjectivesFormValues;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
}

const FIELDS: FieldConfig[] = [
  {
    key: "dwcTarget",
    label: "Objectif DWC% station",
    description: "Pourcentage de conformité DWC minimum attendu pour votre station.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
  },
  {
    key: "iadcTarget",
    label: "Objectif IADC% station",
    description: "Pourcentage de conformité IADC minimum attendu pour votre station.",
    min: 0,
    max: 100,
    step: 1,
    unit: "%",
  },
  {
    key: "dwcAlertDrop",
    label: "Seuil alerte chute DWC (points)",
    description: "Nombre de points de chute du DWC% qui déclenche une alerte automatique.",
    min: 1,
    max: 50,
    step: 1,
    unit: "pts",
  },
  {
    key: "dnrDpmoMax",
    label: "Seuil DNR DPMO maximum",
    description: "Valeur DPMO DNR au-delà de laquelle une alerte est générée pour un livreur.",
    min: 0,
    max: 10000,
    step: 100,
    unit: "DPMO",
  },
  {
    key: "coachingMaxDays",
    label: "Délai max coaching (jours)",
    description: "Nombre de jours maximum avant qu'une action de coaching en attente génère une alerte.",
    min: 1,
    max: 90,
    step: 1,
    unit: "j",
  },
];

interface StationObjectivesFormProps {
  stationId?: Id<"stations">;
}

export function StationObjectivesForm({ stationId }: StationObjectivesFormProps) {
  const { selectedStation } = useDashboardStore();

  // Resolve station ID from prop or from store
  const station = useQuery(
    api.stations.getStationByCode,
    !stationId && selectedStation.code ? { code: selectedStation.code } : "skip",
  );

  const resolvedStationId = stationId ?? station?._id;

  const objectives = useQuery(
    api.stationObjectives.getObjectives,
    resolvedStationId ? { stationId: resolvedStationId } : "skip",
  );

  const updateObjectives = useMutation(api.stationObjectives.updateObjectives);

  const [values, setValues] = useState<ObjectivesFormValues>(DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form values when objectives load
  useEffect(() => {
    if (objectives) {
      setValues({
        dwcTarget: objectives.dwcTarget,
        iadcTarget: objectives.iadcTarget,
        dwcAlertDrop: objectives.dwcAlertDrop,
        dnrDpmoMax: objectives.dnrDpmoMax,
        coachingMaxDays: objectives.coachingMaxDays,
      });
    }
  }, [objectives]);

  const handleChange = (key: keyof ObjectivesFormValues, raw: string) => {
    const parsed = parseFloat(raw);
    setValues((prev) => ({
      ...prev,
      [key]: isNaN(parsed) ? prev[key] : parsed,
    }));
  };

  const handleReset = () => {
    setValues(DEFAULTS);
  };

  const handleSave = async () => {
    if (!resolvedStationId) return;

    setIsSaving(true);
    await withToast(
      updateObjectives({
        stationId: resolvedStationId,
        ...values,
      }),
      {
        loading: "Enregistrement...",
        success: "Objectifs mis à jour",
        error: (err) => err.message || "Erreur lors de la mise à jour",
      },
    );
    setIsSaving(false);
  };

  // Loading state
  if (objectives === undefined || (!stationId && station === undefined)) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80 mt-1" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // No station resolved
  if (!resolvedStationId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Aucune station sélectionnée</h3>
          <p className="text-muted-foreground">Sélectionnez une station pour configurer les objectifs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Objectifs de la station
          </CardTitle>
          <CardDescription>
            Configurez les seuils de performance et d&apos;alerte propres à votre station.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Fields */}
          <div className="space-y-5">
            {FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`field-${field.key}`} className="text-sm font-medium">
                  {field.label}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id={`field-${field.key}`}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={values[field.key]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-32"
                  />
                  {field.unit && <span className="text-sm text-muted-foreground">{field.unit}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Ces objectifs sont propres à votre station. Ils ne correspondent pas aux seuils Amazon officiels.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" onClick={handleReset} disabled={isSaving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>

            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
