import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export const metadata = {
  title: "Merci — DSPilot",
  description: "Paiement confirmé. Vous recevrez un email pour activer votre compte.",
};

export default async function PaidPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F3EE] px-6 py-20">
      <div className="max-w-xl rounded-2xl border border-[#E8E5DF] bg-white p-10 text-center shadow-sm">
        <div className="mb-4 text-5xl">🎉</div>
        <h1 className="mb-4 font-semibold text-2xl text-[#1A1A1A]">Paiement confirmé</h1>
        <p className="mb-6 text-[#4A4A4A]">
          Merci pour votre confiance. Vous allez recevoir un email pour activer votre compte et accéder à DSPilot dans
          les <strong>prochaines 24 heures</strong>.
        </p>
        <p className="mb-8 text-[#8A8A8A] text-sm">
          Notre équipe connecte manuellement votre compte Amazon Logistics pour le premier import (station, livreurs,
          DWC dernières semaines). Vous recevrez une notification dès que tout est prêt.
        </p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-[#2563EB] px-6 py-3 font-semibold text-sm text-white transition-all hover:bg-[#1d4ed8]"
        >
          Retour à l&apos;accueil
        </Link>
        {sessionId ? <p className="mt-6 text-[#8A8A8A] text-xs">Référence : {sessionId}</p> : null}
      </div>
    </main>
  );
}
