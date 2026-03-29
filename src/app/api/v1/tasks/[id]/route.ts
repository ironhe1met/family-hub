import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

// GET /api/v1/tasks/:id — get task with subtasks, comments
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const task = await prisma.task.findFirst({
    where: { id, familyId: auth.user.familyId },
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      assignedTo: { select: { id: true, firstName: true, avatarUrl: true } },
      tags: { select: { id: true, name: true, color: true } },
      subtasks: { orderBy: { sortOrder: 'asc' } },
      comments: {
        include: { user: { select: { id: true, firstName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'asc' },
      },
      reminders: true,
    },
  })

  if (!task) {
    return NextResponse.json({ error: 'Задачу не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json(task)
}

// PUT /api/v1/tasks/:id — update task
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  try {
    const body = await request.json()
    const { title, description, status, priority, dueDate, dueTime, listId, sprintId, assignedTo, tagIds } = body

    // Verify task belongs to family
    const existing = await prisma.task.findFirst({ where: { id, familyId: auth.user.familyId } })
    if (!existing) {
      return NextResponse.json({ error: 'Задачу не знайдено', code: 'NOT_FOUND' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description
    if (status !== undefined) data.status = status
    if (priority !== undefined) data.priority = priority
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
    if (dueTime !== undefined) data.dueTime = dueTime
    if (listId !== undefined) data.listId = listId || null
    if (sprintId !== undefined) data.sprintId = sprintId || null
    if (assignedTo !== undefined) data.assignedToId = assignedTo || null

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...data,
        tags: tagIds !== undefined ? { set: tagIds.map((tid: string) => ({ id: tid })) } : undefined,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
        assignedTo: { select: { id: true, firstName: true, avatarUrl: true } },
        tags: { select: { id: true, name: true, color: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Помилка сервера', code: 'SERVER_ERROR' }, { status: 500 })
  }
}

// DELETE /api/v1/tasks/:id
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const existing = await prisma.task.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Задачу не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.task.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
