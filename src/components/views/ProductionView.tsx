import { ProductionShell } from '../production/ProductionShell';

/* Production — the command bridge for the October 2026 shoot.
   Six tabs: Today · Shot list · Boat ops · Data · Safety · Wrap.
   Tier A ships Today + Shot list + Wrap full; Boat ops · Data · Safety
   render as Tier B placeholders that declare the surface clearly. */

export function ProductionView() {
  return <ProductionShell />;
}
