"use client";

// Color palette
const colors = {
  bg: "#FAFAF8",
  card: "#FFFFFF",
  border: "#E8E5DF",
  ink: "#1A1A1A",
  soft: "#4A4A4A",
  muted: "#8A8A8A",
  accent: "#2563EB",
  green: "#059669",
  red: "#DC2626",
  amber: "#f59e0b",
};

// =============================================================================
// DASHBOARD MOCKUP
// =============================================================================
export function DashboardMockup() {
  const kpis = [
    { label: "DWC Global", value: "94.2%", trend: "+1.2%", color: colors.green },
    { label: "IADC", value: "91.8%", trend: "+0.5%", color: colors.green },
    { label: "Livreurs actifs", value: "47", trend: "3 nouveaux", color: colors.accent },
    { label: "En coaching", value: "8", trend: "-2", color: colors.amber },
    { label: "DCR", value: "99.1%", trend: "stable", color: colors.green },
    { label: "DNR", value: "98.4%", trend: "+0.2%", color: colors.green },
  ];

  const drivers = [
    { name: "A. Martin", dwc: 98.2, tier: "Fantastic", color: colors.green },
    { name: "B. Durand", dwc: 94.1, tier: "Great", color: colors.accent },
    { name: "C. Bernard", dwc: 89.3, tier: "Fair", color: colors.amber },
    { name: "D. Petit", dwc: 85.1, tier: "Poor", color: colors.red },
  ];

  return (
    <div style={{ height: 380, background: colors.bg, padding: 12, display: "flex", gap: 12 }}>
      {/* Sidebar */}
      <div
        style={{
          width: 48,
          background: colors.card,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {[colors.accent, colors.muted, colors.muted, colors.muted, colors.muted].map((c, i) => (
          <div
            key={i}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: c === colors.accent ? "#EFF6FF" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: 4, background: c }} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* KPI Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: colors.card,
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                padding: 10,
              }}
            >
              <div style={{ fontSize: 9, color: colors.muted, marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.ink }}>{kpi.value}</div>
              <div style={{ fontSize: 9, color: kpi.color }}>{kpi.trend}</div>
            </div>
          ))}
        </div>

        {/* Middle Row */}
        <div style={{ display: "flex", gap: 12, flex: 1 }}>
          {/* Chart */}
          <div
            style={{
              flex: 2,
              background: colors.card,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Évolution DWC</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
              {[65, 72, 68, 78, 82, 75, 88, 85, 92, 89, 94, 91].map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: i === 11 ? colors.accent : "#E0E7FF",
                    borderRadius: 3,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontSize: 8, color: colors.muted }}>S1</span>
              <span style={{ fontSize: 8, color: colors.muted }}>S12</span>
            </div>
          </div>

          {/* Tier Distribution */}
          <div
            style={{
              flex: 1,
              background: colors.card,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Répartition tiers</div>
            {[
              { label: "Fantastic", pct: 42, color: colors.green },
              { label: "Great", pct: 32, color: colors.accent },
              { label: "Fair", pct: 18, color: colors.amber },
              { label: "Poor", pct: 8, color: colors.red },
            ].map((tier) => (
              <div key={tier.label} style={{ marginBottom: 8 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 9,
                    color: colors.soft,
                    marginBottom: 2,
                  }}
                >
                  <span>{tier.label}</span>
                  <span>{tier.pct}%</span>
                </div>
                <div style={{ height: 6, background: colors.border, borderRadius: 3 }}>
                  <div
                    style={{
                      width: `${tier.pct}%`,
                      height: "100%",
                      background: tier.color,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Driver Table */}
        <div
          style={{
            background: colors.card,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Top Livreurs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {drivers.map((driver) => (
              <div
                key={driver.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  background: colors.bg,
                  borderRadius: 6,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: colors.border,
                    }}
                  />
                  <span style={{ fontSize: 10, color: colors.ink }}>{driver.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: colors.ink }}>{driver.dwc}%</span>
                  <span
                    style={{
                      fontSize: 9,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: `${driver.color}20`,
                      color: driver.color,
                    }}
                  >
                    {driver.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// IMPORT MOCKUP
// =============================================================================
export function ImportMockup() {
  const steps = [
    { label: "Fichier reçu", done: true },
    { label: "Parsing HTML", done: true },
    { label: "Validation", done: true },
    { label: "Détection semaine", done: true },
    { label: "Import base", done: true },
    { label: "Terminé", done: true },
  ];

  const stats = [
    { label: "Livreurs importés", value: "47" },
    { label: "Semaine", value: "S12-2026" },
    { label: "Durée", value: "2.3s" },
  ];

  return (
    <div style={{ height: 280, background: colors.bg, padding: 24 }}>
      <div
        style={{
          background: colors.card,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          padding: 24,
          maxWidth: 400,
          margin: "0 auto",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#ECFDF5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" role="img">
            <title>Check</title>
            <path
              d="M5 13l4 4L19 7"
              stroke={colors.green}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: 14,
            fontWeight: 600,
            color: colors.ink,
            marginBottom: 4,
          }}
        >
          Import réussi
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: colors.muted,
            marginBottom: 20,
          }}
        >
          Données DWC semaine 12
        </div>

        {/* Steps */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          {steps.map((step, i) => (
            <div key={step.label} style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: step.done ? colors.green : colors.border,
                  margin: "0 auto 4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {step.done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true" role="img">
                    <title>Done</title>
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div style={{ fontSize: 8, color: colors.muted }}>{step.label}</div>
              {i < steps.length - 1 && (
                <div
                  style={{
                    position: "absolute",
                    height: 2,
                    background: colors.green,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12 }}>
          {stats.map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                padding: 12,
                background: colors.bg,
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.ink }}>{stat.value}</div>
              <div style={{ fontSize: 9, color: colors.muted }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COACHING MOCKUP
// =============================================================================
export function CoachingMockup() {
  const columns = [
    {
      title: "Détecter",
      color: colors.red,
      cards: [
        { name: "D. Petit", issue: "DWC < 88%", days: "3j" },
        { name: "E. Roux", issue: "DNR drop", days: "1j" },
      ],
    },
    {
      title: "Attente",
      color: colors.amber,
      cards: [{ name: "F. Moreau", issue: "Entretien planifié", days: "5j" }],
    },
    {
      title: "Évaluer",
      color: colors.accent,
      cards: [{ name: "G. Simon", issue: "Suivi formation", days: "7j" }],
    },
    {
      title: "Terminé",
      color: colors.green,
      cards: [
        { name: "H. Laurent", issue: "Amélioré +5%", days: "14j" },
        { name: "I. Garcia", issue: "Objectif atteint", days: "10j" },
      ],
    },
  ];

  return (
    <div style={{ height: 280, background: colors.bg, padding: 16 }}>
      <div style={{ display: "flex", gap: 12, height: "100%" }}>
        {columns.map((col) => (
          <div
            key={col.title}
            style={{
              flex: 1,
              background: colors.card,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              padding: 10,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: colors.ink }}>{col.title}</span>
              <span
                style={{
                  fontSize: 9,
                  color: colors.muted,
                  marginLeft: "auto",
                }}
              >
                {col.cards.length}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {col.cards.map((card) => (
                <div
                  key={card.name}
                  style={{
                    padding: 10,
                    background: colors.bg,
                    borderRadius: 6,
                    borderLeft: `3px solid ${col.color}`,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 500, color: colors.ink }}>{card.name}</div>
                  <div style={{ fontSize: 9, color: colors.muted, marginTop: 2 }}>{card.issue}</div>
                  <div style={{ fontSize: 8, color: colors.muted, marginTop: 4 }}>{card.days}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// REPORT MOCKUP
// =============================================================================
export function ReportMockup() {
  const kpis = [
    { label: "DWC", value: "94.2%", trend: "up" },
    { label: "IADC", value: "91.8%", trend: "up" },
    { label: "DCR", value: "99.1%", trend: "stable" },
    { label: "DNR", value: "98.4%", trend: "up" },
  ];

  return (
    <div style={{ height: 280, background: colors.bg, padding: 16 }}>
      <div
        style={{
          background: colors.card,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          padding: 20,
          maxWidth: 320,
          margin: "0 auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>Rapport Hebdomadaire</div>
            <div style={{ fontSize: 9, color: colors.muted }}>Semaine 12 · DIF1</div>
          </div>
          <div
            style={{
              padding: "4px 8px",
              background: "#EFF6FF",
              borderRadius: 4,
              fontSize: 9,
              color: colors.accent,
              fontWeight: 500,
            }}
          >
            PDF
          </div>
        </div>

        {/* Mini KPIs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>{kpi.value}</div>
              <div style={{ fontSize: 8, color: colors.muted }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: colors.border, marginBottom: 12 }} />

        {/* Recommendations */}
        <div style={{ fontSize: 9, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Recommandations</div>
        {[
          "Poursuivre le coaching de D. Petit",
          "Féliciter A. Martin pour sa progression",
          "Surveiller le DNR de l'équipe matin",
        ].map((rec, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: colors.accent,
                marginTop: 4,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 9, color: colors.soft, lineHeight: 1.4 }}>{rec}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// DRIVER MOCKUP
// =============================================================================
export function DriverMockup() {
  const kpis = [
    { label: "DWC", value: "96.8%", color: colors.green },
    { label: "IADC", value: "94.2%", color: colors.green },
    { label: "DCR", value: "99.5%", color: colors.green },
    { label: "DNR", value: "98.8%", color: colors.green },
  ];

  return (
    <div style={{ height: 280, background: colors.bg, padding: 16 }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 9, color: colors.muted, marginBottom: 12 }}>
        Livreurs / <span style={{ color: colors.ink }}>A. Martin</span>
      </div>

      {/* Header Card */}
      <div
        style={{
          background: colors.card,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          padding: 12,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${colors.accent}, #0891b2)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          AM
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.ink }}>Antoine Martin</div>
          <div style={{ fontSize: 9, color: colors.muted }}>ID: DRV-2847 · Actif depuis 14 mois</div>
        </div>
        <div
          style={{
            padding: "4px 10px",
            background: `${colors.green}20`,
            color: colors.green,
            borderRadius: 12,
            fontSize: 10,
            fontWeight: 500,
          }}
        >
          Fantastic
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: colors.card,
              borderRadius: 8,
              border: `1px solid ${colors.border}`,
              padding: 10,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: kpi.color }}>{kpi.value}</div>
            <div style={{ fontSize: 9, color: colors.muted }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div
        style={{
          background: colors.card,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          padding: 12,
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 600, color: colors.ink, marginBottom: 8 }}>Évolution 12 semaines</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 50 }}>
          {[88, 90, 89, 92, 91, 93, 94, 93, 95, 96, 95, 97].map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${(h - 85) * 4}%`,
                background: i === 11 ? colors.green : "#D1FAE5",
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
