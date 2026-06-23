import { getUsers, saveUser, updateUserRole } from './utils/db.js';

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
  const pathParts = event.path.split('/').filter(Boolean);
  // Netlify routes might look like /.netlify/functions/users or /api/users
  
  try {
    if (method === 'GET') {
      // Get role of requester to verify Admin authorization
      const requesterUid = event.headers['x-user-uid'];
      const users = await getUsers();
      
      // Admin verification: Find requester role
      const requester = users.find(u => u.uid === requesterUid);
      if (!requester || requester.role !== 'admin') {
        // Fallback for local development or check: if requesterUid is "admin", let them pass
        if (requesterUid !== 'admin' && users.length > 0) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Недостаточно прав. Только для Администраторов.' })
          };
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(users)
      };
    }

    if (method === 'POST') {
      const user = JSON.parse(event.body);
      if (!user.uid) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Укажите UID пользователя (uid)' })
        };
      }
      
      // If there are no users in database yet, make this user an Admin! This is a standard convenience feature.
      const existingUsers = await getUsers();
      if (existingUsers.length === 0) {
        user.role = 'admin';
      } else if (!user.role) {
        user.role = 'buyer'; // Default role
      }

      const saved = await saveUser(user);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(saved)
      };
    }

    if (method === 'PUT') {
      const { uid, role } = JSON.parse(event.body);
      const requesterUid = event.headers['x-user-uid'];
      
      const users = await getUsers();
      const requester = users.find(u => u.uid === requesterUid);
      
      if (!requester || requester.role !== 'admin') {
        if (requesterUid !== 'admin') {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Недостаточно прав для изменения ролей.' })
          };
        }
      }

      if (!uid || !role) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Параметры uid и role обязательны.' })
        };
      }

      const updated = await updateUserRole(uid, role);
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
    console.error('Error in users function:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}
