import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Cron job pour vérifier et envoyer les récaps WhatsApp
 * Exécuté toutes les heures pour vérifier si une station doit envoyer ses récaps
 */
crons.hourly(
  "check-whatsapp-sends",
  { minuteUTC: 0 },
  internal.whatsappCron.checkAndSendRecaps
);

export default crons;
