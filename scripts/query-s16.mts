import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
c.setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);

const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: 2026, week: 16
});

if (!d) { console.log('NO_DATA'); process.exit(0); }

const totalPackages = d.drivers.reduce((s: number, x: any) => s + (x.packagesDelivered || 0), 0);
console.log(JSON.stringify({
  kpis: d.kpis,
  totalDrivers: d.drivers.length,
  totalPackages
}, null, 2));
