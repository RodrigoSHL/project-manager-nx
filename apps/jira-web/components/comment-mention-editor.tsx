'use client'

import * as React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import {
  getCommentMentionQuery,
  insertCommentMention,
  updateCommentMentions,
  type CommentMention,
} from '@/lib/comment-mentions'
import type { ApiTeamMember } from '@/types/project'

interface CommentMentionEditorProps {
  value: string
  mentions: CommentMention[]
  onChange: (value: string, mentions: CommentMention[]) => void
  onSubmit: () => void
  onCancel?: () => void
  teamMembers: ApiTeamMember[]
  placeholder: string
  disabled?: boolean
  autoFocus?: boolean
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function CommentMentionEditor({
  value,
  mentions,
  onChange,
  onSubmit,
  onCancel,
  teamMembers,
  placeholder,
  disabled = false,
  autoFocus = false,
}: CommentMentionEditorProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const editorRef = React.useRef<HTMLDivElement>(null)
  const [query, setQuery] = React.useState<{ start: number; query: string; caret: number } | null>(null)
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  React.useEffect(() => {
    if (!value) setQuery(null)
  }, [value])

  const suggestions = React.useMemo(() => {
    if (!query) return []
    const search = normalize(query.query)
    return teamMembers
      .filter(member => member.isActive !== false && (
        normalize(member.name).includes(search) || normalize(member.email).includes(search)
      ))
      .slice(0, 6)
  }, [query, teamMembers])

  React.useEffect(() => {
    if (!query) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!editorRef.current?.contains(event.target as Node)) setQuery(null)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [query])

  const updateQuery = (text: string, caret: number, ranges: CommentMention[]) => {
    const nextQuery = getCommentMentionQuery(text, caret, ranges)
    setQuery(nextQuery ? { ...nextQuery, caret } : null)
    setSelectedIndex(0)
  }

  const chooseMember = (member: ApiTeamMember) => {
    if (!query) return
    const result = insertCommentMention(value, mentions, query.start, query.caret, member)
    onChange(result.text, result.mentions)
    setQuery(null)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      textareaRef.current?.setSelectionRange(result.caret, result.caret)
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      onSubmit()
      return
    }
    if (event.key === 'Escape') {
      if (query || onCancel) event.preventDefault()
      if (query) setQuery(null)
      else onCancel?.()
      return
    }
    if (!query || suggestions.length === 0) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedIndex(index => (index + (event.key === 'ArrowDown' ? 1 : -1) + suggestions.length) % suggestions.length)
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault()
      chooseMember(suggestions[selectedIndex] ?? suggestions[0])
    }
  }

  return (
    <div ref={editorRef} className="relative">
      {query && (
        <div role="listbox" aria-label="Miembros del equipo" className="absolute bottom-full left-0 right-0 z-50 mb-2 max-h-56 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
          {suggestions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No hay miembros que coincidan.</p>
          ) : suggestions.map((member, index) => (
            <button
              key={member.id}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent aria-selected:bg-accent"
              onMouseDown={event => event.preventDefault()}
              onClick={() => chooseMember(member)}
            >
              <Avatar className="h-7 w-7 shrink-0">
                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                <AvatarFallback className="text-[10px]">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate font-medium">{member.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        placeholder={placeholder}
        value={value}
        onChange={event => {
          const nextText = event.target.value
          const nextMentions = updateCommentMentions(value, nextText, mentions)
          onChange(nextText, nextMentions)
          updateQuery(nextText, event.target.selectionStart, nextMentions)
        }}
        onClick={event => updateQuery(value, event.currentTarget.selectionStart, mentions)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        maxLength={5000}
        className="min-h-20 resize-none"
        autoFocus={autoFocus}
        aria-label={placeholder}
      />
    </div>
  )
}
