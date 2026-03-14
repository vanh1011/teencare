# Teen Up – Mini LMS (Quản lý Học sinh – Phụ huynh & Lớp học)

## 1. Mô tả chung

Ứng dụng web mini cho phép:

- **Quản lý thông tin Học sinh – Phụ huynh**
- **Tạo và lên lịch Lớp học** cho học sinh
- **Quản lý Subscription (gói học)** cơ bản: khởi tạo, theo dõi buổi đã dùng / còn lại

Ứng dụng không cần hoàn thiện 100% chức năng LMS phức tạp, nhưng thể hiện rõ:

- Database schema phù hợp  
- RESTful API cho các nghiệp vụ chính  
- Giao diện đơn giản để tương tác với API  
- Cấu trúc project rõ ràng, có CI/CD script (Dockerfile + script build/run)

### 1.1. Tech stack

| Thành phần | Công nghệ |
|------------|-----------|
| **Database** | **MongoDB** |
| **API** | **Node.js** + **Express.js** |
| **Frontend** | **Next.js** (hoặc React) + **Tailwind CSS** + **shadcn/ui** |

- **Backend:** REST API JSON, Express routing, kết nối MongoDB (mongoose hoặc driver gốc).
- **Frontend:** Next.js/React, Tailwind để styling, **shadcn/ui** cho components (Button, Form, Table, Dialog, v.v.).

---

## 2. Cấu trúc project

```
teen-up/
├── backend/                       # Node.js + Express.js
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── validate.js        # Validation functions (email, phone, gender, date...)
│   │   │   └── errorHandler.js    # Global error handler chuẩn hoá response
│   │   ├── models/
│   │   │   ├── Parent.js
│   │   │   ├── Student.js
│   │   │   ├── Class.js
│   │   │   ├── ClassRegistration.js
│   │   │   ├── Subscription.js
│   │   │   ├── SubscriptionPackage.js
│   │   │   ├── Attendance.js       # Tier A: Điểm danh
│   │   │   └── ActivityLog.js      # Tier B: Activity log
│   │   ├── routes/
│   │   │   ├── parents.js          # CRUD + search + pagination
│   │   │   ├── students.js
│   │   │   ├── classes.js          # + register endpoint
│   │   │   ├── registrations.js    # + refund logic
│   │   │   ├── packages.js
│   │   │   ├── subscriptions.js
│   │   │   ├── dashboard.js        # Tier A: Stats API
│   │   │   └── attendance.js       # Tier A: Attendance CRUD
│   │   ├── app.js                  # Express app (routes + middleware)
│   │   ├── index.js                # Server entry point
│   │   └── seed.js
│   ├── tests/
│   │   └── api-validation.test.js  # Jest + Supertest
│   ├── Dockerfile
│   └── package.json
├── frontend/                       # Next.js + Tailwind + shadcn/ui
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Dashboard stats
│   │   │   ├── layout.tsx          # Sidebar dashboard layout
│   │   │   ├── parents/page.tsx    # CRUD phụ huynh
│   │   │   ├── students/page.tsx   # CRUD học sinh
│   │   │   ├── classes/page.tsx    # Lớp học + đăng ký + tạo lớp
│   │   │   ├── subscriptions/page.tsx # Gói học
│   │   │   ├── registrations/page.tsx # Đăng ký lớp
│   │   │   └── attendance/page.tsx    # Điểm danh
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── sidebar.tsx     # Sidebar navigation
│   │   │   │   ├── page-header.tsx # Page header component
│   │   │   │   └── stat-card.tsx   # Stat card component
│   │   │   └── ui/                 # shadcn/ui components
│   │   └── lib/
│   │       └── api.ts              # API client + types
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── README.md
└── scripts/
```

---

## 3. Database schema (MongoDB)

### 3.1. Tổng quan

Sử dụng **MongoDB**. Mỗi entity tương ứng một **collection**; `_id` dạng ObjectId (hoặc string). Liên kết giữa các collection qua reference (ObjectId).

| Collection            | Mô tả |
|-----------------------|--------|
| `parents`             | Thông tin phụ huynh |
| `students`            | Học sinh, tham chiếu parent qua `parentId` |
| `classes`             | Lớp học (môn, ngày, giờ, giáo viên, sĩ số tối đa) |
| `classregistrations`  | Đăng ký học sinh vào lớp (`classId`, `studentId`) |
| `subscriptions`      | Gói học của học sinh (tổng buổi, đã dùng, thời hạn) |

### 3.2. Chi tiết collection (Mongoose-style)

**Collection: `parents`**

| Field | Kiểu   | Mô tả        |
|-------|--------|--------------|
| _id   | ObjectId | Định danh (tự sinh) |
| name  | String | Tên phụ huynh |
| phone | String | Số điện thoại |
| email | String | Email        |

**Collection: `students`**

| Field        | Kiểu    | Mô tả           |
|--------------|---------|-----------------|
| _id          | ObjectId| Định danh       |
| name         | String  | Tên học sinh    |
| dob          | Date    | Ngày sinh       |
| gender       | String  | Giới tính       |
| currentGrade | String  | Lớp hiện tại    |
| parentId     | ObjectId| Ref → parents   |

**Collection: `classes`**

| Field       | Kiểu    | Mô tả              |
|-------------|---------|--------------------|
| _id         | ObjectId| Định danh          |
| name        | String  | Tên lớp            |
| subject     | String  | Môn học            |
| dayOfWeek   | Number  | Thứ (0–6 hoặc 1–7) |
| timeSlot    | String  | Khung giờ (VD: "09:00-10:30") |
| teacherName | String  | Tên giáo viên      |
| maxStudents | Number  | Sĩ số tối đa       |

**Collection: `classregistrations`**

| Field    | Kiểu    | Mô tả        |
|----------|---------|--------------|
| _id      | ObjectId | Định danh    |
| classId  | ObjectId | Ref → classes |
| studentId| ObjectId | Ref → students |

**Collection: `subscriptions`**

| Field         | Kiểu    | Mô tả                |
|---------------|---------|----------------------|
| _id           | ObjectId| Định danh            |
| studentId     | ObjectId| Ref → students       |
| packageName   | String  | Tên gói học          |
| startDate     | Date    | Ngày bắt đầu         |
| endDate       | Date    | Ngày hết hạn (BRD: expiry_date) |
| totalSessions | Number  | Tổng số buổi         |
| usedSessions  | Number  | Số buổi đã dùng      |

---

## 4. API Endpoints

Base URL: `http://localhost:3001/api` (hoặc port backend bạn cấu hình). Tất cả request/response dùng **JSON**.

### 4.1. Parents

| Method | Endpoint              | Mô tả           |
|--------|------------------------|-----------------|
| POST   | `/api/parents`         | Tạo phụ huynh   |
| GET    | `/api/parents/:id`     | Xem chi tiết    |

**Ví dụ – Tạo phụ huynh**

```bash
curl -X POST http://localhost:3001/api/parents \
  -H "Content-Type: application/json" \
  -d '{"name":"Nguyễn Văn A","phone":"0901234567","email":"nguyenvana@email.com"}'
```

**Ví dụ – Xem chi tiết**

```bash
curl http://localhost:3001/api/parents/1
```

---

### 4.2. Students

| Method | Endpoint               | Mô tả                              |
|--------|------------------------|-------------------------------------|
| POST   | `/api/students`        | Tạo học sinh (kèm parent_id)       |
| GET    | `/api/students/:id`     | Xem chi tiết (bao gồm thông tin parent) |

**Ví dụ – Tạo học sinh**

```bash
curl -X POST http://localhost:3001/api/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Nguyễn Văn B","dob":"2015-05-10","gender":"male","current_grade":"4","parent_id":1}'
```

**Ví dụ – Xem chi tiết**

```bash
curl http://localhost:3001/api/students/1
```

---

### 4.3. Classes

| Method | Endpoint                    | Mô tả                          |
|--------|-----------------------------|--------------------------------|
| POST   | `/api/classes`              | Tạo lớp mới                    |
| GET    | `/api/classes?day={weekday}`| Danh sách lớp theo ngày (0–6)  |

**Ví dụ – Tạo lớp**

```bash
curl -X POST http://localhost:3001/api/classes \
  -H "Content-Type: application/json" \
  -d '{"name":"Toán 4A","subject":"Toán","day_of_week":1,"time_slot":"09:00-10:30","teacher_name":"Trần Thị C","max_students":15}'
```

**Ví dụ – Lấy lớp theo thứ**

```bash
curl "http://localhost:3001/api/classes?day=1"
```

---

### 4.4. Class Registrations

| Method | Endpoint                                | Mô tả                                      |
|--------|-----------------------------------------|--------------------------------------------|
| POST   | `/api/classes/:class_id/register`       | Đăng ký học sinh vào lớp (có kiểm tra)     |
| DELETE | `/api/registrations/:id`                | Hủy đăng ký (có điều kiện hoàn buổi)       |

**Quy tắc khi đăng ký (POST register):**

1. **Sĩ số:** Không cho đăng ký nếu lớp đã đạt `max_students`.
2. **Trùng lịch:** Không cho học sinh đăng ký 2 lớp có `time_slot` trùng hoặc đè lên nhau (cùng `day_of_week`). Cần kiểm tra overlap nếu dùng khung giờ dạng "HH:mm-HH:mm".
3. **Gói học:** Chỉ cho đăng ký nếu có subscription còn hiệu lực: ngày hết hạn (`end_date` / expiry_date) chưa qua và `used_sessions < total_sessions`.

**Quy tắc khi hủy (DELETE registration):**

- Hủy **trước giờ học > 24h**: hoàn 1 buổi (`used_sessions` giảm 1).
- Hủy **sát giờ (< 24h)**: chỉ xóa đăng ký, không hoàn buổi.

**Ví dụ – Đăng ký vào lớp**

```bash
curl -X POST http://localhost:3001/api/classes/1/register \
  -H "Content-Type: application/json" \
  -d '{"student_id":1}'
```

**Ví dụ – Hủy đăng ký**

```bash
curl -X DELETE http://localhost:3001/api/registrations/1
```

---

### 4.5. Subscriptions

| Method | Endpoint                          | Mô tả                          |
|--------|-----------------------------------|--------------------------------|
| POST   | `/api/subscriptions`              | Khởi tạo gói học               |
| PATCH  | `/api/subscriptions/:id/use`      | Đánh dấu đã dùng 1 buổi        |
| GET    | `/api/subscriptions/:id`         | Xem trạng thái gói (tổng/đã dùng) |

**Ví dụ – Tạo gói**

```bash
curl -X POST http://localhost:3001/api/subscriptions \
  -H "Content-Type: application/json" \
  -d '{"student_id":1,"package_name":"Gói 12 buổi","start_date":"2025-03-01","end_date":"2025-06-01","total_sessions":12,"used_sessions":0}'
```

**Ví dụ – Đánh dấu đã dùng 1 buổi**

```bash
curl -X PATCH http://localhost:3001/api/subscriptions/1/use
```

**Ví dụ – Xem trạng thái gói**

```bash
curl http://localhost:3001/api/subscriptions/1
```

---

### 4.6. Validation & Business Rules (checklist test API)

Các rule nghiệp vụ và lỗi API cần validate khi test / viết test.

| Endpoint | Điều kiện / Rule | Response khi lỗi | HTTP |
|----------|------------------|-------------------|------|
| **POST /api/parents** | Thiếu name/phone/email (required) | `{ error: "..." }` (Mongoose validation) | 400 |
| **GET /api/parents/:id** | id không tồn tại hoặc invalid ObjectId | `{ error: "Parent not found" }` | 404 |
| **POST /api/students** | Thiếu parent_id hoặc parent không tồn tại | `{ error: "..." }` | 400 |
| **GET /api/students/:id** | id không tồn tại | `{ error: "Student not found" }` | 404 |
| **POST /api/classes** | Thiếu field bắt buộc (name, subject, dayOfWeek, timeSlot, teacherName, maxStudents) | `{ error: "..." }` | 400 |
| **POST /api/classes/:classId/register** | Thiếu `student_id` | `{ error: "student_id required" }` | 400 |
| **POST /api/classes/:classId/register** | classId không tồn tại | `{ error: "Class not found" }` | 404 |
| **POST /api/classes/:classId/register** | studentId không tồn tại | `{ error: "Student not found" }` | 404 |
| **POST /api/classes/:classId/register** | Lớp đã đủ sĩ số (currentCount >= maxStudents) | `{ error: "Lớp đã đạt sĩ số tối đa" }` | 400 |
| **POST /api/classes/:classId/register** | Học sinh đã đăng ký lớp này rồi | `{ error: "Học sinh đã đăng ký lớp này" }` | 400 |
| **POST /api/classes/:classId/register** | Trùng lịch: đã có lớp khác cùng ngày + overlap time_slot | `{ error: "Trùng lịch: học sinh đã có lớp khác cùng khung giờ trong ngày này" }` | 400 |
| **POST /api/classes/:classId/register** | Không có gói học còn hiệu lực hoặc đã hết buổi | `{ error: "Không có gói học còn hiệu lực hoặc đã hết buổi" }` | 400 |
| **DELETE /api/registrations/:id** | id không tồn tại | `{ error: "Registration not found" }` | 404 |
| **DELETE /api/registrations/:id** | Hủy > 24h trước giờ học → hoàn 1 buổi (usedSessions - 1); < 24h → không hoàn | Body `{ refunded: true }` hoặc `{ refunded: false }` | 200 |
| **POST /api/subscriptions** | Thiếu `student_id` | `{ error: "student_id là bắt buộc" }` | 400 |
| **POST /api/subscriptions** | `package_key` không tồn tại | `{ error: "Gói không tồn tại: <key>" }` | 400 |
| **POST /api/subscriptions** | Học sinh đã có gói cùng loại còn hiệu lực (endDate >= nay) | `{ error: "Học sinh đã có gói \"...\" còn hiệu lực. Không thể đăng ký trùng." }` | 400 |
| **GET /api/subscriptions/:id** | id không tồn tại | `{ error: "Subscription not found" }` | 404 |
| **PATCH /api/subscriptions/:id/use** | id không tồn tại | `{ error: "Subscription not found" }` | 404 |
| **PATCH /api/subscriptions/:id/use** | Gói có totalSessions = 0 (không tính buổi) | `{ error: "Gói này không tính theo buổi" }` | 400 |
| **PATCH /api/subscriptions/:id/use** | Gói đã hết buổi (usedSessions >= totalSessions) | `{ error: "Gói đã hết buổi" }` | 400 |

Bộ test tự động nằm ở `backend/tests/`. Chạy (cần MongoDB đang chạy):

```bash
cd backend
npm run test
```

Mặc định dùng DB `teenup_test`; có thể set `MONGODB_URI_TEST=mongodb://localhost:27017/teenup_test`.

---

### 4.7. Các lỗ hổng validate đã bổ sung

Các validation trước đây thiếu hoặc chưa chặt, đã được fix:

| # | Lỗ hổng | Trước | Sau khi fix |
|---|---------|-------|-------------|
| 1 | **Email format** | Chỉ check `required`, chấp nhận `abc` | Regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` + check trùng email |
| 2 | **Phone format** | Chỉ check `required` | Regex `^(0|\+84)\d{9,10}$` – chuẩn VN |
| 3 | **Gender enum** | `type: String` tự do | Chỉ nhận `male`, `female`, `other` |
| 4 | **DOB tương lai** | Chấp nhận ngày sinh ở tương lai | Check `dob <= now` |
| 5 | **parentId tồn tại** | Chỉ check ObjectId format | Verify parent tồn tại trong DB |
| 6 | **startDate < endDate** | Không check | Validate `startDate < endDate` khi tạo subscription |
| 7 | **timeSlot format** | Tự do string | Regex `HH:MM - HH:MM` + check giờ bắt đầu < giờ kết thúc |
| 8 | **dayOfWeek range** | `min: 0, max: 6` ở schema | Validate ở route trước khi tạo, trả lỗi rõ |
| 9 | **maxStudents > 0** | `min: 1` ở schema | Validate ở route, trả lỗi rõ |
| 10 | **studentId tồn tại** | Không check khi tạo subscription | Verify student tồn tại trước khi tạo |
| 11 | **Gói hết hạn khi dùng buổi** | Cho dùng buổi dù gói đã expired | Check `endDate >= now` trước khi dùng |
| 12 | **Chuẩn hoá response** | Trả `{ error }` không thống nhất | Global error handler: `{ success, error, field? }` |

**File liên quan:**
- `backend/src/middleware/validate.js` – validation functions
- `backend/src/middleware/errorHandler.js` – global error handler chuẩn hoá response

---

### 4.8. Tier A – Dễ làm, ấn tượng cao (ĐÃ IMPLEMENT)

| # | Feature | Mô tả | Files |
|---|---------|-------|-------|
| A1 | **Dashboard API + UI** | `GET /api/dashboard` – trả stats tổng hợp (totalParents, totalStudents, totalClasses, activeSubs, revenue, classesByDay, recentActivities). Frontend hiển thị dashboard với stat cards, bar chart, activity log. | `backend/src/routes/dashboard.js`, `frontend/src/app/page.tsx` |
| A2 | **Input Validation Middleware** | Module validate tập trung: email regex, phone VN, gender enum, ObjectId, date range, timeSlot format. Mọi route đều dùng chung. | `backend/src/middleware/validate.js` |
| A3 | **Global Error Handler** | Middleware xử lý lỗi thống nhất: CastError → 400, duplicate key (11000) → 409, ValidationError → 400, unknown → 500. Response format chuẩn `{ success, error, field? }`. | `backend/src/middleware/errorHandler.js` |
| A4 | **Attendance Tracking** | Model `Attendance` (classId, studentId, date, status: present/absent/late/excused, note). API: `POST /api/attendance`, `GET /api/attendance?classId=&date=`, `PATCH /api/attendance/:id`. Check: chỉ điểm danh HS đã đăng ký lớp đó. | `backend/src/models/Attendance.js`, `backend/src/routes/attendance.js` |
| A5 | **CRUD đầy đủ (PUT + DELETE)** | Bổ sung `PUT /api/parents/:id`, `DELETE /api/parents/:id`, `PUT /api/students/:id`, `DELETE /api/students/:id` cho CRUD hoàn chỉnh. | `backend/src/routes/parents.js`, `backend/src/routes/students.js` |
| A6 | **Search + Pagination** | Tất cả list API đều hỗ trợ `?search=`, `?page=`, `?limit=`. Response format: `{ items: [...], pagination: { page, limit, total, totalPages } }`. | Tất cả routes |

---

### 4.9. Tier B – Effort vừa, impact lớn (ĐÃ IMPLEMENT)

| # | Feature | Mô tả | Files |
|---|---------|-------|-------|
| B1 | **Activity Log** | Model `ActivityLog` ghi lại mọi thao tác CRUD (action, entity, entityId, description, metadata). Dashboard hiển thị 10 hoạt động gần nhất. | `backend/src/models/ActivityLog.js`, mọi route đều ghi log |
| B2 | **Dashboard UI dạng Admin Panel** | Frontend chuyển từ layout simple sang **sidebar dashboard**: sidebar navigation (7 mục), stat cards, bar chart lớp theo ngày, subscription phân bổ, activity timeline. Responsive (mobile có hamburger menu). | `frontend/src/components/dashboard/sidebar.tsx`, `frontend/src/app/layout.tsx` |
| B3 | **Trang Đăng ký lớp riêng** | Trang `/registrations` hiển thị table tất cả đăng ký (học sinh, lớp, ngày, khung giờ), có nút huỷ đăng ký + thông báo hoàn buổi. | `frontend/src/app/registrations/page.tsx` |
| B4 | **Trang Điểm danh** | Trang `/attendance` với table điểm danh, filter theo ngày, form tạo điểm danh (chọn lớp → load danh sách HS đã đăng ký → chọn trạng thái). | `frontend/src/app/attendance/page.tsx` |
| B5 | **Trang Tạo lớp** | Dialog tạo lớp mới ngay trên trang Classes (tên, môn, ngày, khung giờ, GV, sĩ số). Validate realtime trên frontend + backend. | `frontend/src/app/classes/page.tsx` |

---

### 4.10. Tier C – Chưa cần (gợi ý mở rộng sau)

| # | Feature | Mô tả | Lý do chưa cần |
|---|---------|-------|-----------------|
| C1 | Authentication + Authorization | JWT login, role-based (admin/teacher/parent) | Mini LMS demo, không yêu cầu auth |
| C2 | Real-time notifications | WebSocket push khi có đăng ký mới / huỷ | Over-engineering cho scope hiện tại |
| C3 | Payment integration | Tích hợp cổng thanh toán (VNPay, Momo) | Cần infra + sandbox, effort lớn |
| C4 | Report export (PDF/Excel) | Xuất báo cáo điểm danh, doanh thu | Nice-to-have, dùng thư viện thêm |
| C5 | Multi-tenancy | Hỗ trợ nhiều trung tâm trên 1 hệ thống | Thay đổi kiến trúc lớn |
| C6 | File upload (avatar, tài liệu) | Upload ảnh học sinh, tài liệu lớp | Cần S3/cloudinary, ngoài scope |

---

### 4.11. API Endpoints tổng hợp (sau khi bổ sung)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| **Dashboard** | | |
| GET | `/api/dashboard` | Stats tổng hợp hệ thống |
| GET | `/api/health` | Health check |
| **Parents** | | |
| POST | `/api/parents` | Tạo phụ huynh (validate email, phone) |
| GET | `/api/parents?search=&page=&limit=` | Danh sách + tìm kiếm + phân trang |
| GET | `/api/parents/:id` | Chi tiết phụ huynh |
| PUT | `/api/parents/:id` | Cập nhật phụ huynh |
| DELETE | `/api/parents/:id` | Xoá phụ huynh |
| **Students** | | |
| POST | `/api/students` | Tạo học sinh (validate gender, parentId) |
| GET | `/api/students?search=&parentId=&page=` | Danh sách + tìm kiếm + filter |
| GET | `/api/students/:id` | Chi tiết học sinh |
| PUT | `/api/students/:id` | Cập nhật học sinh |
| DELETE | `/api/students/:id` | Xoá học sinh |
| **Classes** | | |
| POST | `/api/classes` | Tạo lớp (validate timeSlot, dayOfWeek) |
| GET | `/api/classes?day=&search=&page=` | Danh sách + filter theo ngày |
| POST | `/api/classes/:classId/register` | Đăng ký HS vào lớp (full validation) |
| **Registrations** | | |
| GET | `/api/registrations?studentId=&classId=` | Danh sách đăng ký + filter |
| DELETE | `/api/registrations/:id` | Huỷ đăng ký (logic hoàn buổi) |
| **Packages** | | |
| GET | `/api/packages` | Danh sách gói đăng ký |
| **Subscriptions** | | |
| POST | `/api/subscriptions` | Tạo gói học (validate trùng, date range) |
| GET | `/api/subscriptions?studentId=&active=&page=` | Danh sách + filter |
| GET | `/api/subscriptions/:id` | Chi tiết gói |
| PATCH | `/api/subscriptions/:id/use` | Dùng 1 buổi (check expired, hết buổi) |
| **Attendance** | | |
| POST | `/api/attendance` | Điểm danh (check HS đã đăng ký lớp) |
| GET | `/api/attendance?classId=&studentId=&date=&page=` | Danh sách + filter |
| PATCH | `/api/attendance/:id` | Cập nhật trạng thái điểm danh |

---

## 5. Frontend (Dashboard Admin Panel)

- **Công nghệ:** **Next.js** (App Router) + **Tailwind CSS** + **shadcn/ui** + **Lucide Icons**.
- **Layout:** Sidebar dashboard – sidebar cố định bên trái (responsive, mobile có hamburger), main content bên phải.
- **Các trang:**

| Route | Trang | Mô tả |
|-------|-------|-------|
| `/` | Dashboard | Stats cards (tổng phụ huynh, học sinh, lớp, gói), bar chart lớp theo ngày, subscription phân bổ, doanh thu, activity log |
| `/parents` | Phụ huynh | Table + search + CRUD (thêm/sửa/xoá) qua Dialog |
| `/students` | Học sinh | Table + search + CRUD, chọn phụ huynh từ dropdown |
| `/classes` | Lớp học | Grid 7 ngày (mỗi ngày là 1 card), tạo lớp + đăng ký HS |
| `/subscriptions` | Gói học | Cards gói + table gói đã đăng ký, đăng ký mới + dùng buổi |
| `/registrations` | Đăng ký lớp | Table tất cả đăng ký, huỷ đăng ký |
| `/attendance` | Điểm danh | Table điểm danh + filter theo ngày + form tạo mới |

- **UI pattern:** Dạng quản lý (admin panel), dùng `Table`, `Card`, `Dialog`, `Badge`, `Button` từ shadcn/ui.
- Giao diện responsive, gọi REST API qua module `lib/api.ts`.

---

## 6. DevOps & CI/CD

### 6.1. Dockerfile

- **Backend:** Dockerfile trong `backend/` – build và chạy **Node.js + Express** (node:20-alpine, npm install, npm start).
- **Frontend:** Dockerfile trong `frontend/` – build **Next.js** (node:20-alpine, npm run build, serve qua node hoặc static export).

### 6.2. Docker Compose

File `docker-compose.yml` tại root, chạy đồng thời:

- **Database:** **MongoDB** (1 service, image `mongo:7`).
- **Backend:** 1 service Node/Express (port 3001).
- **Frontend:** 1 service Next.js (port 3000).

Ví dụ cấu trúc:

```yaml
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo_data:/data/db]
  backend:
    build: ./backend
    ports: ["3001:3001"]
    environment:
      MONGODB_URI: mongodb://mongodb:27017/teenup
    depends_on: [mongodb]
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on: [backend]

volumes:
  mongo_data:
```

### 6.3. Script build/run

- **Bắt buộc (BRD):** Có script hoặc lệnh rõ ràng để build/run (vd: `./scripts/up.sh`, hoặc `npm run docker:up` trong package.json root gọi `docker-compose up --build`).
- Có thể thêm script seed DB sau khi DB ready (xem mục 8).

---

## 7. Hướng dẫn chạy

### Yêu cầu

- **Chạy Docker:** cài [Docker](https://docs.docker.com/get-docker/) và Docker Compose.
- **Chạy local:** Node.js 18+, [MongoDB](https://www.mongodb.com/try/download/community) (local hoặc [Atlas](https://www.mongodb.com/cloud/atlas)).

---

### Cách 1: Chạy bằng Docker (khuyến nghị)

**Bước 1 – Mở terminal tại thư mục gốc dự án:**

```bash
cd teen-up
```

**Bước 2 – Build và chạy tất cả service (MongoDB + Backend + Frontend):**

```bash
docker compose up --build
```

Hoặc chạy nền:

```bash
docker compose up -d --build
```

**Bước 3 – Seed dữ liệu mẫu (chạy trong terminal khác, sau khi các container đã chạy):**

```bash
docker compose exec backend npm run seed
```

**Bước 4 – Mở trình duyệt:**

- **Giao diện:** http://localhost:3000  
- **API:** http://localhost:3001  
- **API health:** http://localhost:3001/api/health  

**Dừng:**

```bash
docker compose down
```

**Lệnh thay thế (nếu dùng script / npm):**

```bash
./scripts/up.sh
# hoặc
npm run docker:up
```

---

### Cách 2: Chạy local (không Docker)

**Bước 1 – MongoDB:** Cài và chạy MongoDB (local hoặc dùng connection string Atlas). Database dùng: `teenup` (tự tạo khi kết nối).

**Bước 2 – Backend:**

```bash
cd backend
npm install
npm run dev
```

Backend chạy tại http://localhost:3001. (Có thể tạo file `.env` với `MONGODB_URI=mongodb://localhost:27017/teenup` và `PORT=3001`.)

**Bước 3 – Seed (một lần, trong thư mục backend):**

```bash
npm run seed
```

**Bước 4 – Frontend (mở terminal mới):**

```bash
cd frontend
npm install
npm run dev
```

Frontend chạy tại http://localhost:3000. (Mặc định gọi API tại http://localhost:3001; nếu khác thì tạo `.env.local` với `NEXT_PUBLIC_API_URL=http://localhost:3001`.)

**Bước 5 – Mở trình duyệt:** http://localhost:3000

---

### Tóm tắt URL

| Môi trường | Frontend | Backend API |
|------------|----------|-------------|
| Docker     | http://localhost:3000 | http://localhost:3001 |
| Local      | http://localhost:3000 | http://localhost:3001 |

---

## 8. Seed data (ví dụ)

Theo BRD, seed **ít nhất**: 2 parents, 3 students, 2–3 classes. Có thể thêm subscriptions để test đăng ký lớp.

- **2 parents**
- **3 students** (gán đúng `parentId` – ObjectId của parent)
- **2–3 classes** (khác `dayOfWeek` / `timeSlot` để test trùng lịch và sĩ số)
- **1–2 subscriptions** (1 gói còn hiệu lực, 1 gói hết hạn hoặc hết buổi – tùy chọn)

Ví dụ dữ liệu mẫu (MongoDB, field naming camelCase):

**parents**

| _id (ObjectId) | name         | phone      | email              |
|----------------|--------------|------------|--------------------|
| ...            | Nguyễn Văn A | 0901234567 | nguyenvana@email.com |
| ...            | Trần Thị B   | 0912345678 | tranthib@email.com   |

**students**

| _id | name        | dob        | gender | currentGrade | parentId |
|-----|-------------|------------|--------|--------------|----------|
| ... | Nguyễn An   | 2015-05-10 | male   | 4            | &lt;parent1_id&gt; |
| ... | Nguyễn Bình | 2014-08-22 | male   | 5            | &lt;parent1_id&gt; |
| ... | Trần Minh   | 2015-01-15 | female | 4            | &lt;parent2_id&gt; |

**classes**

| _id | name    | subject   | dayOfWeek | timeSlot   | teacherName | maxStudents |
|-----|---------|-----------|-----------|------------|-------------|-------------|
| ... | Toán 4A | Toán      | 1         | 09:00-10:30| Trần Thị C  | 15          |
| ... | Văn 4   | Văn       | 1         | 14:00-15:30| Lê Văn D    | 12          |
| ... | Anh 4   | Tiếng Anh | 3         | 09:00-10:30| Phạm Thị E  | 10          |

**subscriptions**

| _id | studentId | packageName | startDate | endDate   | totalSessions | usedSessions |
|-----|-----------|-------------|-----------|-----------|---------------|--------------|
| ... | &lt;student1_id&gt; | Gói 12 buổi | 2025-03-01 | 2025-06-01 | 12 | 0 |
| ... | &lt;student2_id&gt; | Gói 8 buổi  | 2025-03-01 | 2025-05-01 | 8  | 2 |

---

## 9. Tóm tắt

| Thành phần   | Nội dung chính |
|-------------|----------------|
| **DB**      | **MongoDB** – 8 collections: parents, students, classes, classregistrations, subscriptions, subscriptionpackages, attendances, activitylogs |
| **API**     | **Node.js + Express** – 25+ REST endpoints, validation middleware, global error handler, pagination + search |
| **Frontend**| **Next.js** + **Tailwind** + **shadcn/ui** – Dashboard admin panel (sidebar layout, 7 trang, stat cards, charts, CRUD tables) |
| **DevOps**  | Dockerfile (backend + frontend), docker-compose (MongoDB + backend + frontend), README, Jest tests |
| **Extras**  | Activity log, attendance tracking, input validation chuẩn, duplicate prevention, date range check |

---

## 10. Các phase triển khai (thứ tự code từ đầu)

Khi dựng dự án từ đầu, nên code theo thứ tự sau để có nền tảng trước, nghiệp vụ phức tạp sau.

| Phase | Mục tiêu | Việc cần làm |
|-------|----------|--------------|
| **Phase 1** | Khung project + DB | Tạo repo, cấu trúc thư mục `backend/` và `frontend/`. Backend: init Node + Express, kết nối MongoDB. Định nghĩa Mongoose schema cho **Parents**, **Students**, **Classes**, **ClassRegistrations**, **Subscriptions**. Có thể thêm script seed cơ bản. |
| **Phase 2** | API CRUD nền | Implement các route: **Parents** (POST, GET/:id), **Students** (POST, GET/:id kèm populate parent), **Classes** (POST, GET với query `?day=`), **Subscriptions** (POST, GET/:id, PATCH/:id/use). Test bằng curl/Postman. |
| **Phase 3** | API nghiệp vụ đăng ký / hủy | **POST /api/classes/:classId/register**: validate sĩ số, trùng lịch (cùng `dayOfWeek` + `timeSlot`), gói học còn hiệu lực và còn buổi. **DELETE /api/registrations/:id**: hủy đăng ký; nếu trước giờ học > 24h thì hoàn 1 buổi (giảm `usedSessions`), &lt; 24h thì chỉ xóa, không hoàn. |
| **Phase 4** | Frontend setup + layout | Init **Next.js**, cài **Tailwind**, cài **shadcn/ui** (`npx shadcn@latest init`). Cấu hình `NEXT_PUBLIC_API_URL`. Tạo layout chung (header, nav), trang chủ và cấu trúc route (vd: `/parents`, `/students`, `/classes`, `/subscriptions`). |
| **Phase 5** | Frontend: Form + danh sách cơ bản | Form tạo **Parent** và **Student** (gọi POST API). Trang **Classes**: bảng/lưới 7 ngày trong tuần, mỗi ngày list lớp (name, timeSlot, teacherName) – gọi GET `/api/classes?day=0..6`. Có thể thêm trang xem danh sách parent/student. |
| **Phase 6** | Frontend: Đăng ký lớp + gói học | Trang/modal **đăng ký học sinh vào lớp**: chọn student + class, gọi POST register; hiển thị lỗi khi vượt sĩ số / trùng lịch / hết gói. Trang **Subscriptions**: xem trạng thái gói (total/used), có thể gọi PATCH use. (Tuỳ chọn) thêm flow hủy đăng ký (DELETE registration). |
| **Phase 7** | DevOps + chạy full stack | Viết **Dockerfile** cho backend và frontend. Viết **docker-compose.yml** (MongoDB + backend + frontend). Script build/run (vd: `./scripts/up.sh` hoặc npm scripts). Cập nhật **README** với hướng dẫn clone, build, chạy và seed data. |

**Gợi ý thứ tự:**  
1 → 2 → 3 (backend xong, test API kỹ) rồi 4 → 5 → 6 (frontend). Phase 7 có thể làm song song hoặc cuối khi logic đã ổn.

---

## 11. Deliverables (đối chiếu BRD)

| Yêu cầu BRD | Trong repo / README |
|-------------|----------------------|
| Source code backend + frontend | Code trong `backend/`, `frontend/`; push lên GitHub/GitLab (kèm link repo). |
| README: cách dựng project (build/run với Docker) | Mục **7. Cách dựng project và chạy thử**. |
| README: mô tả sơ lược database schema | Mục **3. Database schema (MongoDB)**. |
| README: các endpoint chính và ví dụ truy vấn | Mục **4. API Endpoints** (kèm curl). |
| README: ví dụ data seed (ít nhất 2 parents, 3 students, 2–3 classes) | Mục **8. Seed data**. |
| Dockerfile backend + frontend | Mục **6.1**; file trong `backend/Dockerfile`, `frontend/Dockerfile`. |
| docker-compose.yml (backend + frontend + database) | Mục **6.2**; file `docker-compose.yml` tại root. |
| Script build/run | Mục **6.3**; cần có script hoặc npm script gọi `docker-compose up --build`. |

Khi triển khai, push source (backend + frontend) lên GitHub/GitLab riêng tư và gửi kèm **link repo**; README này đặt tại root để người khác dựng môi trường và chạy thử theo đúng đặc tả trên.
