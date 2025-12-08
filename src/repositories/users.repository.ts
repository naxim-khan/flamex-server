import { Prisma } from '../generated/prisma/client';
import prisma from '../prismaClient';

export class UsersRepository {
    static async createUser(data: Prisma.UserCreateInput) {
        return await prisma.user.create({ data });
    }

    static async findUserById(id: number) {
        return await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    static async findUserByUsername(username: string) {
        return await prisma.user.findFirst({
            where: {
                username: { equals: username, mode: 'insensitive' },
            },
        });
    }


    static async findUsers() {
        return await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async updateUser(id: number, data: Prisma.UserUpdateInput) {
        return await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                fullName: true,
                role: true,
                email: true,
                phone: true,
                status: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    static async deleteUser(id: number) {
        return await prisma.user.delete({
            where: { id },
        });
    }

    static async countUsers() {
        return await prisma.user.count();
    }

    static async countAdmins() {
        return await prisma.user.count({
            where: { role: 'admin', status: 'active' },
        });
    }
}