import { findAgent } from '@domain/agent/agent-catalog'
import { planWorkflow } from '@domain/workflow/plan-workflow'
import { routeWorkflow } from '@domain/workflow/route-workflow'
import { estimateWorkflow } from '@domain/workflow/workflow-estimate'
import { useExcludedAgents } from '../../stores/agent-store'
import { Notice } from '../common/Notice'
import { PlanActions } from './PlanActions'
import { PlanHeader } from './PlanHeader'
import { PlanStepRow } from './PlanStepRow'

interface WorkflowPlanCardProps {
  readonly prompt: string
  readonly onApprove: () => void
  readonly onCancel: () => void
}

/**
 * En supervisado se ensena el plan antes de tocar nada, con lo que va a costar.
 * Siete agentes son varios minutos y dinero real: nadie deberia descubrirlo
 * despues.
 */
export function WorkflowPlanCard({
  prompt,
  onApprove,
  onCancel
}: WorkflowPlanCardProps): React.JSX.Element {
  const excluded = useExcludedAgents()
  const plan = planWorkflow(routeWorkflow(prompt), excluded)
  const estimate = estimateWorkflow(plan.active.length)

  return (
    <section className="mx-4 mb-3 rounded-lg border border-primary/40 bg-card p-4">
      <PlanHeader label={plan.workflow.label} estimate={estimate} />

      <ol className="mt-3 space-y-1">
        {plan.steps.map((planned, index) => (
          <PlanStepRow
            key={planned.step.agentId}
            order={index + 1}
            name={findAgent(planned.step.agentId)?.name ?? planned.step.agentId}
            task={planned.step.task}
            excluded={planned.excluded}
            gate={planned.step.gate === true}
          />
        ))}
      </ol>

      {plan.warnings.length > 0 ? (
        <div className="mt-3">
          <Notice tone="error">{plan.warnings.join('\n')}</Notice>
        </div>
      ) : null}

      <PlanActions onCancel={onCancel} onApprove={onApprove} empty={plan.active.length === 0} />
    </section>
  )
}
