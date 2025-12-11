# Server-Side Fix: Order Status Not Updating When Marked as Paid

## Problem Analysis

When an order is marked as paid offline and synced to the server, the order status is being reset to "pending" when fetched back from the database. This happens because:

1. **Current Behavior**: The `markOrderAsPaid` function in `OrdersService` only updates `paymentStatus` to `'completed'` but does NOT update `orderStatus` to `'completed'`.

2. **Expected Behavior**: When an order is marked as paid, both `paymentStatus` AND `orderStatus` should be set to `'completed'` automatically.

3. **Impact**: Orders that are paid but still have `orderStatus: 'pending'` are being returned in the pending list, causing confusion and incorrect categorization.

## Root Cause

**File**: `flamex-server/src/services/orders.service.ts`

**Current Code** (lines 264-296):
```typescript
static async markOrderAsPaid(
  id: number,
  data: {
    paymentMethod: 'cash' | 'bank_transfer';
    amountTaken?: number;
    returnAmount?: number;
  },
) {
  const order = await OrdersRepository.findOrderById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const updateData: Prisma.OrderUpdateInput = {
    paymentMethod: data.paymentMethod,
    paymentStatus: 'completed',  // ✅ Sets paymentStatus
    // ❌ Missing: orderStatus: 'completed'
  };

  // ... rest of the code
  return await OrdersRepository.updateOrder(id, updateData);
}
```

## Required Fix

### Option 1: Update `markOrderAsPaid` to Set Both Statuses (RECOMMENDED)

**File**: `flamex-server/src/services/orders.service.ts`

**Change**: Update the `markOrderAsPaid` method to also set `orderStatus` to `'completed'`:

```typescript
static async markOrderAsPaid(
  id: number,
  data: {
    paymentMethod: 'cash' | 'bank_transfer';
    amountTaken?: number;
    returnAmount?: number;
  },
) {
  const order = await OrdersRepository.findOrderById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const updateData: Prisma.OrderUpdateInput = {
    paymentMethod: data.paymentMethod,
    paymentStatus: 'completed',
    orderStatus: 'completed',  // ✅ ADD THIS LINE - Automatically set orderStatus to completed when paid
  };

  if (data.paymentMethod === 'cash') {
    if (!data.amountTaken) {
      throw new ApiError(400, 'Amount taken is required for cash payments');
    }
    if (data.amountTaken < Number(order.totalAmount)) {
      throw new ApiError(400, 'Amount taken must be greater than or equal to total amount');
    }
    updateData.amountTaken = data.amountTaken;
    updateData.returnAmount = data.returnAmount || data.amountTaken - Number(order.totalAmount);
  } else {
    updateData.amountTaken = null;
    updateData.returnAmount = null;
  }

  return await OrdersRepository.updateOrder(id, updateData);
}
```

### Option 2: Update `findDineInOrders` to Check Both Statuses

**File**: `flamex-server/src/repositories/orders.repository.ts`

**Current Code** (lines 337-371):
```typescript
static async findDineInOrders(filter: {
  status?: 'pending' | 'completed';
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Prisma.OrderWhereInput = {
    orderType: 'dine_in',
    orderStatus: { not: 'cancelled' },
  };

  if (filter.status === 'completed') {
    where.paymentStatus = 'completed';  // Only checks paymentStatus
  } else if (filter.status === 'pending') {
    where.paymentStatus = 'pending';
  }
  // ... rest
}
```

**Change**: Update to check both `paymentStatus` and `orderStatus`:

```typescript
static async findDineInOrders(filter: {
  status?: 'pending' | 'completed';
  startDate?: Date;
  endDate?: Date;
}) {
  const where: Prisma.OrderWhereInput = {
    orderType: 'dine_in',
    orderStatus: { not: 'cancelled' },
  };

  if (filter.status === 'completed') {
    // Check if EITHER paymentStatus OR orderStatus is completed
    where.OR = [
      { paymentStatus: 'completed' },
      { orderStatus: 'completed' }
    ];
  } else if (filter.status === 'pending') {
    // Check if BOTH paymentStatus AND orderStatus are pending
    where.paymentStatus = 'pending';
    where.orderStatus = { not: 'completed' };
  }

  if (filter.startDate && filter.endDate) {
    where.createdAt = {
      gte: filter.startDate,
      lte: filter.endDate,
    };
  }

  return await prisma.order.findMany({
    where,
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
    },
    orderBy: { orderNumber: 'desc' },
  });
}
```

## Recommended Solution

**Use Option 1** - Update `markOrderAsPaid` to set both statuses. This is the cleanest solution because:

1. It ensures data consistency at the source
2. It matches the expected business logic (paid orders should be completed)
3. It prevents future issues with status mismatches
4. It's a single-line change

## Testing After Fix

1. **Test Mark as Paid**:
   - Create a dine-in order
   - Mark it as paid
   - Verify that both `paymentStatus` and `orderStatus` are `'completed'` in the database

2. **Test Order Fetching**:
   - Fetch pending orders - should NOT include paid orders
   - Fetch completed orders - should include paid orders

3. **Test Offline Sync**:
   - Create order offline
   - Mark as paid offline
   - Sync to server
   - Fetch orders back - should show as completed

## Additional Notes

- The client-side has been updated to handle this gracefully by normalizing order status when syncing, but the server-side fix is still recommended for data consistency
- Consider adding a database constraint or trigger to ensure `orderStatus` is `'completed'` when `paymentStatus` is `'completed'` (optional, for extra safety)

