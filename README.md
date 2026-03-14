# TeenCare – Mini LMS

Ứng dụng web mini quản lý **Học sinh – Phụ huynh**, **Lớp học** và **Gói học** (subscription).  
Tech stack: **MongoDB**, **Node.js + Express**, **Next.js + Tailwind + shadcn/ui**.

---

## 1. Cách dựng project (build/run với Docker)

### Yêu cầu

- [Docker](https://docs.docker.com/get-docker/) và Docker Compose
- (Nếu chạy local) Node.js 18+, MongoDB

### Build và chạy toàn bộ (MongoDB + Backend + Frontend)

Tại thư mục gốc dự án:

```bash
cd teen-up
docker compose up --build
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:3001  
- **MongoDB:** localhost:27017

Chạy nền:

```bash
docker compose up -d --build
```

### Seed dữ liệu mẫu (sau khi container đã chạy)

```bash
docker compose exec backend npm run seed
```

### Dừng

```bash
docker compose down
```

### Chạy local (không dùng Docker)

1. **MongoDB:** Chạy MongoDB local hoặc dùng Atlas, tạo file `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/teenup
   PORT=3001
   ```

2. **Backend:**
   ```bash
   cd backend && npm install && npm run dev
   ```

3. **Frontend:** Tạo `frontend/.env.local` (copy từ `frontend/.env.example`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   ```
   Rồi chạy:
   ```bash
   cd frontend && npm install && npm run dev
   ```

4. Seed (trong thư mục backend): `npm run seed`

---

## 2. Mô tả sơ lược database schema (MongoDB)

Mỗi collection tương ứng một Mongoose model; `_id` là ObjectId, có `createdAt`/`updatedAt` khi dùng timestamps.

| Collection | Mô tả | Field chính |
|------------|--------|--------------|
| **parents** | Phụ huynh | `name`, `phone`, `email` |
| **students** | Học sinh | `name`, `dob`, `gender`, `currentGrade`, `parentId` (ref Parent) |
| **classes** | Lớp học | `name`, `subject`, `dayOfWeek` (0–6), `timeSlot`, `teacherName`, `maxStudents` |
| **classregistrations** | Đăng ký lớp | `classId`, `studentId` (unique cặp) |
| **subscriptionpackages** | Gói mẫu (catalog) | `key`, `name`, `price`, `totalSessions`, `benefits[]`, `isPopular` |
| **subscriptions** | Gói học của HS | `studentId`, `packageId`/`packageName`, `price`, `startDate`, `endDate`, `totalSessions`, `usedSessions` |
| **attendances** | Điểm danh | `classId`, `studentId`, `date`, `status` (present/absent/late/excused), `note` |
| **activitylogs** | Nhật ký thao tác | `action`, `entity`, `entityId`, `description`, `metadata` |

Quan hệ chính:

- Student → Parent (`parentId`)
- ClassRegistration → Class, Student
- Subscription → Student, SubscriptionPackage (optional)
- Attendance → Class, Student

---

## 3. Các endpoint chính và ví dụ truy vấn

Base URL API: `http://localhost:3001/api` (khi chạy Docker hoặc backend local).

### Health

```bash
curl http://localhost:3001/api/health
# {"ok":true}
```

### Parents

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/parents` | Tạo phụ huynh |
| GET | `/api/parents` | Danh sách (query: `?search=&page=&limit=`) |
| GET | `/api/parents/:id` | Chi tiết |
| PUT | `/api/parents/:id` | Cập nhật |
| DELETE | `/api/parents/:id` | Xoá |

```bash
# Tạo phụ huynh
curl -X POST http://localhost:3001/api/parents \
  -H "Content-Type: application/json" \
  -d '{"name":"Nguyễn Văn A","phone":"0901234567","email":"a@example.com"}'

# Danh sách
curl "http://localhost:3001/api/parents?page=1&limit=10"
```

### Students

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/students` | Tạo học sinh |
| GET | `/api/students` | Danh sách (query: `?search=&parentId=&page=`) |
| GET | `/api/students/:id` | Chi tiết |
| PUT | `/api/students/:id` | Cập nhật |
| DELETE | `/api/students/:id` | Xoá |

```bash
# Tạo học sinh (parentId lấy từ POST parents ở trên)
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Nguyễn An","dob":"2015-05-10","gender":"male","current_grade":"4","parent_id":"<PARENT_ID>"}'
```

### Classes

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/classes` | Tạo lớp |
| GET | `/api/classes` | Danh sách (query: `?day=0..6&search=&page=`) |
| POST | `/api/classes/:classId/register` | Đăng ký học sinh vào lớp |

```bash
# Tạo lớp (dayOfWeek: 0=CN, 1=T2,..., 6=T7; timeSlot: "09:00 - 10:30")
curl -X POST http://localhost:3001/api/classes \
  -H "Content-Type: application/json" \
  -d '{"name":"Toán 4A","subject":"Toán","dayOfWeek":1,"timeSlot":"09:00 - 10:30","teacherName":"Trần Thị C","maxStudents":15}'

# Đăng ký học sinh vào lớp
curl -X POST "http://localhost:3001/api/classes/<CLASS_ID>/register" \
  -H "Content-Type: application/json" \
  -d '{"student_id":"<STUDENT_ID>"}'
```

### Registrations (đăng ký lớp)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/registrations` | Danh sách (query: `?studentId=&classId=&page=`) |
| DELETE | `/api/registrations/:id` | Huỷ đăng ký (có logic hoàn buổi nếu >24h trước giờ học) |

```bash
curl "http://localhost:3001/api/registrations"
curl -X DELETE "http://localhost:3001/api/registrations/<REG_ID>"
```

### Packages (gói mẫu)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/packages` | Danh sách gói đăng ký |

```bash
curl http://localhost:3001/api/packages
```

### Subscriptions (gói học của học sinh)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/subscriptions` | Tạo gói (dùng `package_key` hoặc gửi `package_name`, `total_sessions`, …) |
| GET | `/api/subscriptions` | Danh sách (query: `?studentId=&active=&page=`) |
| GET | `/api/subscriptions/:id` | Chi tiết |
| PATCH | `/api/subscriptions/:id/use` | Đánh dấu đã dùng 1 buổi |

```bash
# Tạo gói (theo package_key từ GET /api/packages)
curl -X POST http://localhost:3001/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"student_id":"<STUDENT_ID>","package_key":"huan_luyen","start_date":"2025-03-01","end_date":"2025-06-01"}'

# Đánh dấu đã dùng 1 buổi
curl -X PATCH "http://localhost:3001/api/subscriptions/<SUB_ID>/use"
```

### Dashboard & Attendance

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/dashboard` | Thống kê tổng hợp (số lượng, doanh thu, hoạt động gần đây) |
| POST | `/api/attendance` | Tạo điểm danh |
| GET | `/api/attendance` | Danh sách (query: `?classId=&studentId=&date=&page=`) |
| PATCH | `/api/attendance/:id` | Cập nhật trạng thái điểm danh |

```bash
curl http://localhost:3001/api/dashboard
curl -X POST http://localhost:3001/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"classId":"<CLASS_ID>","studentId":"<STUDENT_ID>","date":"2025-03-15","status":"present"}'
```

---

## 4. Ví dụ data seed (ít nhất 2 parents, 3 students, 2–3 classes)

Sau khi chạy `docker compose exec backend npm run seed` (hoặc `npm run seed` trong thư mục backend), dữ liệu mẫu gồm:

- **2 parents**
  - Nguyễn Văn A – 0901234567 – nguyenvana@email.com  
  - Trần Thị B – 0912345678 – tranthib@email.com  

- **3 students**
  - Nguyễn An (nam, lớp 4, parent A)  
  - Nguyễn Bình (nam, lớp 5, parent A)  
  - Trần Minh (nữ, lớp 4, parent B)  

- **3 classes**
  - Toán 4A – Toán – T2 09:00–10:30 – GV Trần Thị C – max 15  
  - Văn 4 – Văn – T2 14:00–15:30 – GV Lê Văn D – max 12  
  - Anh 4 – Tiếng Anh – T4 09:00–10:30 – GV Phạm Thị E – max 10  

- **3 subscription packages** (catalog): Học tập, Huấn luyện, Chăm sóc  

- **2 subscriptions** (gói đã đăng ký): 1 gói Huấn luyện cho HS 1, 1 gói Học tập cho HS 2  

Script seed nằm tại `backend/src/seed.js`.

---

## 5. (Tùy chọn) Script curl demo các API

File `scripts/demo-api.sh` gọi lần lượt các endpoint chính (health, parents, students, classes, packages, subscriptions, dashboard). Chạy sau khi backend đã chạy và đã seed:

```bash
chmod +x scripts/demo-api.sh
./scripts/demo-api.sh
```

Nếu dùng Postman: import bộ request từ file **Postman collection** (nếu có trong repo) hoặc tạo collection mới với base URL `http://localhost:3001/api` và các method/body như mục 3.
