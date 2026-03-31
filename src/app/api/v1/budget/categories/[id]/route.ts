import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params
  const body = await request.json()

  const category = await prisma.budgetCategory.updateMany({
    where: { id, familyId: auth.user.familyId },
    data: { name: body.name?.trim(), icon: body.icon },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth()
  if (auth.error) return auth.error
  const { id } = await params

  const txCount = await prisma.budgetTransaction.count({ where: { categoryId: id } })
  if (txCount > 0) {
    return NextResponse.json({ error: 'Неможливо видалити категорію з транзакціями', code: 'HAS_TRANSACTIONS' }, { status: 400 })
  }

  await prisma.budgetCategory.deleteMany({ where: { id, familyId: auth.user.familyId } })
  return new NextResponse(null, { status: 204 })
}
