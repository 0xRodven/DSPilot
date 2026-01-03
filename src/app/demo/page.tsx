"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useAuth } from "@clerk/nextjs"
import { Loader2, CheckCircle, AlertCircle, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type SetupStep = {
  label: string
  status: "pending" | "loading" | "done" | "error"
}

export default function DemoPage() {
  const router = useRouter()
  const { userId, isLoaded, isSignedIn } = useAuth()
  const [steps, setSteps] = useState<SetupStep[]>([
    { label: "Création de la station démo", status: "pending" },
    { label: "Génération des 20 livreurs", status: "pending" },
    { label: "Import de 12 semaines de données", status: "pending" },
    { label: "Création des actions coaching", status: "pending" },
    { label: "Configuration des alertes", status: "pending" },
  ])
  const [error, setError] = useState<string | null>(null)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const setupDemo = useMutation(api.demo.setupDemoData)
  const demoStation = useQuery(api.demo.getDemoStation)

  const updateStep = (index: number, status: SetupStep["status"]) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status } : step))
    )
  }

  const runSetup = async () => {
    if (!userId) {
      setError("Vous devez être connecté pour accéder à la démo")
      return
    }

    setIsSettingUp(true)
    setError(null)

    try {
      // Simulate step-by-step progress
      for (let i = 0; i < steps.length; i++) {
        updateStep(i, "loading")
        await new Promise((resolve) => setTimeout(resolve, 400 + Math.random() * 600))

        if (i === 2) {
          // Actually run the setup at step 3
          await setupDemo({ userId })
        }

        updateStep(i, "done")
      }

      setIsDone(true)

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push("/dashboard")
      }, 1500)
    } catch (err) {
      console.error("Demo setup error:", err)
      setError("Erreur lors de la configuration de la démo")
      setSteps((prev) =>
        prev.map((step) =>
          step.status === "loading" ? { ...step, status: "error" } : step
        )
      )
    } finally {
      setIsSettingUp(false)
    }
  }

  // If already has demo station, redirect to dashboard
  useEffect(() => {
    if (demoStation && !isSettingUp && !isDone) {
      router.push("/dashboard")
    }
  }, [demoStation, router, isSettingUp, isDone])

  // Handle unauthenticated users
  if (isLoaded && !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Démo DSPilot</CardTitle>
            <CardDescription>
              Connectez-vous pour accéder à la démonstration
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground">
              Un compte gratuit est nécessaire pour explorer la démo avec vos
              propres données de test.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => router.push("/sign-in?redirect_url=/demo")}>
                Se connecter
              </Button>
              <Button variant="outline" onClick={() => router.push("/sign-up?redirect_url=/demo")}>
                Créer un compte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-lg">
        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">
              {isDone ? "Démo prête !" : "Configuration de la démo"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isDone
                ? "Redirection vers le dashboard..."
                : "Nous préparons votre environnement de démonstration avec des données réalistes."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Steps list */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3"
                >
                  {step.status === "pending" && (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-700" />
                  )}
                  {step.status === "loading" && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {step.status === "done" && (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  )}
                  {step.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span
                    className={
                      step.status === "done"
                        ? "text-slate-300"
                        : step.status === "loading"
                          ? "text-white font-medium"
                          : "text-slate-500"
                    }
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Action button */}
            {!isDone && !isSettingUp && (
              <Button
                onClick={runSetup}
                className="w-full gap-2"
                size="lg"
                disabled={!isLoaded || isSettingUp}
              >
                <Play className="h-4 w-4" />
                Lancer la démo
              </Button>
            )}

            {isSettingUp && (
              <div className="text-center text-sm text-slate-400">
                Configuration en cours, veuillez patienter...
              </div>
            )}

            {isDone && (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span>Environnement prêt !</span>
              </div>
            )}

            {/* Info */}
            <div className="rounded-lg bg-slate-800/50 p-4 text-xs text-slate-400">
              <p className="mb-2 font-medium text-slate-300">La démo inclut :</p>
              <ul className="list-inside list-disc space-y-1">
                <li>20 livreurs avec profils variés</li>
                <li>12 semaines de données de performance</li>
                <li>Actions de coaching en cours</li>
                <li>Alertes KPI actives</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
