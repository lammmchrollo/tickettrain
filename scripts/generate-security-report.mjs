import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  TableLayoutType, convertInchesToTwip, PageBreak, ImageRun
} from 'docx';
import fs from 'fs';
import path from 'path';

// ── Image Copying Logic ────────────────────────────────────────────────────────
const appDataDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\a882af52-9f9a-4af7-897b-14e4ca396e54';
const scriptsDir = path.resolve('scripts');

const ciaTriadImgSrc = path.join(appDataDir, 'cia_triad_diagram_1781195136616.png');
const defenseInDepthImgSrc = path.join(appDataDir, 'defense_in_depth_7_layers_1781195152384.png');
const sensitiveDataImgSrc = path.join(appDataDir, 'sensitive_data_flow_1781195166903.png');

const ciaTriadImgDest = path.join(scriptsDir, 'cia_triad_diagram.png');
const defenseInDepthImgDest = path.join(scriptsDir, 'defense_in_depth_7_layers.png');
const sensitiveDataImgDest = path.join(scriptsDir, 'sensitive_data_flow.png');

try {
  if (fs.existsSync(ciaTriadImgSrc)) {
    fs.copyFileSync(ciaTriadImgSrc, ciaTriadImgDest);
    console.log(`Copied CIA Triad diagram to: ${ciaTriadImgDest}`);
  }
  if (fs.existsSync(defenseInDepthImgSrc)) {
    fs.copyFileSync(defenseInDepthImgSrc, defenseInDepthImgDest);
    console.log(`Copied Defense-in-Depth diagram to: ${defenseInDepthImgDest}`);
  }
  if (fs.existsSync(sensitiveDataImgSrc)) {
    fs.copyFileSync(sensitiveDataImgSrc, sensitiveDataImgDest);
    console.log(`Copied Sensitive Data flow diagram to: ${sensitiveDataImgDest}`);
  }
} catch (e) {
  console.error("Failed to copy generated images:", e.message);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const FONT = 'Times New Roman';
const FONT_SIZE = 26; // 13pt × 2
const HEADING_COLOR = '1a237e'; // Navy Blue
const ACCENT_COLOR = '283593';
const TABLE_HEADER_BG = '1a237e';
const TABLE_ALT_BG = 'e8eaf6';

const text = (t, opts = {}) => new TextRun({ text: t, font: FONT, size: opts.size || FONT_SIZE, ...opts });
const bold = (t, opts = {}) => text(t, { bold: true, ...opts });
const italic = (t, opts = {}) => text(t, { italics: true, ...opts });

const para = (runs, opts = {}) => new Paragraph({
  spacing: { before: 60, after: 120, line: 360 },
  ...opts,
  children: Array.isArray(runs) ? runs : [runs],
});

const heading = (t, level = HeadingLevel.HEADING_1) => new Paragraph({
  heading: level,
  spacing: { before: 360, after: 180 },
  keepWithNext: true,
  children: [text(t, {
    bold: true,
    size: level === HeadingLevel.HEADING_1 ? 36 : level === HeadingLevel.HEADING_2 ? 32 : 28,
    color: HEADING_COLOR,
    font: FONT,
  })],
});

const bullet = (runs, level = 0) => para(runs, { bullet: { level } });

const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '9e9e9e' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '9e9e9e' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '9e9e9e' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '9e9e9e' },
};

const headerCell = (t, width) => new TableCell({
  width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  borders: cellBorders,
  shading: { type: ShadingType.SOLID, color: TABLE_HEADER_BG },
  margins: { top: 100, bottom: 100, left: 100, right: 100 },
  children: [para([bold(t, { color: 'ffffff', size: 24 })], { alignment: AlignmentType.CENTER })],
});

const cell = (t, opts = {}) => new TableCell({
  width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  borders: cellBorders,
  shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
  margins: { top: 80, bottom: 80, left: 100, right: 100 },
  children: [para([text(t, { size: 24 })], { alignment: opts.align || AlignmentType.LEFT })],
});

const tableRow = (cells) => new TableRow({ children: cells });

const makeTable = (headers, rows, colWidths) => new Table({
  layout: TableLayoutType.FIXED,
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    tableRow(headers.map((h, i) => headerCell(h, colWidths?.[i]))),
    ...rows.map((r, ri) =>
      tableRow(r.map((c, ci) => cell(c, {
        width: colWidths?.[ci],
        shading: ri % 2 === 1 ? TABLE_ALT_BG : undefined,
      })))
    ),
  ],
});

const codeBlock = (codeText) => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.SOLID, color: 'f5f5f5' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'e0e0e0' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'e0e0e0' },
              left: { style: BorderStyle.SINGLE, size: 12, color: '1a237e' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'e0e0e0' },
            },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: codeText.split('\n').map(line => new Paragraph({
              spacing: { before: 20, after: 20, line: 240 },
              children: [
                new TextRun({
                  text: line,
                  font: 'Consolas',
                  size: 20,
                  color: '2c3e50',
                })
              ]
            }))
          })
        ]
      })
    ]
  });
};

const embedImage = (imgPath, caption, width = 450, height = 300) => {
  try {
    if (fs.existsSync(imgPath)) {
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 100 },
          children: [
            new ImageRun({
              data: fs.readFileSync(imgPath),
              transformation: {
                width: width,
                height: height
              },
              type: 'png'
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 50, after: 200 },
          children: [italic(caption, { size: 22, color: '555555' })]
        })
      ];
    } else {
      console.warn(`[embedImage] Image file not found: ${imgPath}`);
      return [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [text(`[Hình vẽ: ${caption} - Không tìm thấy file ở ${path.basename(imgPath)}]`, { color: 'ff0000', italics: true })]
        })
      ];
    }
  } catch (err) {
    console.error(`[embedImage] Error embedding image ${imgPath}:`, err.message);
    return [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [text(`[Lỗi nhúng hình ảnh: ${err.message}]`, { color: 'ff0000', italics: true })]
      })
    ];
  }
};

// ── Content Sections ───────────────────────────────────────────────────────────
const sections = [];

// ─── BÌA BÁO CÁO (Cover Page) ──────────────────────────────────────────────────
sections.push({
  properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1) } } },
  children: [
    new Paragraph({ spacing: { before: 1000 }, alignment: AlignmentType.CENTER, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 150 },
      children: [bold('ĐỒ ÁN NGHIÊN CỨU MÔN HỌC', { size: 30 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [bold('AN NINH THÔNG TIN & AN TOÀN DỮ LIỆU', { size: 32, color: HEADING_COLOR })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [text('ĐỀ TÀI:', { size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [bold('PHÂN TÍCH KIẾN TRÚC & GIẢI PHÁP BẢO MẬT TOÀN DIỆN\nTRONG ỨNG DỤNG ĐẶT VÉ TÀU BẮC NAM (VetaU)', { size: 34, color: ACCENT_COLOR })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
      children: [text('Giảng viên hướng dẫn: Bộ môn An toàn Thông tin', { size: 28, italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [text('Sinh viên thực hiện: Nhóm nghiên cứu bảo mật VetaU', { size: 28, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2000 },
      children: [text('Năm học: 2025 – 2026', { size: 24 })],
    }),
  ],
});

// ─── NỘI DUNG CHÍNH (Main Content) ─────────────────────────────────────────────
const body = [];

// ════ MỤC LỤC ════
body.push(heading('MỤC LỤC BÁO CÁO'));
const tocItems = [
  '1. Tổng quan hệ thống & Triết lý An toàn Thông tin',
  '   1.1. Bối cảnh dự án đặt vé tàu Bắc Nam VetaU',
  '   1.2. Triết lý bảo mật cốt lõi',
  '2. Ánh xạ mô hình bảo mật với Tam giác CIA',
  '3. Kiến trúc Phòng thủ Chiều sâu (Defense-in-Depth) 7 lớp',
  '4. Phân tích Chi tiết 16 Giải pháp Bảo mật & Mã nguồn minh họa',
  '   4.1. Giải pháp 1: Lọc dữ liệu đầu vào chống NoSQL Injection và XSS',
  '   4.2. Giải pháp 2: Xác thực biểu thức Regex ở biên dịch đầu vào (Input Validation)',
  '   4.3. Giải pháp 3: Mã hóa dữ liệu PII tại chỗ bằng thuật toán AES-256-GCM',
  '   4.4. Giải pháp 4: Khóa tài khoản tạm thời chống dò mật khẩu (Account Lockout)',
  '   4.5. Giải pháp 5: Ghi nhật ký bảo mật Audit Log bất đồng bộ',
  '   4.6. Giải pháp 6: Sinh OTP và mã số ngẫu nhiên an toàn mật mã (CSPRNG)',
  '   4.7. Giải pháp 7: Quản lý phiên làm việc & cơ chế Tự động Đăng xuất',
  '   4.8. Giải pháp 8: Giới hạn kích thước payload chống tấn công từ chối dịch vụ (DoS)',
  '   4.9. Giải pháp 9: Rate Limiting phân tầng chống spam tài nguyên',
  '   4.10. Giải pháp 10: Sử dụng Helmet để gia cố HTTP Security Headers',
  '   4.11. Giải pháp 11: Che giấu thông tin lỗi ở Production (Error Masking)',
  '   4.12. Giải pháp 12: Lọc dữ liệu đầu ra ngăn rò rỉ (Response Sanitization)',
  '   4.13. Giải pháp 13: Bảo vệ luồng đăng ký bằng OTP Hash & OTP Rate Limit',
  '   4.14. Giải pháp 14: Xác minh chữ ký số thanh toán (HMAC-SHA256)',
  '   4.15. Giải pháp 15: Kiểm tra quyền sở hữu đối với tài nguyên',
  '   4.16. Giải pháp 16: Vô hiệu hóa luồng thanh toán cũ trên production',
  '5. Bản đồ đối chiếu với OWASP Top 10:2021',
  '6. So sánh chi tiết trước và sau khi nâng cấp hệ thống bảo mật',
  '7. Hướng dẫn kiểm thử bảo mật thực tế (Security Testing Guide)',
  '8. Kịch bản thuyết trình bảo vệ đồ án trước Hội đồng (Văn nói)',
  '9. Đánh giá hạn chế & Định hướng tương lai',
];

tocItems.forEach(item => {
  body.push(bullet([text(item, { size: 24 })], item.startsWith(' ') ? 1 : 0));
});

body.push(new PageBreak());

// ════ 1. TỔNG QUAN HỆ THỐNG ════
body.push(heading('1. Tổng quan hệ thống & Triết lý An toàn Thông tin'));
body.push(heading('1.1. Bối cảnh dự án đặt vé tàu Bắc Nam VetaU', HeadingLevel.HEADING_2));
body.push(para([
  text('Hệ thống đặt vé tàu trực tuyến Bắc Nam VetaU được thiết kế trên mô hình Client-Server hiện đại. '),
  text('Client chạy trên nền tảng React 19 được biên dịch tối ưu qua React Compiler và đóng gói bằng Capacitor 8 để triển khai ứng dụng Android native. '),
  text('Server được phát triển bằng Express 5 (Node.js) kết nối cơ sở dữ liệu MongoDB thông qua Mongoose 9 ODM. '),
  text('Hệ thống xử lý lượng giao dịch lớn liên quan đến thông tin di chuyển của người dân và thanh toán ví điện tử, đòi hỏi giải pháp an toàn thông tin chuyên sâu.')
]));

body.push(heading('1.2. Triết lý bảo mật cốt lõi', HeadingLevel.HEADING_2));
body.push(bullet([
  bold('Defense-in-Depth (Phòng thủ chiều sâu): '),
  text('Hệ thống xây dựng 7 lớp chốt chặn bảo vệ liên tiếp. Khi một lớp bị vượt qua, các lớp bên trong vẫn bảo toàn tài nguyên.')
]));
body.push(bullet([
  bold('Least Privilege (Quyền tối thiểu): '),
  text('Hạn chế tối đa quyền hạn và thông tin cung cấp. Dữ liệu nhạy cảm được che dấu (masked) trước khi trả về client. API kiểm soát sở hữu nghiêm ngặt.')
]));
body.push(bullet([
  bold('Fail-Fast (Dừng sớm khi có lỗi): '),
  text('Phát hiện lỗi cấu hình và dữ liệu sai lệch ngay từ cửa ngõ để ngắt xử lý trước khi ảnh hưởng đến lõi DB hoặc gây crash hệ thống.')
]));

body.push(new PageBreak());

// ════ 2. TAM GIÁC CIA ════
body.push(heading('2. Ánh xạ mô hình bảo mật với Tam giác CIA'));
body.push(para([
  text('Mô hình CIA (Confidentiality, Integrity, Availability) được áp dụng toàn diện trong dự án để đảm bảo tính an toàn dữ liệu và tính liên tục của hệ thống vận tải:')
]));

// Nhúng hình vẽ CIA Triad
body.push(...embedImage(ciaTriadImgDest, 'Hình 1: Mô hình Tam giác bảo mật CIA áp dụng trong hệ thống VetaU', 480, 270));

body.push(bullet([
  bold('Tính bảo mật (Confidentiality): '),
  text('Đảm bảo thông tin hành khách chỉ hiển thị cho người được cấp quyền. Dữ liệu tĩnh như Họ tên, SĐT, CCCD, Email được mã hóa AES-256-GCM. Phía client chỉ nhận bản hiển thị đã che (mask) các ký tự giữa.')
]));
body.push(bullet([
  bold('Tính toàn vẹn (Integrity): '),
  text('Ngăn chặn sửa đổi dữ liệu trái phép. Chế độ GCM sinh Auth Tag xác thực ciphertext. Webhook ví điện tử được kiểm tra chữ ký HMAC-SHA256. API Request được làm sạch trước khi ghi vào Database.')
]));
body.push(bullet([
  bold('Tính sẵn sàng (Availability): '),
  text('Đảm bảo hệ thống luôn phục vụ người dùng hợp lệ. Rate Limiting hạn chế spam. Khóa tài khoản tạm thời ngăn brute-force gây treo server. Background Job tự động dọn ghế giữ ảo sau 10 phút.')
]));

body.push(new PageBreak());

// ════ 3. KIẾN TRÚC 7 LỚP ════
body.push(heading('3. Kiến trúc Phòng thủ Chiều sâu (Defense-in-Depth) 7 lớp'));
body.push(para([
  text('Kiến trúc bảo mật đa tầng giúp bảo vệ toàn diện ứng dụng từ thiết bị di động, đường truyền mạng, máy chủ ứng dụng đến cơ sở dữ liệu cuối cùng:')
]));

// Nhúng hình vẽ 7 lớp bảo mật
body.push(...embedImage(defenseInDepthImgDest, 'Hình 2: Kiến trúc phòng thủ chiều sâu 7 lớp bảo vệ hệ thống VetaU', 480, 320));

body.push(bullet([
  bold('Lớp 1: Client-Side Security: '),
  text('Token lưu trữ bằng Capacitor Preferences. Axios interceptor bắt mã lỗi 401 để tự động xóa token và redirect logout.')
]));
body.push(bullet([
  bold('Lớp 2: Network & HTTP Security Headers: '),
  text('Helmet tự động chặn MIME Sniffing, Clickjacking, ép truyền tải qua HTTPS. CORS Whitelist chỉ nhận nguồn từ client được duyệt.')
]));
body.push(bullet([
  bold('Lớp 3: Request Filtering: '),
  text('Chặn body request > 10KB. Middleware làm sạch dữ liệu loại bỏ toán tử NoSQL ($) và mã độc HTML.')
]));
body.push(bullet([
  bold('Lớp 4: Input Validation: '),
  text('Validate email chuẩn RFC, kiểm tra mật khẩu mạnh, CCCD 12 số, SĐT 10-11 số ngay tại middleware.')
]));
body.push(bullet([
  bold('Lớp 5: Auth & Access Control: '),
  text('Ký số JWT thời hạn 24 giờ. Phân quyền RBAC qua middleware requireRole(). Lock tài khoản 15 phút nếu nhập sai mật khẩu 5 lần.')
]));
body.push(bullet([
  bold('Lớp 6: Cryptographic Protection: '),
  text('Mã hóa AES-256-GCM cho PII, băm mật khẩu bằng Bcrypt, sinh OTP bằng CSPRNG, lọc bỏ chuỗi mã hóa gốc đầu ra.')
]));
body.push(bullet([
  bold('Lớp 7: Monitor & Security Audit: '),
  text('Ghi log audit bất đồng bộ không chặn luồng chính, tự động dọn dẹp log sau 90 ngày bằng TTL Index. Ẩn dấu vết lỗi hệ thống ở Production.')
]));

body.push(new PageBreak());

// ════ 4. PHÂN TÍCH 16 GIẢI PHÁP ════
body.push(heading('4. Phân tích Chi tiết 16 Giải pháp Bảo mật & Mã nguồn minh họa'));

body.push(heading('4.1. Giải pháp 1: Lọc dữ liệu đầu vào chống NoSQL Injection và XSS', HeadingLevel.HEADING_2));
body.push(para([
  text('Lớp bảo vệ đầu tiên ngăn chặn hacker chèn mã độc NoSQL để bypass đăng nhập hoặc chèn script nhằm lấy cookie. '),
  text('Hệ thống duyệt đệ quy và loại bỏ các ký tự bắt đầu bằng dấu "$", đồng thời escape các thẻ HTML nguy hiểm.')
]));
body.push(codeBlock(`// server/src/middlewares/inputSanitizer.middleware.js
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
function sanitize(obj) {
  if (typeof obj === 'string') return escapeHtml(obj);
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj !== null && typeof obj === 'object') {
    const clean = {};
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$')) continue; // Chặn NoSQL operators
      clean[key] = sanitize(obj[key]);
    }
    return clean;
  }
  return obj;
}`));

body.push(heading('4.2. Giải pháp 2: Xác thực biểu thức Regex ở biên dịch đầu vào (Input Validation)', HeadingLevel.HEADING_2));
body.push(para([
  text('Hệ thống validate email chuẩn RFC, mật khẩu phức tạp, SĐT và CCCD hợp lệ bằng Regex trước khi đưa dữ liệu vào xử lý sâu.')
]));
body.push(codeBlock(`// server/src/middlewares/inputValidator.middleware.js
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&.#^()_+=-]).{8,}$/;
const PHONE_REGEX = /^(\\+84|0)\\d{9,10}$/;
const NATIONAL_ID_REGEX = /^\\d{9}$|^\\d{12}$/;`));

body.push(heading('4.3. Giải pháp 3: Mã hóa dữ liệu PII tại chỗ bằng thuật toán AES-256-GCM', HeadingLevel.HEADING_2));
body.push(para([
  text('Mã hóa Họ tên, SĐT, CCCD bằng AES-256-GCM. Sinh IV ngẫu nhiên 12 bytes cho mỗi lần mã hóa, đồng thời tạo Auth Tag 16 bytes để xác thực dữ liệu toàn vẹn.')
]));
body.push(codeBlock(`// server/src/services/crypto.service.js
function encryptText(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    tag: tag.toString('hex')
  };
}`));

// Nhúng hình vẽ Sensitive Data Flow
body.push(...embedImage(sensitiveDataImgDest, 'Hình 3: Luồng dữ liệu nhạy cảm được xử lý mã hóa và mask trên hệ thống VetaU', 480, 270));

body.push(heading('4.4. Giải pháp 4: Khóa tài khoản tạm thời chống dò mật khẩu (Account Lockout)', HeadingLevel.HEADING_2));
body.push(para([
  text('Khi người dùng nhập sai mật khẩu quá 5 lần, tài khoản sẽ tự động khóa trong vòng 15 phút. Thiết lập counter và biến thời gian trên Mongoose schema.')
]));
body.push(codeBlock(`// server/src/controllers/auth.controller.js (Trích đoạn Lockout)
if (user.lockUntil && user.lockUntil > new Date()) {
  return res.status(423).json({
    success: false,
    message: 'Tai khoan tam khoa do dang nhap sai qua nhieu lan. Thu lai sau.'
  });
}
const ok = await bcrypt.compare(pass, user.password);
if (!ok) {
  user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
  if (user.failedLoginAttempts >= 5) {
    user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Khóa 15 phút
  }
  await user.save();
  return res.status(400).json({ success: false, message: 'Email hoac mat khau khong dung' });
}`));

body.push(heading('4.5. Giải pháp 5: Ghi nhật ký bảo mật Audit Log bất đồng bộ', HeadingLevel.HEADING_2));
body.push(para([
  text('Lưu vết 7 hành động nhạy cảm của người dùng (Login, Register, Order, Cancel Ticket) vào DB MongoDB với cơ chế non-blocking.')
]));
body.push(codeBlock(`// server/src/middlewares/audit.middleware.js
async function logAudit({ userId, action, resource, resourceId, ip, userAgent, details }) {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      resource: resource || '',
      resourceId: resourceId || '',
      ip: ip || '',
      userAgent: userAgent || '',
      details: details || ''
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit log:', err.message);
  }
}`));

body.push(heading('4.6. Giải pháp 6: Sinh OTP và mã số ngẫu nhiên an toàn mật mã (CSPRNG)', HeadingLevel.HEADING_2));
body.push(para([
  text('Thay thế Math.random() bằng crypto.randomInt() nhằm bảo vệ mã OTP và mã số vé khỏi các cuộc tấn công dự đoán số.')
]));
body.push(codeBlock(`const generateOtp = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0');`));

body.push(heading('4.7. Giải pháp 7: Quản lý phiên làm việc & cơ chế Tự động Đăng xuất', HeadingLevel.HEADING_2));
body.push(para([
  text('Token JWT có thời hạn sống ngắn (24 giờ). Phía frontend thiết lập Axios interceptor tự động logout xóa token khi server trả lỗi 401.')
]));

body.push(heading('4.8. Giải pháp 8: Giới hạn kích thước payload chống tấn công DoS', HeadingLevel.HEADING_2));
body.push(para([
  text('Giới hạn kích thước request JSON ở mức 10KB. Nếu client gửi request lớn hơn sẽ nhận ngay lỗi 413 Payload Too Large.')
]));

body.push(heading('4.9. Giải pháp 9: Rate Limiting phân tầng chống spam tài nguyên', HeadingLevel.HEADING_2));
body.push(para([
  text('Phân tách rate limit thành 3 tầng: 300 request / 15 phút (Global), 30 request / 15 phút (Auth), và 60 request / 15 phút (Payment) để bảo vệ server khỏi DDoS.')
]));

body.push(heading('4.10. Giải pháp 10: Sử dụng Helmet để gia cố HTTP Security Headers', HeadingLevel.HEADING_2));
body.push(para([
  text('Helmet tự động thêm cấu hình bảo mật ngăn Clickjacking, MIME-Sniffing và XSS trên trình duyệt.')
]));

body.push(heading('4.11. Giải pháp 11: Che giấu thông tin lỗi ở Production (Error Masking)', HeadingLevel.HEADING_2));
body.push(para([
  text('Khi chạy trên môi trường production, middleware xử lý lỗi sẽ che dấu stack trace và chỉ hiển thị thông điệp chung để bảo vệ an toàn máy chủ.')
]));
body.push(codeBlock(`// server/src/middlewares/error.middleware.js
const isProd = process.env.NODE_ENV === 'production';
const message = isProd ? 'Da xay ra loi. Vui long thu lai sau.' : err.message;`));

body.push(heading('4.12. Giải pháp 12: Lọc dữ liệu đầu ra ngăn rò rỉ (Response Sanitization)', HeadingLevel.HEADING_2));
body.push(para([
  text('API Response khi trả về client được đi qua hàm lọc bỏ hoàn toàn các trường mã hóa *Encrypted để tránh rò rỉ khóa hay ciphertext.')
]));

body.push(heading('4.13. Giải pháp 13: Bảo vệ luồng đăng ký bằng OTP Hash & OTP Rate Limit', HeadingLevel.HEADING_2));
body.push(para([
  text('OTP được băm Bcrypt trước khi lưu. Thiết lập cooldown 60s và tối đa 5 lần gửi lại mã/giờ để chống spam ví và email.')
]));

body.push(heading('4.14. Giải pháp 14: Xác minh chữ ký số thanh toán (HMAC-SHA256)', HeadingLevel.HEADING_2));
body.push(para([
  text('Xác thực chữ ký SHA256 gửi từ webhook của MoMo/ZaloPay dựa trên khóa bí mật của doanh nghiệp để chống giả mạo giao dịch.')
]));

body.push(heading('4.15. Giải pháp 15: Kiểm tra quyền sở hữu đối với tài nguyên', HeadingLevel.HEADING_2));
body.push(para([
  text('Chống lỗi BOLA/IDOR bằng cách bắt buộc lọc theo userId: req.user.id khi truy cập đơn hàng hoặc vé.')
]));

body.push(heading('4.16. Giải pháp 16: Vô hiệu hóa luồng thanh toán cũ trên production', HeadingLevel.HEADING_2));
body.push(para([
  text('Endpoint thanh toán mock cũ dùng thử nghiệm sẽ trả lỗi 410 Gone trên môi trường production nhằm giảm thiểu bề mặt tấn công.')
]));

body.push(new PageBreak());

// ════ 5. BẢN ĐỒ OWASP ════
body.push(heading('5. Bản đồ đối chiếu với OWASP Top 10:2021'));
body.push(para([
  text('Bảng đối chiếu 10 nhóm lỗ hổng nguy hiểm theo OWASP với các chốt chặn thực tế được xây dựng trong mã nguồn VetaU:')
]));

body.push(makeTable(
  ['Danh mục OWASP', 'Lỗ hổng an ninh', 'Giải pháp áp dụng trên VetaU', 'File codebase'],
  [
    ['A01:2021', 'Broken Access Control', 'Phân quyền RBAC, lọc dữ liệu theo userId, ẩn ciphertext', 'auth.middleware.js, order.controller.js'],
    ['A02:2021', 'Cryptographic Failures', 'AES-256-GCM cho PII, Bcrypt cho pass/OTP, CSPRNG', 'crypto.service.js, auth.controller.js'],
    ['A03:2021', 'Injection', 'Bộ lọc inputSanitizer chặn ($), escape HTML, Regex validate', 'inputSanitizer.middleware.js'],
    ['A04:2021', 'Insecure Design', 'Kiến trúc Defense-in-Depth, lockout tài khoản', 'app.js, auth.controller.js'],
    ['A05:2021', 'Security Misconfig', 'Helmet security headers, CORS Whitelist, payload limit', 'app.js'],
    ['A06:2021', 'Vulnerable Components', 'Sử dụng Express 5, Mongoose 9, Helmet 8 mới nhất', 'package.json'],
    ['A07:2021', 'Identification & Auth', 'Rút ngắn JWT còn 24 giờ, client auto logout khi 401', 'auth.controller.js, http.js'],
    ['A08:2021', 'Software/Data Integrity', 'Xác thực chữ ký HMAC-SHA256 webhook MoMo/ZaloPay', 'momo.service.js, zalopay.service.js'],
    ['A09:2021', 'Security Logging/Monitor', 'Ghi log audit bất đồng bộ, MongoDB TTL Index dọn log', 'audit.middleware.js'],
    ['A10:2021', 'SSRF', 'Khóa tĩnh địa chỉ endpoint trong biến môi trường', 'env.js'],
  ],
  [15, 25, 35, 25]
));

body.push(new PageBreak());

// ════ 6. SO SÁNH TRƯỚC VÀ SAU ════
body.push(heading('6. So sánh chi tiết trước và sau khi nâng cấp hệ thống bảo mật'));
body.push(para([
  text('Các thay đổi mang tính cốt lõi nâng cấp mức độ bao phủ bảo mật của dự án VetaU:')
]));

body.push(makeTable(
  ['Tiêu chí bảo mật', 'Kiến trúc ban đầu (Legacy)', 'Kiến trúc hiện tại (Nâng cấp)'],
  [
    ['Mã hóa PII dữ liệu cá nhân', 'Lưu dạng plaintext thô', 'Mã hóa AES-256-GCM tĩnh'],
    ['Bộ lọc NoSQL Injection', 'Không hỗ trợ', 'Tự động loại bỏ toán tử ($)'],
    ['Bộ lọc Stored XSS', 'Không hỗ trợ', 'Mã hóa escape HTML đầu vào'],
    ['Validate dữ liệu ở backend', 'Không validate, tin client', 'Middleware Regex validate'],
    ['Yêu cầu mật khẩu', 'Không giới hạn ký tự', '8+ ký tự, có hoa, thường, số, đặc biệt'],
    ['Chống Brute-force mật khẩu', 'Không giới hạn lần thử', 'Khóa tài khoản 15 phút sau 5 lần sai'],
    ['Thời gian sống JWT token', '7 ngày', '24 giờ'],
    ['Xử lý JWT hết hạn ở client', 'Màn hình lỗi hoặc treo app', 'Tự động đăng xuất, xóa token'],
    ['Sinh mã vé / số ngẫu nhiên', 'Dùng Math.random() (PRNG)', 'Dùng crypto.randomInt() (CSPRNG)'],
    ['Bảo vệ OTP lưu trữ', 'Lưu dạng text thô', 'Băm một chiều bằng Bcrypt'],
    ['Rate Limiting', 'Không có', 'Phân tầng 3 lớp (Global, Auth, Payment)'],
    ['Kích thước Payload', 'Không giới hạn', 'Giới hạn tối đa 10KB'],
    ['Dữ liệu lỗi ở Production', 'Trả Stack Trace chi tiết', 'Error Masking (trả thông báo lỗi chung)'],
    ['Rò rỉ trường mã hóa API', 'Trả nguyên đối tượng mã hóa', 'Sanitizer xóa bỏ các trường mã hóa'],
    ['Bảo vệ luồng thanh toán', 'Nhận callback trực tiếp', 'Xác minh chữ ký HMAC-SHA256'],
    ['Lưu vết vết bảo mật (Audit)', 'Không hỗ trợ', 'Ghi log 7 sự kiện, dọn dẹp sau 90 ngày'],
    ['Bao phủ OWASP Top 10', '2 / 10 danh mục', '9 / 10 danh mục'],
  ],
  [25, 35, 40]
));

body.push(new PageBreak());

// ════ 7. HƯỚNG DẪN KIỂM THỬ ════
body.push(heading('7. Hướng dẫn kiểm thử bảo mật thực tế (Security Testing Guide)'));

body.push(heading('7.1. Kiểm thử chống NoSQL Injection', HeadingLevel.HEADING_2));
body.push(para([
  text('Chạy lệnh PowerShell gửi payload chứa toán tử $gt để thử bypass mật khẩu:')
]));
body.push(codeBlock(`Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" \`
  -Method POST \`
  -ContentType "application/json" \`
  -Body '{"email": {"$gt": ""}, "pass": "any_password"}'`));
body.push(para([
  text('Kết quả: Nhận lỗi 400 hoặc 401. Operator $gt đã bị inputSanitizer loại bỏ.')
]));

body.push(heading('7.2. Kiểm thử chống Stored XSS', HeadingLevel.HEADING_2));
body.push(para([
  text('Đặt vé với Họ tên hành khách: "Nguyen Van A <script>alert(1)</script>".'),
  text(' Kiểm tra trong DB bằng mongosh, chuỗi phải được chuyển đổi thành:'),
  bold(' "Nguyen Van A &lt;script&gt;alert(1)&lt;/script&gt;".'),
  text(' Giao diện hiển thị text thô, không thực thi alert.')
]));

body.push(heading('7.3. Kiểm thử Khóa tài khoản (Account Lockout)', HeadingLevel.HEADING_2));
body.push(para([
  text('Gửi liên tiếp 6 request đăng nhập sai mật khẩu:')
]));
body.push(codeBlock(`for ($i=1; $i -le 6; $i++) {
  try {
    $res = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" \`
      -Method POST \`
      -ContentType "application/json" \`
      -Body '{"email": "timkiemve@gmail.com", "pass": "sai_mat_khau"}'
    Write-Host "Lần $i: Thành công"
  } catch {
    Write-Host "Lần $i: $_"
  }
}`));
body.push(para([
  text('Kết quả: Lần 1-5 trả 400 (Email hoặc mật khẩu không đúng). Lần 6 trả về lỗi 423 Locked.')
]));

body.push(heading('7.4. Kiểm chứng dữ liệu mã hóa tĩnh trong database', HeadingLevel.HEADING_2));
body.push(para([
  text('Truy cập MongoDB Compass hoặc chạy lệnh CLI kiểm tra dữ liệu đơn hàng:')
]));
body.push(codeBlock(`db.orders.find().limit(1).pretty()`));
body.push(para([
  text('Kết quả: Các trường phoneEncrypted, nationalIdEncrypted chứa cấu trúc iv, content, tag đã được mã hóa hex hoàn toàn.')
]));

body.push(new PageBreak());

// ════ 8. KỊCH BẢN THUYẾT TRÌNH ════
body.push(heading('8. Kịch bản thuyết trình bảo vệ đồ án trước Hội đồng (Văn nói)'));
body.push(para([
  text('Dưới đây là kịch bản nói lập luận sắc bén theo phương pháp "Tại sao làm? - Hậu quả nếu không làm - Tại sao dùng giải pháp này?":', { italics: true })
]));

body.push(heading('PHẦN 1: Đặt vấn đề và Triết lý bảo mật chiều sâu', HeadingLevel.HEADING_2));
body.push(para([
  text('"Kính thưa thầy cô và các bạn, đối với một ứng dụng dịch vụ công cộng như VetaU - hệ thống đặt vé tàu Bắc Nam trực tuyến, chúng ta đang trực tiếp xử lý hai loại tài sản vô cùng nhạy cảm: Thông tin định danh cá nhân (PII) của hành khách và Giao dịch tài chính. Nếu một hệ thống như thế này bị xâm nhập, thiệt hại không chỉ dừng lại ở mặt tài chính mà còn là nguy cơ rò rỉ dữ liệu di chuyển của công dân trên diện rộng. Do đó, chúng em đã nâng cấp bảo mật VetaU dựa trên triết lý Defense-in-Depth (Phòng thủ chiều sâu): thiết lập nhiều chốt chặn liên hoàn từ Client, Network, Application cho tới Database."')
], { alignment: AlignmentType.JUSTIFY }));

body.push(heading('PHẦN 2: Trình bày các trụ cột giải pháp', HeadingLevel.HEADING_2));
body.push(para([
  bold('1. Trụ cột kiểm soát đầu vào (Input Security): '),
  text('"Chúng em tự viết middleware inputSanitizer.middleware.js tự động quét qua toàn bộ cấu trúc dữ liệu và bóc tách các ký tự bắt đầu bằng dấu ($) - toán tử đặc trưng của MongoDB để chống NoSQL Injection, đồng thời escape HTML để chống XSS chèn script đánh cắp token. Bên cạnh đó, chúng em dùng crypto.randomInt() thay thế Math.random() thông thường để sinh OTP và mã số vé, đây là bộ sinh số ngẫu nhiên an toàn mật mã CSPRNG lấy entropy từ phần cứng hệ điều hành, hacker hoàn toàn không thể đoán trước được."')
], { alignment: AlignmentType.JUSTIFY }));
body.push(para([
  bold('2. Trụ cột bảo vệ dữ liệu nhạy cảm (Cryptography): '),
  text('"Đối với số điện thoại và CCCD của hành khách lưu trữ trong DB, nếu lưu dạng plaintext thông thường, nếu xảy ra DB breach hacker sẽ đọc được toàn bộ. Chúng em lựa chọn thuật toán mã hóa đối xứng AES-256-GCM. Thuật toán này vừa che giấu dữ liệu (Confidentiality) vừa sinh Auth Tag xác thực tính toàn vẹn (Integrity). Khóa mã hóa được lưu riêng trong file .env. Phía API Response chỉ trả về thông tin đã masked che chữ số giữa, loại bỏ hoàn toàn ciphertext ra ngoài để ngăn rò rỉ."')
], { alignment: AlignmentType.JUSTIFY }));
body.push(para([
  bold('3. Trụ cột quản lý phiên và giám sát (Monitoring & Auth): '),
  text('"Chúng em rút ngắn thời gian hết hạn của JWT xuống còn 24 giờ. Ở Frontend, chúng em viết Axios interceptor lắng nghe lỗi 401 để tự động xóa token và logout người dùng tránh phiên làm việc bỏ quên bị chiếm đoạt. Hệ thống cũng tích hợp cơ chế ghi log audit bất đồng bộ không làm chậm trải nghiệm của người dùng, tự động dọn log sau 90 ngày bằng TTL Index để phục vụ công tác forensics khi xảy ra sự cố."')
], { alignment: AlignmentType.JUSTIFY }));

body.push(heading('PHẦN 3: Kết luận', HeadingLevel.HEADING_2));
body.push(para([
  text('"Tóm lại, bằng cách kết hợp đồng bộ cả 3 trụ cột bảo mật nêu trên, đồ án VetaU đã giải quyết triệt để các rủi ro an ninh thông tin thường gặp, nâng cấp mức độ bao phủ các lỗ hổng bảo mật theo chuẩn OWASP Top 10 từ 2/10 lên 9/10 danh mục. Hệ thống giờ đây sẵn sàng bảo vệ an toàn cho dữ liệu của mọi hành khách. Em xin chân thành cảm ơn thầy cô."')
], { alignment: AlignmentType.JUSTIFY }));

body.push(new PageBreak());

// ════ 9. HẠN CHẾ & ĐỊNH HƯỚNG TƯƠNG LAI ════
body.push(heading('9. Đánh giá hạn chế & Định hướng tương lai'));
body.push(para([
  text('Mặc dù đã hoàn thiện các giải pháp bảo mật cốt lõi, dự án VetaU vẫn vạch ra kế hoạch phát triển nhằm gia cố thêm tính an toàn:')
]));

body.push(makeTable(
  ['Hạn chế hiện tại', 'Giải pháp khắc phục đề xuất', 'Lợi ích bảo vệ'],
  [
    ['Chưa có HTTPS bắt buộc ở tầng server', 'Cấu hình Reverse Proxy bằng Nginx hoặc Caddy với Let\'s Encrypt SSL', 'Chống đánh cắp dữ liệu trên đường truyền mạng'],
    ['Chưa có xác thực 2 yếu tố (2FA)', 'Thêm mã xác thực thời gian TOTP tích hợp Google Authenticator cho admin', 'Ngăn chặn hacker chiếm quyền điều khiển admin'],
    ['Chưa có CAPTCHA chống spam', 'Tích hợp hCaptcha hoặc reCAPTCHA v3 vào form đăng nhập và đăng ký', 'Chống tool tự động đăng ký tài khoản rác'],
    ['JWT không hỗ trợ Refresh Token Rotation', 'Chuyển sang Access Token ngắn (15p) + Refresh Token lưu HttpOnly cookie', 'Tối đa hóa bảo mật phiên làm việc và khả năng thu hồi'],
    ['MongoDB connection chưa mã hóa', 'Bật TLS/SSL trong connection string tới MongoDB Atlas', 'Chống tấn công nghe lén nội bộ mạng DB'],
  ],
  [30, 45, 25]
));

body.push(para([text('')]));
body.push(para([text('─── Hết Báo cáo ───', { italics: true, color: '9e9e9e' }), text('')], { alignment: AlignmentType.CENTER }));

// ─── Push main section ─────────────────────────────────────────────────────────
sections.push({
  properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1) } } },
  children: body,
});

// ── Build Document ─────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: FONT_SIZE } },
      heading1: { run: { font: FONT, bold: true, size: 36, color: HEADING_COLOR } },
      heading2: { run: { font: FONT, bold: true, size: 32, color: ACCENT_COLOR } },
      heading3: { run: { font: FONT, bold: true, size: 28, color: ACCENT_COLOR } },
    },
  },
  sections,
});

const outPath = path.resolve('BaoCao_AnNinh_ThongTin_VetaU.docx');
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`✅ Đã tạo báo cáo bảo mật chi tiết (Word .docx): ${outPath}`);
