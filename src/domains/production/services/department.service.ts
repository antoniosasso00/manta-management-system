import { prisma } from '@/lib/prisma'
import { Department } from '@prisma/client'

export class DepartmentService {
  static async findByCode(code: string): Promise<Department | null> {
    return prisma.department.findFirst({
      where: {
        code,
        isActive: true,
      },
    })
  }

  static async findById(id: string): Promise<Department | null> {
    return prisma.department.findUnique({
      where: { id },
    })
  }

  static async findMany(): Promise<Department[]> {
    return prisma.department.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
  }
}