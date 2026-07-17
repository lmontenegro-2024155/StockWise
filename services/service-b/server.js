import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 5302;
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/stockwise?authSource=admin';
const jwtSecret = process.env.JWT_SECRET || 'stockwise-secret';

app.use(cors());
app.use(express.json());

await mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB for service-b');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error in service-b:', err);
});

const alertSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, default: '' },
  message: { type: String, required: true },
  level: { type: String, default: 'warning' },
  createdAt: { type: Date, default: () => new Date() },
});

const Alert = mongoose.model('Alert', alertSchema);

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, jwtSecret);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

const serviceABaseUrl = process.env.SERVICE_A_URL || 'http://127.0.0.1:5301/api/v1/service-a';

const fetchServiceA = async (req, path, options = {}) => {
  const url = `${serviceABaseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (req.headers.authorization) {
    headers.authorization = req.headers.authorization;
  }

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Service A responded ${response.status}: ${errorText}`);
  }
  return response.json();
};

const fetchAllProducts = async (req) => {
  return fetchServiceA(req, '/products');
};

const fetchProductMovements = async (req, productId) => {
  return fetchServiceA(req, `/inventory/${productId}`);
};

const createAlertRecord = async (productId, productName, message, level = 'warning') => {
  return Alert.create({ productId, productName, message, level });
};

app.get('/api/v1/service-b/health', (req, res) => {
  res.json({ status: 'ok', service: 'service-b' });
});

const lowStockHandler = async (req, res) => {
  const products = await fetchAllProducts(req);
  const lowStockProducts = products.filter((product) => product.stock <= (product.minStock ?? 5));

  res.json({
    count: lowStockProducts.length,
    products: lowStockProducts,
  });
};

const outOfStockHandler = async (req, res) => {
  const products = await fetchAllProducts(req);
  const outOfStockProducts = products.filter((product) => product.stock === 0);

  res.json({
    count: outOfStockProducts.length,
    products: outOfStockProducts,
  });
};

app.get('/alerts/low-stock', authMiddleware, lowStockHandler);
app.get('/api/v1/service-b/alerts/low-stock', authMiddleware, lowStockHandler);

app.get('/alerts/out-of-stock', authMiddleware, outOfStockHandler);
app.get('/api/v1/service-b/alerts/out-of-stock', authMiddleware, outOfStockHandler);

app.get('/reports/top-products', authMiddleware, async (req, res) => {
  const products = await fetchAllProducts(req);
  const soldProducts = await Promise.all(
    products.map(async (product) => {
      const inventory = await fetchProductMovements(req, product._id);
      const totalSold = inventory.movements
        .filter((movement) => movement.type === 'outgoing')
        .reduce((sum, movement) => sum + movement.quantity, 0);
      return {
        productId: product._id,
        name: product.name,
        category: product.category,
        totalSold,
        stock: product.stock,
      };
    })
  );

  const topProducts = soldProducts
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10);

  res.json({ products: topProducts });
});

app.get('/api/v1/service-b/reports/top-products', authMiddleware, async (req, res) => {
  const products = await fetchAllProducts(req);
  const soldProducts = await Promise.all(
    products.map(async (product) => {
      const inventory = await fetchProductMovements(req, product._id);
      const totalSold = inventory.movements
        .filter((movement) => movement.type === 'outgoing')
        .reduce((sum, movement) => sum + movement.quantity, 0);
      return {
        productId: product._id,
        name: product.name,
        category: product.category,
        totalSold,
        stock: product.stock,
      };
    })
  );

  const topProducts = soldProducts
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 10);

  res.json({ products: topProducts });
});

app.get('/reports/categories', authMiddleware, async (req, res) => {
  const products = await fetchAllProducts(req);
  const categoryMap = {};

  products.forEach((product) => {
    const key = product.category || 'Sin categoría';
    categoryMap[key] = categoryMap[key] || { category: key, productCount: 0, totalStock: 0, lowStockCount: 0 };
    categoryMap[key].productCount += 1;
    categoryMap[key].totalStock += product.stock;
    if (product.stock <= (product.minStock ?? 5)) {
      categoryMap[key].lowStockCount += 1;
    }
  });

  res.json({ categories: Object.values(categoryMap) });
});

app.get('/reports/summary', authMiddleware, async (req, res) => {
  const products = await fetchAllProducts(req);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + (product.stock ?? 0), 0);
  const lowStockCount = products.filter((product) => product.stock <= (product.minStock ?? 5)).length;
  const outOfStockCount = products.filter((product) => product.stock === 0).length;
  const categories = [...new Set(products.map((product) => product.category || 'Sin categoría'))];

  res.json({
    totalProducts,
    totalStock,
    lowStockCount,
    outOfStockCount,
    categoryCount: categories.length,
    categories,
  });
});

app.get('/api/v1/service-b/reports/summary', authMiddleware, async (req, res) => {
  const products = await fetchAllProducts(req);
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + (product.stock ?? 0), 0);
  const lowStockCount = products.filter((product) => product.stock <= (product.minStock ?? 5)).length;
  const outOfStockCount = products.filter((product) => product.stock === 0).length;
  const categories = [...new Set(products.map((product) => product.category || 'Sin categoría'))];

  res.json({
    totalProducts,
    totalStock,
    lowStockCount,
    outOfStockCount,
    categoryCount: categories.length,
    categories,
  });
});

app.get('/api/v1/service-b/alerts', authMiddleware, async (req, res) => {
  const alerts = await Alert.find().sort({ createdAt: -1 });
  res.json(alerts);
});

app.post('/api/v1/service-b/alerts/internal', async (req, res) => {
  const { productId, productName, message, level } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'El mensaje es obligatorio' });
  }

  const alert = await createAlertRecord(productId, productName, message, level);
  res.status(201).json(alert);
});

app.post('/api/v1/service-b/alerts', authMiddleware, async (req, res) => {
  const { productId, productName, message, level } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'El mensaje es obligatorio' });
  }

  const alert = await createAlertRecord(productId, productName, message, level);
  res.status(201).json(alert);
});

app.get('/api/v1/service-b/reports/inventory-summary', authMiddleware, async (req, res) => {
  const totalAlerts = await Alert.countDocuments();
  const latestAlerts = await Alert.find().sort({ createdAt: -1 }).limit(10);
  const levels = await Alert.aggregate([
    { $group: { _id: '$level', count: { $sum: 1 } } },
  ]);

  res.json({ totalAlerts, levels, latestAlerts });
});

app.listen(port, () => {
  console.log(`Service B Node.js running on http://0.0.0.0:${port}`);
});
