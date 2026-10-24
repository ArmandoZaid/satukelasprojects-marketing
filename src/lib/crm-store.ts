import "server-only";
import { createDemo, type DemoState } from "./crm-demo";
import { CrmDataError } from "./crm-data";

const globalStore = globalThis as typeof globalThis & { marketingSyntheticCrm?: DemoState };
const seedOwners: Record<string, string> = { Yunus: "usr_mkt_01", Dzaky: "usr_mkt_02", Armando: "usr_mkt_03", Yasser: "usr_mkt_04" };
// Explicit synthetic process store, not an operational persistence fallback.
export function readCrmStore(): DemoState {
  if (process.env.MARKETING_ENABLE_SYNTHETIC_CRM !== "true") throw new CrmDataError("Data CRM operasional belum dikonfigurasi. Mode sintetis dinonaktifkan.", 503);
  if (!globalStore.marketingSyntheticCrm) {
    return resetCrmStore();
  }
  return globalStore.marketingSyntheticCrm;
}
export function resetCrmStore(): DemoState {
  const demo = createDemo();
  globalStore.marketingSyntheticCrm = {
    opportunities: demo.opportunities.map(o => ({ ...o, ownerId: seedOwners[o.owner] })),
    activities: demo.activities.map(a => ({ ...a, ownerId: seedOwners[a.owner] })),
  };
  return globalStore.marketingSyntheticCrm;
}
export function writeCrmStore(next: DemoState) { globalStore.marketingSyntheticCrm = next; }
