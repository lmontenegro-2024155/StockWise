import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 5296;
const mongoUri = process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/stockwise?authSource=admin';
const jwtSecret = process.env.JWT_SECRET || 'stockwise-secret';

app.use(cors());
app.use(express.json());

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'USER_ROLE' },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: () => new Date() },
});

const User = mongoose.model('User', userSchema);

const createAuthToken = (user) => {
  return jwt.sign(
    {
      sub: user._id.toString(),
      username: user.username,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: '6h' }
  );
};

const standardResponse = (success, message, data = null) => ({ success, message, data });

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(standardResponse(false, 'Token no proporcionado')); 
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json(standardResponse(false, 'Token inválido')); 
  }
};

const seedAdminUser = async () => {
  const existingAdmin = await User.findOne({ username: 'admin' });
  if (existingAdmin) return;

  const passwordHash = await bcrypt.hash('Kinal2026!', 10);
  await User.create({
    username: 'admin',
    email: 'ksadmin@local.com',
    passwordHash,
    role: 'ADMIN_ROLE',
    status: true,
  });
  console.log('Admin seeded: admin / Kinal2026!');
};

app.get('/api/v1/auth/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

app.post('/api/v1/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json(standardResponse(false, 'Todos los campos son obligatorios'));
  }

  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    return res.status(409).json(standardResponse(false, 'El usuario o correo ya existe'));
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await User.create({ username, email, passwordHash, role: 'USER_ROLE' });
  res.status(201).json(standardResponse(true, 'Usuario registrado correctamente', { id: newUser._id, username: newUser.username, email: newUser.email }));
});

app.post('/api/v1/auth/login', async (req, res) => {
  const { EmailOrUsername, Password } = req.body;
  if (!EmailOrUsername || !Password) {
    return res.status(400).json(standardResponse(false, 'Usuario y contraseña son obligatorios'));
  }

  const user = await User.findOne({
    $or: [{ username: EmailOrUsername }, { email: EmailOrUsername }],
  });

  if (!user) {
    return res.status(401).json(standardResponse(false, 'Usuario no encontrado'));
  }

  const validPassword = await bcrypt.compare(Password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json(standardResponse(false, 'Contraseña inválida'));
  }

  const token = createAuthToken(user);
  return res.json(standardResponse(true, 'Autenticación exitosa', { token, userDetails: { username: user.username, email: user.email, role: user.role } }));
});

app.get('/api/v1/auth/profile', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.sub).select('-passwordHash');
  if (!user) {
    return res.status(404).json(standardResponse(false, 'Usuario no encontrado'));
  }
  res.json(standardResponse(true, 'Perfil obtenido exitosamente', user));
});

app.listen(port, () => {
  console.log(`Auth service listening on http://0.0.0.0:${port}`);
});

mongoose.connection.once('open', async () => {
  console.log('Connected to MongoDB for auth-service');
  await seedAdminUser();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error in auth-service:', err);
});
