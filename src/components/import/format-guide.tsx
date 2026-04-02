"use client";

import { CheckCircle2, ExternalLink, FileText, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FormatGuide() {
  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-medium text-sm">
          <FileText className="h-4 w-4" />
          Format accepté
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">Fichier HTML exporté depuis Amazon Delivery Excellence</p>

        <div className="border-border/50 border-t pt-4">
          <p className="mb-2 font-medium text-muted-foreground text-xs">Nom attendu:</p>
          <code className="block rounded bg-muted px-2 py-1 text-xs">FR-PSUA-XXX-DWC-IADC-Report_YYYY-WW.html</code>
        </div>

        <div className="space-y-2 border-border/50 border-t pt-4">
          <p className="mb-2 font-medium text-muted-foreground text-xs">Contenu attendu:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Données Weekly (requis)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Données Daily (optionnel)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Données Trends (optionnel)</span>
            </div>
          </div>
        </div>

        <div className="border-border/50 border-t pt-4">
          <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div className="text-amber-200/80 text-xs">
              <p className="mb-1 font-medium">Astuce</p>
              <p>
                Exportez le rapport complet depuis Amazon avec tous les onglets visibles pour obtenir toutes les
                données.
              </p>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full gap-2 text-xs">
          <ExternalLink className="h-3 w-3" />
          Voir documentation
        </Button>
      </CardContent>
    </Card>
  );
}
