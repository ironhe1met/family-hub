import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

// POST /api/v1/tasks/:id/comments
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const task = await prisma.task.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!task) {
    return NextResponse.json({ error: 'Задачу не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Текст коментаря обов\'язковий', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const comment = await prisma.taskComment.create({
    data: { taskId: id, userId: auth.user.userId, content: body.content.trim() },
    include: { user: { select: { id: true, firstName: true, avatarUrl: true } } },
  })

  return NextResponse.json(comment, { status: 201 })
}
