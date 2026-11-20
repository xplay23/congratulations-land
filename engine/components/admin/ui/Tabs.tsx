import type { ReactNode } from 'react'
import { C } from './tokens'
import './admin-ui.css'

export interface Tab<T extends string = string> {
  id: T
  label: string
}

interface TabsProps<T extends string = string> {
  tabs: Tab<T>[]
  active: T
  onChange: (id: T) => void
  children?: ReactNode  // optional — rendered below tabs
}

export function Tabs<T extends string = string>({ tabs, active, onChange, children }: TabsProps<T>) {
  return (
    <div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.cardBorder}`, marginBottom: '1.25rem' }}>
        {tabs.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`aui-tab${isActive ? ' aui-tab--active' : ''}`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {children}
    </div>
  )
}
