import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function GET() {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const assets = await prisma.asset.findMany({
    where: { familyId: auth.user.familyId },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json({
    assets: assets.map((a) => ({ id: a.id, name: a.name, amount: Number(a.amount), currency: a.currency, icon: a.icon })),
  })
}

export async function POST(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const body = await request.json()

  if (!body.name?.trim() || body.amount === undefined) {
    return NextResponse.json({ error: 'Назва та сума обов\'язкові', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const count = await prisma.asset.count({ where: { familyId: auth.user.familyId } })
  const asset = await prisma.asset.create({
    data: { familyId: auth.user.familyId, name: body.name.trim(), amount: body.amount, currency: body.currency || 'UAH', icon: body.icon || null, sortOrder: count },
  })

  return NextResponse.json({ asset: { id: asset.id, name: asset.name, amount: Number(asset.amount), currency: asset.currency, icon: asset.icon } }, { status: 201 })
}
