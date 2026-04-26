import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { useApp } from '../../state/AppContext';
import { EditableText } from '../primitives/EditableText';
import { EditableNumber } from '../primitives/EditableNumber';
import {
  AddButton,
  DeleteButton,
  EmptyState,
  EntityCard,
  Field,
  SectionHeader,
  newId,
} from './shared';
import type { Catch, CatchMethod, Meal } from '../../types';
import { CatchOfTheDay } from './CatchOfTheDay';
import { FishingCalendar } from './FishingCalendar';

const METHOD_CYCLE: CatchMethod[] = ['line', 'spear', 'net', 'trap', 'other'];

export function SubjectTab({ episodeId }: { episodeId: string }) {
  const { state, dispatch } = useApp();
  const catches = state.catches.filter((c) => c.episodeId === episodeId);
  const meals = state.meals.filter((m) => m.episodeId === episodeId);

  function addCatch() {
    const entry: Catch = {
      id: newId('catch'),
      episodeId,
      fishCro: '',
      fishLat: '',
      fishEng: '',
      method: 'line',
      anchorageId: undefined,
      timeOfDay: '',
      weather: '',
      notes: '',
    };
    dispatch({ type: 'ADD_CATCH', entry });
  }

  function addMeal() {
    const entry: Meal = {
      id: newId('meal'),
      episodeId,
      dish: '',
      recipe: '',
      notes: '',
    };
    dispatch({ type: 'ADD_MEAL', entry });
  }

  return (
    <div className="space-y-12">
      {/* Adriatic fishing calendar — month-by-month species, water temp, season notes */}
      <FishingCalendar episodeMonth={10} />

      <section>
        <SectionHeader
          title="Catch"
          count={catches.length}
          action={<AddButton label="Log a catch" onClick={addCatch} />}
        />
        {catches.length === 0 && (
          <EmptyState
            message="No fish logged yet for this episode."
            hint="Croatian + Latin + English name, method, anchorage, time, weather. Hektorović verse parallel optional."
          />
        )}
        <div className="grid grid-cols-2 gap-4">
          {catches.map((c) => (
            <CatchCard key={c.id} entry={c} catches={catches} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Meals"
          count={meals.length}
          action={<AddButton label="Log a meal" onClick={addMeal} />}
        />
        {meals.length === 0 && (
          <EmptyState
            message="No meals logged yet for this episode."
            hint="Rene's territory — dish, wine pairing, fish link, recipe."
          />
        )}
        <div className="grid grid-cols-2 gap-4">
          {meals.map((m) => (
            <MealCard key={m.id} entry={m} catches={catches} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CatchCard({ entry, catches }: { entry: Catch; catches: Catch[] }) {
  const { dispatch } = useApp();
  const [shareOpen, setShareOpen] = useState(false);
  function patch(p: Partial<Catch>) {
    dispatch({ type: 'UPDATE_CATCH', id: entry.id, patch: p });
  }
  function cycleMethod() {
    const i = METHOD_CYCLE.indexOf(entry.method);
    patch({ method: METHOD_CYCLE[(i + 1) % METHOD_CYCLE.length] });
  }
  void catches;
  return (
    <EntityCard>
      <div className="flex items-baseline gap-3">
        <div className="flex-1 min-w-0">
          <EditableText
            value={entry.fishCro}
            onChange={(v) => patch({ fishCro: v })}
            placeholder="Croatian name"
            className="display-italic text-[20px] text-[color:var(--color-on-paper)]"
          />
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              <EditableText
                value={entry.fishLat}
                onChange={(v) => patch({ fishLat: v })}
                placeholder="Latin"
              />
            </span>
            <span className="text-[color:var(--color-on-paper-faint)]">·</span>
            <span className="prose-body italic text-[12px] text-[color:var(--color-on-paper-muted)]">
              <EditableText
                value={entry.fishEng}
                onChange={(v) => patch({ fishEng: v })}
                placeholder="English"
              />
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={cycleMethod}
          className="label-caps text-[color:var(--color-brass-deep)] border-[0.5px] border-[color:var(--color-border-brass)] rounded-full px-2.5 py-[2px] hover:border-[color:var(--color-brass)] transition-colors"
          title="cycle method"
        >
          {entry.method}
        </button>
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="label-caps text-[color:var(--color-on-paper-faint)] hover:text-[color:var(--color-brass-deep)] transition-colors"
          title="catch-of-the-day social card"
        >
          <Share2 size={11} />
        </button>
        <DeleteButton onClick={() => dispatch({ type: 'DELETE_CATCH', id: entry.id })} />
      </div>

      {shareOpen && (
        <CatchOfTheDay catch_={entry} onClose={() => setShareOpen(false)} />
      )}

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Field label="Time">
          <EditableText
            value={entry.timeOfDay}
            onChange={(v) => patch({ timeOfDay: v })}
            placeholder="e.g. 06:30 sunrise"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Weather">
          <EditableText
            value={entry.weather}
            onChange={(v) => patch({ weather: v })}
            placeholder="bura, jugo, calm"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)]"
          />
        </Field>
        <Field label="Weight">
          <EditableNumber
            value={entry.weightKg ?? 0}
            onChange={(v) => patch({ weightKg: v })}
            suffix=" kg"
            size="sm"
            align="left"
          />
        </Field>
      </div>

      <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <Field label="Hektorović parallel">
          <EditableText
            value={entry.hektorovicVerseRef ?? ''}
            onChange={(v) => patch({ hektorovicVerseRef: v })}
            multiline
            rows={2}
            placeholder="Did the 1568 voyagers fish for this here too?"
            className="prose-body italic text-[13px] text-[color:var(--color-on-paper)] leading-[1.55]"
          />
        </Field>
      </div>
    </EntityCard>
  );
}

function MealCard({ entry, catches }: { entry: Meal; catches: Catch[] }) {
  const { dispatch } = useApp();
  function patch(p: Partial<Meal>) {
    dispatch({ type: 'UPDATE_MEAL', id: entry.id, patch: p });
  }
  return (
    <EntityCard>
      <div className="flex items-baseline gap-3">
        <div className="flex-1 min-w-0">
          <EditableText
            value={entry.dish}
            onChange={(v) => patch({ dish: v })}
            placeholder="Dish name"
            className="display-italic text-[20px] text-[color:var(--color-on-paper)]"
          />
          <div className="prose-body italic text-[13px] text-[color:var(--color-on-paper-muted)] mt-0.5">
            <EditableText
              value={[entry.wineProducer, entry.wineRegion].filter(Boolean).join(' · ')}
              onChange={(v) => {
                const [producer, region] = v.split(/\s*·\s*/);
                patch({ wineProducer: producer ?? '', wineRegion: region ?? '' });
              }}
              placeholder="Wine producer · region"
            />
          </div>
        </div>
        <DeleteButton onClick={() => dispatch({ type: 'DELETE_MEAL', id: entry.id })} />
      </div>

      <div className="mt-4">
        <Field label="Linked catch">
          <select
            value={entry.fishLinkCatchId ?? ''}
            onChange={(e) => patch({ fishLinkCatchId: e.target.value || undefined })}
            className="w-full bg-transparent border-b-[0.5px] border-[color:var(--color-border-paper-strong)] py-1 prose-body italic text-[13px] text-[color:var(--color-on-paper)] outline-none focus:border-[color:var(--color-brass)]"
          >
            <option value="">— none —</option>
            {catches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fishCro || c.fishEng || c.fishLat || 'unnamed'}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-3 pt-3 border-t-[0.5px] border-[color:var(--color-border-paper)]">
        <Field label="Recipe / preparation">
          <EditableText
            value={entry.recipe}
            onChange={(v) => patch({ recipe: v })}
            multiline
            rows={3}
            placeholder="How was it cooked?"
            className="prose-body text-[13px] text-[color:var(--color-on-paper)] leading-[1.55]"
          />
        </Field>
      </div>
    </EntityCard>
  );
}
