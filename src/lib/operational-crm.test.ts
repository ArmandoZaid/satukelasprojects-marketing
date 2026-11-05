import { describe, it, expect } from "vitest";
import { addProspect, followUpState, recordResult, moveStage } from "./crm-demo";
import { businessToday } from "./business-date";
const empty = { opportunities: [], activities: [] };
const input = { school: "SMA Negeri 15", owner: "Admin", region: "Surabaya", service: "Photoshoot", period: "2026/2027", estimate: "10000000" };
describe("operational CRM versus explicit demo", () => {
 it("does not relabel real schools as sample data", () => {
  const state = addProspect(empty, input, ["Admin"], true);
  expect(state.opportunities[0].school).toBe("SMA Negeri 15");
  expect(addProspect(empty, input, ["Admin"]).opportunities[0].school).toContain("(Contoh)");
 });
 it("uses WIB calendar dates across UTC day boundaries", () => {
  expect(businessToday(new Date("2026-11-05T18:00:00Z"))).toBe("2026-11-06");
 });
 it("accepts real today activities and closing dates, rejecting the future", () => {
  const state = addProspect(empty, input, ["Admin"], true);
  const id = state.opportunities[0].id;
  const updated = recordResult(state, id, { summary:"Follow up sekolah", kind:"Telepon",date:"2026-11-05",nextAction:"",due:"" }, "2026-11-05");
  expect(updated.activities[0].date).toBe("2026-11-05");
  expect(() => recordResult(state,id,{summary:"Future",kind:"Telepon",date:"2026-11-06",nextAction:"",due:""},"2026-11-05")).toThrow();
  const won = moveStage(state,id,{stage:"Won",reason:"Kesepakatan selesai",finalValue:"15000000",closedOn:"2026-11-05",reference:"SPK-123"},"2026-11-05");
  expect(won.opportunities[0].status).toBe("WON");
  expect(won.activities[0].date).toBe("2026-11-05");
  expect(followUpState({...state.opportunities[0],due:"2026-11-05"},"2026-11-05")).toBe("today");
 });
});
