import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

// PATCH /api/v1/tasks/:id/status — quick status change (checkbox, drag&drop)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json()
  const { status } = body

  if (!['new', 'in_progress', 'done', 'archived'].includes(status)) {
    return NextResponse.json({ error: 'Невалідний статус', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const existing = await prisma.task.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Задачу не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const task = await prisma.task.update({
    where: { id },
    data: { status },
    select: { id: true, status: true },
  })

  return NextResponse.json(task)
}
