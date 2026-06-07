import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  TableLayoutType, convertInchesToTwip, PageBreak
} from 'docx';
import fs from 'fs';
import path from 'path';

// ── Helpers ────────────────────────────────────────────────────────────────────
const FONT = 'Times New Roman';
const FONT_SIZE = 26; // 13pt × 2
const HEADING_COLOR = '1a237e';
const ACCENT_COLOR = '283593';
const TABLE_HEADER_BG = '1a237e';
const TABLE_ALT_BG = 'e8eaf6';

const text = (t, opts = {}) => new TextRun({ text: t, font: FONT, size: opts.size || FONT_SIZE, ...opts });
const bold = (t, opts = {}) => text(t, { bold: true, ...opts });
const italic = (t, opts = {}) => text(t, { italics: true, ...opts });

const para = (runs, opts = {}) => new Paragraph({
  spacing: { after: 120, line: 360 },
  ...opts,
  children: Array.isArray(runs) ? runs : [runs],
});

const heading = (t, level = HeadingLevel.HEADING_1) => new Paragraph({
  heading: level,
  spacing: { before: 300, after: 200 },
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
  children: [para([bold(t, { color: 'ffffff', size: 24 })], { alignment: AlignmentType.CENTER })],
});

const cell = (t, opts = {}) => new TableCell({
  width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  borders: cellBorders,
  shading: opts.shading ? { type: ShadingType.SOLID, color: opts.shading } : undefined,
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

// ── Content ────────────────────────────────────────────────────────────────────
const sections = [];

// ─── BÌA ───────────────────────────────────────────────────────────────────────
sections.push({
  properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1) } } },
  children: [
    new Paragraph({ spacing: { before: 3000 }, alignment: AlignmentType.CENTER, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [text('TRƯỜNG ĐẠI HỌC', { bold: true, size: 32, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [text('KHOA CÔNG NGHỆ THÔNG TIN', { bold: true, size: 32, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [text('BÁO CÁO MÔN HỌC', { bold: true, size: 36, color: HEADING_COLOR, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [text('AN NINH THÔNG TIN', { bold: true, size: 40, color: ACCENT_COLOR, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
      children: [text('─────────────────────────', { size: 28, color: '9e9e9e', font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [text('Đề tài:', { size: 30, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [bold('PHÂN TÍCH CHỨC NĂNG THANH TOÁN TRONG ỨNG DỤNG ĐẶT VÉ TÀU BẮC NAM (VetaU)', { size: 32, color: HEADING_COLOR, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1200 },
      children: [text('Ứng dụng: VetaU – Đặt vé tàu Bắc Nam', { size: 28, italics: true, font: FONT })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [text('Năm học 2025 – 2026', { size: 28, font: FONT })],
    }),
  ],
});

// ─── NỘI DUNG CHÍNH ──────────────────────────────────────────────────────────
const body = [];

// MỤC LỤC
body.push(heading('MỤC LỤC'));
const toc = [
  '1. Giới thiệu tổng quan',
  '2. Kiến trúc hệ thống thanh toán',
  '3. Các nhà cung cấp thanh toán được tích hợp',
  '4. Luồng xử lý thanh toán chi tiết',
  '5. Mô hình dữ liệu',
  '6. Cơ chế bảo mật trong thanh toán',
  '7. Tính giá và khuyến mãi',
  '8. Giữ ghế tạm (Seat Hold)',
  '9. Phát hành vé điện tử',
  '10. Các điểm hạn chế',
  '11. Hướng phát triển',
  '12. Kết luận',
];
toc.forEach(t => body.push(bullet([text(t)])));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 1. GIỚI THIỆU ════════════════════════════════════════════════════════════
body.push(heading('1. Giới thiệu tổng quan'));
body.push(para([
  text('VetaU là ứng dụng đặt vé tàu Bắc Nam được xây dựng bằng '),
  bold('React 19 + Vite 8 + Capacitor 8'),
  text(' (frontend) và '),
  bold('Node.js + Express 5 + MongoDB'),
  text(' (backend). Ứng dụng hỗ trợ hai vai trò người dùng: '),
  bold('Admin'),
  text(' (quản lý chủ chuyến, tạo/duyệt/huỷ chuyến tàu) và '),
  bold('Khách hàng'),
  text(' (tìm kiếm chuyến, đặt ghế, thanh toán, xem vé điện tử).'),
]));
body.push(para([
  text('Chức năng thanh toán là một trong những module quan trọng nhất của hệ thống, chịu trách nhiệm xử lý toàn bộ quy trình từ khi người dùng xác nhận đặt vé cho đến khi vé điện tử được phát hành. Hệ thống thanh toán được thiết kế theo kiến trúc '),
  bold('multi-provider'),
  text(', hỗ trợ nhiều cổng thanh toán và có cơ chế demo để phục vụ phát triển và kiểm thử.'),
]));

body.push(heading('1.1. Phạm vi báo cáo', HeadingLevel.HEADING_2));
body.push(para([text('Báo cáo này tập trung phân tích chi tiết:')]));
body.push(bullet([text('Kiến trúc và luồng xử lý thanh toán trong hệ thống VetaU')]));
body.push(bullet([text('Các nhà cung cấp thanh toán (MoMo, ZaloPay, Mock)')]));
body.push(bullet([text('Mô hình dữ liệu liên quan (Order, Payment, Ticket)')]));
body.push(bullet([text('Cơ chế bảo mật áp dụng cho module thanh toán')]));
body.push(bullet([text('Các điểm hạn chế hiện tại và hướng phát triển tương lai')]));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 2. KIẾN TRÚC ═════════════════════════════════════════════════════════════
body.push(heading('2. Kiến trúc hệ thống thanh toán'));
body.push(para([text('Hệ thống thanh toán được tổ chức theo kiến trúc phân lớp (layered architecture) gồm các thành phần:')]));

body.push(makeTable(
  ['Lớp', 'Thành phần', 'Vai trò'],
  [
    ['Routes', 'payment.routes.js', 'Định tuyến HTTP request đến controller tương ứng'],
    ['Controller', 'payment.controller.js', 'Điều phối logic: validate, tạo order, gọi provider, lưu payment, redirect'],
    ['Services', 'momo.service.js, zalopay.service.js, payment.service.js', 'Tích hợp với từng cổng thanh toán: tạo giao dịch, xác thực chữ ký'],
    ['Services', 'crypto.service.js', 'Mã hoá/giải mã dữ liệu PII (AES-256-GCM)'],
    ['Services', 'pricing.service.js', 'Tính giá vé, phí dịch vụ, áp mã khuyến mãi'],
    ['Services', 'ticket.service.js', 'Phát hành vé điện tử sau thanh toán thành công'],
    ['Models', 'order.model.js, payment.model.js, ticket.model.js', 'Schema MongoDB cho đơn hàng, giao dịch thanh toán, vé'],
    ['Utils', 'mask.js, generateCode.js', 'Che dấu thông tin nhạy cảm, sinh mã đơn hàng/vé/giao dịch'],
    ['Middleware', 'auth.middleware.js', 'Xác thực JWT token cho các route yêu cầu đăng nhập'],
    ['Background', 'holdCleaner.js', 'Tự động giải phóng ghế hết hạn hold (chạy mỗi 30 giây)'],
  ],
  [15, 30, 55]
));

body.push(para([text('')]));
body.push(heading('2.1. Sơ đồ kiến trúc', HeadingLevel.HEADING_2));
body.push(para([text('Luồng request thanh toán đi qua các lớp theo thứ tự:')]));
body.push(para([text('Client (React App) → Express Router → Auth Middleware → Rate Limiter (60 req/15 phút) → Payment Controller → Payment Service / Provider SDK → MongoDB → Ticket Service → Socket.IO (realtime) → Client', { italics: true })]));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 3. CÁC NHÀ CUNG CẤP ════════════════════════════════════════════════════
body.push(heading('3. Các nhà cung cấp thanh toán được tích hợp'));

body.push(heading('3.1. MoMo (Ví điện tử MoMo)', HeadingLevel.HEADING_2));
body.push(para([text('MoMo là cổng thanh toán phổ biến nhất tại Việt Nam. Hệ thống tích hợp MoMo thông qua API v2 (captureWallet).')]));
body.push(heading('Tạo giao dịch (createMoMo)', HeadingLevel.HEADING_3));
body.push(bullet([text('Tạo chữ ký HMAC-SHA256 từ chuỗi raw signature theo đúng thứ tự MoMo quy định')]));
body.push(bullet([text('Gửi POST request đến endpoint MoMo với payload đã ký')]));
body.push(bullet([text('Trả về payUrl để redirect người dùng đến trang thanh toán MoMo')]));
body.push(bullet([text('Nếu MoMo trả resultCode ≠ 0 → throw error với thông tin chi tiết')]));

body.push(heading('Xác thực callback (verifyMoMoSignature)', HeadingLevel.HEADING_3));
body.push(bullet([text('Tái tạo raw signature từ body callback')]));
body.push(bullet([text('So sánh HMAC-SHA256 với signature MoMo gửi về')]));
body.push(bullet([text('Chỉ xử lý nếu chữ ký hợp lệ, chống giả mạo webhook')]));

body.push(heading('Endpoints MoMo', HeadingLevel.HEADING_3));
body.push(makeTable(
  ['Route', 'Method', 'Mô tả'],
  [
    ['/api/payments/momo-return', 'GET', 'MoMo redirect người dùng sau thanh toán (return URL)'],
    ['/api/payments/momo-notify', 'POST', 'MoMo gọi webhook thông báo kết quả (IPN URL)'],
  ],
  [35, 10, 55]
));

body.push(para([text('')]));
body.push(heading('3.2. ZaloPay', HeadingLevel.HEADING_2));
body.push(para([text('ZaloPay là cổng thanh toán thứ hai được tích hợp, sử dụng API sandbox.')]));
body.push(heading('Tạo giao dịch (createZaloPay)', HeadingLevel.HEADING_3));
body.push(bullet([text('Tạo app_trans_id theo format: YYMMDD_orderId')]));
body.push(bullet([text('Ký HMAC-SHA256 với key1, chuỗi: appId|appTransId|appUser|amount|appTime|embedData|items')]));
body.push(bullet([text('Gửi POST request đến endpoint ZaloPay')]));
body.push(bullet([text('Trả về order_url để redirect người dùng')]));

body.push(heading('Xác thực callback (verifyZaloPayCallback)', HeadingLevel.HEADING_3));
body.push(bullet([text('Dùng key2 để tạo HMAC-SHA256 từ data callback')]));
body.push(bullet([text('So sánh với mac gửi về, trả return_code: 1 nếu hợp lệ')]));

body.push(heading('Endpoints ZaloPay', HeadingLevel.HEADING_3));
body.push(makeTable(
  ['Route', 'Method', 'Mô tả'],
  [
    ['/api/payments/zalopay-return', 'GET', 'ZaloPay redirect người dùng sau thanh toán'],
    ['/api/payments/zalopay-callback', 'POST', 'ZaloPay gọi webhook thông báo kết quả'],
  ],
  [35, 10, 55]
));

body.push(para([text('')]));
body.push(heading('3.3. Mock Payment (Chế độ demo)', HeadingLevel.HEADING_2));
body.push(para([text('Hệ thống cung cấp chế độ demo (PAYMENT_DEMO=true) để kiểm thử mà không cần kết nối cổng thanh toán thật.')]));
body.push(bullet([text('mockProviderCreatePayment: trả về providerTxnId dạng MOCK-{timestamp}')]));
body.push(bullet([text('Mock checkout page: render trang HTML đơn giản với nút "Pay Success" / "Pay Failed"')]));
body.push(bullet([text('confirmMockPayment: API xác nhận thanh toán mock (cần auth token)')]));
body.push(bullet([text('mockCompletePayment: xử lý redirect sau khi bấm nút trên trang mock checkout')]));

body.push(heading('Endpoints Mock', HeadingLevel.HEADING_3));
body.push(makeTable(
  ['Route', 'Method', 'Auth', 'Mô tả'],
  [
    ['/api/payments/create', 'POST', 'Có', 'Tạo giao dịch mới (chọn provider: momo/zalopay/mock)'],
    ['/api/payments/mock-confirm', 'POST', 'Có', 'Xác nhận thanh toán mock qua API'],
    ['/api/payments/mock-checkout', 'GET', 'Không', 'Trang checkout demo (HTML)'],
    ['/api/payments/mock-complete', 'GET', 'Không', 'Xử lý kết quả mock checkout'],
    ['/api/payments/complete-legacy', 'POST', 'Có', 'Luồng legacy (đã chặn ở production)'],
  ],
  [30, 8, 7, 55]
));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 4. LUỒNG XỬ LÝ CHI TIẾT ════════════════════════════════════════════════
body.push(heading('4. Luồng xử lý thanh toán chi tiết'));

body.push(heading('4.1. Luồng chính (createPayment)', HeadingLevel.HEADING_2));
body.push(para([text('Đây là luồng thanh toán chính của hệ thống, xử lý cả hai trường hợp: tạo đơn hàng mới và thanh toán đơn hàng đã tồn tại.')]));

body.push(para([bold('Trường hợp 1: Có orderId (đơn hàng đã tạo trước đó)')]));
body.push(bullet([text('Tìm đơn hàng theo orderId và userId (đảm bảo ownership)')]));
body.push(bullet([text('Kiểm tra trạng thái phải là pending_payment')]));
body.push(bullet([text('Tiến hành tạo giao dịch thanh toán')]));

body.push(para([bold('Trường hợp 2: Không có orderId (tạo mới hoàn toàn)')]));
body.push(bullet([text('Nhận dữ liệu: selectedTrain, searchData, selectedSeats, passengers, totalPrice, serviceFee, discount, finalTotal')]));
body.push(bullet([text('Validate dữ liệu đầu vào (chuyến tàu, ghế, hành khách)')]));
body.push(bullet([text('Mã hoá thông tin nhạy cảm: phone và CCCD/CMND bằng AES-256-GCM')]));
body.push(bullet([text('Tạo bản mask để hiển thị an toàn (phoneMasked, nationalIdMasked)')]));
body.push(bullet([text('Tạo đơn hàng mới (Order) với trạng thái pending_payment')]));

body.push(para([bold('Tạo giao dịch thanh toán (chung cho cả hai trường hợp):')]));
body.push(bullet([text('Xác định provider: momo → createMoMo, zalopay → createZaloPay, khác → mockProviderCreatePayment')]));
body.push(bullet([text('Tạo bản ghi Payment với trạng thái pending')]));
body.push(bullet([text('Nếu PAYMENT_DEMO=true: ghi đè checkoutUrl thành trang mock checkout')]));
body.push(bullet([text('Trả về paymentId, checkoutUrl, provider cho client')]));

body.push(heading('4.2. Luồng xác nhận thanh toán', HeadingLevel.HEADING_2));
body.push(para([text('Sau khi người dùng hoàn tất thanh toán trên cổng, hệ thống nhận kết quả qua 2 kênh:')]));

body.push(para([bold('Kênh 1 – Return URL (redirect):')]));
body.push(bullet([text('MoMo: /api/payments/momo-return → kiểm tra resultCode')]));
body.push(bullet([text('ZaloPay: /api/payments/zalopay-return → kiểm tra status')]));
body.push(bullet([text('Nếu thành công: cập nhật Payment.status = success, Order.paymentStatus = paid')]));
body.push(bullet([text('Gọi issueTicketsForOrder() để phát hành vé')]));
body.push(bullet([text('Redirect người dùng về app qua CLIENT_RETURN_URL (deep link: vetau://payment-result)')]));

body.push(para([bold('Kênh 2 – Webhook/IPN (server-to-server):')]));
body.push(bullet([text('MoMo: /api/payments/momo-notify → xác thực chữ ký HMAC-SHA256')]));
body.push(bullet([text('ZaloPay: /api/payments/zalopay-callback → xác thực chữ ký bằng key2')]));
body.push(bullet([text('Xử lý idempotent: nếu payment.status đã là success thì bỏ qua')]));
body.push(bullet([text('Trả response theo format yêu cầu của từng provider')]));

body.push(heading('4.3. Hàm settlePaymentAndRedirect', HeadingLevel.HEADING_2));
body.push(para([text('Đây là helper dùng chung cho nhiều handler, thực hiện:')]));
body.push(bullet([text('Cập nhật Payment: status = success, paidAt = now')]));
body.push(bullet([text('Cập nhật Order: paymentStatus = paid, orderStatus = paid')]));
body.push(bullet([text('Gọi issueTicketsForOrder(order) để tạo vé')]));
body.push(bullet([text('Redirect về client với query params: status, provider, orderId')]));

body.push(heading('4.4. Luồng Legacy (completeLegacyPayment)', HeadingLevel.HEADING_2));
body.push(para([text('Luồng cũ tạo đơn hàng + thanh toán + phát hành vé trong một request duy nhất. Đã được nâng cấp bảo mật:')]));
body.push(bullet([text('Chặn hoàn toàn ở production (trả HTTP 410 Gone)')]));
body.push(bullet([text('Ở development: vẫn mã hoá PII và tạo mask trước khi lưu')]));
body.push(bullet([text('Tạo payment mockpay tự động với status = success')]));
body.push(bullet([text('Phát hành vé ngay lập tức, ticket chỉ lưu dữ liệu mask')]));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 5. MÔ HÌNH DỮ LIỆU ═════════════════════════════════════════════════════
body.push(heading('5. Mô hình dữ liệu'));

body.push(heading('5.1. Order (Đơn hàng)', HeadingLevel.HEADING_2));
body.push(makeTable(
  ['Trường', 'Kiểu dữ liệu', 'Mô tả'],
  [
    ['orderCode', 'String (unique)', 'Mã đơn hàng, sinh tự động (OD + timestamp + random)'],
    ['userId', 'ObjectId → User', 'Người tạo đơn hàng'],
    ['trainId', 'ObjectId → Train', 'Chuyến tàu (có thể là synthetic ID)'],
    ['holdId', 'ObjectId → SeatHold', 'Liên kết đến bản ghi giữ ghế (nếu có)'],
    ['trainSnapshot', 'Object', 'Snapshot thông tin chuyến tàu tại thời điểm đặt'],
    ['selectedSeats', 'Array', 'Danh sách ghế đã chọn (seatNumber, classType, basePrice)'],
    ['passengers', 'Array<Passenger>', 'Thông tin hành khách (đã mã hoá + mask)'],
    ['pricing', 'Object', 'Chi tiết giá: subtotal, serviceFee, discount, total'],
    ['promotionSnapshot', 'Object', 'Thông tin mã khuyến mãi đã áp dụng'],
    ['paymentStatus', 'Enum', 'unpaid → pending → paid / failed'],
    ['orderStatus', 'Enum', 'draft → pending_payment → paid → ticketed / cancelled / expired'],
  ],
  [20, 20, 60]
));

body.push(para([text('')]));
body.push(para([bold('Passenger Schema (embedded trong Order):')]));
body.push(makeTable(
  ['Trường', 'Kiểu', 'Mô tả'],
  [
    ['fullName', 'String', 'Họ tên hành khách (plain text)'],
    ['phoneEncrypted', 'EncryptedValue (iv, content, tag)', 'Số điện thoại đã mã hoá AES-256-GCM'],
    ['phoneMasked', 'String', 'Số điện thoại đã che (VD: 0912****34)'],
    ['nationalIdEncrypted', 'EncryptedValue', 'CCCD/CMND đã mã hoá'],
    ['nationalIdMasked', 'String', 'CCCD/CMND đã che (VD: ********1234)'],
    ['email', 'String', 'Email hành khách (tuỳ chọn)'],
  ],
  [22, 25, 53]
));

body.push(para([text('')]));
body.push(heading('5.2. Payment (Giao dịch thanh toán)', HeadingLevel.HEADING_2));
body.push(makeTable(
  ['Trường', 'Kiểu', 'Mô tả'],
  [
    ['orderId', 'ObjectId → Order', 'Đơn hàng liên quan'],
    ['provider', 'String', 'Nhà cung cấp: momo, zalopay, mockpay'],
    ['providerTxnId', 'String', 'Mã giao dịch phía provider'],
    ['amount', 'Number', 'Số tiền thanh toán (VNĐ)'],
    ['checkoutUrl', 'String', 'URL trang thanh toán (để redirect)'],
    ['status', 'Enum', 'initiated → pending → success / failed / cancelled'],
    ['paidAt', 'Date', 'Thời điểm thanh toán thành công'],
  ],
  [20, 20, 60]
));

body.push(para([text('')]));
body.push(heading('5.3. Ticket (Vé điện tử)', HeadingLevel.HEADING_2));
body.push(makeTable(
  ['Trường', 'Kiểu', 'Mô tả'],
  [
    ['ticketCode', 'String (unique)', 'Mã vé, sinh tự động (TK + timestamp + random)'],
    ['orderId', 'ObjectId → Order', 'Đơn hàng gốc'],
    ['userId', 'ObjectId → User', 'Chủ vé'],
    ['trainSnapshot', 'Object', 'Snapshot chuyến tàu'],
    ['seatSnapshot', 'Object', 'Snapshot ghế (seatNumber, classType, basePrice)'],
    ['passengerSnapshot', 'Object', 'Thông tin hành khách đã mask (không có dữ liệu mã hoá)'],
    ['ticketStatus', 'Enum', 'issued → used / cancelled'],
  ],
  [20, 20, 60]
));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 6. BẢO MẬT ══════════════════════════════════════════════════════════════
body.push(heading('6. Cơ chế bảo mật trong thanh toán'));

body.push(heading('6.1. Mã hoá dữ liệu cá nhân (PII Encryption)', HeadingLevel.HEADING_2));
body.push(para([text('Tất cả thông tin nhạy cảm của hành khách (số điện thoại, CCCD/CMND) đều được mã hoá trước khi lưu vào database.')]));
body.push(bullet([bold('Thuật toán: '), text('AES-256-GCM (Galois/Counter Mode)')]));
body.push(bullet([bold('Key: '), text('DATA_ENCRYPTION_KEY – 64 ký tự hex (32 bytes)')]));
body.push(bullet([bold('IV: '), text('12 bytes random cho mỗi lần mã hoá (đảm bảo ciphertext khác nhau dù plaintext giống nhau)')]));
body.push(bullet([bold('Auth Tag: '), text('16 bytes – đảm bảo toàn vẹn dữ liệu (integrity + authenticity)')]));
body.push(bullet([bold('Output: '), text('Object { iv, content, tag } – lưu dưới dạng hex string')]));

body.push(para([bold('Fail-fast mechanism:'), text(' Server kiểm tra key khi khởi động. Nếu key thiếu hoặc sai format → throw error, server dừng ngay. Loại bỏ nguy cơ chạy với key yếu/fallback.')]));

body.push(heading('6.2. Che dấu dữ liệu (Data Masking)', HeadingLevel.HEADING_2));
body.push(para([text('Song song với mã hoá, hệ thống lưu bản mask cho mục đích hiển thị:')]));
body.push(makeTable(
  ['Loại', 'Hàm', 'Ví dụ'],
  [
    ['Số điện thoại', 'maskPhone()', '0912345678 → 0912****78'],
    ['CCCD/CMND', 'maskNationalId()', '012345678901 → ********8901'],
  ],
  [20, 20, 60]
));

body.push(para([text('')]));
body.push(heading('6.3. Lọc dữ liệu trả về (Response Sanitization)', HeadingLevel.HEADING_2));
body.push(para([text('Hàm sanitizeOrderForCustomer lọc dữ liệu trước khi trả cho client:')]));
body.push(bullet([text('Chỉ trả các trường cần thiết: orderCode, trainSnapshot, pricing, trạng thái')]));
body.push(bullet([text('Passenger: chỉ trả fullName, phoneMasked, nationalIdMasked, email')]));
body.push(bullet([bold('Không bao giờ trả'), text(' phoneEncrypted, nationalIdEncrypted cho client')]));

body.push(heading('6.4. Xác thực chữ ký Webhook', HeadingLevel.HEADING_2));
body.push(para([text('Mọi callback từ cổng thanh toán đều được xác thực chữ ký:')]));
body.push(makeTable(
  ['Provider', 'Thuật toán', 'Dữ liệu ký', 'Key'],
  [
    ['MoMo', 'HMAC-SHA256', 'Raw signature (14 trường theo thứ tự)', 'MOMO_SECRET_KEY'],
    ['ZaloPay', 'HMAC-SHA256', 'data field từ callback body', 'ZALOPAY_KEY2'],
  ],
  [15, 15, 45, 25]
));

body.push(para([text('')]));
body.push(heading('6.5. Rate Limiting', HeadingLevel.HEADING_2));
body.push(para([text('Endpoint thanh toán được bảo vệ bởi rate limiter riêng:')]));
body.push(makeTable(
  ['Scope', 'Window', 'Max requests', 'Mục đích'],
  [
    ['/api/payments/*', '15 phút', '60', 'Chống spam tạo/xác nhận thanh toán'],
    ['/api/auth/*', '15 phút', '30', 'Chống brute force login/OTP'],
    ['Toàn app', '15 phút', '300', 'Giới hạn tổng chống DDoS'],
  ],
  [25, 15, 15, 45]
));

body.push(para([text('')]));
body.push(heading('6.6. Các biện pháp bảo mật khác', HeadingLevel.HEADING_2));
body.push(bullet([bold('JWT Authentication: '), text('Tất cả API thanh toán yêu cầu token hợp lệ (trừ webhook callback)')]));
body.push(bullet([bold('Ownership check: '), text('Khi thanh toán đơn hàng có sẵn, kiểm tra orderId + userId để đảm bảo chỉ chủ đơn mới được thanh toán')]));
body.push(bullet([bold('Helmet: '), text('HTTP security headers (X-Content-Type-Options, X-Frame-Options, v.v.)')]));
body.push(bullet([bold('CORS: '), text('Chỉ cho phép origin đã đăng ký trong APP_ORIGIN')]));
body.push(bullet([bold('Error masking: '), text('Ở production, ẩn chi tiết lỗi nội bộ, chỉ trả message chung')]));
body.push(bullet([bold('Luồng legacy chặn ở production: '), text('Trả HTTP 410 Gone để giảm bề mặt tấn công')]));
body.push(bullet([bold('Idempotent processing: '), text('Kiểm tra payment.status trước khi xử lý, tránh cập nhật trùng lặp')]));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 7. TÍNH GIÁ ═════════════════════════════════════════════════════════════
body.push(heading('7. Tính giá và khuyến mãi'));

body.push(heading('7.1. Công thức tính giá', HeadingLevel.HEADING_2));
body.push(para([text('Hệ thống tính giá theo công thức:')]));
body.push(para([bold('total = max(subtotal + serviceFee – discount, 0)'), text(' trong đó:')]));
body.push(bullet([bold('subtotal'), text(' = tổng basePrice của tất cả ghế được chọn')]));
body.push(bullet([bold('serviceFee'), text(' = 2% × subtotal (làm tròn)')]));
body.push(bullet([bold('discount'), text(' = giá trị giảm giá từ mã khuyến mãi (nếu có)')]));

body.push(heading('7.2. Mã khuyến mãi (Promotion)', HeadingLevel.HEADING_2));
body.push(para([text('Hệ thống hỗ trợ hai loại khuyến mãi:')]));
body.push(makeTable(
  ['Loại', 'Cách tính', 'Ràng buộc'],
  [
    ['percent', 'discount = subtotal × value / 100', 'Giới hạn bởi maxDiscount (nếu có)'],
    ['fixed', 'discount = value (cố định)', 'Không giới hạn thêm'],
  ],
  [15, 40, 45]
));
body.push(para([text('')]));
body.push(para([text('Điều kiện áp dụng:')]));
body.push(bullet([text('Mã code phải tồn tại, isActive = true')]));
body.push(bullet([text('Thời gian hiện tại nằm trong [startAt, endAt]')]));
body.push(bullet([text('subtotal ≥ minOrderValue')]));

// ═══ 8. GIỮ GHẾ ══════════════════════════════════════════════════════════════
body.push(heading('8. Giữ ghế tạm (Seat Hold)'));
body.push(para([text('Trước khi thanh toán, hệ thống giữ ghế tạm thời để tránh xung đột khi nhiều người cùng đặt một ghế.')]));
body.push(bullet([bold('SeatHold model: '), text('lưu userId, trainId, seatIds, expiresAt')]));
body.push(bullet([bold('TTL Index: '), text('MongoDB TTL index trên expiresAt tự động xoá bản ghi hết hạn')]));
body.push(bullet([bold('Hold Cleaner: '), text('Background job chạy mỗi 30 giây, tìm hold hết hạn, cập nhật status = expired')]));
body.push(bullet([bold('Socket.IO: '), text('Phát sự kiện seat:release đến room train_{trainId} khi ghế được giải phóng')]));
body.push(bullet([bold('Trạng thái hold: '), text('active → expired (hết hạn) / converted (đã thanh toán) / cancelled (người dùng huỷ)')]));

body.push(para([text('Khi tạo đơn hàng (createOrder), hệ thống:')]));
body.push(bullet([text('Kiểm tra hold còn active và chưa hết hạn'), 0]));
body.push(bullet([text('Liên kết holdId vào Order'), 0]));
body.push(bullet([text('Sau thanh toán thành công: hold.status = converted, seat.status = sold'), 0]));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 9. PHÁT HÀNH VÉ ═════════════════════════════════════════════════════════
body.push(heading('9. Phát hành vé điện tử'));
body.push(para([text('Sau khi thanh toán thành công, hàm issueTicketsForOrder thực hiện:')]));
body.push(bullet([text('Tạo một Ticket cho mỗi ghế trong đơn hàng')]));
body.push(bullet([text('Mỗi vé có ticketCode duy nhất (TK + timestamp + random)')]));
body.push(bullet([text('Snapshot thông tin chuyến tàu, ghế, hành khách (chỉ lưu dữ liệu mask)')]));
body.push(bullet([text('Cập nhật Seat.status = sold trong database')]));
body.push(bullet([text('Nếu đơn hàng có holdId: cập nhật SeatHold.status = converted')]));
body.push(bullet([text('Phát sự kiện seat:reserved qua Socket.IO để cập nhật UI realtime')]));
body.push(bullet([text('Cập nhật Order: orderStatus = ticketed, paymentStatus = paid')]));

body.push(para([bold('Lưu ý bảo mật:'), text(' Vé điện tử (passengerSnapshot) chỉ chứa dữ liệu đã mask (phoneMasked, nationalIdMasked), không chứa dữ liệu mã hoá. Điều này đảm bảo ngay cả khi vé bị truy cập trái phép, thông tin cá nhân vẫn được bảo vệ.')]));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 10. HẠN CHẾ ═════════════════════════════════════════════════════════════
body.push(heading('10. Các điểm hạn chế'));

body.push(heading('10.1. Hạn chế về kiến trúc', HeadingLevel.HEADING_2));
body.push(makeTable(
  ['#', 'Hạn chế', 'Mô tả chi tiết', 'Mức độ'],
  [
    ['1', 'Chưa có transaction (atomic operation)', 'Quy trình tạo Order → Payment → Ticket gồm nhiều bước ghi riêng lẻ. Nếu server crash giữa chừng, dữ liệu có thể bất đồng bộ (VD: Order đã tạo nhưng Payment chưa lưu).', 'Cao'],
    ['2', 'Logic trùng lặp giữa các handler', 'settlePaymentAndRedirect, momoReturn, zaloPayReturn, mockCompletePayment có logic cập nhật trạng thái rất giống nhau, gây khó bảo trì.', 'Trung bình'],
    ['3', 'Chưa có message queue', 'Xử lý webhook đồng bộ. Nếu issueTicketsForOrder thất bại, không có cơ chế retry tự động.', 'Cao'],
    ['4', 'Luồng legacy vẫn tồn tại', 'Dù đã chặn ở production, code legacy vẫn nằm trong codebase, tăng complexity không cần thiết.', 'Thấp'],
    ['5', 'Single-server architecture', 'Chưa hỗ trợ horizontal scaling, holdCleaner chạy trên mỗi instance có thể gây xung đột.', 'Trung bình'],
  ],
  [5, 18, 57, 10]
));

body.push(para([text('')]));
body.push(heading('10.2. Hạn chế về bảo mật', HeadingLevel.HEADING_2));
body.push(makeTable(
  ['#', 'Hạn chế', 'Mô tả chi tiết', 'Mức độ'],
  [
    ['1', 'Chưa có HTTPS enforcement', 'Backend chưa tự enforce HTTPS, phụ thuộc vào reverse proxy. Dữ liệu thanh toán có thể bị sniff nếu triển khai sai.', 'Cao'],
    ['2', 'Webhook endpoint không xác thực IP', 'Chỉ xác thực chữ ký, chưa whitelist IP của MoMo/ZaloPay. Attacker có thể thử brute force signature.', 'Trung bình'],
    ['3', 'Chưa có audit log', 'Không ghi log chi tiết các thao tác thanh toán (ai, khi nào, từ IP nào). Khó truy vết khi có sự cố.', 'Cao'],
    ['4', 'Mock checkout không bảo vệ', 'Trang /api/payments/mock-checkout và /mock-complete không yêu cầu auth, ai cũng có thể truy cập.', 'Trung bình'],
    ['5', 'Single encryption key', 'Toàn bộ dữ liệu dùng chung 1 key. Nếu key bị lộ, toàn bộ PII bị compromise. Chưa có key rotation.', 'Cao'],
    ['6', 'Chưa có 2FA cho admin', 'Tài khoản admin chỉ đăng nhập bằng email + mật khẩu, chưa có xác thực 2 yếu tố.', 'Trung bình'],
  ],
  [5, 18, 57, 10]
));

body.push(para([text('')]));
body.push(heading('10.3. Hạn chế về chức năng', HeadingLevel.HEADING_2));
body.push(makeTable(
  ['#', 'Hạn chế', 'Mô tả chi tiết'],
  [
    ['1', 'Chưa hỗ trợ hoàn tiền (refund)', 'Khi huỷ vé, hệ thống chỉ đổi trạng thái, chưa tích hợp refund qua MoMo/ZaloPay.'],
    ['2', 'Chưa hỗ trợ thanh toán thẻ ngân hàng', 'Chỉ có MoMo, ZaloPay và mock. Chưa tích hợp VNPAY, thẻ quốc tế (Visa/Mastercard).'],
    ['3', 'Chưa có hệ thống hoá đơn điện tử', 'Không tạo hoá đơn VAT hoặc biên lai chính thức.'],
    ['4', 'Chưa có hệ thống thông báo đầy đủ', 'Chưa gửi email xác nhận thanh toán, push notification khi vé được phát hành.'],
    ['5', 'Pricing tính phía client', 'totalPrice gửi từ client lên, server không tự tính lại từ seatId. Có nguy cơ bị tamper giá.'],
    ['6', 'ZaloPay route chưa đăng ký', 'zaloPayReturn và zaloPayCallback được import nhưng chưa có router.get/post trong payment.routes.js.'],
    ['7', 'Chưa quản lý lịch sử thanh toán', 'Không có API để xem lịch sử giao dịch chi tiết (payment history) cho người dùng.'],
    ['8', 'Chưa có cơ chế timeout đơn hàng', 'Đơn hàng pending_payment không tự expire, có thể tồn tại vô hạn.'],
  ],
  [5, 22, 73]
));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 11. HƯỚNG PHÁT TRIỂN ════════════════════════════════════════════════════
body.push(heading('11. Hướng phát triển'));

body.push(heading('11.1. Ngắn hạn (ưu tiên cao)', HeadingLevel.HEADING_2));

body.push(makeTable(
  ['#', 'Hạng mục', 'Mô tả', 'Lợi ích'],
  [
    ['1', 'MongoDB Transaction', 'Sử dụng session.withTransaction() để đảm bảo atomic operation cho chuỗi Order → Payment → Ticket.', 'Đảm bảo toàn vẹn dữ liệu'],
    ['2', 'Server-side pricing', 'Server tự tính totalPrice từ seatId thay vì tin tưởng giá từ client. So sánh với giá client gửi lên.', 'Chống tamper giá'],
    ['3', 'Đăng ký ZaloPay routes', 'Thêm router.get/post cho zalopay-return và zalopay-callback trong payment.routes.js.', 'Hoàn thiện tích hợp ZaloPay'],
    ['4', 'Order timeout', 'Thêm expiresAt cho đơn hàng pending_payment, background job tự huỷ đơn hết hạn.', 'Giải phóng ghế, giảm đơn treo'],
    ['5', 'Audit logging', 'Ghi log chi tiết: userId, action, IP, timestamp, provider cho mọi thao tác thanh toán.', 'Truy vết sự cố, compliance'],
    ['6', 'Xoá luồng legacy', 'Loại bỏ completeLegacyPayment khỏi codebase, giảm bề mặt tấn công.', 'Đơn giản hoá code'],
  ],
  [5, 18, 52, 25]
));

body.push(para([text('')]));
body.push(heading('11.2. Trung hạn', HeadingLevel.HEADING_2));

body.push(makeTable(
  ['#', 'Hạng mục', 'Mô tả'],
  [
    ['1', 'Tích hợp VNPAY', 'Thêm cổng thanh toán VNPAY để hỗ trợ thẻ ATM nội địa và thẻ quốc tế.'],
    ['2', 'Hoàn tiền tự động', 'Tích hợp refund API của MoMo/ZaloPay. Khi huỷ vé → tự động hoàn tiền về ví/tài khoản.'],
    ['3', 'Message Queue (Redis/RabbitMQ)', 'Xử lý webhook qua hàng đợi: nhận nhanh → trả OK → xử lý async với retry mechanism.'],
    ['4', 'Key rotation', 'Hỗ trợ nhiều encryption key, mỗi key có version. Re-encrypt dữ liệu cũ khi rotate key.'],
    ['5', 'Email xác nhận thanh toán', 'Gửi email chứa thông tin đơn hàng + vé sau khi thanh toán thành công.'],
    ['6', 'Payment history API', 'API cho người dùng xem lịch sử giao dịch, tìm kiếm/lọc theo thời gian, trạng thái.'],
    ['7', '2FA cho admin', 'Thêm xác thực 2 yếu tố (TOTP hoặc SMS) cho tài khoản admin.'],
  ],
  [5, 22, 73]
));

body.push(para([text('')]));
body.push(heading('11.3. Dài hạn', HeadingLevel.HEADING_2));

body.push(makeTable(
  ['#', 'Hạng mục', 'Mô tả'],
  [
    ['1', 'Microservice thanh toán', 'Tách module thanh toán thành service riêng, giao tiếp qua event bus.'],
    ['2', 'QR Code vé điện tử', 'Tạo QR code cho mỗi vé, soát vé bằng quét QR tại ga.'],
    ['3', 'Hoá đơn điện tử (VAT)', 'Tích hợp hệ thống hoá đơn điện tử theo quy định pháp luật.'],
    ['4', 'Thanh toán quốc tế', 'Hỗ trợ Stripe/PayPal cho khách du lịch nước ngoài.'],
    ['5', 'Analytics dashboard', 'Dashboard doanh thu, thống kê thanh toán theo thời gian, provider, tỷ lệ thành công.'],
    ['6', 'PCI DSS compliance', 'Tuân thủ tiêu chuẩn bảo mật thẻ thanh toán nếu xử lý trực tiếp thông tin thẻ.'],
  ],
  [5, 22, 73]
));

body.push(new Paragraph({ children: [new PageBreak()] }));

// ═══ 12. KẾT LUẬN ════════════════════════════════════════════════════════════
body.push(heading('12. Kết luận'));
body.push(para([
  text('Chức năng thanh toán trong ứng dụng VetaU đã xây dựng được nền tảng vững chắc với kiến trúc multi-provider, hỗ trợ MoMo, ZaloPay và chế độ demo. Hệ thống đã áp dụng nhiều biện pháp bảo mật quan trọng bao gồm: mã hoá dữ liệu PII bằng AES-256-GCM, che dấu thông tin hiển thị, xác thực chữ ký webhook, rate limiting riêng cho endpoint thanh toán, và kiểm soát lỗi tại production.'),
]));
body.push(para([
  text('Tuy nhiên, hệ thống vẫn còn một số hạn chế cần khắc phục trước khi đưa vào sản xuất thực tế, đặc biệt là: thiếu MongoDB transaction cho tính toàn vẹn dữ liệu, server chưa tự tính giá vé (phụ thuộc giá từ client), chưa có cơ chế hoàn tiền, và chưa có audit log đầy đủ.'),
]));
body.push(para([
  text('Với lộ trình phát triển đã đề xuất, hệ thống có thể được nâng cấp dần qua 3 giai đoạn (ngắn hạn, trung hạn, dài hạn) để đạt mức độ tin cậy và bảo mật cao hơn, đáp ứng yêu cầu vận hành thương mại.'),
]));

body.push(para([text('')]));
body.push(para([text('─── Hết ───', { italics: true, color: '9e9e9e' })]));

// ─── Push nội dung vào section chính ──────────────────────────────────────────
sections.push({
  properties: { page: { margin: { top: convertInchesToTwip(1), bottom: convertInchesToTwip(1), left: convertInchesToTwip(1.2), right: convertInchesToTwip(1) } } },
  children: body,
});

// ── Build & Write ──────────────────────────────────────────────────────────────
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

const outPath = path.resolve('BaoCao_ChucNang_ThanhToan_VetaU.docx');
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log(`✅ Đã tạo báo cáo: ${outPath}`);
