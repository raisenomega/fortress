import { CATEGORY_LABEL, CONNECTOR_CATEGORIES } from '@domain/connectors/connector'
import { useConnectorsStore } from '../../stores/connectors-store'
import { FIELD_CLASS, LabeledField } from '../common/LabeledField'

/** Campos del formulario, aparte solo para respetar el limite por funcion. */
export function ConnectorFormFields(): React.JSX.Element {
  const draft = useConnectorsStore((state) => state.draft)
  const patchDraft = useConnectorsStore((state) => state.patchDraft)

  return (
    <>
      <LabeledField label="Nombre">
        <input
          value={draft.name}
          placeholder="Mi servidor interno"
          onChange={(event) => patchDraft({ name: event.target.value })}
          className={FIELD_CLASS}
        />
      </LabeledField>

      <LabeledField label="URL del servidor MCP (solo https)">
        <input
          value={draft.url}
          placeholder="https://mcp.miempresa.com/mcp"
          onChange={(event) => patchDraft({ url: event.target.value })}
          className={`${FIELD_CLASS} font-mono`}
        />
      </LabeledField>

      <LabeledField label="Descripcion">
        <input
          value={draft.description}
          placeholder="Que hace este conector"
          onChange={(event) => patchDraft({ description: event.target.value })}
          className={FIELD_CLASS}
        />
      </LabeledField>

      <LabeledField label="Categoria">
        <select
          value={draft.category}
          onChange={(event) => patchDraft({ category: event.target.value as never })}
          className={FIELD_CLASS}
        >
          {CONNECTOR_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {CATEGORY_LABEL[option]}
            </option>
          ))}
        </select>
      </LabeledField>
    </>
  )
}
