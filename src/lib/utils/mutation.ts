/**
 * Mutation utilities with toast notifications
 */

import { toast } from "sonner";

type ToastMessages = {
  loading?: string;
  success?: string;
  error?: string | ((err: Error) => string);
};

/**
 * Wraps a promise with toast notifications for loading, success, and error states
 */
export async function withToast<T>(promise: Promise<T>, messages: ToastMessages): Promise<T | null> {
  const { loading, success, error } = messages;
  let toastId: string | number | undefined;

  if (loading) {
    toastId = toast.loading(loading);
  }

  try {
    const result = await promise;
    if (toastId) {
      toast.dismiss(toastId);
    }
    if (success) {
      toast.success(success);
    }
    return result;
  } catch (err) {
    if (toastId) {
      toast.dismiss(toastId);
    }
    const message =
      typeof error === "function" ? error(err as Error) : error || (err as Error).message || "Une erreur est survenue";
    toast.error(message);
    console.error("Mutation error:", err);
    return null;
  }
}

/**
 * Shows a loading toast and returns a function to dismiss it
 */
export function showLoading(message: string) {
  const toastId = toast.loading(message);
  return () => toast.dismiss(toastId);
}

/**
 * Standard error messages for common scenarios
 */
export const errorMessages = {
  network: "Erreur de connexion. Vérifiez votre connexion internet.",
  auth: "Session expirée. Veuillez vous reconnecter.",
  server: "Erreur serveur. Réessayez plus tard.",
  validation: "Données invalides. Vérifiez les champs.",
  notFound: "Ressource non trouvée.",
  conflict: "Cette ressource existe déjà.",
};

/**
 * Helper to get a user-friendly error message from an error
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    // Check for common error patterns
    if (err.message.includes("fetch")) {
      return errorMessages.network;
    }
    if (err.message.includes("auth") || err.message.includes("401")) {
      return errorMessages.auth;
    }
    if (err.message.includes("existe déjà") || err.message.includes("already exists")) {
      return errorMessages.conflict;
    }
    if (err.message.includes("not found") || err.message.includes("non trouvé")) {
      return errorMessages.notFound;
    }
    // Return the original message if it's user-friendly
    if (err.message.length < 100 && !err.message.includes("Error:")) {
      return err.message;
    }
    return errorMessages.server;
  }
  return errorMessages.server;
}
