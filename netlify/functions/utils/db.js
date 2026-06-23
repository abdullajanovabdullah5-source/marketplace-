import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Firebase configuration loaded from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

let db = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase initialized in Netlify Function.');
  } catch (error) {
    console.error('Firebase initialization failed in Netlify Function:', error);
  }
}

// Fallback JSON-based Database logic for local development
const dataDir = path.resolve('.data');
const dbFilePath = path.join(dataDir, 'db.json');

const defaultMockData = {
  products: [
    {
      id: 'p1',
      title: 'Кожаная Куртка Sulhak',
      description: 'Премиальная кожаная куртка ручной работы с шелковой подкладкой.',
      price: 24900,
      image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=60',
      category: 'Одежда',
      sellerId: 's1',
      sellerName: 'Sulhak Boutique',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p2',
      title: 'Умные Часы Chrono V',
      description: 'Минималистичные смарт-часы с титановым корпусом и AMOLED-экраном.',
      price: 18900,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=60',
      category: 'Электроника',
      sellerId: 's1',
      sellerName: 'Sulhak Boutique',
      createdAt: new Date().toISOString()
    },
    {
      id: 'p3',
      title: 'Рюкзак Nomad Canvas',
      description: 'Влагозащищенный рюкзак из вощеного канваса с отделениями под ноутбук.',
      price: 8500,
      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=60',
      category: 'Аксессуары',
      sellerId: 's2',
      sellerName: 'Nomad Gear',
      createdAt: new Date().toISOString()
    }
  ],
  orders: [],
  users: [
    {
      uid: 's1',
      email: 'seller@sulhak.com',
      role: 'seller',
      createdAt: new Date().toISOString()
    },
    {
      uid: 's2',
      email: 'nomad@sulhak.com',
      role: 'seller',
      createdAt: new Date().toISOString()
    },
    {
      uid: 'a1',
      email: 'admin@sulhak.com',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
  ]
};

function readLocalDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbFilePath)) {
    fs.writeFileSync(dbFilePath, JSON.stringify(defaultMockData, null, 2), 'utf-8');
    return defaultMockData;
  }
  try {
    const content = fs.readFileSync(dbFilePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading local db.json:', error);
    return defaultMockData;
  }
}

function writeLocalDb(data) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

// DATABASE API
export async function getProducts() {
  if (db) {
    try {
      const q = collection(db, 'products');
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Firestore getProducts error:', err);
    }
  }
  return readLocalDb().products;
}

export async function saveProduct(product) {
  if (!product.id) {
    product.id = 'prod_' + Math.random().toString(36).substr(2, 9);
  }
  if (!product.createdAt) {
    product.createdAt = new Date().toISOString();
  }
  
  if (db) {
    try {
      await setDoc(doc(db, 'products', product.id), product);
      return product;
    } catch (err) {
      console.error('Firestore saveProduct error:', err);
    }
  }
  
  const local = readLocalDb();
  const idx = local.products.findIndex(p => p.id === product.id);
  if (idx > -1) {
    local.products[idx] = product;
  } else {
    local.products.push(product);
  }
  writeLocalDb(local);
  return product;
}

export async function deleteProduct(id) {
  if (db) {
    try {
      await deleteDoc(doc(db, 'products', id));
      return true;
    } catch (err) {
      console.error('Firestore deleteProduct error:', err);
    }
  }
  
  const local = readLocalDb();
  local.products = local.products.filter(p => p.id !== id);
  writeLocalDb(local);
  return true;
}

export async function getOrders() {
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Firestore getOrders error:', err);
    }
  }
  return readLocalDb().orders;
}

export async function saveOrder(order) {
  if (!order.id) {
    order.id = 'ord_' + Math.random().toString(36).substr(2, 9);
  }
  if (!order.createdAt) {
    order.createdAt = new Date().toISOString();
  }
  
  if (db) {
    try {
      await setDoc(doc(db, 'orders', order.id), order);
      return order;
    } catch (err) {
      console.error('Firestore saveOrder error:', err);
    }
  }
  
  const local = readLocalDb();
  local.orders.push(order);
  writeLocalDb(local);
  return order;
}

export async function updateOrderStatus(orderId, status) {
  if (db) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status });
      const updatedSnap = await getDoc(orderRef);
      return { id: orderId, ...updatedSnap.data() };
    } catch (err) {
      console.error('Firestore updateOrderStatus error:', err);
    }
  }
  
  const local = readLocalDb();
  const idx = local.orders.findIndex(o => o.id === orderId);
  if (idx > -1) {
    local.orders[idx].status = status;
    writeLocalDb(local);
    return local.orders[idx];
  }
  return null;
}

export async function getUsers() {
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('Firestore getUsers error:', err);
    }
  }
  return readLocalDb().users;
}

export async function saveUser(user) {
  if (!user.uid) return null;
  if (!user.role) user.role = 'buyer';
  if (!user.createdAt) user.createdAt = new Date().toISOString();
  
  if (db) {
    try {
      await setDoc(doc(db, 'users', user.uid), user);
      return user;
    } catch (err) {
      console.error('Firestore saveUser error:', err);
    }
  }
  
  const local = readLocalDb();
  const idx = local.users.findIndex(u => u.uid === user.uid);
  if (idx > -1) {
    local.users[idx] = { ...local.users[idx], ...user };
  } else {
    local.users.push(user);
  }
  writeLocalDb(local);
  return user;
}

export async function updateUserRole(uid, role) {
  if (db) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, { role });
      const updatedSnap = await getDoc(userRef);
      return { uid, ...updatedSnap.data() };
    } catch (err) {
      console.error('Firestore updateUserRole error:', err);
    }
  }
  
  const local = readLocalDb();
  const idx = local.users.findIndex(u => u.uid === uid);
  if (idx > -1) {
    local.users[idx].role = role;
    writeLocalDb(local);
    return local.users[idx];
  }
  return null;
}
