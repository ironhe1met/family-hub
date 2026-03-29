import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

// PATCH /api/v1/tasks/:id/subtasks/:subtaskId
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; subtaskId: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id, subtaskId } = await params

  // Verify parent task belongs to family
  const task = await prisma.task.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!task) {
    return NextResponse.json({ error: 'Задачу не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.isDone !== undefined) data.isDone = body.isDone
  if (body.title !== undefined) data.title = body.title.trim()

  const subtask = await prisma.subtask.update({ where: { id: subtaskId }, data })
  return NextResponse.json(subtask)
}

// DELETE /api/v1/tasks/:id/subtasks/:subtaskId
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; subtaskId: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id, subtaskId } = await params

  const task = await prisma.task.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!task) {
    return NextResponse.json({ error: 'Задачу не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.subtask.delete({ where: { id: subtaskId } })
  return new NextResponse(null, { status: 204 })
}
