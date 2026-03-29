import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/server/auth-middleware'

// PATCH /api/v1/tasks/reorder — batch update sort order and status
export async function PATCH(request: Request) {
  const auth = await requireAuth()
  if (auth.error) return auth.error

  const body = await request.json()
  const { updates } = body as { updates: { id: string; sortOrder: number; status?: string }[] }

  if (!updates?.length) {
    return NextResponse.json({ error: 'Updates обов\'язкові', code: 'VALIDATION_ERROR' }, { status: 400 })
  }

  await prisma.$transaction(
    updates.map((u) =>
      prisma.task.updateMany({
        where: { id: u.id, familyId: auth.user.familyId },
        data: { sortOrder: u.sortOrder, ...(u.status ? { status: u.status } : {}) },
      })
    )
  )

  return new NextResponse(null, { status: 204 })
}
