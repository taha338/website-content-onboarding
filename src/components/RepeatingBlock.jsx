/**
 * Repeating block: renders a list of rows, each with the same form
 * shape, with "Add another" + per-row remove buttons.
 *
 * Usage:
 *   <RepeatingBlock
 *     label="Hard Milestones"
 *     items={state.hardMilestones}
 *     onAdd={() => addRepeating('hardMilestones', { name: '', date: '' })}
 *     onRemove={(i) => removeRepeating('hardMilestones', i)}
 *     renderRow={(row, i) => (
 *       <>
 *         <TextField label="Name" value={row.name} onChange={(v) => updateRepeating('hardMilestones', i, { name: v })} />
 *         <TextField label="Date" type="date" value={row.date} onChange={(v) => updateRepeating('hardMilestones', i, { date: v })} />
 *       </>
 *     )}
 *   />
 */
import { Plus, X } from 'lucide-react';

export default function RepeatingBlock({ label, items, onAdd, onRemove, renderRow, addLabel = 'Add another', help, minRows = 1 }) {
  const list = items || [];
  return (
    <div>
      {label && <p className="op-label">{label}</p>}
      {help && <p className="op-help -mt-1 mb-3">{help}</p>}
      <div className="space-y-3">
        {list.map((row, i) => (
          <div
            key={i}
            className="relative p-4 rounded-lg border border-[var(--color-op-line)] bg-white"
          >
            <div className="space-y-3">
              {renderRow(row, i)}
            </div>
            {list.length > minRows && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-md text-[var(--color-op-muted)] hover:text-[var(--color-op-red)] hover:bg-red-50 transition-colors"
                aria-label="Remove"
              >
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-[var(--color-op-red)] hover:bg-red-50 transition-colors"
      >
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}
