import { TicketPage } from '@/components/ticket-page'

export default async function TicketDetailPage({ params }: {
  params: Promise<{ projectId: string; ticketId: string }>
}) {
  const { projectId, ticketId } = await params
  return <TicketPage key={`${projectId}:${ticketId}`} projectId={projectId} ticketId={ticketId} />
}
