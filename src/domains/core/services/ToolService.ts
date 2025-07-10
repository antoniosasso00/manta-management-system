import { prisma } from '@/lib/prisma';
import { Tool, PartTool, Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/lib/api-helpers';

export interface ToolQueryInput {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateToolInput {
  toolPartNumber: string;
  description?: string | null;
  base: number;
  height: number;
  weight?: number | null;
  material?: string | null;
  isActive?: boolean;
  associatedPartIds?: string[];
}

export class ToolService {
  /**
   * Trova tutti i tool con paginazione e filtri
   */
  static async findMany(input: ToolQueryInput = {}) {
    const {
      search,
      isActive,
      page = 1,
      limit = 10,
      sortBy = 'toolPartNumber',
      sortOrder = 'asc'
    } = input;

    const where: Prisma.ToolWhereInput = {};
    
    if (search) {
      where.OR = [
        { toolPartNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { material: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Build orderBy clause
    const orderBy: Prisma.ToolOrderByWithRelationInput[] = [];
    const allowedSortFields = ['toolPartNumber', 'description', 'material', 'createdAt'];
    
    if (allowedSortFields.includes(sortBy)) {
      orderBy.push({ [sortBy]: sortOrder });
    }
    
    // Add secondary sort by toolPartNumber for consistency
    if (sortBy !== 'toolPartNumber') {
      orderBy.push({ toolPartNumber: 'asc' });
    }

    const skip = (page - 1) * limit;

    // Execute queries in parallel
    const [tools, total] = await Promise.all([
      prisma.tool.findMany({
        where,
        include: {
          partTools: {
            include: {
              part: {
                select: {
                  id: true,
                  partNumber: true,
                  description: true
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.tool.count({ where })
    ]);

    // Transform data for consistent API response
    const transformedTools = tools.map(tool => ({
      id: tool.id,
      toolPartNumber: tool.toolPartNumber,
      description: tool.description,
      base: tool.base,
      height: tool.height,
      weight: tool.weight,
      material: tool.material,
      isActive: tool.isActive,
      associatedParts: tool.partTools.length,
      parts: tool.partTools.map(pt => pt.part),
      createdAt: tool.createdAt,
      updatedAt: tool.updatedAt
    }));

    return {
      tools: transformedTools,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Backward compatibility for existing code
   */
  static async findAll(filters?: {
    search?: string;
    isActive?: boolean;
  }) {
    const result = await this.findMany(filters);
    return result.tools;
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
   * Trova tool per Part Number
   */
  static async findByPartNumber(toolPartNumber: string) {
    return prisma.tool.findUnique({
      where: { toolPartNumber },
      include: {
        partTools: {
          include: {
            part: {
              select: {
                id: true,
                partNumber: true,
                description: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Verifica se Part Number esiste
   */
  static async checkPartNumberExists(toolPartNumber: string, excludeId?: string) {
    const existing = await prisma.tool.findUnique({
      where: { toolPartNumber },
      select: { id: true, toolPartNumber: true }
    });
    
    if (existing && excludeId && existing.id === excludeId) {
      return false; // È lo stesso tool che stiamo aggiornando
    }
    
    return !!existing;
  }

  /**
   * Crea nuovo tool con validazioni e associazioni
   */
  static async create(input: CreateToolInput) {
    const { associatedPartIds, ...toolData } = input;

    // Verifica unicità Part Number
    const exists = await this.checkPartNumberExists(toolData.toolPartNumber);
    if (exists) {
      throw new ConflictError('Part Number già esistente');
    }

    return await prisma.$transaction(async (tx) => {
      // Crea il tool
      const tool = await tx.tool.create({
        data: {
          ...toolData,
          description: toolData.description || undefined,
          weight: toolData.weight || undefined,
          material: toolData.material || undefined,
          isActive: toolData.isActive ?? true
        }
      });

      // Crea associazioni con i parts se fornite
      if (associatedPartIds && associatedPartIds.length > 0) {
        await tx.partTool.createMany({
          data: associatedPartIds.map(partId => ({
            toolId: tool.id,
            partId: partId
          }))
        });
      }

      // Ritorna il tool con le associazioni
      return await tx.tool.findUnique({
        where: { id: tool.id },
        include: {
          partTools: {
            include: {
              part: {
                select: {
                  id: true,
                  partNumber: true,
                  description: true
                }
              }
            }
          }
        }
      });
    });
  }

  /**
   * Aggiorna tool con validazioni
   */
  static async update(id: string, data: Partial<CreateToolInput>) {
    const { associatedPartIds, ...toolData } = data;

    // Verifica se il tool esiste
    const existingTool = await prisma.tool.findUnique({
      where: { id },
      select: { id: true, toolPartNumber: true }
    });

    if (!existingTool) {
      throw new NotFoundError('Tool non trovato');
    }

    // Verifica unicità Part Number se viene modificato
    if (toolData.toolPartNumber && toolData.toolPartNumber !== existingTool.toolPartNumber) {
      const exists = await this.checkPartNumberExists(toolData.toolPartNumber, id);
      if (exists) {
        throw new ConflictError('Part Number già esistente');
      }
    }

    return await prisma.$transaction(async (tx) => {
      // Aggiorna il tool
      const updatedTool = await tx.tool.update({
        where: { id },
        data: {
          ...toolData,
          description: toolData.description === null ? undefined : toolData.description,
          weight: toolData.weight === null ? undefined : toolData.weight,
          material: toolData.material === null ? undefined : toolData.material,
        }
      });

      // Gestisce le associazioni se fornite
      if (associatedPartIds !== undefined) {
        // Rimuove tutte le associazioni esistenti
        await tx.partTool.deleteMany({
          where: { toolId: id }
        });

        // Crea le nuove associazioni
        if (associatedPartIds.length > 0) {
          await tx.partTool.createMany({
            data: associatedPartIds.map(partId => ({
              toolId: id,
              partId: partId
            }))
          });
        }
      }

      // Ritorna il tool aggiornato con le associazioni
      return await tx.tool.findUnique({
        where: { id },
        include: {
          partTools: {
            include: {
              part: {
                select: {
                  id: true,
                  partNumber: true,
                  description: true
                }
              }
            }
          }
        }
      });
    });
  }

  /**
   * Elimina tool con controlli di sicurezza
   */
  static async delete(id: string) {
    // Verifica se il tool esiste
    const existingTool = await prisma.tool.findUnique({
      where: { id },
      select: { id: true, toolPartNumber: true }
    });

    if (!existingTool) {
      throw new NotFoundError('Tool non trovato');
    }

    // Verifica se ci sono associazioni
    const associationsCount = await prisma.partTool.count({
      where: { toolId: id }
    });
    
    if (associationsCount > 0) {
      throw new ConflictError(`Tool in uso da ${associationsCount} part numbers`);
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