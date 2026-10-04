const mysql = require('mysql2/promise');
require('dotenv').config();

// In-Memory Database fallback (Seed data matching User schema in Phụ lục)
const mockUsers = [
  {
    IdUser: 1,
    UserName: 'admin',
    Password: 'MTIzNDU2', // '123456' in Base64
    Token: null
  },
  {
    IdUser: 2,
    UserName: 'user1',
    Password: 'e10adc3949ba59abbe56e057f20f883e', // '123456' in MD5
    Token: null
  },
  {
    IdUser: 3,
    UserName: 'testuser',
    Password: 'cGFzc3dvcmQxMjM=', // 'password123' in Base64
    Token: null
  }
];

let pool = null;
let useMock = false;

async function initDB() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'jwt_demo_db',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL Database successfully!');
    connection.release();
    useMock = false;
  } catch (err) {
    console.warn('⚠️  Could not connect to MySQL Database:', err.message);
    console.warn('💡 Falling back to In-Memory Mock Database for instant testing & demonstration.');
    useMock = true;
  }
}

async function findUserByUsername(userName) {
  if (useMock || !pool) {
    return mockUsers.find(u => u.UserName === userName) || null;
  }

  try {
    const [rows] = await pool.execute(
      'SELECT IdUser, UserName, Password, Token FROM `User` WHERE UserName = ? LIMIT 1',
      [userName]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('MySQL Query Error (findUserByUsername):', error.message);
    // Fallback to mock if table missing or error
    return mockUsers.find(u => u.UserName === userName) || null;
  }
}

async function updateUserToken(idUser, token) {
  if (useMock || !pool) {
    const user = mockUsers.find(u => u.IdUser === idUser);
    if (user) {
      user.Token = token;
      return true;
    }
    return false;
  }

  try {
    await pool.execute(
      'UPDATE `User` SET Token = ? WHERE IdUser = ?',
      [token, idUser]
    );
    return true;
  } catch (error) {
    console.error('MySQL Query Error (updateUserToken):', error.message);
    const user = mockUsers.find(u => u.IdUser === idUser);
    if (user) user.Token = token;
    return true;
  }
}

async function findUserById(idUser) {
  if (useMock || !pool) {
    return mockUsers.find(u => u.IdUser === idUser) || null;
  }

  try {
    const [rows] = await pool.execute(
      'SELECT IdUser, UserName, Password, Token FROM `User` WHERE IdUser = ? LIMIT 1',
      [idUser]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('MySQL Query Error (findUserById):', error.message);
    return mockUsers.find(u => u.IdUser === idUser) || null;
  }
}

module.exports = {
  initDB,
  findUserByUsername,
  updateUserToken,
  findUserById
};
