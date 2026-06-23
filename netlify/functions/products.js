import { getProducts, saveProduct, deleteProduct, getUsers } from './utils/db.js';

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
  const params = event.queryStringParameters || {};

  try {
    // 1. GET - Fetch products (public)
    if (method === 'GET') {
      let products = await getProducts();
      if (params.sellerId) {
        products = products.filter(p => p.sellerId === params.sellerId);
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(products)
      };
    }

    // Role-based validation helper
    const verifySellerOrAdmin = async () => {
      if (!requesterUid) return false;
      if (requesterUid === 'admin' || requesterUid === 'seller') return true;
      const users = await getUsers();
      const user = users.find(u => u.uid === requesterUid);
      return user && (user.role === 'seller' || user.role === 'admin');
    };

    // 2. POST - Create product
    if (method === 'POST') {
      const allowed = await verifySellerOrAdmin();
      if (!allowed) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Доступ запрещен. Требуется роль продавца или администратора.' })
        };
      }

      const productData = JSON.parse(event.body);
      if (!productData.title || !productData.price || !productData.image) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Заполните обязательные поля: Название, Цена, Ссылка на изображение.' })
        };
      }

      const saved = await saveProduct({
        ...productData,
        price: Number(productData.price),
        sellerId: productData.sellerId || requesterUid,
        sellerName: productData.sellerName || 'Продавец'
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(saved)
      };
    }

    // 3. PUT - Update product
    if (method === 'PUT') {
      const allowed = await verifySellerOrAdmin();
      if (!allowed) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Доступ запрещен.' })
        };
      }

      const productData = JSON.parse(event.body);
      const products = await getProducts();
      const existingProduct = products.find(p => p.id === productData.id);

      if (!existingProduct) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Товар не найден.' })
        };
      }

      // Check ownership (sellers can only edit their own products, admins can edit any)
      if (existingProduct.sellerId !== requesterUid && requesterUid !== 'admin') {
        const users = await getUsers();
        const requester = users.find(u => u.uid === requesterUid);
        if (!requester || requester.role !== 'admin') {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Вы не являетесь владельцем этого товара.' })
          };
        }
      }

      const saved = await saveProduct({
        ...existingProduct,
        ...productData,
        price: Number(productData.price)
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(saved)
      };
    }

    // 4. DELETE - Delete product
    if (method === 'DELETE') {
      const allowed = await verifySellerOrAdmin();
      if (!allowed) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Доступ запрещен.' })
        };
      }

      const { id } = params;
      if (!id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Укажите id товара для удаления.' })
        };
      }

      const products = await getProducts();
      const existingProduct = products.find(p => p.id === id);

      if (!existingProduct) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Товар не найден.' })
        };
      }

      // Check ownership
      if (existingProduct.sellerId !== requesterUid && requesterUid !== 'admin') {
        const users = await getUsers();
        const requester = users.find(u => u.uid === requesterUid);
        if (!requester || requester.role !== 'admin') {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Вы не являетесь владельцем этого товара.' })
          };
        }
      }

      await deleteProduct(id);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: 'Товар успешно удален.' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Метод не поддерживается.' })
    };
  } catch (error) {
    console.error('Error in products function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
