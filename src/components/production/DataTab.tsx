import { useMemo } from 'react';
import { Cloud, HardDrive, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import type { DataBackupDay } from '../../types';
import { EditableText } from '../primitives/EditableText';
import { resolveShootDay, shootDaysSorted } from './productionSelectors';

interface Props {
  previewDateIso?: string;
}

export function DataTab({ previewDateIso }: Props) {
  const { state, dispatch } = useApp();
  const resolved = resolveShootDay(state, previewDateIso);
  const allDays = shootDaysSorted(state);

  if (!resolved) {
    return (
      <p className="prose-body italic text-[14px] text-[color:var(--color-on-paper-muted)]">
        No shoot days configured.
      </p>
    );
  }

  const todayDate = resolved.day.date;
  const todayData = state.dataBackupDays.find((d) => d.date === todayDate);

  /* Storage burn projection — sum tbCaptured across all logged days. */
  const totalTb = useMemo(
    () => state.dataBackupDays.reduce((s, d) => s + d.tbCaptured, 0),
    [state.dataBackupDays]
  );

  function ensureToday(): DataBackupDay {
    if (todayData) return todayData;
    const fresh: DataBackupDay = {
      id: `data-${todayDate}`,
      date: todayDate,
      drive1OK: false,
      drive2OK: false,
      cloudOK: false,
      tbCaptured: 0,
      hashLog: '',
    };
    dispatch({ type: 'UPSERT_DATA_BACKUP', day: fresh });
    return fresh;
  }

  function patchToday(p: Partial<DataBackupDay>) {
    const t = ensureToday();
    dispatch({ type: 'UPDATE_DATA_BACKUP', id: t.id, patch: p });
  }

  /* Per-day backup status across all shoot days. */
  const dayStatuses = useMemo(() => {
    return allDays.map((d) => {
      const data = state.dataBackupDays.find((x) => x.date === d.date);
      const all = data && data.drive1OK && data.drive2OK && data.cloudOK;
      const partial =
        data && (data.drive1OK || data.drive2OK || data.cloudOK) && !all;
      return { day: d, data, all, partial };
    });
  }, [allDays, state.dataBackupDays]);

  return (
    <div className="space-y-7 max-w-[1200px]">
      {/* Hero — today's three-checkbox state */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
        <header className="flex items-baseline justify-between mb-5 pb-3 border-b-[0.5px] border-[color:var(--color-border-brass)]/40">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1">
              Day {resolved.index} · {fmtIsoDate(todayDate)}
            </div>
            <h2 className="display-italic text-[24px] text-[color:var(--color-on-paper)]">
              Today's footage backup
            </h2>
          </div>
          <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
            until all three are green, today is at risk
          </span>
        </header>

        <div className="grid grid-cols-3 gap-5">
          <BackupCheckbox
            label="Drive 1 (primary)"
            sub="local field drive"
            checked={todayData?.drive1OK ?? false}
            onToggle={(v) => patchToday({ drive1OK: v })}
          />
          <BackupCheckbox
            label="Drive 2 (mirror)"
            sub="redundancy on the boat"
            checked={todayData?.drive2OK ?? false}
            onToggle={(v) => patchToday({ drive2OK: v })}
          />
          <BackupCheckbox
            label="Cloud / shore mirror"
            sub="when in port"
            icon={Cloud}
            checked={todayData?.cloudOK ?? false}
            onToggle={(v) => patchToday({ cloudOK: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-7 mt-6 pt-5 border-t-[0.5px] border-[color:var(--color-border-paper)]">
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
              TB captured today
            </div>
            <input
              type="number"
              step="0.1"
              min={0}
              value={todayData?.tbCaptured ?? 0}
              onChange={(e) => patchToday({ tbCaptured: parseFloat(e.target.value) || 0 })}
              className="bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] focus:border-[color:var(--color-brass)] outline-none display-italic text-[24px] text-[color:var(--color-on-paper)] tabular-nums w-32 py-1"
            />
            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] ml-2">
              TB
            </span>
          </div>
          <div>
            <div className="label-caps text-[color:var(--color-brass-deep)] mb-1.5">
              Drive holding today
            </div>
            <EditableText
              value={todayData?.driveManifest ?? ''}
              onChange={(v) => patchToday({ driveManifest: v || undefined })}
              placeholder="e.g. SSD-04 + SSD-04-mirror"
              className="display-italic text-[16px] text-[color:var(--color-on-paper)] block"
            />
          </div>
        </div>
      </section>

      {/* Hash log */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
        <header className="flex items-baseline justify-between mb-3">
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Hash verification log
          </h3>
          <span className="prose-body italic text-[11px] text-[color:var(--color-on-paper-faint)]">
            md5 / sha256 mismatches surface here
          </span>
        </header>
        <EditableText
          multiline
          rows={4}
          value={todayData?.hashLog ?? ''}
          onChange={(v) => patchToday({ hashLog: v })}
          placeholder="Day 12 verification: drive 1 → drive 2 ✓ all 380GB clean. Cloud upload pending shore."
          className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-relaxed block w-full"
        />
      </section>

      {/* Per-day backup matrix */}
      <section>
        <div className="flex items-baseline gap-2 mb-3">
          <HardDrive size={13} className="text-[color:var(--color-brass-deep)]" />
          <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)]">
            Backup state across shoot ({totalTb.toFixed(1)} TB total)
          </h3>
          <div className="flex-1 h-px bg-[color:var(--color-border-brass)]/40" />
        </div>
        <ul className="grid grid-cols-10 gap-1">
          {dayStatuses.map(({ day, data, all, partial }, idx) => {
            const isToday = day.date === todayDate;
            return (
              <li key={day.id} title={`Day ${idx + 1} · ${day.date}${data ? ` · ${data.tbCaptured} TB` : ''}`}>
                <div
                  className={`aspect-square rounded-[2px] border-[0.5px] flex items-center justify-center ${
                    all
                      ? 'bg-[color:var(--color-success)]/35 border-[color:var(--color-success)]'
                      : partial
                      ? 'bg-[color:var(--color-warn)]/30 border-[color:var(--color-warn)]'
                      : data
                      ? 'bg-[color:var(--color-coral-deep)]/15 border-[color:var(--color-coral)]/40'
                      : 'bg-[color:var(--color-paper-deep)]/20 border-[color:var(--color-border-paper)]'
                  } ${isToday ? 'ring-1 ring-[color:var(--color-brass)]' : ''}`}
                >
                  <span className="display-italic text-[11px] text-[color:var(--color-on-paper)] tabular-nums">
                    {idx + 1}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex items-baseline gap-5 mt-3 prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)]">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-[2px] bg-[color:var(--color-success)]/35 border-[0.5px] border-[color:var(--color-success)]" />
            all three green
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-[2px] bg-[color:var(--color-warn)]/30 border-[0.5px] border-[color:var(--color-warn)]" />
            partial
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-[2px] bg-[color:var(--color-coral-deep)]/15 border-[0.5px] border-[color:var(--color-coral)]/40" />
            logged but no checkboxes
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-[2px] bg-[color:var(--color-paper-deep)]/20 border-[0.5px] border-[color:var(--color-border-paper)]" />
            not yet logged
          </span>
        </div>
      </section>

      {/* Drive manifest list */}
      <DriveManifestList />

      {/* Metadata template */}
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-3">
          Filename template
        </h3>
        <code className="block font-sans text-[13px] tracking-wide text-[color:var(--color-on-paper)] bg-[color:var(--color-paper-card)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[2px] px-4 py-3">
          YYYY-MM-DD_DAY##_EP#_CAM_SC##_T##.mov
        </code>
        <p className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] mt-2 leading-relaxed">
          Example for today: <code className="font-sans not-italic">2026-10-12_DAY12_EP3_A_SC03-1_T01.mov</code> — Day 12, Episode 3 (Kamen), Camera A, Scene 3.1 (stone walls), Take 1.
        </p>
      </section>
    </div>
  );
}

/* ---------- subcomponents ---------- */

function BackupCheckbox({
  label,
  sub,
  checked,
  onToggle,
  icon: Icon,
}: {
  label: string;
  sub?: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  icon?: typeof HardDrive;
}) {
  const I = Icon ?? HardDrive;
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={`text-left bg-[color:var(--color-paper)] border-[0.5px] rounded-[3px] px-4 py-4 transition-colors ${
        checked
          ? 'border-[color:var(--color-success)] bg-[color:var(--color-success)]/10'
          : 'border-[color:var(--color-border-paper-strong)] hover:border-[color:var(--color-brass)]'
      }`}
    >
      <div className="flex items-baseline gap-2 mb-2">
        <I size={13} className={checked ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-on-paper-muted)]'} />
        <div className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
          {label}
        </div>
      </div>
      {sub && (
        <div className="prose-body italic text-[11px] text-[color:var(--color-on-paper-muted)] mb-3">
          {sub}
        </div>
      )}
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-4 h-4 rounded-[2px] border flex items-center justify-center ${
            checked
              ? 'bg-[color:var(--color-success)] border-[color:var(--color-success)]'
              : 'border-[color:var(--color-border-paper-strong)]'
          }`}
        >
          {checked && (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6.5L5 9.5L10 3.5"
                stroke="var(--color-paper)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span
          className={`label-caps tracking-[0.14em] text-[10px] ${
            checked
              ? 'text-[color:var(--color-success)]'
              : 'text-[color:var(--color-on-paper-faint)]'
          }`}
        >
          {checked ? 'verified' : 'pending'}
        </span>
      </div>
    </button>
  );
}

function DriveManifestList() {
  const { state } = useApp();
  /* Collect unique drives from dataBackupDays.driveManifest entries. */
  const drives = useMemo(() => {
    const m = new Map<string, { drive: string; days: { date: string; tb: number }[] }>();
    for (const d of state.dataBackupDays) {
      if (!d.driveManifest) continue;
      const existing = m.get(d.driveManifest) ?? { drive: d.driveManifest, days: [] };
      existing.days.push({ date: d.date, tb: d.tbCaptured });
      m.set(d.driveManifest, existing);
    }
    return Array.from(m.values()).sort((a, b) => a.drive.localeCompare(b.drive));
  }, [state.dataBackupDays]);

  if (drives.length === 0) {
    return (
      <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-dashed border-[color:var(--color-border-paper-strong)] rounded-[3px] px-7 py-6">
        <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-2">
          Drive manifest
        </h3>
        <p className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)]">
          As days log a "drive holding today" value above, those drives are aggregated here
          with the days they hold and the total TB on each. Today's value: type a drive
          name like <code className="font-sans not-italic">SSD-04</code> and it'll appear.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-[color:var(--color-paper-light)] border-[0.5px] border-[color:var(--color-border-paper)] rounded-[3px] px-7 py-6">
      <h3 className="display-italic text-[18px] text-[color:var(--color-on-paper)] mb-4">
        Drive manifest
      </h3>
      <ul className="space-y-3">
        {drives.map((d) => {
          const totalTb = d.days.reduce((s, x) => s + x.tb, 0);
          return (
            <li key={d.drive} className="flex items-baseline justify-between border-b-[0.5px] border-[color:var(--color-border-paper)] pb-2 last:border-b-0">
              <span className="display-italic text-[15px] text-[color:var(--color-on-paper)]">
                {d.drive}
              </span>
              <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)] tabular-nums">
                {d.days.length} day{d.days.length === 1 ? '' : 's'} · {totalTb.toFixed(1)} TB
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function fmtIsoDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/* unused-import suppressors */
export const _icons = { Plus, Trash2 };
