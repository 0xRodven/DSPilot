"use client";

import { Calendar, CheckCircle, Download, FileText, Mail, Phone, Rocket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const invoices = [
  {
    date: "15 Déc 2025",
    description: "Performance - 52 drivers",
    amount: "2 278,80€",
    status: "paid",
  },
  {
    date: "15 Nov 2025",
    description: "Performance - 48 drivers",
    amount: "2 178,80€",
    status: "paid",
  },
  {
    date: "15 Oct 2025",
    description: "Performance - 46 drivers",
    amount: "2 128,80€",
    status: "paid",
  },
  {
    date: "01 Oct 2025",
    description: "Implémentation",
    amount: "2 490,00€",
    status: "paid",
  },
];

export function SubscriptionSettings() {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Votre abonnement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                <Rocket className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-xl">PERFORMANCE</span>
            </div>
            <Badge variant="default" className="bg-tier-fantastic text-white">
              Actif
            </Badge>
          </div>

          <div className="border-border border-t" />

          {/* Monthly breakdown */}
          <div className="space-y-3">
            <h4 className="font-medium text-muted-foreground">Détail mensuel</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform fee</span>
                <span>599,00€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">52 drivers actifs × 25€</span>
                <span>1 300,00€</span>
              </div>
              <div className="my-2 border-border border-t" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total HT</span>
                <span>1 899,00€</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA (20%)</span>
                <span>379,80€</span>
              </div>
              <div className="my-2 border-border border-t" />
              <div className="flex justify-between font-semibold text-base">
                <span>Total TTC</span>
                <span>2 278,80€/mois</span>
              </div>
            </div>
          </div>

          <div className="border-border border-t" />

          {/* Dates */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Prochain prélèvement:</span>
              <span className="font-medium">15 Janvier 2026</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Renouvellement contrat:</span>
              <span className="font-medium">15 Octobre 2026</span>
            </div>
          </div>

          <div className="border-border border-t" />

          {/* Features */}
          <div className="space-y-2">
            <h4 className="font-medium text-muted-foreground">Inclus:</h4>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="h-4 w-4 text-tier-fantastic" />
                <span>Dashboard complet</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="h-4 w-4 text-tier-fantastic" />
                <span>Coaching</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="h-4 w-4 text-tier-fantastic" />
                <span>Alertes</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <CheckCircle className="h-4 w-4 text-tier-fantastic" />
                <span>10 users</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des factures</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice, index) => (
                <TableRow key={index}>
                  <TableCell className="text-muted-foreground">{invoice.date}</TableCell>
                  <TableCell>{invoice.description}</TableCell>
                  <TableCell className="font-medium">{invoice.amount}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="border-tier-fantastic/30 bg-tier-fantastic/10 text-tier-fantastic"
                    >
                      Payée
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Besoin d'aide ?</CardTitle>
          <CardDescription>
            Pour toute question sur votre abonnement, facturation, ou pour passer en Enterprise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a href="mailto:support@dspilot.io" className="text-primary hover:underline">
              support@dspilot.io
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>+33 1 23 45 67 89</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
