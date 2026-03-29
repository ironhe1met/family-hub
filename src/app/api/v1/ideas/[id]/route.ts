import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const existing = await prisma.idea.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Ідею не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title.trim()
  if (body.description !== undefined) data.description = body.description

  const idea = await prisma.idea.update({
    where: { id },
    data: {
      ...data,
      tags: body.tagIds !== undefined ? { set: body.tagIds.map((tid: string) => ({ id: tid })) } : undefined,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      tags: { select: { id: true, name: true, color: true } },
    },
  })

  return NextResponse.json({ idea })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const existing = await prisma.idea.findFirst({ where: { id, familyId: auth.user.familyId } })
  if (!existing) {
    return NextResponse.json({ error: 'Ідею не знайдено', code: 'NOT_FOUND' }, { status: 404 })
  }

  await prisma.idea.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
