import { rfc768 } from "~/visuals/rfc768";
import { rfc791 } from "~/visuals/rfc791";
import { rfc792 } from "~/visuals/rfc792";
import { rfc826 } from "~/visuals/rfc826";
import { rfc1034 } from "~/visuals/rfc1034";
import { rfc1035 } from "~/visuals/rfc1035";
import { rfc2131 } from "~/visuals/rfc2131";
import { rfc2328 } from "~/visuals/rfc2328";
import { rfc4271 } from "~/visuals/rfc4271";
import { rfc4443 } from "~/visuals/rfc4443";
import { rfc4861 } from "~/visuals/rfc4861";
import { rfc5880 } from "~/visuals/rfc5880";
import { rfc8200 } from "~/visuals/rfc8200";
import { rfc8446 } from "~/visuals/rfc8446";
import { rfc9000 } from "~/visuals/rfc9000";
import { rfc9112 } from "~/visuals/rfc9112";
import { rfc9293 } from "~/visuals/rfc9293";
import { rfc9846 } from "~/visuals/rfc9846";
import type { RfcVisualModel } from "~/visuals/types";

const VISUALS: RfcVisualModel[] = [
  rfc768,
  rfc791,
  rfc792,
  rfc826,
  rfc1034,
  rfc1035,
  rfc2131,
  rfc2328,
  rfc4271,
  rfc4443,
  rfc4861,
  rfc5880,
  rfc8200,
  rfc8446,
  rfc9000,
  rfc9112,
  rfc9293,
  rfc9846,
];

const BY_NUMBER = new Map(VISUALS.map((model) => [model.rfc, model]));

export function visualFor(num: number): RfcVisualModel | undefined {
  return BY_NUMBER.get(num);
}

export function allVisuals(): RfcVisualModel[] {
  return VISUALS;
}
