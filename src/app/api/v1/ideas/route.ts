import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'
import type { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')
  const tagId = searchParams.get('tagId')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  const where: Prisma.IdeaWhereInput = { familyId: auth.user.familyId }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (tagId) where.tags = { some: { id: tagId } }

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      include: {
        createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
        tags: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.idea.count({ where }),
  ])

  return NextResponse.json({ ideas, total })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Назва обов\'язкова', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const idea = await prisma.idea.create({
    data: {
      familyId: auth.user.familyId,
      createdById: auth.user.userId,
      title: body.title.trim(),
      description: body.description || null,
      tags: body.tagIds?.length ? { connect: body.tagIds.map((id: string) => ({ id })) } : undefined,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, avatarUrl: true } },
      tags: { select: { id: true, name: true, color: true } },
    },
  })

  return NextResponse.json({ idea }, { status: 201 })
}
