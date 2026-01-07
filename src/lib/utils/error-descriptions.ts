/**
 * French descriptions for error types in DSPilot
 * Used for tooltips in the Errors page
 */

export const ERROR_DESCRIPTIONS: Record<string, string> = {
  // DWC (Delivered With Customer) errors
  "DWC": "Delivered With Customer - Erreurs lors de la remise au client. Mesure la qualité de l'interaction avec le destinataire.",
  "Contact Miss": "Le driver n'a pas réussi à contacter le client au moment de la livraison (sonnette, appel, etc.)",
  "Photo Defect": "La photo de preuve de livraison n'est pas conforme : floue, mal cadrée, ou ne montre pas clairement le colis",
  "No Photo": "Aucune photo de preuve de livraison n'a été prise alors qu'elle était requise",
  "OTP Miss": "Le code de vérification (One-Time Password) n'a pas été correctement obtenu ou vérifié auprès du client",
  "Failed Attempts": "MS - Tentatives échouées - Le driver n'a pas pu effectuer la livraison (problème système ou client absent)",
  "MS - Failed Attempts": "MS - Tentatives échouées - Le driver n'a pas pu effectuer la livraison (problème système ou client absent)",

  // IADC (In Absence of Customer) errors
  "IADC": "In Absence of Customer - Erreurs lors des livraisons en l'absence du client (boîte aux lettres, voisin, lieu sûr)",
  "Mailbox": "Livraison en boîte aux lettres non conforme aux procédures (taille colis, confirmation, etc.)",
  "Unattended": "Livraison sans surveillance incorrecte - Le colis a été laissé sans respecter les consignes de sécurité",
  "Safe Place": "Le lieu sûr choisi pour déposer le colis n'est pas conforme aux règles Amazon (visibilité, protection, etc.)",
  "Compliant - Mailbox": "Livraisons conformes en boîte aux lettres",
  "Compliant - Unattended": "Livraisons conformes sans surveillance",
  "Compliant - Safe Place": "Livraisons conformes en lieu sûr",
  "Not Compliant - Mailbox": "Livraisons non conformes en boîte aux lettres",
  "Not Compliant - Unattended": "Livraisons non conformes sans surveillance",
  "Not Compliant - Safe Place": "Livraisons non conformes en lieu sûr",

  // False Scans (Scans frauduleux)
  "False Scans": "Scans frauduleux - Scans de livraison effectués dans des conditions anormales (timing, localisation)",
  "Early Delivery": "Scan de livraison effectué trop tôt, avant l'arrivée réelle au point de livraison",
  "Late Delivery": "Scan de livraison effectué trop tard, après avoir quitté le point de livraison",
  "GPS Miss": "Localisation GPS incorrecte au moment du scan - Le driver n'était pas à l'adresse de livraison",

  // Generic
  "Other": "Autres types d'erreurs non catégorisées",
  "Total Misses": "Nombre total d'erreurs DWC (Contact Miss, Photo Defect, No Photo, OTP Miss)",
  "Total IADC": "Nombre total d'erreurs IADC (Mailbox, Unattended, Safe Place non conformes)",
  "Total Scans Frauduleux": "Nombre total de scans suspects détectés",
}

/**
 * Get the French description for an error type
 * @param errorType The error type key (e.g., "Contact Miss", "DWC")
 * @returns French description or the original key if not found
 */
export function getErrorDescription(errorType: string): string {
  return ERROR_DESCRIPTIONS[errorType] || errorType
}

/**
 * Check if an error type has a description
 */
export function hasErrorDescription(errorType: string): boolean {
  return errorType in ERROR_DESCRIPTIONS
}
