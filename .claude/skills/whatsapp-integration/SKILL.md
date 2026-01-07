---
name: whatsapp-integration
description: Send WhatsApp messages via Twilio, manage opt-ins, and schedule weekly recaps. Use for any WhatsApp-related functionality, message templates, or scheduled notifications.
allowed-tools: Read, Write, Edit, Bash
---

# WhatsApp Integration Skill for DSPilot

## When to Use
- Sending WhatsApp messages to drivers
- Managing opt-in/opt-out status
- Scheduling weekly recap messages
- Building WhatsApp settings UI
- Implementing message templates

## Reference Implementation
Location: `/convex/whatsapp.ts`, `/convex/whatsappCron.ts`

## Twilio Configuration

```typescript
// Environment variables required
// TWILIO_ACCOUNT_SID
// TWILIO_AUTH_TOKEN
// TWILIO_WHATSAPP_FROM  // e.g., "whatsapp:+14155238886"
```

## Phone Number Validation

```typescript
// E.164 format validation
const E164_REGEX = /^\+[1-9]\d{1,14}$/

function validatePhoneNumber(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, "")
  return E164_REGEX.test(cleaned)
}

function formatForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, "")
  return `whatsapp:${cleaned}`
}
```

## Message Status Flow

```
created → pending → sent → delivered
                 ↘ failed
                 ↘ undelivered
```

```typescript
type MessageStatus =
  | "pending"     // Created, not yet sent
  | "sent"        // Sent to Twilio
  | "delivered"   // Confirmed delivered
  | "failed"      // Twilio error
  | "undelivered" // Couldn't reach recipient
```

## Data Schema

```typescript
// Convex schema for whatsappMessages table
whatsappMessages: defineTable({
  stationId: v.id("stations"),
  driverId: v.id("drivers"),
  phoneNumber: v.string(),
  message: v.string(),
  messageType: v.string(),  // "recap" | "alert" | "custom"
  status: v.string(),
  twilioSid: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  year: v.number(),
  week: v.number(),
  createdAt: v.number(),
  sentAt: v.optional(v.number()),
  deliveredAt: v.optional(v.number()),
})
  .index("by_station_week", ["stationId", "year", "week"])
  .index("by_driver", ["driverId"])
  .index("by_status", ["status"])
```

## WhatsApp Settings Schema

```typescript
// Per-station settings
interface WhatsAppSettings {
  enabled: boolean
  sendDay: number      // 0-6 (Sunday-Saturday), default: 1 (Monday)
  sendHour: number     // 0-23, default: 9
  timezone: string     // e.g., "Europe/Paris"
}

// In stations table
whatsappSettings: v.optional(v.object({
  enabled: v.boolean(),
  sendDay: v.number(),
  sendHour: v.number(),
  timezone: v.string(),
}))
```

## Opt-in Management

```typescript
// In drivers table
whatsappOptIn: v.optional(v.boolean())
phoneNumber: v.optional(v.string())

// Check before sending
function canSendWhatsApp(driver: Driver): boolean {
  return (
    driver.whatsappOptIn === true &&
    driver.phoneNumber !== undefined &&
    validatePhoneNumber(driver.phoneNumber)
  )
}
```

## Sending Messages

```typescript
// Internal action for sending
export const sendWhatsAppMessage = internalAction({
  args: {
    messageId: v.id("whatsappMessages"),
  },
  handler: async (ctx, { messageId }) => {
    const message = await ctx.runQuery(internal.whatsapp.getMessage, { messageId })
    if (!message) throw new Error("Message not found")

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    )

    try {
      const result = await client.messages.create({
        body: message.message,
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: formatForWhatsApp(message.phoneNumber),
      })

      await ctx.runMutation(internal.whatsapp.updateMessageStatus, {
        messageId,
        status: "sent",
        twilioSid: result.sid,
      })
    } catch (error) {
      await ctx.runMutation(internal.whatsapp.updateMessageStatus, {
        messageId,
        status: "failed",
        errorMessage: error.message,
      })
    }
  },
})
```

## Scheduled Sends (Cron)

```typescript
// In convex/crons.ts
crons.weekly(
  "send-weekly-recaps",
  { dayOfWeek: "monday", hourUTC: 8 },
  internal.whatsappCron.sendWeeklyRecaps
)

// Handler
export const sendWeeklyRecaps = internalAction({
  handler: async (ctx) => {
    // Get all stations with WhatsApp enabled
    const stations = await ctx.runQuery(internal.whatsapp.getEnabledStations)

    for (const station of stations) {
      // Check if it's the right time for this station's timezone
      if (!isCorrectSendTime(station.whatsappSettings)) continue

      // Get drivers with opt-in
      const drivers = await ctx.runQuery(
        internal.whatsapp.getOptedInDrivers,
        { stationId: station._id }
      )

      for (const driver of drivers) {
        // Generate and queue message
        const recap = await generateDriverRecap(driver)
        const message = generateRecapMessage(recap)

        await ctx.runMutation(internal.whatsapp.createMessage, {
          stationId: station._id,
          driverId: driver._id,
          phoneNumber: driver.phoneNumber,
          message,
          messageType: "recap",
        })
      }
    }

    // Schedule sends
    await ctx.scheduler.runAfter(0, internal.whatsapp.processPendingMessages)
  },
})
```

## Message Templates

### Weekly Recap
```typescript
const RECAP_TEMPLATE = `
*Recap Semaine {{week}}* 📊

Salut {{firstName}} !

*Ta performance:*
DWC: {{dwcPercent}}% {{tierEmoji}}
IADC: {{iadcPercent}}%
Classement: {{rank}}/{{totalDrivers}}

*Tendance:* {{trendArrow}} {{change}}%

{{#if topErrors}}
*Top erreurs:*
{{#each topErrors}}
- {{category}}: {{count}}
{{/each}}
{{/if}}

{{tip}}

Bonne semaine ! 💪
`
```

### Alert Notification
```typescript
const ALERT_TEMPLATE = `
⚠️ *Alerte Performance*

{{driverName}}, ton DWC a baisse de {{drop}}% cette semaine.

Actuel: {{currentDwc}}%
Semaine derniere: {{previousDwc}}%

{{#if coachingScheduled}}
Un point est prevu le {{coachingDate}}.
{{/if}}

N'hesite pas a en parler si tu as besoin d'aide !
`
```

## UI Components

### Settings Form
```tsx
<Form>
  <Switch
    name="enabled"
    label="Activer les recaps WhatsApp"
  />

  <Select name="sendDay" label="Jour d'envoi">
    <SelectItem value={1}>Lundi</SelectItem>
    <SelectItem value={2}>Mardi</SelectItem>
    {/* ... */}
  </Select>

  <Select name="sendHour" label="Heure d'envoi">
    {Array.from({ length: 24 }, (_, i) => (
      <SelectItem key={i} value={i}>
        {i.toString().padStart(2, "0")}:00
      </SelectItem>
    ))}
  </Select>

  <Select name="timezone" label="Fuseau horaire">
    <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
    {/* ... */}
  </Select>
</Form>
```

### Message History Table
```tsx
<DataTable
  columns={[
    { header: "Driver", accessor: "driverName" },
    { header: "Status", accessor: "status", cell: StatusBadge },
    { header: "Sent", accessor: "sentAt", cell: DateCell },
    { header: "Message", accessor: "message", truncate: 50 },
  ]}
  data={messages}
/>
```

## Error Handling

```typescript
// Common Twilio errors
const TWILIO_ERRORS = {
  21211: "Invalid phone number format",
  21614: "Invalid WhatsApp number",
  21408: "Permission to send denied",
  21610: "Recipient opted out",
}

function handleTwilioError(code: number): string {
  return TWILIO_ERRORS[code] || "Unknown error"
}
```

## DO NOT
- Send messages without opt-in verification
- Store phone numbers in logs
- Expose Twilio credentials
- Send during night hours (respect timezone)
- Queue duplicate messages for same driver/week
