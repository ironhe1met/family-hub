import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const project = await prisma.project.findFirst({
    where: { id, familyId: auth.user.familyId },
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      items: { orderBy: { sortOrder: 'asc' } },
      tasks: {
        include: {
          assignedTo: { select: { id: true, firstName: true, avatarUrl: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      },
    },
  })

  if (!project) {
    return NextResponse.json({ error: 'Проєкт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const totalCost = project.items.reduce((sum, i) => sum + (i.estimatedCost ? Number(i.estimatedCost) : 0), 0)
  const completedCost = project.items.filter((i) => i.status === 'done').reduce((sum, i) => sum + (i.estimatedCost ? Number(i.estimatedCost) : 0), 0)

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdBy: project.createdBy,
      items: project.items.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        estimatedCost: i.estimatedCost ? Number(i.estimatedCost) : null,
        currency: i.currency,
        url: i.url,
        sortOrder: i.sortOrder,
        createdAt: i.createdAt,
      })),
      tasks: project.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedTo,
        dueDate: t.dueDate,
      })),
      totalCost,
      completedCost,
    },
  })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const existing = await prisma.project.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Проєкт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.description !== undefined) data.description = body.description
  if (body.status !== undefined) data.status = body.status

  const project = await prisma.project.update({
    where: { id },
    data,
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      items: { orderBy: { sortOrder: 'asc' } },
    },
  })

  return NextResponse.json({ project })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const existing = await prisma.project.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Проєкт не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.project.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
