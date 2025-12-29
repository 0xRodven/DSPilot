import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "DSPilot",
  version: packageJson.version,
  copyright: `© ${currentYear}, DSPilot.`,
  meta: {
    title: "DSPilot - Gestion des Performances Livreurs",
    description:
      "DSPilot est une plateforme SaaS de gestion des performances livreurs Amazon (DWC/IADC).",
  },
};
