import { useMemo } from 'react';
import { AlertTriangle, ChevronRight, Eye } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { Shot } from '../../types';

/* Continuity warnings — auto-flag mismatches across takes/shots that would
   create headaches for the editor and colorist:
   - Same scene, ISO mismatch across cams (exposure jump)
   - Same scene, WB mismatch (color jump)
   - Same scene, lens swap unflagged
   - Shutter angle non-cinematic (not 180° equivalent)
   - Missing critical metadata (lens / fps / ISO / WB)
   - Frame rate within scene differs without intent

   Lives at top of Continuity tab. Click → could deep-link to the shot. */

type Severity = 'critical' | 'warn' | 'info';

interface Warning {
  id: string;
  severity: Severity;
  category: string;
  message: string;
  shotIds: string[];
  sceneId?: string;
}

const SEVERITY_TONE: Record<Severity, { bg: string; fg: string; icon: typeof AlertTriangle }> = {
  critical: { bg: 'rgba(194,106,74,0.12)', fg: 'rgb(140,60,40)', icon: AlertTriangle },
  warn:     { bg: 'rgba(217,169,62,0.12)', fg: 'rgb(140,100,30)', icon: AlertTriangle },
  info:     { bg: 'rgba(91,163,204,0.12)', fg: 'rgb(60,120,160)', icon: Eye },
};

function isStandardShutter(angle: number | undefined): boolean {
  if (angle === undefined) return true; // not flagged
  /* Common cinematic shutter angles */
  return [90, 180, 360, 45, 270, 210, 172.8].includes(angle);
}

function detectWarnings(shots: Shot[]): Warning[] {
  const warnings: Warning[] = [];
  /* Group shots by scene */
  const byScene = new Map<string, Shot[]>();
  const looseShots: Shot[] = [];
  for (const s of shots) {
    if (s.sceneId) {
      const arr = byScene.get(s.sceneId) ?? [];
      arr.push(s);
      byScene.set(s.sceneId, arr);
    } else {
      looseShots.push(s);
    }
  }

  for (const [sceneId, sceneShots] of byScene.entries()) {
    /* 1. ISO mismatch across same scene */
    const isos = new Set(sceneShots.map((s) => s.isoValue).filter(Boolean));
    if (isos.size > 1) {
      const ids = sceneShots.filter((s) => s.isoValue !== undefined).map((s) => s.id);
      warnings.push({
        id: `iso-${sceneId}`,
        severity: 'critical',
        category: 'Exposure jump',
        message: `Scene has ${isos.size} different ISO values across shots — risk of grading mismatch.`,
        shotIds: ids,
        sceneId,
      });
    }

    /* 2. WB mismatch >500K within same scene */
    const wbs = sceneShots.map((s) => s.wbKelvin).filter((v): v is number => !!v);
    if (wbs.length > 1) {
      const min = Math.min(...wbs);
      const max = Math.max(...wbs);
      if (max - min > 500) {
        warnings.push({
          id: `wb-${sceneId}`,
          severity: 'critical',
          category: 'Color jump',
          message: `WB drift of ${max - min}K across the scene (${min}K → ${max}K). Lock WB or sync grade in post.`,
          shotIds: sceneShots.filter((s) => s.wbKelvin !== undefined).map((s) => s.id),
          sceneId,
        });
      }
    }

    /* 3. Lens swap on same camera within scene */
    for (const slot of ['A', 'B', 'drone', 'underwater', 'crash'] as const) {
      const slotShots = sceneShots.filter((s) => s.cameraSlot === slot);
      const lenses = new Set(slotShots.map((s) => s.lensId).filter(Boolean));
      if (lenses.size > 1) {
        warnings.push({
          id: `lens-${sceneId}-${slot}`,
          severity: 'warn',
          category: 'Lens swap',
          message: `Cam ${slot} used ${lenses.size} different lenses in this scene — flag intentional or align.`,
          shotIds: slotShots.map((s) => s.id),
          sceneId,
        });
      }
    }

    /* 4. Frame-rate mismatch unintended */
    const rates = new Set(sceneShots.map((s) => s.frameRate).filter(Boolean));
    if (rates.size > 1) {
      warnings.push({
        id: `fps-${sceneId}`,
        severity: 'info',
        category: 'Frame rate mix',
        message: `Multiple frame rates in same scene (${Array.from(rates).join(' · ')}). Check if intentional (slow-mo passages).`,
        shotIds: sceneShots.filter((s) => s.frameRate).map((s) => s.id),
        sceneId,
      });
    }
  }

  /* 5. Non-standard shutter — across all shots */
  const nonStandard = shots.filter((s) => !isStandardShutter(s.shutterAngle));
  if (nonStandard.length > 0) {
    warnings.push({
      id: 'shutter-nonstandard',
      severity: 'warn',
      category: 'Shutter angle',
      message: `${nonStandard.length} shots use non-standard shutter angles — verify intent (any value other than 90/180/270/360 needs reason).`,
      shotIds: nonStandard.map((s) => s.id),
    });
  }

  /* 6. Missing critical metadata */
  const missing = {
    lens: shots.filter((s) => !s.lensId).length,
    iso: shots.filter((s) => s.isoValue === undefined).length,
    wb: shots.filter((s) => s.wbKelvin === undefined).length,
    fps: shots.filter((s) => !s.frameRate).length,
  };
  for (const [key, count] of Object.entries(missing)) {
    if (count > 0) {
      warnings.push({
        id: `missing-${key}`,
        severity: count > shots.length / 2 ? 'critical' : 'info',
        category: 'Missing metadata',
        message: `${count} shot${count === 1 ? '' : 's'} missing ${key.toUpperCase()}. Editor will ask.`,
        shotIds: [],
      });
    }
  }

  /* 7. Loose shots — unscened */
  if (looseShots.length > 0) {
    warnings.push({
      id: 'loose-shots',
      severity: 'info',
      category: 'Unsceneed',
      message: `${looseShots.length} shot${looseShots.length === 1 ? '' : 's'} not assigned to any scene. Group for cleaner editorial.`,
      shotIds: looseShots.map((s) => s.id),
    });
  }

  return warnings;
}

export function ContinuityWarnings() {
  const { state } = useApp();

  const warnings = useMemo(() => detectWarnings(state.shots), [state.shots]);
  const counts = useMemo(() => {
    const c = { critical: 0, warn: 0, info: 0 };
    for (const w of warnings) c[w.severity]++;
    return c;
  }, [warnings]);

  if (warnings.length === 0) {
    return (
      <section className="bg-[color:var(--color-success)]/10 border-l-2 border-[color:var(--color-success)] px-5 py-4">
        <div className="flex items-baseline gap-2">
          <Eye size={14} className="text-[color:var(--color-success)]" />
          <h4 className="display-italic text-[16px] text-[color:var(--color-on-paper)]">
            Continuity scan clean
          </h4>
        </div>
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-1 leading-relaxed">
          No mismatches detected across {state.shots.length} shot
          {state.shots.length === 1 ? '' : 's'}. Editor handoff looks healthy.
        </p>
      </section>
    );
  }

  return (
    <section>
      <header className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <AlertTriangle size={14} className="text-[color:var(--color-coral-deep)]" />
          <h4 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Continuity warnings
          </h4>
        </div>
        <div className="flex items-baseline gap-3 prose-body italic text-[11px]">
          {counts.critical > 0 && (
            <span className="text-[color:var(--color-coral-deep)]">
              {counts.critical} critical
            </span>
          )}
          {counts.warn > 0 && (
            <span className="text-[color:var(--color-warn)]">
              {counts.warn} warn
            </span>
          )}
          {counts.info > 0 && (
            <span className="text-[color:var(--color-on-paper-muted)]">
              {counts.info} info
            </span>
          )}
        </div>
      </header>

      <ul className="space-y-2">
        {warnings.map((w) => (
          <WarningCard key={w.id} warning={w} />
        ))}
      </ul>

      <p className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)] mt-3 leading-relaxed">
        Auto-detected from shot metadata. Critical warnings affect grade or edit;
        warnings flag intent-needed; info is hygiene. Each warning lists the affected
        shots — fix the metadata or note the deliberate choice in the shot.
      </p>
    </section>
  );
}

function WarningCard({ warning: w }: { warning: Warning }) {
  const tone = SEVERITY_TONE[w.severity];
  const Icon = tone.icon;

  return (
    <li
      className="rounded-[2px] px-4 py-3 border-l-2"
      style={{
        background: tone.bg,
        borderLeftColor: tone.fg,
      }}
    >
      <div className="flex items-baseline gap-2">
        <Icon size={11} style={{ color: tone.fg }} />
        <span
          className="label-caps tracking-[0.10em] text-[10px]"
          style={{ color: tone.fg }}
        >
          {w.severity} · {w.category}
        </span>
        {w.shotIds.length > 0 && (
          <span className="ml-auto prose-body italic text-[10px] text-[color:var(--color-on-paper-muted)] tabular-nums flex items-baseline gap-1">
            {w.shotIds.length} shot{w.shotIds.length === 1 ? '' : 's'}
            <ChevronRight size={9} />
          </span>
        )}
      </div>
      <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper)] mt-1 leading-relaxed">
        {w.message}
      </p>
    </li>
  );
}
