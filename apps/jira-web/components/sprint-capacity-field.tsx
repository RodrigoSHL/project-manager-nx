import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSprintCapacity } from '@/lib/sprint-capacity'

interface SprintCapacityFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  startDate: string
  endDate: string
  disabled: boolean
}

export function SprintCapacityField({ id, value, onChange, startDate, endDate, disabled }: SprintCapacityFieldProps) {
  const weeklyCapacity = Number(value)
  const isValid = Number.isInteger(weeklyCapacity) && weeklyCapacity > 0 && weeklyCapacity <= 2147483647
  const { weekdays, points } = getSprintCapacity(startDate, endDate, isValid ? weeklyCapacity : null)

  return (
    <div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
      <Label htmlFor={id}>Capacidad semanal del equipo (pts)</Label>
      <Input
        id={id}
        type="number"
        min={1}
        max={2147483647}
        step={1}
        placeholder="Ej. 21"
        value={value}
        onChange={event => onChange(event.target.value)}
        disabled={disabled}
        aria-describedby={id + '-help'}
      />
      <p id={id + '-help'} className="text-xs text-muted-foreground">
        Meta del equipo por 5 días hábiles. El cálculo cuenta de lunes a viernes, incluidas las fechas de inicio y fin.
      </p>
      <p aria-live="polite" className="text-sm font-medium">
        {points !== null ? `${points} pts de capacidad · ${weekdays} días hábiles`
          : isValid ? 'Indica las fechas para calcular la capacidad.' : 'Capacidad sin configurar'}
      </p>
    </div>
  )
}
