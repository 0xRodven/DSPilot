import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
c.setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);

const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: 2026, week: 15
});

if (!d) { console.log('NO_DATA'); process.exit(0); }

const totalContactMiss = d.drivers.reduce((s: number, x: any) => s + (x.contactMiss || 0), 0);
const totalDnr = d.drivers.reduce((s: number, x: any) => s + (x.dnrCount || 0), 0);
const totalDeliveries = d.drivers.reduce((s: number, x: any) => s + (x.totalDeliveries || 0), 0);

const top = d.drivers
  .map((x: any) => ({ name: x.name, contactMiss: x.contactMiss ?? 0, dnr: x.dnrCount ?? 0, deliveries: x.totalDeliveries ?? 0 }))
  .filter((x: any) => x.contactMiss > 0 || x.dnr > 0)
  .sort((a: any, b: any) => (b.contactMiss + b.dnr) - (a.contactMiss + a.dnr))
  .slice(0, 10);

console.log(JSON.stringify({
  totalDrivers: d.drivers.length,
  totalDeliveries,
  totalContactMiss,
  totalDnr,
  top
}, null, 2));
