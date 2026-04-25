import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
c.setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);

const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: 2026, week: 16
});

if (!d) { console.log('NO_DATA'); process.exit(0); }

const matches = d.drivers.filter((x: any) =>
  (x.driverName || '').toLowerCase().includes('dupont') ||
  (x.driverName || '').toLowerCase().includes('jean')
);

console.log(JSON.stringify({
  matchCount: matches.length,
  matches: matches.map((m: any) => ({ name: m.driverName, dwc: m.dwc, dcr: m.dcr })),
  totalDrivers: d.drivers.length,
}, null, 2));
