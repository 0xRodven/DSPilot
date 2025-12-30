/**
 * Utilitaires Convex
 */

/**
 * Convertit une chaîne en slug majuscule (pour les codes station)
 * - Normalise les accents
 * - Convertit en majuscules
 * - Remplace les caractères non-alphanumériques par des tirets
 * - Limite la longueur à 20 caractères
 *
 * @example slugify("Ma DSP") // "MA-DSP"
 * @example slugify("Livraison Éxpress Paris") // "LIVRAISON-EXPRESS-PA"
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD") // Décompose les accents
    .replace(/[\u0300-\u036f]/g, "") // Supprime les diacritiques
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-") // Remplace non-alphanum par tiret
    .replace(/^-+|-+$/g, "") // Trim les tirets en début/fin
    .substring(0, 20); // Limite la longueur
}
