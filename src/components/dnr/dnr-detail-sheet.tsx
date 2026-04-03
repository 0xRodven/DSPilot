"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

import { differenceInDays, differenceInHours, format } from "date-fns";
import { fr } from "date-fns/locale";
import { Info, MapPin, Navigation, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import type { DnrRow } from "./dnr-table/columns";

const DnrMap = dynamic(() => import("./dnr-map"), { ssr: false });

interface DnrDetailSheetProps {
  investigation: DnrRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusStyles = {
  ongoing: "bg-amber-500/20 text-amber-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
  confirmed_dnr: "bg-red-500/20 text-red-400",
} as const;

const statusLabels = {
  ongoing: "En cours",
  resolved: "Résolu",
  confirmed_dnr: "DNR confirmé",
} as const;

export function DnrDetailSheet({ investigation, open, onOpenChange }: DnrDetailSheetProps) {
  if (!investigation) return null;

  const deliveryDate = new Date(investigation.deliveryDatetime);
  const concessionDate = new Date(investigation.concessionDatetime);
  const delayDays = differenceInDays(concessionDate, deliveryDate);
  const delayHours = differenceInHours(concessionDate, deliveryDate) % 24;
  const totalHours = differenceInHours(concessionDate, deliveryDate);

  const delayColor = totalHours > 72 ? "text-red-400" : totalHours > 24 ? "text-amber-400" : "text-emerald-400";
  const distColor =
    investigation.gpsDistanceMeters == null
      ? "text-muted-foreground"
      : investigation.gpsDistanceMeters > 50
        ? "text-red-400"
        : investigation.gpsDistanceMeters > 20
          ? "text-amber-400"
          : "text-emerald-400";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[480px]">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <SheetTitle className="font-mono text-lg">{investigation.trackingId}</SheetTitle>
            <Badge variant="outline" className={cn("text-xs", statusStyles[investigation.status])}>
              {statusLabels[investigation.status]}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Livraison */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-medium text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              Livraison
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Livreur</span>
                {investigation.driverId ? (
                  <Link
                    href={`/dashboard/drivers/${investigation.driverId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {investigation.driverName}
                  </Link>
                ) : (
                  <span className="font-medium">{investigation.driverName}</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transporter ID</span>
                <span className="font-mono text-xs">{investigation.transporterId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date livraison</span>
                <span className="tabular-nums">{format(deliveryDate, "dd/MM/yyyy HH:mm", { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date concession</span>
                <span className="tabular-nums">{format(concessionDate, "dd/MM/yyyy HH:mm", { locale: fr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Délai</span>
                <span className={cn("font-medium tabular-nums", delayColor)}>
                  {delayDays > 0 ? `${delayDays}j ${delayHours}h` : `${totalHours}h`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lieu de dépôt</span>
                <span>{investigation.scanType.replace("DELIVERED_TO_", "").replace(/_/g, " ")}</span>
              </div>
            </div>
          </section>

          {/* Adresse */}
          <section className="space-y-3">
            <h3 className="flex items-center gap-2 font-medium text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Adresse
            </h3>
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{investigation.address.street}</p>
              {investigation.address.building && (
                <p className="text-muted-foreground">{investigation.address.building}</p>
              )}
              {investigation.address.floor && <p className="text-muted-foreground">{investigation.address.floor}</p>}
              <p className="text-muted-foreground">
                {investigation.address.postalCode} {investigation.address.city}
              </p>
            </div>
            {investigation.customerNotes && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm">
                <div className="mb-1 flex items-center gap-1 font-medium text-amber-400 text-xs">
                  <Info className="h-3 w-3" />
                  Notes du client
                </div>
                <p className="text-muted-foreground">{investigation.customerNotes}</p>
              </div>
            )}
          </section>

          {/* Géolocalisation */}
          {investigation.gpsPlanned && investigation.gpsActual && (
            <section className="space-y-3">
              <h3 className="flex items-center gap-2 font-medium text-sm">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                Géolocalisation
              </h3>
              <DnrMap planned={investigation.gpsPlanned} actual={investigation.gpsActual} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-muted-foreground text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" /> Planifié
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> Réel
                  </span>
                </div>
                {investigation.gpsDistanceMeters != null && (
                  <span className={cn("font-bold text-2xl tabular-nums", distColor)}>
                    {Math.round(investigation.gpsDistanceMeters)}m
                  </span>
                )}
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="pt-2">
            <Button asChild className="w-full">
              <Link
                href={`/dashboard/coaching?reason=dnr&tracking=${investigation.trackingId}${investigation.driverId ? `&driver=${investigation.driverId}` : ""}`}
              >
                Créer action coaching
              </Link>
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
