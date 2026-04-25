import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
c.setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);

const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: 2026, week: 16
});

if (!d) { console.log('NO_DATA'); process.exit(0); }

const matches = d.drivers.filter((x: any) => {
  const n = (x.name || '').toLowerCase();
  return n.includes('hassane') || (n.includes('coulibaly') && n.includes('camara'));
});

console.log('matches:', matches.length);
console.log(JSON.stringify(matches.map((m: any) => ({
  name: m.name,
  daysWorked: m.daysWorked,
  totalDeliveries: m.totalDeliveries,
  dwcPercent: m.dwcPercent,
})), null, 2));
