import { prisma } from '@/lib/prisma';
import { User, UserRole } from '@prisma/client';

export class UserService {
  static async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  static async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  static async updateSettings(userId: string, settings: Record<string, any>): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { settings },
    });
  }

  static async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    return await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  static async create(data: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    departmentId?: string;
  }): Promise<User> {
    return await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role || UserRole.OPERATOR,
        departmentId: data.departmentId,
        settings: { ui: { theme: 'auto' } }, // Default settings
      },
    });
  }
}