# วิธี Deploy โปรเจค เกมส์เติมคำ แบบฟรี 🚀

โปรเจคนี้ประกอบด้วย 2 ส่วน:
- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js + Express + MongoDB

## 📋 สิ่งที่ต้องเตรียม

1. บัญชี GitHub (สมัครฟรีที่ [github.com](https://github.com))
2. บัญชี MongoDB Atlas (ฐานข้อมูลฟรี)
3. บัญชีสำหรับ deploy backend (เลือก 1 ใน 3):
   - Render (แนะนำ)
   - Railway
   - Fly.io

---

## 🗄️ ขั้นตอนที่ 1: ตั้งค่า MongoDB Atlas (ฐานข้อมูลฟรี)

### 1.1 สร้างบัญชีและ Cluster
1. ไปที่ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. สมัครบัญชีฟรี
3. สร้าง Cluster ใหม่ (เลือก FREE tier - M0)
4. เลือก Region ที่ใกล้ที่สุด (แนะนำ Singapore)

### 1.2 ตั้งค่าการเข้าถึง
1. คลิกที่ **Network Access** → **Add IP Address**
2. เลือก **Allow Access from Anywhere** (0.0.0.0/0)
3. คลิก **Confirm**

### 1.3 สร้าง Database User
1. คลิกที่ **Database Access** → **Add New Database User**
2. เลือก **Password** authentication
3. ตั้ง Username และ Password (จดไว้)
4. เลือก Role: **Read and write to any database**
5. คลิก **Add User**

### 1.4 รับ Connection String
1. กลับไปที่ **Database** → คลิก **Connect**
2. เลือก **Connect your application**
3. คัดลอก Connection String (รูปแบบ: `mongodb+srv://...`)
4. แทนที่ `<password>` ด้วยรหัสผ่านจริง

---

## 🖥️ ขั้นตอนที่ 2: Upload โค้ดขึ้น GitHub

### 2.1 สร้าง Repository
1. ไปที่ [GitHub](https://github.com) → คลิก **New repository**
2. ตั้งชื่อ เช่น `games-word-thai`
3. เลือก **Public**
4. คลิก **Create repository**

### 2.2 Upload โค้ด
เปิด Terminal ในโฟลเดอร์โปรเจค แล้วรันคำสั่ง:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/games-word-thai.git
git push -u origin main
```

---

## 🚀 ขั้นตอนที่ 3: Deploy Backend (เลือกวิธีใดวิธีหนึ่ง)

## วิธีที่ 1: Deploy ด้วย Render (แนะนำ - ฟรีตลอด)

### 3.1 สร้างบัญชี Render
1. ไปที่ [Render](https://render.com) → Sign up
2. เชื่อมต่อกับ GitHub account

### 3.2 Deploy Backend
1. คลิก **New +** → **Web Service**
2. เชื่อมต่อ GitHub repository ของคุณ
3. ตั้งค่าดังนี้:
   - **Name**: `games-word-backend` (หรือชื่อที่ต้องการ)
   - **Region**: Singapore
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start` หรือ `node server.js`
   - **Instance Type**: Free

4. คลิก **Advanced** → เพิ่ม Environment Variables:
   - `MONGODB_URI` = (Connection String จาก MongoDB Atlas)
   - `JWT_SECRET` = (สร้างรหัสลับสุ่ม เช่น `my-super-secret-key-12345`)
   - `PORT` = `10000`

5. คลิก **Create Web Service**
6. รอ 3-5 นาที จะได้ URL เช่น `https://games-word-backend.onrender.com`

---

## วิธีที่ 2: Deploy ด้วย Railway

### 3.1 สร้างบัญชี Railway
1. ไปที่ [Railway](https://railway.app) → Sign up with GitHub
2. ยืนยันอีเมล

### 3.2 Deploy Backend
1. คลิก **New Project** → **Deploy from GitHub repo**
2. เลือก repository ของคุณ
3. คลิก **Add variables**:
   - `MONGODB_URI` = (Connection String)
   - `JWT_SECRET` = (รหัสลับ)
   - `PORT` = `3000`

4. Railway จะ deploy อัตโนมัติ
5. ไปที่ **Settings** → **Networking** → **Generate Domain**
6. จะได้ URL เช่น `https://games-word-backend.up.railway.app`

---

## วิธีที่ 3: Deploy ด้วย Fly.io

### 3.1 ติดตั้ง Fly CLI
```bash
# Windows (PowerShell)
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# macOS/Linux
curl -L https://fly.io/install.sh | sh
```

### 3.2 Login และ Deploy
```bash
# Login
fly auth login

# ไปที่โฟลเดอร์ backend
cd backend

# สร้างแอป
fly launch --name games-word-backend

# ตั้งค่า Environment Variables
fly secrets set MONGODB_URI="your-mongodb-connection-string"
fly secrets set JWT_SECRET="your-secret-key"

# Deploy
fly deploy
```

จะได้ URL เช่น `https://games-word-backend.fly.dev`

---

## 🌐 ขั้นตอนที่ 4: Deploy Frontend

## วิธีที่ 1: Netlify (แนะนำ - ง่ายที่สุด)

### 4.1 เตรียม Frontend
สร้างไฟล์ `netlify.toml` ในโฟลเดอร์หลัก:

```toml
[build]
  publish = "."
  command = "echo 'No build command'"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 4.2 Deploy
1. ไปที่ [Netlify](https://www.netlify.com) → Sign up
2. คลิก **Add new site** → **Import an existing project**
3. เชื่อมต่อ GitHub และเลือก repository
4. ตั้งค่า:
   - **Build command**: (เว้นว่าง)
   - **Publish directory**: `.`
5. คลิก **Deploy site**

### 4.3 อัปเดต API URL
แก้ไขไฟล์ `js/api.js` เปลี่ยน URL ของ backend:

```javascript
const API_URL = 'https://games-word-backend.onrender.com'; // URL จาก Render
```

Push การเปลี่ยนแปลงขึ้น GitHub:
```bash
git add .
git commit -m "Update API URL"
git push
```

Netlify จะ deploy อัตโนมัติ 🎉

---

## วิธีที่ 2: Vercel

### 4.1 Deploy
1. ไปที่ [Vercel](https://vercel.com) → Sign up with GitHub
2. คลิก **Add New** → **Project**
3. Import repository ของคุณ
4. คลิก **Deploy**

### 4.2 อัปเดต API URL
แก้ไขไฟล์ `js/api.js` แล้ว push ขึ้น GitHub (เหมือนวิธี Netlify)

---

## วิธีที่ 3: GitHub Pages

### 4.1 เปิดใช้งาน GitHub Pages
1. ไปที่ repository บน GitHub
2. คลิก **Settings** → **Pages**
3. เลือก Source: **main branch**
4. คลิก **Save**

### 4.2 อัปเดต API URL
แก้ไขไฟล์ `js/api.js`:

```javascript
const API_URL = 'https://games-word-backend.onrender.com';
```

Push ขึ้น GitHub → รอ 1-2 นาที
เว็บจะอยู่ที่ `https://YOUR_USERNAME.github.io/games-word-thai`

---

## 🔧 ขั้นตอนที่ 5: แก้ไข CORS (สำคัญ!)

แก้ไขไฟล์ `backend/server.js` เพื่ออนุญาต frontend ของคุณ:

```javascript
const cors = require('cors');

// เพิ่ม URL ของ frontend ที่ deploy แล้ว
const corsOptions = {
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://YOUR-NETLIFY-SITE.netlify.app', // เปลี่ยนเป็น URL จริง
        'https://YOUR-GITHUB-PAGES.github.io'   // เปลี่ยนเป็น URL จริง
    ],
    credentials: true
};

app.use(cors(corsOptions));
```

Push การเปลี่ยนแปลงขึ้น GitHub → Backend จะ redeploy อัตโนมัติ

---

## ✅ ทดสอบ

1. เปิดเว็บที่ deploy แล้ว
2. ลองสมัครสมาชิก
3. ลองเล่นเกม
4. ตรวจสอบว่าคะแนนบันทึกได้

---

## 🎯 สรุป URL ที่ได้

- **Frontend**: `https://your-site.netlify.app`
- **Backend**: `https://games-word-backend.onrender.com`
- **Database**: MongoDB Atlas (ไม่มี URL สำหรับเข้าถึงโดยตรง)

---

## 🔍 แก้ไขปัญหาที่พบบ่อย

### 1. Backend ไม่ตอบสนอง
- ตรวจสอบ logs ใน Render/Railway/Fly.io
- ตรวจสอบว่า Environment Variables ตั้งค่าถูกต้อง
- ตรวจสอบ MongoDB Connection String

### 2. CORS Error
- ตรวจสอบว่าได้เพิ่ม frontend URL ใน CORS settings แล้ว
- ตรวจสอบว่า `credentials: true` ตั้งค่าไว้

### 3. Frontend ไม่เชื่อมต่อ Backend
- ตรวจสอบ API_URL ใน `js/api.js`
- เปิด Developer Console (F12) ดู error

### 4. Render Free Tier หลับ (Cold Start)
- Render free tier จะ "sleep" หลังไม่มีใช้งาน 15 นาที
- ครั้งแรกที่เข้าอาจช้า 30-50 วินาที (ปกติ)
- ทางแก้: ใช้ [UptimeRobot](https://uptimerobot.com) ping ทุก 5 นาที

---

## 💰 ค่าใช้จ่าย

### ฟรีตลอดกาล:
- **MongoDB Atlas**: 512 MB storage ฟรี
- **Render**: 750 ชั่วโมง/เดือน ฟรี
- **Netlify/Vercel**: ฟรีไม่จำกัด bandwidth
- **GitHub Pages**: ฟรีไม่จำกัด

### ข้อจำกัดของ Free Tier:
- Render: Backend จะ sleep หลัง 15 นาที ไม่มีใช้งาน
- MongoDB Atlas: จำกัด 512 MB และ 5 connections พร้อมกัน
- Railway: ฟรี $5 credit/เดือน (ประมาณ 500 ชั่วโมง)

---

## 🎨 ปรับแต่งเพิ่มเติม

### เพิ่ม Custom Domain (ฟรี)
1. ซื้อโดเมนจาก [Freenom](https://www.freenom.com) (ฟรี)
2. ตั้งค่า DNS ใน Netlify/Vercel

### เพิ่ม SSL Certificate
- Netlify และ Vercel ให้ SSL ฟรีอัตโนมัติ (HTTPS)

---

## 📞 การสนับสนุน

หากมีปัญหา:
1. ตรวจสอบ logs ในแต่ละ platform
2. อ่าน documentation ของ Render/Railway/Netlify
3. ถามใน Discord/Forum ของแต่ละ platform

---

**สำเร็จแล้ว! 🎉 เกมของคุณพร้อมให้ทั่วโลกเล่นได้แบบฟรี!**

---

## 📝 Checklist สำหรับ Deployment

- [ ] สร้าง MongoDB Atlas cluster และได้ connection string
- [ ] Upload โค้ดขึ้น GitHub
- [ ] Deploy backend (Render/Railway/Fly.io)
- [ ] ตั้งค่า Environment Variables บน backend
- [ ] Deploy frontend (Netlify/Vercel/GitHub Pages)
- [ ] อัปเดต API_URL ในไฟล์ `js/api.js`
- [ ] แก้ไข CORS settings ใน backend
- [ ] ทดสอบสมัครสมาชิกและเล่นเกม
- [ ] แชร์ลิงก์เกมให้เพื่อน ๆ ทดสอบ

**Happy Deployment! 🚀**
