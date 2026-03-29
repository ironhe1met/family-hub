import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const lists = await prisma.taskList.findMany({
    where: { familyId: auth.user.familyId },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { tasks: true } } },
  })

  return NextResponse.json({
    lists: lists.map((l) => ({ id: l.id, name: l.name, sortOrder: l.sortOrder, taskCount: l._count.tasks })),
  })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Назва обов\'язкова', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const count = await prisma.taskList.count({ where: { familyId: auth.user.familyId } })

  const list = await prisma.taskList.create({
    data: { familyId: auth.user.familyId, name: body.name.trim(), sortOrder: count },
  })

  return NextResponse.json(list, { status: 201 })
}
