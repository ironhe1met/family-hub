import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'
import type { Prisma } from '@prisma/client'

// GET /api/v1/tasks — list tasks
export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const listId = searchParams.get('listId')
  const sprintId = searchParams.get('sprintId')
  const assignedTo = searchParams.get('assignedTo')
  const priority = searchParams.get('priority')
  const tagId = searchParams.get('tagId')
  const search = searchParams.get('search')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  const where: Prisma.TaskWhereInput = {
    familyId: auth.user.familyId,
  }

  const projectId = searchParams.get('projectId')

  if (status) where.status = status
  if (listId) where.listId = listId
  if (sprintId) where.sprintId = sprintId
  if (projectId) where.projectId = projectId
  if (assignedTo) where.assignedToId = assignedTo
  if (priority) where.priority = priority
  if (tagId) where.tags = { some: { id: tagId } }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
        assignedTo: { select: { id: true, firstName: true, avatarUrl: true } },
        tags: { select: { id: true, name: true, color: true } },
        _count: { select: { subtasks: true, comments: true } },
        subtasks: { select: { isDone: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: limit,
      skip: offset,
    }),
    prisma.task.count({ where }),
  ])

  const result = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    listId: task.listId,
    sprintId: task.sprintId,
    projectId: task.projectId,
    createdBy: task.createdBy,
    assignedTo: task.assignedTo,
    tags: task.tags,
    subtaskCount: task._count.subtasks,
    subtaskDoneCount: task.subtasks.filter((s) => s.isDone).length,
    commentCount: task._count.comments,
    isRecurring: task.isRecurring,
    sortOrder: task.sortOrder,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }))

  return NextResponse.json({ tasks: result, total })
}

// POST /api/v1/tasks — create task
export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  try {
    const body = await request.json()
    const { title, description, status, priority, dueDate, dueTime, listId, sprintId, projectId, assignedTo, tagIds, isRecurring, recurrenceRule } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Назва обов\'язкова', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const task = await prisma.task.create({
      data: {
        familyId: auth.user.familyId,
        createdById: auth.user.userId,
        title: title.trim(),
        description: description || null,
        status: status || 'new',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        dueTime: dueTime || null,
        listId: listId || null,
        sprintId: sprintId || null,
        projectId: projectId || null,
        assignedToId: assignedTo || null,
        isRecurring: isRecurring || false,
        recurrenceRule: recurrenceRule || undefined,
        tags: tagIds?.length ? { connect: tagIds.map((id: string) => ({ id })) } : undefined,
      },
      include: {
        createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
        assignedTo: { select: { id: true, firstName: true, avatarUrl: true } },
        tags: { select: { id: true, name: true, color: true } },
        _count: { select: { subtasks: true, comments: true } },
      },
    })

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Помилка сервера', code: 'SERVER_ERROR' }, { status: 500 })
  }
}
