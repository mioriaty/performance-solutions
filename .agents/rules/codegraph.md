# Rule: Code Intelligence via CodeGraph MCP

## 1. Core Mandate

- Repository này đã được lập chỉ mục đầy đủ bằng CodeGraph (.codegraph/).
- **NGHIÊM CẤM** việc lạm dụng `grep`, `glob_files`, `file_search`, hoặc đọc tuần tự nhiều file source code (`read_file`) để lần mò cấu trúc hoặc tìm symbol references.
- **LUÔN LUÔN** ưu tiên sử dụng các MCP tools của CodeGraph trước khi chuyển sang các tool đọc file hệ thống cơ bản.

---

## 2. Tool Trigger Matrix (Khi nào dùng tool gì?)

| Tình huống / Nhiệm vụ                             | MCP Tool bắt buộc   | Mục tiêu                                                                     |
| :------------------------------------------------ | :------------------ | :--------------------------------------------------------------------------- |
| Tìm kiếm hàm, biến, type, component, API endpoint | `codegraph_search`  | Lấy nhanh vị trí chính xác và định nghĩa của symbol trong toàn bộ repo       |
| Khám phá kiến trúc, luồng thực thi, caller/callee | `codegraph_explore` | Trace call graph từ entry point (page/route) sâu vào service/action          |
| Refactor, sửa đổi interface, đổi tên hàm/type     | `codegraph_impact`  | Phân tích Blast Radius (tất cả các file, component, hook bị ảnh hưởng)       |
| Kiểm tra chi tiết 1 symbol hoặc node cụ thể       | `codegraph_node`    | Lấy source code, signature, metadata của symbol mà không cần mở toàn bộ file |
| Kiểm tra phụ thuộc vòng (circular imports)        | `codegraph_cycles`  | Phát hiện vòng lặp import gây lỗi build hoặc re-render vô tận                |

---

## 3. Mandatory Investigation Workflow

Mỗi khi nhận yêu cầu liên quan đến tìm hiểu luồng code, fix bug, hoặc refactor:

1. **Giai đoạn Discovery (Khám phá):**

- Gọi `codegraph_search` hoặc `codegraph_explore` để xác định đúng component, handler, hoặc service liên quan.
- Chỉ đọc source file cụ thể (`read_file`) sau khi đã xác định chính xác node cần chỉnh sửa qua CodeGraph context.

2. **Giai đoạn Impact Analysis (Đánh giá tác động):**

- Trước khi sửa bất kỳ Shared Component, Utility Function, Zod Schema, hoặc Type/Interface:
  -> BẮT BUỘC gọi `codegraph_impact` trên symbol đó để liệt kê danh sách các caller/consumer bị ảnh hưởng.
- Lên kế hoạch cập nhật đồng bộ tất cả các vị trí được cảnh báo.

3. **Giai đoạn Framework-Specific (Next.js App Router):**

- Khi truy vết Server Actions: Dùng `codegraph_explore` từ file `page.tsx` hoặc Form component để lần theo edge `calls` tới file action tương ứng.
- Khi kiểm tra Navigation: Kiểm tra các edge `references` hoặc route nodes được tạo bởi `<Link>`, `router.push`, hoặc `redirect()`.

---

## 4. Fallback Rule

- Chỉ dùng các tool cơ bản (`read_file`, `grep_search`) khi:
  1. Thao tác trên các file cấu hình, tài liệu không thuộc index (như `.env*`, `package.json`, markdown docs).
  2. Cần xem trực tiếp các file build output hoặc generated assets.
  3. CodeGraph server trả về lỗi hoặc symbol không tìm thấy sau 2 lần thử query.
