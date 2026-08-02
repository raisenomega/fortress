import { useEffect, useState } from 'react'
import { api } from '../../adapters/fortress-api'
import { FIELD_CLASS, LabeledField } from '../common/LabeledField'

interface BudgetFieldProps {
  readonly settingKey: string
  readonly label: string
  readonly fallback: number
}

/** Se guarda al salir del campo, no en cada tecla: escribir "10" pasa por "1". */
export function BudgetField({ settingKey, label, fallback }: BudgetFieldProps): React.JSX.Element {
  const [value, setValue] = useState('')

  useEffect(() => {
    void api()
      .settings.get(settingKey)
      .then((stored) => setValue(stored ?? String(fallback)))
  }, [settingKey])

  return (
    <LabeledField label={`${label} (USD)`}>
      <input
        inputMode="decimal"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => void api().settings.set(settingKey, value)}
        className={FIELD_CLASS}
      />
    </LabeledField>
  )
}
