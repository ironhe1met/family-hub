import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const idea = await prisma.idea.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!idea) {
    return NextResponse.json({ error: 'Ідею не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  const { type } = body // 'task' or 'project'

  if (type === 'task') {
    const task = await prisma.task.create({
      data: {
        familyId: auth.user.familyId,
        createdById: auth.user.userId,
        title: idea.title,
        description: idea.description,
      },
    })

    await prisma.idea.update({
      where: { id },
      data: { convertedToType: 'task', convertedToId: task.id },
    })

    return NextResponse.json({ convertedToType: 'task', convertedToId: task.id }, { status: 201 })
  }

  if (type === 'project') {
    const project = await prisma.project.create({
      data: {
        familyId: auth.user.familyId,
        createdById: auth.user.userId,
        title: idea.title,
        description: idea.description,
      },
    })

    await prisma.idea.update({
      where: { id },
      data: { convertedToType: 'project', convertedToId: project.id },
    })

    return NextResponse.json({ convertedToType: 'project', convertedToId: project.id }, { status: 201 })
  }

  return NextResponse.json({ error: 'Тип має бути task або project', code: 'VALIDATION_ERROR' }, { status: 400 })
}
