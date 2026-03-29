import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

// POST /api/v1/tasks/:id/subtasks
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const task = await prisma.task.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!task) {
    return NextResponse.json({ error: 'Задачу не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Назва обов\'язкова', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const count = await prisma.subtask.count({ where: { taskId: id } })

  const subtask = await prisma.subtask.create({
    data: { taskId: id, title: body.title.trim(), sortOrder: count },
  })

  return NextResponse.json(subtask, { status: 201 })
}
