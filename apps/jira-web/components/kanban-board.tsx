'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { TicketCard } from '@/components/ticket-card'
import { statusConfig } from '@/lib/mock-data'
import type { ApiTicket } from '@/types/project'

interface KanbanBoardProps {
  tickets: ApiTicket[]
  onTicketClick: (ticket: ApiTicket) => void
  onCreateTicket: (status: ApiTicket['status']) => void
  onStatusChange?: (ticketId: string, status: ApiTicket['status']) => void
}

const columns: ApiTicket['status'][] = ['todo', 'in_progress', 'in_review', 'done']

export function KanbanBoard({ tickets, onTicketClick, onCreateTicket, onStatusChange }: KanbanBoardProps) {
  const [draggedTicket, setDraggedTicket] = React.useState<ApiTicket | null>(null)
  const [dragOverColumn, setDragOverColumn] = React.useState<ApiTicket['status'] | null>(null)

  const handleDragStart = (e: React.DragEvent, ticket: ApiTicket) => {
    setDraggedTicket(ticket)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: ApiTicket['status']) => {
    e.preventDefault()
    setDragOverColumn(status)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, status: ApiTicket['status']) => {
    e.preventDefault()
    setDragOverColumn(null)
    if (draggedTicket && draggedTicket.status !== status) {
      onStatusChange?.(draggedTicket.id, status)
    }
    setDraggedTicket(null)
  }

  const handleDragEnd = () => {
    setDraggedTicket(null)
    setDragOverColumn(null)
  }

  return (
    <div className="flex gap-4 h-full overflow-x-auto pb-4">
      {columns.map((status) => {
        const columnTickets = tickets.filter(t => t.status === status)
        const config = statusConfig[status]
        const isDragOver = dragOverColumn === status

        return (
          <div
            key={status}
            className={cn(
              "flex flex-col w-[320px] min-w-[320px] rounded-xl transition-colors duration-200",
              isDragOver && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
            )}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 py-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", 
                  status === 'todo' && "bg-muted-foreground",
                  status === 'in_progress' && "bg-primary",
                  status === 'in_review' && "bg-warning",
                  status === 'done' && "bg-success"
                )} />
                <h3 className="text-sm font-semibold">{config.label}</h3>
                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-full">
                  {columnTickets.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onCreateTicket(status)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Column Content */}
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-2 pb-2">
                {columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket)}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TicketCard
                      ticket={ticket}
                      onClick={() => onTicketClick(ticket)}
                      isDragging={draggedTicket?.id === ticket.id}
                    />
                  </div>
                ))}

                {/* Empty State */}
                {columnTickets.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">No hay tickets</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => onCreateTicket(status)}
                    >
                      Crear ticket
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}
