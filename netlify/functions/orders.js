import { getOrders, saveOrder, updateOrderStatus, getUsers } from './utils/db.js';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-uid',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  const method = event.httpMethod;
  const requesterUid = event.headers['x-user-uid'];

  try {
    if (!requesterUid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Пользователь не авторизован (x-user-uid header is missing).' })
      };
    }

    // Get user details
    const users = await getUsers();
    const requester = users.find(u => u.uid === requesterUid);
    const requesterRole = requester ? requester.role : (requesterUid === 'admin' ? 'admin' : (requesterUid === 'seller' ? 'seller' : 'buyer'));

    // 1. GET - Fetch orders based on role
    if (method === 'GET') {
      const allOrders = await getOrders();
      let filteredOrders = [];

      if (requesterRole === 'admin') {
        filteredOrders = allOrders;
      } else if (requesterRole === 'seller') {
        // Seller sees orders that contain their products
        filteredOrders = allOrders.filter(order => 
          order.items.some(item => item.sellerId === requesterUid)
        ).map(order => {
          // Optional: filter items to only show seller's own products
          return {
            ...order,
            items: order.items.filter(item => item.sellerId === requesterUid)
          };
        });
      } else {
        // Buyer sees their own orders
        filteredOrders = allOrders.filter(order => order.buyerId === requesterUid);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(filteredOrders)
      };
    }

    // 2. POST - Checkout (create order)
    if (method === 'POST') {
      const orderData = JSON.parse(event.body);
      
      if (!orderData.items || orderData.items.length === 0 || !orderData.total) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Корзина пуста. Невозможно оформить заказ.' })
        };
      }

      const newOrder = {
        buyerId: requesterUid,
        buyerEmail: orderData.buyerEmail || (requester ? requester.email : 'buyer@test.com'),
        items: orderData.items,
        total: Number(orderData.total),
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      const saved = await saveOrder(newOrder);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(saved)
      };
    }

    // 3. PUT - Update order status
    if (method === 'PUT') {
      const { id, status } = JSON.parse(event.body);

      if (!id || !status) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Укажите id заказа и новый статус.' })
        };
      }

      const allOrders = await getOrders();
      const existingOrder = allOrders.find(o => o.id === id);

      if (!existingOrder) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Заказ не найден.' })
        };
      }

      // Check authorization: Admin can change any order, Seller can change status if order contains their item
      const isSellerOfOrder = existingOrder.items.some(item => item.sellerId === requesterUid);
      const allowed = requesterRole === 'admin' || (requesterRole === 'seller' && isSellerOfOrder);

      if (!allowed) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Вы не можете изменить статус этого заказа.' })
        };
      }

      const updated = await updateOrderStatus(id, status);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(updated)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Метод не поддерживается.' })
    };
  } catch (error) {
    console.error('Error in orders function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
