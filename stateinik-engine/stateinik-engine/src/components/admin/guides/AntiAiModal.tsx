'use client'

import { useMemo, useState } from 'react'
import { runAntiAiChecks, type AntiAiCheckInput, type AntiAiCheck } from '@/lib/guides/anti-ai-check'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  input: AntiAiCheckInput
  publishing: boolean
}

export function AntiAiModal({ open, onClose, onConfirm, input, publishing }: Props) {
  const result = useMemo(() => runAntiAiChecks(input), [input])
  const [manualConfirmed, setManualConfirmed] = useState<Record<string, boolean>>({})

  if (!open) return null

  const automatedFails = result.checks.filter(c => c.automated && c.status !== 'pass')
  const manualChecks = result.checks.filter(c => !c.automated)
  const allManualConfirmed = manualChecks.every(c => manualConfirmed[c.id])
  const canPublish = automatedFails.length === 0 && allManualConfirmed

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-bg-card border border-border rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-head text-[22px] text-text">Pre-publish gate</h2>
            <p className="text-text-dim text-[13px] mt-1">
              Anti-AI checklist per the policy {' '}
              <code className="text-[11px] bg-white/5 px-1.5 py-0.5 rounded">
                business/marketing/content-editorial-policy.md
              </code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-dim hover:text-text text-[20px] leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-2">
          {result.checks.map(c => (
            <CheckRow
              key={c.id}
              check={c}
              manual={!c.automated}
              confirmed={manualConfirmed[c.id]}
              onConfirm={() => setManualConfirmed(s => ({ ...s, [c.id]: !s[c.id] }))}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-border">
          <div className="text-[12px] text-text-dim">
            {automatedFails.length > 0
              ? `Automated checks not passed: ${automatedFails.length}`
              : allManualConfirmed
                ? 'All checks passed — ready to publish'
                : 'Confirm the manual items'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-text-sub hover:text-text px-4 py-2 rounded-xl text-[13px]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canPublish || publishing}
              className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:hover:bg-accent text-white px-5 py-2 rounded-xl text-[13px] font-medium"
            >
              {publishing ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckRow({
  check,
  manual,
  confirmed,
  onConfirm,
}: {
  check: AntiAiCheck
  manual: boolean
  confirmed?: boolean
  onConfirm: () => void
}) {
  const passed = manual ? !!confirmed : check.status === 'pass'
  const bg = passed
    ? 'bg-emerald-500/10 border-emerald-500/30'
    : check.status === 'fail'
      ? 'bg-red-500/10 border-red-500/30'
      : 'bg-white/5 border-border'

  return (
    <div className={`border rounded-xl px-3 py-2.5 ${bg}`}>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={passed}
          readOnly={!manual}
          onChange={manual ? onConfirm : undefined}
          className="mt-0.5 accent-emerald-500"
        />
        <div className="flex-1">
          <div className="text-[13px] text-text">{check.label}</div>
          {check.details && check.details.length > 0 && (
            <ul className="text-[11px] text-text-dim mt-1 list-disc pl-4 space-y-0.5">
              {check.details.slice(0, 6).map((d, i) => (
                <li key={i} className="font-mono">{d}</li>
              ))}
              {check.details.length > 6 && (
                <li className="text-text-dim/70">…{check.details.length - 6} more</li>
              )}
            </ul>
          )}
        </div>
      </label>
    </div>
  )
}
