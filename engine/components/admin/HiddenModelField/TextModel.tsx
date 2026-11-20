'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'
import ModelSelect from '../ModelSelect'

export default function TextModelField() {
  const { value } = useField<string>({ path: 'model' })
  return (
    <>
      <input type="hidden" value={value ?? ''} onChange={() => {}} />
      <ModelSelect
        modelFieldPath="model"
        providerFieldPath="provider"
        apiKeyFieldPath="apiKey"
        imageMode={false}
      />
    </>
  )
}
