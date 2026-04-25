import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const url = process.env.CONVEX_PROD_URL || process.env.NEXT_PUBLIC_CONVEX_URL!;
const key = process.env.CONVEX_DEPLOY_KEY_PROD || process.env.CONVEX_DEPLOY_KEY!;
const c = new ConvexHttpClient(url);
c.setAdminAuth(key);

const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: 2026, week: 16
});

if (!d) { console.log('NO_DATA'); process.exit(0); }

const matches = d.drivers.filter((x: any) =>
  (x.name || '').toLowerCase().includes('rayan') ||
  (x.name || '').toLowerCase().includes('mbimaketa') ||
  (x.transporterId || '').toLowerCase().includes('rayan') ||
  (x.transporterId || '').toLowerCase().includes('mbimaketa')
);

console.log('URL:', url);
console.log('Matches:', JSON.stringify(matches.map((x: any) => ({
  name: x.name,
  transporterId: x.transporterId,
  dnrCount: x.dnrCount,
  daysWorked: x.daysWorked,
  packagesDelivered: x.packagesDelivered,
})), null, 2));
console.log('Top offenders S16:', JSON.stringify(d.dnr.topOffenders, null, 2));
console.log('Total concessions S16:', d.dnr.totalConcessions);
