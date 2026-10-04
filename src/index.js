const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
require('dotenv').config();

const { initDB, findUserByUsername, updateUserToken } = require('./db');
const { verifyPassword } = require('./utils/cryptoUtils');
const authenticateToken = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026_antigravity';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JWT Authentication API - Lab Demo',
      version: '1.0.0',
      description: 'Hệ thống API Xác thực JWT với Node.js, Express & MySQL.\nHỗ trợ đăng nhập với mật khẩu mã hóa Base64 / MD5 từ Client.',
      contact: {
        name: 'Antigravity AI Assistant'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            IdUser: { type: 'integer', example: 1 },
            UserName: { type: 'string', example: 'admin' },
            Password: { type: 'string', example: 'MTIzNDU2' },
            Token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['userName', 'password'],
          properties: {
            userName: { type: 'string', example: 'admin' },
            password: { 
              type: 'string', 
              description: 'Mật khẩu đã được mã hoá Base64 (vd: MTIzNDU2) hoặc MD5 (vd: e10adc3949ba59abbe56e057f20f883e) tại Client',
              example: 'MTIzNDU2' 
            }
          }
        },
        AuthVerifyRequest: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT Token cần kiểm tra (Nếu không truyền qua Bearer Header)', example: 'eyJhbGciOiJIUzI1Ni...' }
          }
        }
      }
    }
  },
  apis: ['./src/index.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @openapi
 * /:
 *   post:
 *     summary: API Đăng nhập & Sinh Token JWT (Root URL)
 *     description: Tiếp nhận userName và password (đã mã hoá Base64 hoặc MD5 từ Client), kiểm tra tài khoản trong bảng User, sinh mã JWT và cập nhật cột Token trong CSDL.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công và nhận JWT Token
 *       400:
 *         description: Thiếu tham số input
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
 */
const handleLogin = async (req, res) => {
  const { userName, password } = req.body;

  if (!userName || !password) {
    return res.status(400).json({
      status: 'error',
      message: 'Vui lòng cung cấp cả userName và password (mã hoá Base64/MD5).'
    });
  }

  // 1. Tìm user trong CSDL
  const user = await findUserByUsername(userName);
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'Tài khoản hoặc mật khẩu không chính xác.'
    });
  }

  // 2. Xác thực mật khẩu (hỗ trợ Base64 / MD5 từ client)
  const isValidPassword = verifyPassword(password, user.Password);
  if (!isValidPassword) {
    return res.status(401).json({
      status: 'error',
      message: 'Tài khoản hoặc mật khẩu không chính xác.'
    });
  }

  // 3. Sinh JWT Token
  const payload = {
    IdUser: user.IdUser,
    UserName: user.UserName,
    iat: Math.floor(Date.now() / 1000)
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  // 4. Lưu Token vào bảng User trong CSDL (cập nhật cột Token)
  await updateUserToken(user.IdUser, token);

  // 5. Giải mã cấu trúc token để trả về thông tin phục vụ kiểm tra
  const decodedHeader = jwt.decode(token, { complete: true })?.header;
  const decodedPayload = jwt.decode(token);

  return res.status(200).json({
    status: 'success',
    message: 'Đăng nhập thành công! Đã tạo và cập nhật Token vào CSDL.',
    token: token,
    tokenType: 'Bearer',
    user: {
      IdUser: user.IdUser,
      UserName: user.UserName
    },
    tokenDetails: {
      header: decodedHeader,
      payload: decodedPayload
    }
  });
};

// Đăng ký route gốc (localhost:****/) và /login
app.post('/', handleLogin);
app.post('/login', handleLogin);

/**
 * @openapi
 * /auth:
 *   post:
 *     summary: API Xác thực JWT Token (localhost:3000/auth)
 *     description: "Tiếp nhận Token từ Header (Authorization: Bearer token) hoặc Body/Query, tiến hành kiểm tra tính hợp lệ và giải mã cấu trúc Token."
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthVerifyRequest'
 *     responses:
 *       200:
 *         description: Token hợp lệ
 *       401:
 *         description: Thiếu token
 *       403:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
const handleAuthVerify = (req, res) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    token = req.headers['x-access-token'] || req.body?.token || req.query?.token;
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      valid: false,
      message: 'Thiếu Token xác thực. Vui lòng gửi Token qua Header Authorization (Bearer <token>) hoặc trong body JSON ({ "token": "..." }).'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        status: 'error',
        valid: false,
        message: 'Token không hợp lệ hoặc đã hết hạn!',
        error: err.message
      });
    }

    const decodedHeader = jwt.decode(token, { complete: true })?.header;

    return res.status(200).json({
      status: 'success',
      valid: true,
      message: 'Token hợp lệ!',
      tokenStructure: {
        header: decodedHeader,
        payload: decoded,
        signature: 'Validated with JWT_SECRET'
      }
    });
  });
};

app.post('/auth', handleAuthVerify);
app.get('/auth', handleAuthVerify);

/**
 * @openapi
 * /hello:
 *   get:
 *     summary: API In dòng "Hello World" (Được bảo vệ bởi Middleware xác thực Token)
 *     description: API thực hành số 1 được bảo vệ bởi Middleware authenticateToken. Chỉ truy cập được khi gửi Token hợp lệ.
 *     tags: [Protected API]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về dòng Hello World cùng thông tin user
 *       401:
 *         description: Chưa xác thực token
 *       403:
 *         description: Token không hợp lệ
 */
const handleHelloWorld = (req, res) => {
  return res.status(200).send("Hello World");
};

// Route trả về JSON chi tiết kèm Hello World
app.get('/hello', authenticateToken, handleHelloWorld);
app.post('/hello', authenticateToken, handleHelloWorld);

// Route JSON cho Hello World
app.get('/hello-json', authenticateToken, (req, res) => {
  return res.status(200).json({
    message: 'Hello World',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Khởi chạy server và kết nối CSDL
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Server JWT Demo đang chạy tại: http://localhost:${PORT}`);
    console.log(`📑 Swagger Documentation (Swagger UI): http://localhost:${PORT}/api-docs`);
    console.log(`🔑 Login API: POST http://localhost:${PORT}/`);
    console.log(`🛡️  Auth API:  POST http://localhost:${PORT}/auth`);
    console.log(`🌐 Hello API: GET  http://localhost:${PORT}/hello`);
    console.log(`==================================================\n`);
  });
});
