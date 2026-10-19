// Written by scripts/generate-visuals.ts — do not edit by hand.
import rfc5340 from "./rfc5340.json";
import rfc5905 from "./rfc5905.json";
import rfc7348 from "./rfc7348.json";
import type { RfcVisualModel } from "~/visuals/types";

export const GENERATED: RfcVisualModel[] = [rfc5340, rfc5905, rfc7348] as RfcVisualModel[];
