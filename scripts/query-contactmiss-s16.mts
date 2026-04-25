import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
c.setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);

const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: 2026, week: 16
});

if (!d) { console.log('NO_DATA'); process.exit(0); }

const ranked = d.drivers
  .map((x: any) => ({
    name: x.name,
    contactMiss: x.contactMiss ?? 0,
    packages: x.packagesDelivered ?? 0,
  }))
  .sort((a: any, b: any) => b.contactMiss - a.contactMiss)
  .slice(0, 10);

console.log(JSON.stringify(ranked, null, 2));
