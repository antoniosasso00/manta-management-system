import { prisma } from '@/lib/prisma';
import { Tool, PartTool, Prisma } from '@prisma/client';

export class ToolService {
  /**
   * Trova tutti i tool
   */
  static async findAll(filters?: {
    search?: string;
    isActive?: boolean;
  }) {
    const where: Prisma.ToolWhereInput = {};
    
    if (filters?.search) {
      where.OR = [
        { toolPartNumber: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } }
      ];
    }
    
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return prisma.tool.findMany({
      where,
      include: {
        _count: {
          select: { partTools: true }
        }
      },
      orderBy: { toolPartNumber: 'asc' }
    });
  }

  /**
   * Trova tool per ID
   */
  static async findById(id: string) {
    return prisma.tool.findUnique({
      where: { id },
      include: {
        partTools: {
          include: {
            part: true
          }
        }
      }
    });
  }

  /**
   * Crea nuovo tool
   */
  static async create(data: {
    toolPartNumber: string;
    description?: string;
    base: number;
    height: number;
    weight?: number;
    material?: string;
    valveCount?: number;
    isActive?: boolean;
  }) {
    return prisma.tool.create({
      data: {
        ...data,
        valveCount: data.valveCount || 0,
        isActive: data.isActive ?? true
      }
    });
  }

  /**
   * Aggiorna tool
   */
  static async update(id: string, data: Partial<Tool>) {
    return prisma.tool.update({
      where: { id },
      data
    });
  }

  /**
   * Elimina tool
   */
  static async delete(id: string) {
    // Verifica se ci sono associazioni
    const count = await prisma.partTool.count({
      where: { toolId: id }
    });
    
    if (count > 0) {
      throw new Error(`Tool in uso da ${count} part numbers`);
    }
    
    return prisma.tool.delete({
      where: { id }
    });
  }

  /**
   * Gestione associazioni Part-Tool
   */
  static async getPartAssociations(toolId: string) {
    return prisma.partTool.findMany({
      where: { toolId },
      include: {
        part: true
      }
    });
  }

  static async addPartAssociation(toolId: string, partId: string) {
    return prisma.partTool.create({
      data: { toolId, partId }
    });
  }

  static async removePartAssociation(toolId: string, partId: string) {
    return prisma.partTool.delete({
      where: {
        partId_toolId: {
          partId,
          toolId
        }
      }
    });
  }

  /**
   * Import bulk da CSV
   */
  static async bulkImport(data: Array<{
    toolPartNumber: string;
    description?: string;
    base: number;
    height: number;
    weight?: number;
    material?: string;
    valveCount?: number;
  }>) {
    const results = {
      success: 0,
      errors: [] as string[]
    };

    for (const item of data) {
      try {
        await this.create(item);
        results.success++;
      } catch (error) {
        results.errors.push(`Errore per ${item.toolPartNumber}: ${error}`);
      }
    }

    return results;
  }
}