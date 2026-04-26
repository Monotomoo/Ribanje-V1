import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { MicPlacement } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { newId } from '../episode/shared';

export function BoatLogistics() {
  const { state, dispatch } = useApp();

  function add() {
    const placement: MicPlacement = {
      id: newId('mic'),
      label: 'New mic',
      position: '',
      episodeId: 'general',
      notes: '',
    };
    dispatch({ type: 'ADD_MIC', placement });
  }

  return (
    <div className="space-y-8">
      {/* Boat schematic — abstract overhead view */}
      <BoatSchematic placements={state.micPlacements} />

      {/* Mic table */}
      <section>
        <header className="flex items-baseline justify-between mb-3">
          <div>
            <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
              Mic placements &amp; RF channels
            </h3>
            <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
              Plan RF before the boat — bura interference patterns plus close hulls make this critical.
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            className="flex items-center gap-1.5 label-caps text-[color:var(--color-brass-deep)] hover:text-[color:var(--color-on-paper)] border-[0.5px] border-[color:var(--color-border-brass)] hover:border-[color:var(--color-brass)] rounded-[2px] px-2.5 py-1 transition-colors"
          >
            <Plus size={11} />
            Add mic
          </button>
        </header>

        <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] overflow-hidden">
          <header className="grid grid-cols-[2fr_2fr_1fr_3fr_40px] gap-4 px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)] label-caps text-[color:var(--color-on-paper-faint)]">
            <span>Mic</span>
            <span>Position</span>
            <span>RF (MHz)</span>
            <span>Notes</span>
            <span />
          </header>
          {state.micPlacements.length === 0 ? (
            <div className="px-5 py-12 text-center prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
              No mic placements yet.
            </div>
          ) : (
            state.micPlacements.map((m) => (
              <MicRow key={m.id} mic={m} />
            ))
          )}
        </div>
      </section>

      {/* Power and protection */}
      <section className="grid grid-cols-2 gap-5">
        <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
            Power chain
          </h3>
          <ul className="space-y-2 prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55] list-disc pl-5">
            <li>Recorder: Sound Devices Scorpio · 2× L-mount batteries on hot-swap.</li>
            <li>Wireless TX (4×): rechargeable AA, swap each shoot day.</li>
            <li>Wireless RX bag: dedicated V-mount with regulator.</li>
            <li>Backup: USB power bank for emergency RX power.</li>
          </ul>
        </article>
        <article className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-6 py-5">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
            Wind &amp; water protection
          </h3>
          <ul className="space-y-2 prose-body text-[14px] text-[color:var(--color-on-paper)] leading-[1.55] list-disc pl-5">
            <li>Boom: Rycote blimp + dead-cat. Backup high-wind cover.</li>
            <li>Lavs: Rycote Overcovers + Stickies. Sweat-proof patches for active scenes.</li>
            <li>Plant mics: Rycote Cyclone or DIY foam + furry combination.</li>
            <li>All RF receivers in splash bags. Recorder under cover when at sea.</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

function BoatSchematic({
  placements,
}: {
  placements: MicPlacement[];
}) {
  /* Simple abstract top-down boat schematic. Position labels rendered as text
     pinned to fixed schematic anchors. */
  return (
    <section>
      <header className="mb-3">
        <h3 className="display-italic text-[20px] text-[color:var(--color-on-paper)]">
          Boat schematic · top-down
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
          A reference outline. Cluster labels by where the mic actually sits.
        </p>
      </header>
      <div className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
        <svg viewBox="0 0 800 280" className="w-full" style={{ maxHeight: 320 }}>
          {/* Boat outline — rough sail-doc form */}
          <path
            d="M 80 140
               C 100 70, 200 40, 400 40
               C 600 40, 700 70, 720 140
               C 700 210, 600 240, 400 240
               C 200 240, 100 210, 80 140 Z"
            fill="rgba(14,30,54,0.04)"
            stroke="rgba(14,30,54,0.4)"
            strokeWidth={1}
          />
          {/* Cabin / wheelhouse */}
          <rect
            x={350}
            y={110}
            width={200}
            height={60}
            rx={6}
            fill="rgba(14,30,54,0.06)"
            stroke="rgba(14,30,54,0.4)"
            strokeWidth={0.5}
          />
          {/* Mast */}
          <circle
            cx={400}
            cy={140}
            r={4}
            fill="rgba(168,136,74,0.6)"
            stroke="rgba(14,30,54,0.55)"
            strokeWidth={0.5}
          />
          {/* Bow / stern labels */}
          <text x={730} y={148} fontFamily="Inter,sans-serif" fontSize={9} letterSpacing={1.4} fill="rgba(14,30,54,0.5)">
            BOW →
          </text>
          <text x={20} y={148} fontFamily="Inter,sans-serif" fontSize={9} letterSpacing={1.4} fill="rgba(14,30,54,0.5)">
            ← STERN
          </text>
          <text x={400} y={28} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={9} letterSpacing={1.4} fill="rgba(14,30,54,0.5)">
            PORT (left)
          </text>
          <text x={400} y={264} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize={9} letterSpacing={1.4} fill="rgba(14,30,54,0.5)">
            STARBOARD (right)
          </text>

          {/* Mic anchors — distributed roughly */}
          {placements.map((m, idx) => {
            /* Distribute around the cabin / bow / stern based on label keywords. */
            const lower = m.position.toLowerCase();
            let x = 400;
            let y = 140;
            if (lower.includes('bow')) x = 660;
            else if (lower.includes('stern')) x = 130;
            else if (lower.includes('mast')) {
              x = 400;
              y = 100;
            } else if (lower.includes('galley')) {
              x = 350;
              y = 200;
            } else if (lower.includes('camera')) {
              x = 470;
              y = 200;
            } else {
              /* Spread along centerline */
              x = 220 + (idx * 90) % 380;
              y = 90;
            }
            return (
              <g key={m.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={5}
                  fill="var(--color-brass)"
                  stroke="var(--color-brass-deep)"
                  strokeWidth={0.5}
                />
                <text
                  x={x + 8}
                  y={y + 3.5}
                  fontFamily="Fraunces, serif"
                  fontStyle="italic"
                  fontSize={11}
                  fill="rgba(14,30,54,0.78)"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function MicRow({ mic }: { mic: MicPlacement }) {
  const { state, dispatch } = useApp();
  function patch(p: Partial<MicPlacement>) {
    dispatch({ type: 'UPDATE_MIC', id: mic.id, patch: p });
  }
  const linkedKit = mic.kitId
    ? state.dopKit.find((k) => k.id === mic.kitId)
    : null;
  return (
    <div className="grid grid-cols-[2fr_2fr_1fr_3fr_40px] gap-4 px-5 py-3 border-b-[0.5px] border-[color:var(--color-border-paper)] last:border-b-0 group items-baseline">
      <div>
        <EditableText
          value={mic.label}
          onChange={(v) => patch({ label: v })}
          className="display-italic text-[14px] text-[color:var(--color-on-paper)]"
        />
        {linkedKit && (
          <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            {linkedKit.label}
          </div>
        )}
      </div>
      <EditableText
        value={mic.position}
        onChange={(v) => patch({ position: v })}
        placeholder="Where is it on the boat?"
        className="prose-body italic text-[13px] text-[color:var(--color-on-paper)]"
      />
      <input
        type="number"
        step="0.001"
        value={mic.channelMHz ?? ''}
        onChange={(e) =>
          patch({
            channelMHz: e.target.value ? parseFloat(e.target.value) : undefined,
          })
        }
        placeholder="—"
        className="bg-transparent display-italic text-[14px] text-[color:var(--color-on-paper)] outline-none tabular-nums"
      />
      <EditableText
        value={mic.notes}
        onChange={(v) => patch({ notes: v })}
        placeholder="Notes"
        className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]"
      />
      <button
        type="button"
        onClick={() => dispatch({ type: 'DELETE_MIC', id: mic.id })}
        aria-label="Delete mic"
        className="opacity-0 group-hover:opacity-100 text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-coral)] transition-all p-1 justify-self-end"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
