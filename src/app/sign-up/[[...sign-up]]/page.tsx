import { SignUp } from "@clerk/nextjs"
import Image from "next/image"

const clerkAppearance = {
  variables: {
    colorPrimary: "#0052CC",
    colorText: "#0A0A0A",
    colorTextSecondary: "#6B7280",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#F9FAFB",
    colorInputText: "#0A0A0A",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full max-w-md",
    card: "shadow-none border-0 bg-transparent p-0",
    headerTitle: "text-2xl font-bold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButton:
      "border border-gray-200 hover:bg-gray-50 transition-colors",
    socialButtonsBlockButtonText: "font-medium",
    formButtonPrimary:
      "bg-[#0052CC] hover:bg-[#0052CC]/90 transition-colors font-medium",
    formFieldInput:
      "border-gray-200 focus:border-[#0052CC] focus:ring-[#0052CC]/20",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-[#0052CC] hover:text-[#0081FF] font-medium",
    dividerLine: "bg-gray-200",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-[#0052CC] hover:text-[#0081FF]",
    formResendCodeLink: "text-[#0052CC] hover:text-[#0081FF]",
  },
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen">
      {/* Panel Gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0052CC] via-[#0081FF] to-[#00C9D7] flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-md">
          <div className="mb-8 p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
            <Image
              src="/logo/DSPilot_Icon.png"
              alt="DSPilot Logo"
              width={80}
              height={80}
              className="drop-shadow-lg"
            />
          </div>

          <h1 className="text-white text-4xl font-bold mb-4">
            Rejoignez DSPilot
          </h1>

          <p className="text-white/90 text-xl mb-6">
            La plateforme de référence pour les DSP Amazon
          </p>

          <div className="flex flex-col gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Configuration en quelques minutes</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Import automatique des données CSV</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <span>Tableau de bord complet dès le premier jour</span>
            </div>
          </div>
        </div>
      </div>

      {/* Panel Droit - Formulaire Clerk */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <Image
              src="/logo/DSPilot_Icon.png"
              alt="DSPilot Logo"
              width={64}
              height={64}
              className="mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">DSPilot</h1>
          </div>

          <SignUp
            appearance={clerkAppearance}
            forceRedirectUrl="/dashboard"
            signInUrl="/sign-in"
          />
        </div>
      </div>
    </div>
  )
}
