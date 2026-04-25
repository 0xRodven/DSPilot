import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

const c = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
c.setAdminAuth(process.env.CONVEX_DEPLOY_KEY!);

const d = await c.query(api.reporting.getReportData, {
  stationCode: 'FR-PSUA-DIF1',
  year: 2026, week: 16
});

if (!d) { console.log('NO_DATA'); process.exit(0); }

const drivers = d.drivers.filter((x: any) => typeof x.dwcPercent === 'number');
const poor = drivers.filter((x: any) => x.dwcPercent < 88);
const fair = drivers.filter((x: any) => x.dwcPercent >= 88 && x.dwcPercent < 90);
const great = drivers.filter((x: any) => x.dwcPercent >= 90 && x.dwcPercent < 95);
const fantastic = drivers.filter((x: any) => x.dwcPercent >= 95);

console.log(JSON.stringify({
  totalDrivers: drivers.length,
  tiers: {
    fantastic: fantastic.length,
    great: great.length,
    fair: fair.length,
    poor: poor.length
  },
  poorList: poor.map((d: any) => ({ name: d.transporterName, dwc: d.dwcPercent })).sort((a: any, b: any) => a.dwc - b.dwc)
}, null, 2));
