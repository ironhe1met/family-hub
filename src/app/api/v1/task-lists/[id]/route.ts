import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const body = await request.json()
  const list = await prisma.taskList.updateMany({
    where: { id, familyId: auth.user.familyId },
    data: { name: body.name?.trim() },
  })

  if (list.count === 0) {
    return NextResponse.json({ error: 'Список не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  // Set tasks in this list to listId = null
  await prisma.task.updateMany({
    where: { listId: id, familyId: auth.user.familyId },
    data: { listId: null },
  })

  await prisma.taskList.deleteMany({ where: { id, familyId: auth.user.familyId } })

  return new NextResponse(null, { status: 204 })
}
