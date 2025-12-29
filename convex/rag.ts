import { components } from "./_generated/api"
import { RAG } from "@convex-dev/rag"
import { openai } from "@ai-sdk/openai"

// Cast to any to avoid version mismatch between ai-sdk versions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const embeddingModel = openai.embedding("text-embedding-3-small") as any

/**
 * DSPilot RAG Configuration
 *
 * Filters for namespace-isolated semantic search:
 * - namespace: ownerId (tenant isolation per admin)
 * - stationId: filter by station
 * - dataType: type of indexed content (driver, coaching, error, import)
 * - tier: performance tier (fantastic, great, fair, poor)
 */

// Type-safe filter definitions
type DSPilotFilters = {
  stationId: string
  dataType: "driver" | "coaching" | "error" | "import"
  tier: "fantastic" | "great" | "fair" | "poor"
}

export const rag = new RAG<DSPilotFilters>(components.rag, {
  textEmbeddingModel: embeddingModel,
  embeddingDimension: 1536,
  filterNames: ["stationId", "dataType", "tier"],
})
