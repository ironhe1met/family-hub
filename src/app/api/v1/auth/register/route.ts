import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, setAuthCookies } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, firstName, familyName } = body

    // Validation
    if (!email || !password || !firstName || !familyName) {
      return NextResponse.json(
        { error: 'Всі поля обов\'язкові', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль має бути не менше 8 символів', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Цей email вже зареєстрований', code: 'EMAIL_EXISTS' },
        { status: 409 }
      )
    }

    // Create family + user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const family = await tx.family.create({
        data: { name: familyName },
      })

      const user = await tx.user.create({
        data: {
          familyId: family.id,
          email,
          passwordHash: await hashPassword(password),
          firstName,
        },
      })

      // Create default budget categories
      const defaultExpenseCategories = [
        { name: 'Їжа', icon: 'utensils', type: 'expense' },
        { name: 'Транспорт', icon: 'car', type: 'expense' },
        { name: 'Житло/Комуналка', icon: 'home', type: 'expense' },
        { name: 'Здоров\'я', icon: 'heart-pulse', type: 'expense' },
        { name: 'Одяг', icon: 'shirt', type: 'expense' },
        { name: 'Розваги', icon: 'gamepad-2', type: 'expense' },
        { name: 'Підписки', icon: 'credit-card', type: 'expense' },
        { name: 'Діти', icon: 'baby', type: 'expense' },
        { name: 'Інше', icon: 'circle-ellipsis', type: 'expense' },
      ]
      const defaultIncomeCategories = [
        { name: 'Зарплата', icon: 'banknote', type: 'income' },
        { name: 'Фріланс', icon: 'laptop', type: 'income' },
        { name: 'Інше', icon: 'circle-ellipsis', type: 'income' },
      ]

      await tx.budgetCategory.createMany({
        data: [...defaultExpenseCategories, ...defaultIncomeCategories].map((cat, i) => ({
          familyId: family.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          isDefault: true,
          sortOrder: i,
        })),
      })

      // Create default task list
      await tx.taskList.create({
        data: { familyId: family.id, name: 'Загальні', sortOrder: 0 },
      })

      return { user, family }
    })

    // Set auth cookies
    await setAuthCookies({
      userId: result.user.id,
      familyId: result.family.id,
    })

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          familyId: result.family.id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Помилка сервера', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}
