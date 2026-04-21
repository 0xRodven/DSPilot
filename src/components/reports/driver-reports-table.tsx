"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Download, ExternalLink, FileText, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DriverReport {
  id: string;
  driverId: string;
  driverName: string;
  htmlContent: string;
  dwcPercent: number;
  rank?: number;
  createdAt: number;
}

interface DriverReportsTableProps {
  reports: DriverReport[];
  onOpen: (htmlContent: string, title: string) => void;
  onPrint: (htmlContent: string, title: string) => void;
}

export function DriverReportsTable({ reports, onOpen, onPrint }: DriverReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="font-medium text-lg text-muted-foreground">Aucun rapport individuel pour cette semaine</p>
        <p className="mt-1 text-muted-foreground/70 text-sm">
          Les rapports livreurs sont générés chaque lundi à 13h30.
        </p>
      </div>
    );
  }

  const sorted = [...reports].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[80px] text-muted-foreground">Rang</TableHead>
            <TableHead className="text-muted-foreground">Livreur</TableHead>
            <TableHead className="w-[120px] text-right text-muted-foreground">DWC</TableHead>
            <TableHead className="w-[160px] text-right text-muted-foreground">Généré le</TableHead>
            <TableHead className="w-[120px] text-right text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((r) => {
            const title = `Rapport ${r.driverName} — S${format(new Date(r.createdAt), "I")}`;
            return (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-muted-foreground text-sm tabular-nums">
                  {r.rank != null ? `#${r.rank}` : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-medium">{r.driverName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">{r.dwcPercent}%</TableCell>
                <TableCell className="text-right text-muted-foreground text-sm tabular-nums">
                  {format(new Date(r.createdAt), "d MMM yyyy, HH:mm", { locale: fr })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Ouvrir"
                      onClick={() => onOpen(r.htmlContent, title)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Imprimer / PDF"
                      onClick={() => onPrint(r.htmlContent, title)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
