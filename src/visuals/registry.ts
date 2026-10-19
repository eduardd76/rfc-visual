import { rfc9293 } from "~/visuals/rfc9293";
import type { RfcVisualModel } from "~/visuals/types";

const VISUALS: Record<number, RfcVisualModel> = { 9293: rfc9293 };

export function visualFor(num: number): RfcVisualModel | undefined {
  return VISUALS[num];
}
