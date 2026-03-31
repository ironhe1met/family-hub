import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id, commentId } = await params

  const comment = await prisma.taskComment.findFirst({
    where: { id: commentId, taskId: id, userId: auth.user.userId },
  })
  if (!comment) {
    return NextResponse.json({ error: 'Коментар не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Текст обов\'язковий', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const updated = await prisma.taskComment.update({
    where: { id: commentId },
    data: { content: body.content.trim() },
    include: { user: { select: { id: true, firstName: true, avatarUrl: true } } },
  })

  return NextResponse.json(updated)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; commentId: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id, commentId } = await params

  const comment = await prisma.taskComment.findFirst({
    where: { id: commentId, taskId: id, userId: auth.user.userId },
  })
  if (!comment) {
    return NextResponse.json({ error: 'Коментар не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.taskComment.delete({ where: { id: commentId } })
  return new NextResponse(null, { status: 204 })
}
