"use client"

import { FileText, CheckCircle2, Lightbulb, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function FormatGuide() {
  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Format accepté
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Fichier HTML exporté depuis Amazon Delivery Excellence</p>

        <div className="border-t border-border/50 pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Nom attendu:</p>
          <code className="text-xs bg-muted px-2 py-1 rounded block">FR-PSUA-XXX-DWC-IADC-Report_YYYY-WW.html</code>
        </div>

        <div className="border-t border-border/50 pt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">Contenu attendu:</p>
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

        <div className="border-t border-border/50 pt-4">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Lightbulb className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-200/80">
              <p className="font-medium mb-1">Astuce</p>
              <p>
                Exportez le rapport complet depuis Amazon avec tous les onglets visibles pour obtenir toutes les
                données.
              </p>
            </div>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="w-full text-xs gap-2">
          <ExternalLink className="h-3 w-3" />
          Voir documentation
        </Button>
      </CardContent>
    </Card>
  )
}
