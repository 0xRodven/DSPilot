"use server";

const TRIGGER_IDS = {
  weekly: process.env.CLAUDE_TRIGGER_WEEKLY ?? "trig_01EAVQFMazCbAa7Y8gBEhoTH",
  daily: process.env.CLAUDE_TRIGGER_DAILY ?? "trig_01TmkhfvdopSFVc7NnVgeY56",
} as const;

const CLAUDE_API_BASE = "https://api.claude.ai/v1/code/triggers";

export async function runReportTrigger(type: "weekly" | "daily"): Promise<{ success: boolean; message: string }> {
  const sessionKey = process.env.CLAUDE_SESSION_KEY;
  if (!sessionKey) {
    return {
      success: false,
      message: "CLAUDE_SESSION_KEY non configurée. Ajoutez-la dans les variables d'environnement Vercel.",
    };
  }

  const triggerId = TRIGGER_IDS[type];

  try {
    const res = await fetch(`${CLAUDE_API_BASE}/${triggerId}/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        message: `Erreur API Claude (${res.status}): ${text.slice(0, 200)}`,
      };
    }

    return {
      success: true,
      message: `Rapport ${type === "weekly" ? "hebdomadaire" : "quotidien"} lancé. L'agent Claude génère le rapport avec analyse IA — il apparaîtra dans quelques minutes.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Erreur réseau: ${error instanceof Error ? error.message : "inconnue"}`,
    };
  }
}
