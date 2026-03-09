# Thai Word Game - Backend API

Backend API สำหรับเกมเติมคำภาษาไทย ใช้ Node.js, Express และ MongoDB

## 🚀 การติดตั้ง

### 1. ติดตั้ง Dependencies

```bash
cd backend
npm install
```

### 2. สร้าง MongoDB Atlas Account

1. ไปที่ https://www.mongodb.com/cloud/atlas/register
2. สมัครสมาชิกฟรี (Free Tier)
3. สร้าง Cluster ใหม่ (เลือก Free M0)
4. รอ Cluster สร้างเสร็จ (2-5 นาที)

### 3. ตั้งค่า MongoDB Atlas

1. คลิก **Database Access** → Add New Database User
   - Username: เช่น `gameuser`
   - Password: สร้างรหัสผ่านที่แข็งแรง (เก็บไว้ใช้ในขั้นตอนถัดไป)
   - Database User Privileges: เลือก **Read and write to any database**

2. คลิก **Network Access** → Add IP Address
   - เลือก **Allow Access from Anywhere** (0.0.0.0/0)
   - หรือระบุ IP ของคุณเอง

3. คลิก **Database** → Connect → Drivers
   - เลือก Node.js
   - คัดลอก Connection String
   - จะได้ URL แบบนี้: 
     ```
     mongodb+srv://gameuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```

### 4. ตั้งค่า Environment Variables

1. คัดลอกไฟล์ `.env.example` เป็น `.env`:
   ```bash
   cp .env.example .env
   ```

2. แก้ไขไฟล์ `.env`:
   ```env
   MONGODB_URI=mongodb+srv://gameuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/thai-word-game?retryWrites=true&w=majority
   JWT_SECRET=your-random-secret-key-change-this
   PORT=3000
   FRONTEND_URL=http://127.0.0.1:5500
   ```

   **แทนที่:**
   - `YOUR_PASSWORD` = รหัสผ่านที่สร้างใน MongoDB Atlas
   - `your-random-secret-key-change-this` = สุ่มข้อความยาวๆ เช่น `myGame2024SecretKey!@#`

### 5. รัน Server

```bash
npm start
```

หรือใช้ nodemon สำหรับ development:
```bash
npm run dev
```

เมื่อเห็นข้อความนี้แสดงว่าพร้อมใช้งาน:
```
✅ Connected to MongoDB
🚀 Server running on http://localhost:3000
```

## 📡 API Endpoints

### Authentication

**POST** `/api/auth/register`
- Body: `{ username, password, displayName, characterId }`
- Response: `{ token, user }`

**POST** `/api/auth/login`
- Body: `{ username, password }`
- Response: `{ token, user }`

### User

**GET** `/api/user/profile`
- Headers: `Authorization: Bearer <token>`
- Response: `{ user }`

**PUT** `/api/user/profile`
- Headers: `Authorization: Bearer <token>`
- Body: `{ displayName, characterId }`
- Response: `{ user }`

### Progress

**GET** `/api/progress`
- Headers: `Authorization: Bearer <token>`
- Response: `{ progress }`

**PUT** `/api/progress`
- Headers: `Authorization: Bearer <token>`
- Body: `{ unlockedLevels, levelScores, answeredWords, ... }`
- Response: `{ progress }`

### Leaderboard

**GET** `/api/leaderboard/:period`
- Period: `daily`, `weekly`, `monthly`, `allTime`
- Query: `?limit=100`
- Response: `[ { userId, username, score, ... } ]`

**POST** `/api/leaderboard`
- Headers: `Authorization: Bearer <token>`
- Body: `{ score, level, period }`
- Response: `{ entry }`

## 🔒 Security

- รหัสผ่านเข้ารหัสด้วย bcrypt
- Authentication ใช้ JWT (7 วันหมดอายุ)
- CORS ป้องกันการเข้าถึงจาก domain อื่น

## 🛠️ Tech Stack

- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## 📝 Database Schema

### User
```javascript
{
  username: String (unique),
  password: String (hashed),
  displayName: String,
  characterId: Number,
  characterImage: String,
  totalScore: Number,
  gamesPlayed: Number,
  createdAt: Date,
  lastLoginAt: Date
}
```

### Progress
```javascript
{
  userId: ObjectId,
  unlockedLevels: [Number],
  levelScores: Map<Number, Number>,
  answeredWords: Map<Number, [String]>,
  completedLevels: [Number],
  currentLevel: Number,
  totalStars: Number
}
```

### Leaderboard
```javascript
{
  userId: ObjectId,
  username: String,
  displayName: String,
  characterId: Number,
  score: Number,
  level: Number,
  period: String ('daily'|'weekly'|'monthly'|'allTime'),
  date: Date
}
```
