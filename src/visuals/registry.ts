import { rfc9293 } from "~/visuals/rfc9293";
import type { RfcVisualModel } from "~/visuals/types";

const VISUALS: RfcVisualModel[] = [rfc9293];

const BY_NUMBER = new Map(VISUALS.map((model) => [model.rfc, model]));

export function visualFor(num: number): RfcVisualModel | undefined {
  return BY_NUMBER.get(num);
}

export function allVisuals(): RfcVisualModel[] {
  return VISUALS;
}
