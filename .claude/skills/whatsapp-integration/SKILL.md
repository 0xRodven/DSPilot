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

Note: This integration uses raw `fetch()` to call the Twilio REST API directly. It does NOT use the Twilio SDK.

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
created -> pending -> sent -> delivered
                  \-> failed
                  \-> undelivered
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
  messageContent: v.string(),
  status: v.string(),
  messageSid: v.optional(v.string()),
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

WhatsApp settings are stored in a separate `whatsappSettings` table (not embedded in the stations table):

```typescript
// Separate whatsappSettings table
whatsappSettings: defineTable({
  stationId: v.id("stations"),
  enabled: v.boolean(),
  sendDay: v.number(),      // 0-6 (Sunday-Saturday), default: 1 (Monday)
  sendHour: v.number(),     // 0-23, default: 9
  timezone: v.string(),     // e.g., "Europe/Paris"
})
  .index("by_station", ["stationId"])
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
// Internal action for sending via raw fetch (no Twilio SDK)
export const sendWhatsAppMessage = internalAction({
  args: {
    messageId: v.id("whatsappMessages"),
  },
  handler: async (ctx, { messageId }) => {
    const message = await ctx.runQuery(internal.whatsapp.getMessage, { messageId })
    if (!message) throw new Error("Message not found")

    const accountSid = process.env.TWILIO_ACCOUNT_SID!
    const authToken = process.env.TWILIO_AUTH_TOKEN!
    const from = process.env.TWILIO_WHATSAPP_FROM!

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
          body: new URLSearchParams({
            Body: message.messageContent,
            From: from,
            To: formatForWhatsApp(message.phoneNumber),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Twilio API error")
      }

      await ctx.runMutation(internal.whatsapp.updateMessageStatus, {
        messageId,
        status: "sent",
        messageSid: result.sid,
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

The cron runs **hourly** to check whether any station is due for sends:

```typescript
// In convex/crons.ts
crons.hourly(
  "check-whatsapp-sends",
  internal.whatsappCron.checkAndSendRecaps
)

// Handler
export const checkAndSendRecaps = internalAction({
  handler: async (ctx) => {
    // Get all stations with WhatsApp enabled
    const settings = await ctx.runQuery(internal.whatsapp.getEnabledSettings)

    for (const setting of settings) {
      // Check if it's the right day/hour for this station's timezone
      if (!isCorrectSendTime(setting)) continue

      // Get drivers with opt-in
      const drivers = await ctx.runQuery(
        internal.whatsapp.getOptedInDrivers,
        { stationId: setting.stationId }
      )

      for (const driver of drivers) {
        // Generate and queue message
        const recap = await generateDriverRecap(driver)
        const messageContent = generateRecapMessage(recap)

        await ctx.runMutation(internal.whatsapp.createMessage, {
          stationId: setting.stationId,
          driverId: driver._id,
          phoneNumber: driver.phoneNumber,
          messageContent,
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
    { header: "Message", accessor: "messageContent", truncate: 50 },
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
