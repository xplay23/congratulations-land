import { C } from './tokens'

export interface StepperStep {
  label: string
}

interface StepperProps {
  steps: StepperStep[]
  current: number  // 0-based active step index
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    // overflow:hidden ensures labels that are wider than the circle don't push layout
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '2rem', overflow: 'hidden' }}>
      {steps.map((step, i) => {
        const done   = i < current
        const active = i === current
        const last   = i === steps.length - 1

        const circleColor  = done ? C.green : active ? C.blue : 'transparent'
        const circleBorder = done ? C.green : active ? C.blue : 'var(--theme-elevation-300, rgba(128,128,128,0.4))'
        const circleText   = done ? '✓' : String(i + 1)

        return (
          // Each step takes equal share; last one doesn't grow so line doesn't overshoot
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              flex: '1 1 0',
              minWidth: 0,
              position: 'relative',
            }}
          >
            {/* Circle row: connector left + circle + connector right */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* Left connector (hidden for first step) */}
              <div style={{
                flex: 1,
                height: '2px',
                background: i === 0 ? 'transparent' : done || active ? C.green : 'var(--theme-elevation-200, rgba(128,128,128,0.25))',
                transition: 'background 0.3s',
              }} />

              {/* Circle */}
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: `1px solid ${circleBorder}`,
                background: done || active ? circleColor : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: done || active ? '#fff' : 'var(--theme-elevation-400, rgba(128,128,128,0.6))',
                flexShrink: 0,
                transition: 'all 0.2s',
                zIndex: 1,
              }}>
                {circleText}
              </div>

              {/* Right connector (hidden for last step) */}
              <div style={{
                flex: 1,
                height: '2px',
                background: last ? 'transparent' : done ? C.green : 'var(--theme-elevation-200, rgba(128,128,128,0.25))',
                transition: 'background 0.3s',
              }} />
            </div>

            {/* Label */}
            <div
              className="adm-caption"
              style={{
                marginTop: '0.375rem',
                fontWeight: active ? 700 : 500,
                color: active ? C.text : C.muted,
                opacity: done || active ? 1 : 0.35,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                transition: 'opacity 0.2s',
              }}
            >
              {step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}
