"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer"

// Styles du PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    borderBottom: "2px solid #3b82f6",
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3b82f6",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#0f172a",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1e293b",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 5,
  },
  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  kpiCard: {
    width: "23%",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    border: "1px solid #e2e8f0",
  },
  kpiLabel: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
  },
  kpiChange: {
    fontSize: 8,
    marginTop: 4,
  },
  positive: {
    color: "#10b981",
  },
  negative: {
    color: "#ef4444",
  },
  table: {
    width: "100%",
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 8,
    borderBottom: "1px solid #e2e8f0",
  },
  tableHeaderCell: {
    fontWeight: "bold",
    fontSize: 9,
    color: "#475569",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottom: "1px solid #f1f5f9",
  },
  tableCell: {
    fontSize: 9,
    color: "#334155",
  },
  col1: { width: "5%" },
  col2: { width: "35%" },
  col3: { width: "15%", textAlign: "center" },
  col4: { width: "15%", textAlign: "center" },
  col5: { width: "15%", textAlign: "center" },
  col6: { width: "15%", textAlign: "center" },
  tierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    textAlign: "center",
  },
  tierFantastic: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  tierGreat: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  tierFair: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  tierPoor: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#94a3b8",
    borderTop: "1px solid #e2e8f0",
    paddingTop: 10,
  },
  distributionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  distributionItem: {
    alignItems: "center",
    padding: 10,
  },
  distributionCount: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  distributionLabel: {
    fontSize: 9,
    color: "#64748b",
  },
})

// Types
export interface PDFDriver {
  rank: number
  name: string
  amazonId: string
  dwcPercent: number
  iadcPercent: number
  tier: "fantastic" | "great" | "fair" | "poor"
  daysWorked: number
}

export interface PDFKPIs {
  avgDwc: number
  avgIadc: number
  totalDrivers: number
  activeDrivers: number
  dwcChange?: number
  iadcChange?: number
}

export interface PDFTierDistribution {
  fantastic: number
  great: number
  fair: number
  poor: number
}

export interface WeeklyRecapData {
  stationName: string
  stationCode: string
  week: number
  year: number
  generatedAt: string
  kpis: PDFKPIs
  tierDistribution: PDFTierDistribution
  topDrivers: PDFDriver[]
  bottomDrivers: PDFDriver[]
}

function getTierStyle(tier: string) {
  switch (tier) {
    case "fantastic":
      return styles.tierFantastic
    case "great":
      return styles.tierGreat
    case "fair":
      return styles.tierFair
    case "poor":
      return styles.tierPoor
    default:
      return styles.tierFair
  }
}

function getTierLabel(tier: string) {
  switch (tier) {
    case "fantastic":
      return "Fantastic"
    case "great":
      return "Great"
    case "fair":
      return "Fair"
    case "poor":
      return "Poor"
    default:
      return tier
  }
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatChange(value?: number) {
  if (value === undefined) return null
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(1)}%`
}

export function WeeklyRecapDocument({ data }: { data: WeeklyRecapData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>DSPilot</Text>
          <Text style={styles.subtitle}>
            Récapitulatif Hebdomadaire - {data.stationName} ({data.stationCode})
          </Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Semaine {data.week} • {data.year}
        </Text>

        {/* KPIs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicateurs Clés</Text>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Score DWC</Text>
              <Text style={styles.kpiValue}>{formatPercent(data.kpis.avgDwc)}</Text>
              {data.kpis.dwcChange !== undefined && (
                <Text style={[styles.kpiChange, data.kpis.dwcChange >= 0 ? styles.positive : styles.negative]}>
                  {formatChange(data.kpis.dwcChange)} vs sem. préc.
                </Text>
              )}
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Score IADC</Text>
              <Text style={styles.kpiValue}>{formatPercent(data.kpis.avgIadc)}</Text>
              {data.kpis.iadcChange !== undefined && (
                <Text style={[styles.kpiChange, data.kpis.iadcChange >= 0 ? styles.positive : styles.negative]}>
                  {formatChange(data.kpis.iadcChange)} vs sem. préc.
                </Text>
              )}
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Livreurs Actifs</Text>
              <Text style={styles.kpiValue}>{data.kpis.activeDrivers}</Text>
              <Text style={[styles.kpiChange, { color: "#64748b" }]}>
                sur {data.kpis.totalDrivers} total
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Taux Fantastic</Text>
              <Text style={styles.kpiValue}>
                {data.kpis.activeDrivers > 0
                  ? Math.round((data.tierDistribution.fantastic / data.kpis.activeDrivers) * 100)
                  : 0}%
              </Text>
              <Text style={[styles.kpiChange, { color: "#64748b" }]}>
                {data.tierDistribution.fantastic} livreurs
              </Text>
            </View>
          </View>
        </View>

        {/* Tier Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribution des Tiers</Text>
          <View style={styles.distributionRow}>
            <View style={styles.distributionItem}>
              <Text style={[styles.distributionCount, { color: "#10b981" }]}>
                {data.tierDistribution.fantastic}
              </Text>
              <Text style={styles.distributionLabel}>Fantastic (≥98.5%)</Text>
            </View>
            <View style={styles.distributionItem}>
              <Text style={[styles.distributionCount, { color: "#3b82f6" }]}>
                {data.tierDistribution.great}
              </Text>
              <Text style={styles.distributionLabel}>Great (≥96%)</Text>
            </View>
            <View style={styles.distributionItem}>
              <Text style={[styles.distributionCount, { color: "#f59e0b" }]}>
                {data.tierDistribution.fair}
              </Text>
              <Text style={styles.distributionLabel}>Fair (≥90%)</Text>
            </View>
            <View style={styles.distributionItem}>
              <Text style={[styles.distributionCount, { color: "#ef4444" }]}>
                {data.tierDistribution.poor}
              </Text>
              <Text style={styles.distributionLabel}>Poor (&lt;90%)</Text>
            </View>
          </View>
        </View>

        {/* Top 5 Performers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top 5 Performers</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col1]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>Livreur</Text>
              <Text style={[styles.tableHeaderCell, styles.col3]}>DWC %</Text>
              <Text style={[styles.tableHeaderCell, styles.col4]}>IADC %</Text>
              <Text style={[styles.tableHeaderCell, styles.col5]}>Jours</Text>
              <Text style={[styles.tableHeaderCell, styles.col6]}>Tier</Text>
            </View>
            {data.topDrivers.map((driver, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{driver.rank}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{driver.name}</Text>
                <Text style={[styles.tableCell, styles.col3, styles.positive]}>
                  {formatPercent(driver.dwcPercent)}
                </Text>
                <Text style={[styles.tableCell, styles.col4, styles.positive]}>
                  {formatPercent(driver.iadcPercent)}
                </Text>
                <Text style={[styles.tableCell, styles.col5]}>{driver.daysWorked}</Text>
                <View style={[styles.col6, { alignItems: "center" }]}>
                  <Text style={[styles.tierBadge, getTierStyle(driver.tier)]}>
                    {getTierLabel(driver.tier)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom 5 (Need attention) */}
        {data.bottomDrivers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Livreurs à Coacher</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.col1]}>#</Text>
                <Text style={[styles.tableHeaderCell, styles.col2]}>Livreur</Text>
                <Text style={[styles.tableHeaderCell, styles.col3]}>DWC %</Text>
                <Text style={[styles.tableHeaderCell, styles.col4]}>IADC %</Text>
                <Text style={[styles.tableHeaderCell, styles.col5]}>Jours</Text>
                <Text style={[styles.tableHeaderCell, styles.col6]}>Tier</Text>
              </View>
              {data.bottomDrivers.map((driver, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.col1]}>{driver.rank}</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{driver.name}</Text>
                  <Text style={[styles.tableCell, styles.col3, styles.negative]}>
                    {formatPercent(driver.dwcPercent)}
                  </Text>
                  <Text style={[styles.tableCell, styles.col4, styles.negative]}>
                    {formatPercent(driver.iadcPercent)}
                  </Text>
                  <Text style={[styles.tableCell, styles.col5]}>{driver.daysWorked}</Text>
                  <View style={[styles.col6, { alignItems: "center" }]}>
                    <Text style={[styles.tierBadge, getTierStyle(driver.tier)]}>
                      {getTierLabel(driver.tier)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Généré le {data.generatedAt}</Text>
          <Text>DSPilot - dspilot.fr</Text>
        </View>
      </Page>
    </Document>
  )
}
