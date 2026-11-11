import { TicketPage } from '@/components/ticket-page'

export default async function TicketDetailPage({ params, searchParams }: {
  params: Promise<{ projectId: string; ticketId: string }>
  searchParams: Promise<{ commentId?: string | string[] }>
}) {
  const { projectId, ticketId } = await params
  const { commentId } = await searchParams
  return <TicketPage key={`${projectId}:${ticketId}`} projectId={projectId} ticketId={ticketId}
    commentId={typeof commentId === 'string' ? commentId : undefined} />
}
