/// <reference types="node" />
// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "./../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Ensure DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    accelerateUrl: "",
  }),
});

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data (order matters due to foreign keys)
  await prisma.orderEditHistory.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.rider.deleteMany();
  await prisma.businessInfo.deleteMany();
  await prisma.user.deleteMany();

  // Business info
  console.log("📊 Creating business info...");
  await prisma.businessInfo.createMany({
    data: [
      { key: "easypaisa_name", value: "Abdullah Saleem" },
      { key: "easypaisa_account", value: "03307072222" },
      { key: "business_name", value: "Flamex" },
    ],
  });

  // Users
  console.log("👥 Creating default users...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const managerPassword = await bcrypt.hash("manager123", 10);

  await prisma.user.createMany({
    data: [
      {
        username: "admin",
        password: adminPassword,
        fullName: "System Administrator",
        role: "admin",
        email: "admin@flamex.com",
        status: "active",
      },
      {
        username: "manager",
        password: managerPassword,
        fullName: "Store Manager",
        role: "manager",
        email: "manager@flamex.com",
        status: "active",
      },
    ],
    skipDuplicates: true,
  });

  // Categories
  console.log("📁 Creating categories...");
  await prisma.category.createMany({
    data: [
      { name: "Burgers", description: "Delicious burgers" },
      { name: "Pizzas", description: "Fresh pizzas" },
      { name: "Drinks", description: "Cold beverages" },
      { name: "Desserts", description: "Sweet treats" },
    ],
    skipDuplicates: true,
  });

  const categories = await prisma.category.findMany();

  // Menu items
  console.log("🍔 Creating menu items...");
  await prisma.menuItem.createMany({
    data: [
      {
        name: "Classic Burger",
        description: "Beef patty with lettuce, tomato, and special sauce",
        price: 350,
        categoryId: categories.find((c: any) => c.name === "Burgers")!.id,
        available: true,
      },
      {
        name: "Cheese Pizza",
        description: "Classic cheese pizza with mozzarella",
        price: 800,
        categoryId: categories.find((c: any) => c.name === "Pizzas")!.id,
        available: true,
      },
      {
        name: "Coca Cola",
        description: "330ml can",
        price: 80,
        categoryId: categories.find((c: any) => c.name === "Drinks")!.id,
        available: true,
      },
      {
        name: "Chocolate Cake",
        description: "Rich chocolate cake slice",
        price: 200,
        categoryId: categories.find((c: any) => c.name === "Desserts")!.id,
        available: true,
      },
    ],
    skipDuplicates: true,
  });

  const menuItems = await prisma.menuItem.findMany();

  // Customers
  console.log("👤 Creating sample customers...");
  await prisma.customer.createMany({
    data: [
      {
        name: "Ali Khan",
        phone: "03001234567",
        address: "House 123, Street 45, Lahore",
        totalOrders: 5,
        totalSpent: 2500,
      },
      {
        name: "Sara Ahmed",
        phone: "03331234567",
        address: "Flat 45, Block B, Karachi",
        totalOrders: 3,
        totalSpent: 1500,
      },
    ],
    skipDuplicates: true,
  });

  const customers = await prisma.customer.findMany();

  // Riders
  console.log("🚴 Creating sample riders...");
  await prisma.rider.createMany({
    data: [
      {
        name: "Rider One",
        phone: "03111234567",
        address: "Lahore",
        status: "active",
        totalDeliveries: 25,
        totalCashCollected: 12500,
      },
      {
        name: "Rider Two",
        phone: "03221234567",
        address: "Karachi",
        status: "active",
        totalDeliveries: 18,
        totalCashCollected: 9000,
      },
    ],
    skipDuplicates: true,
  });

  // Orders
  console.log("📦 Creating sample orders...");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dineInOrder = await prisma.order.create({
    data: {
      totalAmount: 430,
      subtotal: 430,
      paymentMethod: "cash",
      amountTaken: 500,
      returnAmount: 70,
      status: "completed",
      orderType: "dine_in",
      orderStatus: "completed",
      paymentStatus: "completed",
      tableNumber: 1,
      orderNumber: 1001,
      cashierName: "Cashier",
      createdAt: yesterday,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: dineInOrder.id,
        menuItemId: menuItems[0].id,
        quantity: 1,
        price: 350,
      },
      {
        orderId: dineInOrder.id,
        menuItemId: menuItems[2].id,
        quantity: 1,
        price: 80,
      },
    ],
  });

  const deliveryOrder = await prisma.order.create({
    data: {
      totalAmount: 1000,
      subtotal: 800,
      paymentMethod: "cash",
      amountTaken: 1000,
      returnAmount: 0,
      status: "completed",
      orderType: "delivery",
      orderStatus: "completed",
      paymentStatus: "completed",
      deliveryCharge: 200,
      deliveryAddress: "House 456, Street 78, Islamabad",
      deliveryStatus: "delivered",
      customerId: customers[0].id,
      orderNumber: 1002,
      cashierName: "Cashier",
      createdAt: today,
      deliveredAt: today,
    },
  });

  await prisma.orderItem.createMany({
    data: [
      {
        orderId: deliveryOrder.id,
        menuItemId: menuItems[1].id,
        quantity: 1,
        price: 800,
      },
    ],
  });

  console.log("💰 Creating sample expense...");
  await prisma.expense.create({
    data: {
      description: "Vegetables purchase",
      amount: 5000,
      category: "Food Supplies",
      paymentMethod: "cash",
      quantity: 10,
      unit: "KG",
      unitPrice: 500,
      expenseDate: today,
    },
  });

  console.log("📈 Updating customer statistics...");
  for (const customer of customers) {
    const orders = await prisma.order.findMany({
      where: { customerId: customer.id },
    });

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum: number, order: any) => sum + Number(order.totalAmount), 0);

    await prisma.customer.update({
      where: { id: customer.id },
      data: { totalOrders, totalSpent },
    });
  }

  console.log("✅ Database seeding completed successfully!");
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", JSON.stringify(error, null, 2));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
