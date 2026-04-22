/**
 * Deterministic driver-name anonymization.
 *
 * Same input → same output across runs (so stats tables referencing
 * the same driverId remain coherent when cloned).
 */
import { createHash } from "node:crypto";

const FIRST_MASC = [
  "Martin",
  "Bernard",
  "Dubois",
  "Moreau",
  "Laurent",
  "Simon",
  "Michel",
  "Lefebvre",
  "Leroy",
  "Roux",
  "David",
  "Bertrand",
  "Morel",
  "Fournier",
  "Girard",
];

const FIRST_FEM = [
  "Martin",
  "Bernard",
  "Dubois",
  "Moreau",
  "Petit",
  "Durand",
  "Leroy",
  "Morel",
  "Girard",
  "Roux",
  "Fontaine",
  "Masson",
  "Lambert",
  "Gauthier",
  "Perrin",
];

const GIVEN_M = [
  "Alexandre",
  "Antoine",
  "Benoit",
  "Clément",
  "Damien",
  "Étienne",
  "François",
  "Gabriel",
  "Hugo",
  "Julien",
  "Kévin",
  "Lucas",
  "Maxime",
  "Nicolas",
  "Olivier",
];

const GIVEN_F = [
  "Amélie",
  "Béatrice",
  "Camille",
  "Delphine",
  "Émilie",
  "Fanny",
  "Gaëlle",
  "Héloïse",
  "Isabelle",
  "Julie",
  "Karine",
  "Laura",
  "Margaux",
  "Noémie",
  "Olivia",
];

function hashIdx(input: string, mod: number): number {
  const h = createHash("sha256").update(input).digest();
  return h.readUInt32BE(0) % mod;
}

export function anonymizeDriverName(original: string): string {
  const isFem = hashIdx(original + ":sex", 2) === 0;
  const given = isFem ? GIVEN_F[hashIdx(original, GIVEN_F.length)] : GIVEN_M[hashIdx(original, GIVEN_M.length)];
  const last = isFem
    ? FIRST_FEM[hashIdx(original + ":last", FIRST_FEM.length)]
    : FIRST_MASC[hashIdx(original + ":last", FIRST_MASC.length)];
  return `${given} ${last}`;
}

export function anonymizeAmazonId(original: string): string {
  return "A_DEMO_" + createHash("sha256").update(original).digest("hex").slice(0, 10).toUpperCase();
}

if (require.main === module) {
  const sample = ["Kitenge", "Rayan", "Jean Dupont", "Hassane"];
  for (const name of sample) {
    console.log(`  ${name.padEnd(20)} → ${anonymizeDriverName(name)}`);
  }
}
