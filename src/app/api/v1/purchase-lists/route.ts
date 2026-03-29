import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const lists = await prisma.purchaseList.findMany({
    where: { familyId: auth.user.familyId },
    orderBy: { sortOrder: 'asc' },
    include: {
      purchases: {
        orderBy: [{ isBought: 'asc' }, { sortOrder: 'asc' }],
      },
    },
  })

  return NextResponse.json({
    lists: lists.map((l) => ({
      id: l.id,
      name: l.name,
      sortOrder: l.sortOrder,
      items: l.purchases.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        isBought: p.isBought,
        sortOrder: p.sortOrder,
      })),
      itemCount: l.purchases.length,
      boughtCount: l.purchases.filter((p) => p.isBought).length,
    })),
  })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Назва обов\'язкова', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const count = await prisma.purchaseList.count({ where: { familyId: auth.user.familyId } })

  const list = await prisma.purchaseList.create({
    data: { familyId: auth.user.familyId, name: body.name.trim(), sortOrder: count },
  })

  return NextResponse.json(list, { status: 201 })
}
