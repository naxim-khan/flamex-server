// repositories/business-info.repository.ts
import { Prisma } from '../generated/prisma/client';
import prisma from '../prismaClient';

export class BusinessInfoRepository {
  static async findAll() {
    return await prisma.businessInfo.findMany({
      orderBy: { key: 'asc' },
    });
  }

  static async findByKey(key: string) {
    return await prisma.businessInfo.findUnique({
      where: { key },
    });
  }

  static async create(data: Prisma.BusinessInfoCreateInput) {
    return await prisma.businessInfo.create({ data });
  }

  static async update(key: string, data: Prisma.BusinessInfoUpdateInput) {
    return await prisma.businessInfo.update({
      where: { key },
      data,
    });
  }

  static async delete(key: string) {
    return await prisma.businessInfo.delete({
      where: { key },
    });
  }

  static async upsert(key: string, value: string) {
    return await prisma.businessInfo.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}