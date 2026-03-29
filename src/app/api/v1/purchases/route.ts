import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body.name?.trim() || !body.listId) {
    return NextResponse.json({ error: 'Назва та список обов\'язкові', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const count = await prisma.purchase.count({ where: { listId: body.listId } })

  const purchase = await prisma.purchase.create({
    data: {
      familyId: auth.user.familyId,
      listId: body.listId,
      name: body.name.trim(),
      quantity: body.quantity || null,
      sortOrder: count,
    },
  })

  return NextResponse.json(purchase, { status: 201 })
}
