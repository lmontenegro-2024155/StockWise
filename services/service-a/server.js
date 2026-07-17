import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 5301;
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/stockwise?authSource=admin';
const jwtSecret = process.env.JWT_SECRET || 'stockwise-secret';

app.use(cors());
app.use(express.json());

await mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB for service-a');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error in service-a:', err);
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  sku: { type: String, required: true, unique: true },
  category: { type: String, required: true, index: true },
  description: { type: String, default: '' },
  price: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() },
});

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, index: true },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: () => new Date() },
});

const movementSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['incoming', 'outgoing'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: () => new Date() },
});

const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category', categorySchema);
const InventoryMovement = mongoose.model('InventoryMovement', movementSchema);

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

const notifyLowStock = async (product) => {
  if (product.stock <= product.minStock) {
    const url = 'http://127.0.0.1:5302/api/v1/service-b/alerts/internal';
    try {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product._id,
          productName: product.name,
          message: `Stock bajo: ${product.stock} unidades`,
          level: 'warning',
        }),
      });
    } catch (error) {
      console.warn('No se pudo notificar alerta de stock bajo:', error.message || error);
    }
  }
};

app.get('/api/v1/service-a/health', (req, res) => {
  res.json({ status: 'ok', service: 'service-a' });
});

const listProducts = async (req, res) => {
  const { search, category } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) {
    query.category = category;
  }

  const products = await Product.find(query).sort({ name: 1 });
  res.json(products);
};

const getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  }
  res.json(product);
};

const getProductInventory = async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  }

  const movements = await InventoryMovement.find({ productId: product._id }).sort({ createdAt: -1 });
  res.json({ product, movements });
};

const createProduct = async (req, res) => {
  const { name, sku, category, description, price, stock, minStock } = req.body;
  if (!name || !sku || !category) {
    return res.status(400).json({ success: false, message: 'Nombre, SKU y categoría son obligatorios' });
  }

  const existing = await Product.findOne({ sku });
  if (existing) {
    return res.status(409).json({ success: false, message: 'Producto con ese SKU ya existe' });
  }

  const product = await Product.create({ name, sku, category, description, price, stock, minStock });
  await notifyLowStock(product);
  res.status(201).json(product);
};

const updateProduct = async (req, res) => {
  const update = { ...req.body, updatedAt: new Date() };
  const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!product) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  }
  await notifyLowStock(product);
  res.json(product);
};

const deleteProduct = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  }
  res.json({ success: true, message: 'Producto eliminado' });
};

const handleEntry = async (req, res) => {
  const { productId, quantity, note } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'productId y quantity válidos son obligatorios' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  }

  product.stock += quantity;
  product.updatedAt = new Date();
  await product.save();

  const movement = await InventoryMovement.create({ productId, type: 'incoming', quantity, note });
  await notifyLowStock(product);

  res.status(201).json({ success: true, movement, product });
};

const handleOutput = async (req, res) => {
  const { productId, quantity, note } = req.body;
  if (!productId || !quantity || quantity <= 0) {
    return res.status(400).json({ success: false, message: 'productId y quantity válidos son obligatorios' });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Producto no encontrado' });
  }

  if (product.stock - quantity < 0) {
    return res.status(400).json({ success: false, message: 'No hay suficiente inventario para esta salida' });
  }

  product.stock -= quantity;
  product.updatedAt = new Date();
  await product.save();

  const movement = await InventoryMovement.create({ productId, type: 'outgoing', quantity, note });
  await notifyLowStock(product);

  res.status(201).json({ success: true, movement, product });
};

const listCategories = async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.json(categories);
};

const createCategory = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'El nombre de la categoría es obligatorio' });
  }

  const existing = await Category.findOne({ name });
  if (existing) {
    return res.status(409).json({ success: false, message: 'La categoría ya existe' });
  }

  const category = await Category.create({ name, description });
  res.status(201).json(category);
};

app.get('/api/v1/service-a/products', authMiddleware, listProducts);
app.get('/products', authMiddleware, listProducts);
app.get('/api/v1/service-a/products/:id', authMiddleware, getProduct);
app.get('/products/:id', authMiddleware, getProduct);
app.get('/api/v1/service-a/inventory/:productId', authMiddleware, getProductInventory);
app.get('/inventory/:productId', authMiddleware, getProductInventory);
app.post('/api/v1/service-a/products', authMiddleware, createProduct);
app.post('/products', authMiddleware, createProduct);
app.put('/api/v1/service-a/products/:id', authMiddleware, updateProduct);
app.put('/products/:id', authMiddleware, updateProduct);
app.delete('/api/v1/service-a/products/:id', authMiddleware, deleteProduct);
app.delete('/products/:id', authMiddleware, deleteProduct);
app.post('/api/v1/service-a/entries', authMiddleware, handleEntry);
app.post('/entries', authMiddleware, handleEntry);
app.post('/api/v1/service-a/outputs', authMiddleware, handleOutput);
app.post('/outputs', authMiddleware, handleOutput);
app.get('/api/v1/service-a/categories', authMiddleware, listCategories);
app.get('/categories', authMiddleware, listCategories);
app.post('/api/v1/service-a/categories', authMiddleware, createCategory);
app.post('/categories', authMiddleware, createCategory);

app.listen(port, () => {
  console.log(`Service A Node.js running on http://0.0.0.0:${port}`);
});
