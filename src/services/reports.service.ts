// services/reports.service.ts
import { Prisma } from '../generated/prisma/client';
import prisma from '../prismaClient';
import { DateRange } from '../types';
import {
    parseDateRange,
    getTodayRange,
    getYesterdayRange,
    getThisWeekRange,
    getThisMonthRange,
} from '../utils/date.utils';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';

export class ReportsService {
    static async getDailySalesReport(date?: Date) {
        const reportDate = date || new Date();
        const start = startOfDay(reportDate);
        const end = endOfDay(reportDate);

        const [orders, orderItems] = await Promise.all([
            prisma.order.findMany({
                where: {
                    createdAt: { gte: start, lte: end },
                    orderStatus: { not: 'cancelled' },
                },
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.orderItem.findMany({
                where: {
                    order: {
                        createdAt: { gte: start, lte: end },
                        orderStatus: { not: 'cancelled' },
                    },
                },
                include: {
                    menuItem: true,
                },
            }),
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalOrders = orders.length;
        const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

        // Group by order type
        const dineInOrders = orders.filter(o => o.orderType === 'dine_in');
        const deliveryOrders = orders.filter(o => o.orderType === 'delivery');

        // Group by payment method
        const cashOrders = orders.filter(o => o.paymentMethod === 'cash');
        const bankOrders = orders.filter(o => o.paymentMethod === 'bank_transfer');

        return {
            date: format(reportDate, 'yyyy-MM-dd'),
            summary: {
                totalRevenue,
                totalOrders,
                totalItems,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
            },
            breakdown: {
                byOrderType: {
                    dineIn: {
                        count: dineInOrders.length,
                        revenue: dineInOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
                    },
                    delivery: {
                        count: deliveryOrders.length,
                        revenue: deliveryOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
                    },
                },
                byPaymentMethod: {
                    cash: {
                        count: cashOrders.length,
                        revenue: cashOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
                    },
                    bank: {
                        count: bankOrders.length,
                        revenue: bankOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
                    },
                },
            },
            orders,
        };
    }

    static async getMonthlySalesReport(year?: number, month?: number) {
        const today = new Date();
        const reportYear = year || today.getFullYear();
        const reportMonth = month || today.getMonth() + 1;

        const start = new Date(reportYear, reportMonth - 1, 1);
        const end = new Date(reportYear, reportMonth, 0, 23, 59, 59, 999);

        const [orders, dailyStats] = await Promise.all([
            prisma.order.findMany({
                where: {
                    createdAt: { gte: start, lte: end },
                    orderStatus: { not: 'cancelled' },
                },
                include: {
                    orderItems: {
                        include: {
                            menuItem: true,
                        },
                    },
                },
            }),
            this.getDailyStatsForMonth(start, end),
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalOrders = orders.length;

        // Top selling items
        const itemSales = new Map();
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const key = item.menuItemId;
                if (!itemSales.has(key)) {
                    itemSales.set(key, {
                        id: item.menuItemId,
                        name: item.menuItem.name,
                        quantity: 0,
                        revenue: 0,
                    });
                }
                const record = itemSales.get(key);
                record.quantity += item.quantity;
                record.revenue += Number(item.price) * item.quantity;
            });
        });

        const topItems = Array.from(itemSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        return {
            period: `${reportYear}-${reportMonth.toString().padStart(2, '0')}`,
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                dailyAverage: totalRevenue / dailyStats.length,
            },
            dailyStats,
            topItems,
        };
    }

    static async getYearlySalesReport(year?: number) {
        const today = new Date();
        const reportYear = year || today.getFullYear();

        const start = new Date(reportYear, 0, 1);
        const end = new Date(reportYear, 11, 31, 23, 59, 59, 999);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: start, lte: end },
                orderStatus: { not: 'cancelled' },
            },
        });

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalOrders = orders.length;

        // Monthly breakdown
        const monthlyStats = Array.from({ length: 12 }, (_, i) => {
            const monthStart = new Date(reportYear, i, 1);
            const monthEnd = new Date(reportYear, i + 1, 0, 23, 59, 59, 999);
            const monthOrders = orders.filter(o =>
                o.createdAt >= monthStart && o.createdAt <= monthEnd
            );

            return {
                month: i + 1,
                monthName: format(monthStart, 'MMM'),
                revenue: monthOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
                orders: monthOrders.length,
            };
        });

        return {
            year: reportYear,
            summary: {
                totalRevenue,
                totalOrders,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                monthlyAverage: totalRevenue / 12,
            },
            monthlyStats,
        };
    }

    static async getOrderSummaryReport(start?: string, end?: string) {
        const range = parseDateRange(start, end);

        const [orders, orderItems, customers] = await Promise.all([
            prisma.order.findMany({
                where: {
                    createdAt: { gte: range.startDate, lte: range.endDate },
                    orderStatus: { not: 'cancelled' },
                },
                include: {
                    customer: true,
                    rider: true,
                    orderItems: {
                        include: {
                            menuItem: true,
                        },
                    },
                },
            }),
            prisma.orderItem.findMany({
                where: {
                    order: {
                        createdAt: { gte: range.startDate, lte: range.endDate },
                        orderStatus: { not: 'cancelled' },
                    },
                },
            }),
            prisma.customer.findMany({
                where: {
                    orders: {
                        some: {
                            createdAt: { gte: range.startDate, lte: range.endDate },
                            orderStatus: { not: 'cancelled' },
                        },
                    },
                },
            }),
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalOrders = orders.length;
        const totalCustomers = customers.length;
        const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);

        // Status breakdown
        const statusBreakdown = {
            pending: orders.filter(o => o.orderStatus === 'pending').length,
            preparing: orders.filter(o => o.orderStatus === 'preparing').length,
            ready: orders.filter(o => o.orderStatus === 'ready').length,
            completed: orders.filter(o => o.orderStatus === 'completed').length,
            cancelled: orders.filter(o => o.orderStatus === 'cancelled').length,
        };

        // Peak hours analysis
        const hourCounts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
        orders.forEach(order => {
            const hour = order.createdAt.getHours();
            hourCounts[hour].count++;
        });

        return {
            summary: {
                totalRevenue,
                totalOrders,
                totalCustomers,
                totalItems,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
                averageItemsPerOrder: totalOrders > 0 ? totalItems / totalOrders : 0,
            },
            breakdown: {
                byStatus: statusBreakdown,
                byOrderType: {
                    dineIn: orders.filter(o => o.orderType === 'dine_in').length,
                    delivery: orders.filter(o => o.orderType === 'delivery').length,
                },
                byPaymentMethod: {
                    cash: orders.filter(o => o.paymentMethod === 'cash').length,
                    bankTransfer: orders.filter(o => o.paymentMethod === 'bank_transfer').length,
                },
            },
            peakHours: hourCounts.filter(h => h.count > 0),
        };
    }

    static async getOrderTimelineReport(start?: string, end?: string, interval: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily') {
        const range = parseDateRange(start, end);

        const orders = await prisma.order.findMany({
            where: {
                createdAt: { gte: range.startDate, lte: range.endDate },
                orderStatus: { not: 'cancelled' },
            },
            orderBy: { createdAt: 'asc' },
        });

        const timeline: Array<{
            time?: string;
            date?: string;
            dayOfWeek?: string;
            month?: string;
            monthName?: string;
            orders: number;
            revenue: number;
        }> = [];

        if (interval === 'hourly') {
            const hours = eachDayOfInterval({ start: range.startDate, end: range.endDate }).flatMap(date =>
                Array.from({ length: 24 }, (_, i) => new Date(date.getFullYear(), date.getMonth(), date.getDate(), i))
            );

            hours.forEach(hour => {
                const hourEnd = new Date(hour.getTime() + 60 * 60 * 1000);
                const hourOrders = orders.filter(o => o.createdAt >= hour && o.createdAt < hourEnd);

                timeline.push({
                    time: format(hour, 'yyyy-MM-dd HH:00'),
                    orders: hourOrders.length,
                    revenue: hourOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
                });
            });
        } else if (interval === 'daily') {
            const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });

            days.forEach(day => {
                const dayStart = startOfDay(day);
                const dayEnd = endOfDay(day);
                const dayOrders = orders.filter(o => o.createdAt >= dayStart && o.createdAt <= dayEnd);

                timeline.push({
                    date: format(day, 'yyyy-MM-dd'),
                    dayOfWeek: format(day, 'EEEE'),
                    orders: dayOrders.length,
                    revenue: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
                });
            });
        } else if (interval === 'monthly') {
            const months = eachMonthOfInterval({ start: range.startDate, end: range.endDate });

            months.forEach(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const monthOrders = orders.filter(o => o.createdAt >= monthStart && o.createdAt <= monthEnd);

                timeline.push({
                    month: format(month, 'yyyy-MM'),
                    monthName: format(month, 'MMMM yyyy'),
                    orders: monthOrders.length,
                    revenue: monthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
                });
            });
        }

        return {
            interval,
            timeline,
            summary: {
                totalOrders: timeline.reduce((sum, t) => sum + t.orders, 0),
                totalRevenue: timeline.reduce((sum, t) => sum + t.revenue, 0),
                averageOrdersPerInterval: timeline.length > 0 ? timeline.reduce((sum, t) => sum + t.orders, 0) / timeline.length : 0,
                averageRevenuePerInterval: timeline.length > 0 ? timeline.reduce((sum, t) => sum + t.revenue, 0) / timeline.length : 0,
            },
        };
    }

    static async getTopSellingItemsReport(start?: string, end?: string, limit: number = 10) {
        const range = parseDateRange(start, end);

        const orderItems = await prisma.orderItem.findMany({
            where: {
                order: {
                    createdAt: { gte: range.startDate, lte: range.endDate },
                    orderStatus: { not: 'cancelled' },
                },
            },
            include: {
                menuItem: true,
            },
        });

        const itemMap = new Map();

        orderItems.forEach(item => {
            const key = item.menuItemId;
            if (!itemMap.has(key)) {
                itemMap.set(key, {
                    id: item.menuItemId,
                    name: item.menuItem.name,
                    category: item.menuItem.categoryId,
                    quantity: 0,
                    revenue: 0,
                    orders: new Set(),
                });
            }

            const record = itemMap.get(key);
            record.quantity += item.quantity;
            record.revenue += Number(item.price) * item.quantity;
            record.orders.add(item.orderId);
        });

        const items = Array.from(itemMap.values()).map(item => ({
            ...item,
            orderCount: item.orders.size,
            averageQuantityPerOrder: item.orders.size > 0 ? item.quantity / item.orders.size : 0,
        }));

        // Sort by revenue descending
        items.sort((a, b) => b.revenue - a.revenue);

        return {
            period: { startDate: range.startDate, endDate: range.endDate },
            items: items.slice(0, limit),
            summary: {
                totalItemsSold: items.reduce((sum, item) => sum + item.quantity, 0),
                totalRevenue: items.reduce((sum, item) => sum + item.revenue, 0),
                uniqueItems: items.length,
            },
        };
    }

    static async getLowStockItemsReport() {
        // Note: This is a placeholder since we don't have stock tracking
        // In a real implementation, you would check items below minimum stock level
        const lowStockItems = await prisma.menuItem.findMany({
            where: {
                available: false,
            },
            include: {
                category: true,
            },
        });

        return {
            count: lowStockItems.length,
            items: lowStockItems,
            summary: `Found ${lowStockItems.length} unavailable items`,
        };
    }

    static async getTopCustomersReport(start?: string, end?: string, limit: number = 10) {
        const range = parseDateRange(start, end);

        const customers = await prisma.customer.findMany({
            where: {
                orders: {
                    some: {
                        createdAt: { gte: range.startDate, lte: range.endDate },
                        orderStatus: { not: 'cancelled' },
                    },
                },
            },
            include: {
                orders: {
                    where: {
                        createdAt: { gte: range.startDate, lte: range.endDate },
                        orderStatus: { not: 'cancelled' },
                    },
                    include: {
                        orderItems: true,
                    },
                },
            },
        });

        // Calculate metrics for each customer
        const customersWithMetrics = customers.map(customer => {
            const orders = customer.orders;
            const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
            const totalOrders = orders.length;
            const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
            const totalItems = orders.reduce((sum, order) =>
                sum + order.orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                totalSpent,
                totalOrders,
                averageOrderValue,
                totalItems,
                lastOrderDate: orders.length > 0
                    ? orders[orders.length - 1].createdAt
                    : null,
            };
        });

        // Sort by total spent descending
        customersWithMetrics.sort((a, b) => b.totalSpent - a.totalSpent);

        return {
            period: { startDate: range.startDate, endDate: range.endDate },
            customers: customersWithMetrics.slice(0, limit),
            summary: {
                totalCustomers: customers.length,
                totalRevenue: customersWithMetrics.reduce((sum, c) => sum + c.totalSpent, 0),
                averageCustomerValue: customers.length > 0
                    ? customersWithMetrics.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length
                    : 0,
            },
        };
    }

    static async getCustomerLoyaltyReport(start?: string, end?: string) {
        const range = parseDateRange(start, end);

        const customers = await prisma.customer.findMany({
            include: {
                orders: {
                    where: {
                        createdAt: { gte: range.startDate, lte: range.endDate },
                        orderStatus: { not: 'cancelled' },
                    },
                },
            },
        });

        const loyaltySegments = {
            new: { count: 0, customers: [] as any[], totalSpent: 0 },
            regular: { count: 0, customers: [] as any[], totalSpent: 0 },
            loyal: { count: 0, customers: [] as any[], totalSpent: 0 },
            vip: { count: 0, customers: [] as any[], totalSpent: 0 },
        };

        customers.forEach(customer => {
            const orders = customer.orders;
            const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
            const orderCount = orders.length;

            const customerData = {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                orderCount,
                totalSpent,
                averageOrderValue: orderCount > 0 ? totalSpent / orderCount : 0,
            };

            if (orderCount === 1) {
                loyaltySegments.new.count++;
                loyaltySegments.new.customers.push(customerData);
                loyaltySegments.new.totalSpent += totalSpent;
            } else if (orderCount >= 2 && orderCount <= 5) {
                loyaltySegments.regular.count++;
                loyaltySegments.regular.customers.push(customerData);
                loyaltySegments.regular.totalSpent += totalSpent;
            } else if (orderCount >= 6 && orderCount <= 10) {
                loyaltySegments.loyal.count++;
                loyaltySegments.loyal.customers.push(customerData);
                loyaltySegments.loyal.totalSpent += totalSpent;
            } else if (orderCount > 10) {
                loyaltySegments.vip.count++;
                loyaltySegments.vip.customers.push(customerData);
                loyaltySegments.vip.totalSpent += totalSpent;
            }
        });

        return {
            period: { startDate: range.startDate, endDate: range.endDate },
            segments: loyaltySegments,
            summary: {
                totalCustomers: customers.length,
                totalRevenue: Object.values(loyaltySegments).reduce((sum, segment) => sum + segment.totalSpent, 0),
                averageOrdersPerCustomer: customers.length > 0
                    ? customers.reduce((sum, c) => sum + c.orders.length, 0) / customers.length
                    : 0,
            },
        };
    }

    static async getRiderPerformanceReport(start?: string, end?: string) {
        const range = parseDateRange(start, end);

        const riders = await prisma.rider.findMany({
            where: {
                status: 'active',
                orders: {
                    some: {
                        createdAt: { gte: range.startDate, lte: range.endDate },
                        orderStatus: { not: 'cancelled' },
                    },
                },
            },
            include: {
                orders: {
                    where: {
                        createdAt: { gte: range.startDate, lte: range.endDate },
                        orderStatus: { not: 'cancelled' },
                    },
                    include: {
                        customer: true,
                    },
                },
            },
        });

        const ridersWithMetrics = riders.map(rider => {
            const orders = rider.orders;
            const deliveredOrders = orders.filter(o => o.deliveryStatus === 'delivered');
            const pendingOrders = orders.filter(o => o.deliveryStatus !== 'delivered');

            const totalDeliveries = deliveredOrders.length;
            const totalRevenue = deliveredOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
            const cashCollected = deliveredOrders
                .filter(o => o.paymentMethod === 'cash')
                .reduce((sum, order) => sum + Number(order.totalAmount), 0);

            const averageDeliveryTime = totalDeliveries > 0
                ? deliveredOrders.reduce((sum, order) => {
                    if (order.assignedAt && order.deliveredAt) {
                        const timeDiff = order.deliveredAt.getTime() - order.assignedAt.getTime();
                        return sum + (timeDiff / (1000 * 60)); // Convert to minutes
                    }
                    return sum;
                }, 0) / totalDeliveries
                : 0;

            return {
                id: rider.id,
                name: rider.name,
                phone: rider.phone,
                metrics: {
                    totalDeliveries,
                    totalRevenue,
                    cashCollected,
                    pendingDeliveries: pendingOrders.length,
                    averageDeliveryTime: Math.round(averageDeliveryTime),
                    successRate: orders.length > 0 ? (totalDeliveries / orders.length) * 100 : 0,
                },
                orders: deliveredOrders.slice(0, 5), // Recent deliveries
            };
        });

        // Sort by total deliveries descending
        ridersWithMetrics.sort((a, b) => b.metrics.totalDeliveries - a.metrics.totalDeliveries);

        return {
            period: { startDate: range.startDate, endDate: range.endDate },
            riders: ridersWithMetrics,
            summary: {
                totalRiders: riders.length,
                totalDeliveries: ridersWithMetrics.reduce((sum, r) => sum + r.metrics.totalDeliveries, 0),
                totalRevenue: ridersWithMetrics.reduce((sum, r) => sum + r.metrics.totalRevenue, 0),
                averageSuccessRate: riders.length > 0
                    ? ridersWithMetrics.reduce((sum, r) => sum + r.metrics.successRate, 0) / riders.length
                    : 0,
            },
        };
    }

    static async getFinancialSummaryReport(start?: string, end?: string) {
        const range = parseDateRange(start, end);

        const [orders, expenses] = await Promise.all([
            prisma.order.findMany({
                where: {
                    createdAt: { gte: range.startDate, lte: range.endDate },
                    orderStatus: { not: 'cancelled' },
                },
            }),
            prisma.expense.findMany({
                where: {
                    createdAt: { gte: range.startDate, lte: range.endDate },
                },
            }),
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
        const netProfit = totalRevenue - totalExpenses;
        const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // Revenue by payment method
        const cashRevenue = orders
            .filter(o => o.paymentMethod === 'cash')
            .reduce((sum, order) => sum + Number(order.totalAmount), 0);

        const bankRevenue = orders
            .filter(o => o.paymentMethod === 'bank_transfer')
            .reduce((sum, order) => sum + Number(order.totalAmount), 0);

        // Expense categories
        const expenseCategories = expenses.reduce((acc, expense) => {
            const category = expense.category || 'Uncategorized';
            if (!acc[category]) {
                acc[category] = { amount: 0, count: 0 };
            }
            acc[category].amount += Number(expense.amount);
            acc[category].count++;
            return acc;
        }, {} as Record<string, { amount: number; count: number }>);

        return {
            period: { startDate: range.startDate, endDate: range.endDate },
            revenue: {
                total: totalRevenue,
                byPaymentMethod: {
                    cash: cashRevenue,
                    bankTransfer: bankRevenue,
                    cashPercentage: totalRevenue > 0 ? (cashRevenue / totalRevenue) * 100 : 0,
                    bankPercentage: totalRevenue > 0 ? (bankRevenue / totalRevenue) * 100 : 0,
                },
                byOrderType: {
                    dineIn: orders.filter(o => o.orderType === 'dine_in').reduce((sum, o) => sum + Number(o.totalAmount), 0),
                    delivery: orders.filter(o => o.orderType === 'delivery').reduce((sum, o) => sum + Number(o.totalAmount), 0),
                },
            },
            expenses: {
                total: totalExpenses,
                categories: expenseCategories,
                averagePerDay: expenses.length > 0 ? totalExpenses / expenses.length : 0,
            },
            profit: {
                net: netProfit,
                margin: profitMargin,
                expenseToRevenueRatio: totalRevenue > 0 ? totalExpenses / totalRevenue : 0,
            },
            keyMetrics: {
                orders: orders.length,
                averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
                expenses: expenses.length,
                averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
            },
        };
    }

    static async getProfitLossReport(start?: string, end?: string) {
        const range = parseDateRange(start, end);
        const financialSummary = await this.getFinancialSummaryReport(start, end);

        // Add more detailed breakdown
        const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });
        const dailyProfits = [];

        for (const day of days) {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const [dayOrders, dayExpenses] = await Promise.all([
                prisma.order.findMany({
                    where: {
                        createdAt: { gte: dayStart, lte: dayEnd },
                        orderStatus: { not: 'cancelled' },
                    },
                }),
                prisma.expense.findMany({
                    where: {
                        createdAt: { gte: dayStart, lte: dayEnd },
                    },
                }),
            ]);

            const dayRevenue = dayOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
            const dayExpensesTotal = dayExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
            const dayProfit = dayRevenue - dayExpensesTotal;

            dailyProfits.push({
                date: format(day, 'yyyy-MM-dd'),
                dayOfWeek: format(day, 'EEEE'),
                revenue: dayRevenue,
                expenses: dayExpensesTotal,
                profit: dayProfit,
                margin: dayRevenue > 0 ? (dayProfit / dayRevenue) * 100 : 0,
                orders: dayOrders.length,
            });
        }

        // Calculate trends
        const totalDays = dailyProfits.length;
        const averageDailyProfit = dailyProfits.reduce((sum, day) => sum + day.profit, 0) / totalDays;
        const profitableDays = dailyProfits.filter(day => day.profit > 0).length;
        const profitabilityRate = (profitableDays / totalDays) * 100;

        return {
            ...financialSummary,
            dailyBreakdown: dailyProfits,
            trends: {
                averageDailyProfit,
                profitableDays,
                profitabilityRate,
                bestDay: dailyProfits.reduce((best, day) => day.profit > best.profit ? day : best, dailyProfits[0] || { profit: 0 }),
                worstDay: dailyProfits.reduce((worst, day) => day.profit < worst.profit ? day : worst, dailyProfits[0] || { profit: 0 }),
            },
            recommendations: this.generateProfitRecommendations(financialSummary, dailyProfits),
        };
    }

    private static async getDailyStatsForMonth(start: Date, end: Date) {
        const days = eachDayOfInterval({ start, end });
        const dailyStats = [];

        for (const day of days) {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const orders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: dayStart, lte: dayEnd },
                    orderStatus: { not: 'cancelled' },
                },
            });

            dailyStats.push({
                date: format(day, 'yyyy-MM-dd'),
                dayOfWeek: format(day, 'EEEE'),
                orders: orders.length,
                revenue: orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
            });
        }

        return dailyStats;
    }

    private static generateProfitRecommendations(summary: any, dailyProfits: any[]) {
        const recommendations = [];

        // Fix: Access the profit margin correctly
        const profitMargin = summary.profit?.margin || 0;
        const totalRevenue = summary.revenue?.total || 0;
        const totalExpenses = summary.expenses?.total || 0;

        if (profitMargin < 20) {
            recommendations.push({
                type: 'warning',
                message: 'Profit margin is below 20%. Consider reducing costs or increasing prices.',
                action: 'Review expense categories and menu pricing.',
            });
        }

        if (totalExpenses > totalRevenue * 0.7) {
            recommendations.push({
                type: 'critical',
                message: 'Expenses are consuming more than 70% of revenue.',
                action: 'Implement cost-cutting measures immediately.',
            });
        }

        const lowProfitDays = dailyProfits.filter(day => day.profit < 0).length;
        if (lowProfitDays > dailyProfits.length * 0.3) {
            recommendations.push({
                type: 'warning',
                message: `More than 30% of days are unprofitable (${lowProfitDays} out of ${dailyProfits.length} days).`,
                action: 'Analyze patterns in unprofitable days.',
            });
        }

        // Fix: Check if expense categories exist before accessing
        const highExpenseCategories = summary.expenses?.categories
            ? Object.entries(summary.expenses.categories)
                .filter(([_, data]: [string, any]) => data.amount > totalRevenue * 0.1)
                .map(([category]) => category)
            : [];

        if (highExpenseCategories.length > 0) {
            recommendations.push({
                type: 'info',
                message: `High expense categories: ${highExpenseCategories.join(', ')}`,
                action: 'Review spending in these categories.',
            });
        }

        return recommendations;
    }

    /**
     * Get delivery overview report with payment breakdown and trend
     */
    static async getDeliveryOverviewReport(start?: string, end?: string) {
        const range = parseDateRange(start, end);

        const orders = await prisma.order.findMany({
            where: {
                orderType: 'delivery',
                createdAt: { gte: range.startDate, lte: range.endDate },
            },
            include: {
                customer: true,
            },
        });

        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const deliveredOrders = orders.filter(o => o.deliveryStatus === 'delivered').length;
        const pendingOrders = orders.filter(o =>
            o.deliveryStatus === 'pending' ||
            o.deliveryStatus === 'out_for_delivery'
        ).length;
        const cancelledOrders = orders.filter(o => o.deliveryStatus === 'cancelled').length;

        // Payment breakdown
        const cashOrders = orders.filter(o => o.paymentMethod === 'cash' && o.paymentStatus === 'completed');
        const bankOrders = orders.filter(o => o.paymentMethod === 'bank_transfer' && o.paymentStatus === 'completed');
        const codPendingOrders = orders.filter(o => o.paymentMethod === 'cash' && o.paymentStatus === 'pending');
        const codReceivedOrders = orders.filter(o =>
            o.paymentMethod === 'cash' &&
            o.paymentStatus === 'completed' &&
            o.deliveryStatus === 'delivered'
        );

        const paymentBreakdown = {
            cash: {
                count: cashOrders.length,
                total: cashOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
            },
            bank: {
                count: bankOrders.length,
                total: bankOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
            },
            codPending: {
                count: codPendingOrders.length,
                total: codPendingOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
            },
            codReceived: {
                count: codReceivedOrders.length,
                total: codReceivedOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
            },
        };

        // Calculate daily trend
        const trend: Array<{ date: string; orders: number; revenue: number }> = [];
        const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });

        for (const day of days) {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);

            const dayOrders = orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= dayStart && orderDate <= dayEnd;
            });

            trend.push({
                date: format(day, 'yyyy-MM-dd'),
                orders: dayOrders.length,
                revenue: dayOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
            });
        }

        return {
            summary: {
                totalOrders,
                totalRevenue,
                averageOrderValue,
                deliveredOrders,
                pendingOrders,
                cancelledOrders,
            },
            paymentBreakdown,
            trend,
        };
    }

    /**
     * Get delivery area analysis - auto-discovers areas from delivery addresses
     */
    static async getDeliveryAreaAnalysis(start?: string, end?: string) {
        const range = parseDateRange(start, end);

        const orders = await prisma.order.findMany({
            where: {
                orderType: 'delivery',
                createdAt: { gte: range.startDate, lte: range.endDate },
                deliveryAddress: {
                    not: null,
                },
            },
        });

        // Group by area (extract area from delivery address)
        const areaMap = new Map<string, typeof orders>();

        orders.forEach(order => {
            const area = this.extractAreaFromAddress(order.deliveryAddress || 'Unknown');

            if (!areaMap.has(area)) {
                areaMap.set(area, []);
            }
            areaMap.get(area)!.push(order);
        });

        // Calculate stats for each area
        const areaAnalysis = Array.from(areaMap.entries()).map(([area, areaOrders]) => {
            const totalOrders = areaOrders.length;
            const totalRevenue = areaOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const deliveredOrders = areaOrders.filter(o => o.deliveryStatus === 'delivered').length;
            const pendingOrders = areaOrders.filter(o =>
                o.deliveryStatus === 'pending' ||
                o.deliveryStatus === 'out_for_delivery'
            ).length;

            return {
                area,
                totalOrders,
                totalRevenue,
                averageOrderValue,
                deliveredOrders,
                pendingOrders,
            };
        });

        // Sort by total revenue descending
        return areaAnalysis.sort((a, b) => b.totalRevenue - a.totalRevenue);
    }

    /**
     * Get pending or received COD orders
     */
    static async getDeliveryCODOrders(
        status: 'pending' | 'received',
        start?: string,
        end?: string
    ) {
        const range = parseDateRange(start, end);
        const paymentStatus = status === 'pending' ? 'pending' : 'completed';

        const orders = await prisma.order.findMany({
            where: {
                orderType: 'delivery',
                paymentMethod: 'cash',
                paymentStatus,
                createdAt: { gte: range.startDate, lte: range.endDate },
            },
            include: {
                customer: true,
                rider: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const codOrders = orders.map(order => ({
            id: order.id,
            orderNumber: order.orderNumber || 0,
            customerName: order.customer?.name || 'Guest',
            customerPhone: order.customer?.phone || 'N/A',
            deliveryAddress: order.deliveryAddress || 'N/A',
            totalAmount: Number(order.totalAmount),
            deliveryCharge: Number(order.deliveryCharge),
            deliveryStatus: order.deliveryStatus || 'pending',
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            riderName: order.rider?.name || null,
            paymentStatus: order.paymentStatus,
        }));

        const totals = {
            count: codOrders.length,
            amount: codOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        };

        return { orders: codOrders, totals };
    }

    /**
     * Extract area/locality from delivery address
     * Simple parsing - extracts meaningful part of address as area
     */
    private static extractAreaFromAddress(address: string): string {
        if (!address || address === 'N/A') return 'Unknown';

        // Common patterns: "street, area, city" or "address area"
        // Take the second-to-last part as area (before city)
        const parts = address.split(',').map(p => p.trim());

        if (parts.length >= 2) {
            // Return second-to-last part as area
            return parts[parts.length - 2] || 'Unknown';
        } else if (parts.length === 1) {
            // If no comma, try to extract last word/phrase
            const words = address.trim().split(' ');
            return words.length > 2 ? words.slice(-2).join(' ') : address;
        }

        return 'Unknown';
    }
}