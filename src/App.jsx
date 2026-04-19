import { useState, useEffect, useRef } from "react";
import { Preferences } from '@capacitor/preferences';
import axios from 'axios';
import {
  Search, Ticket, Clock, Gift, ChevronRight, MapPin, TrendingUp,
  Headphones, Star, Home, Bell, User, ChevronLeft, Calendar, Users,
  ArrowRight, SlidersHorizontal, Zap, Armchair, Check, X, Train,
  AlertCircle, CreditCard, Wallet, Tag, CheckCircle2, Download,
  Share2, XCircle, Mail, Phone, Plus, Wifi, Coffee, Snowflake,
  Info, LogOut, Shield, Settings, HelpCircle, Globe, FileText,
  History, Filter, Eye, EyeOff
} from "lucide-react";

// Cấu hình API tập trung (An ninh: Sử dụng HTTPS)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.vetau.example.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Interceptor để tự động đính kèm Token vào Header (An ninh)
api.interceptors.request.use(async (config) => {
  const { value } = await Preferences.get({ key: 'auth_token' });
  if (value) {
    config.headers.Authorization = `Bearer ${value}`;
  }
  return config;
});

const P = '#2563eb';
const PD = '#1d4ed8';
const T = '#0d9488';
const BG = '#f9fafb';
const GRAD = `linear-gradient(135deg, ${P} 0%, ${T} 100%)`;
const GRAD2 = `linear-gradient(135deg, ${PD} 0%, ${T} 100%)`;

const fmt = (n) => n.toLocaleString('vi-VN') + 'đ';

const STATIONS = ['Hà Nội','Vinh','Đồng Hới','Huế','Đà Nẵng','Quảng Ngãi','Nha Trang','TP. Hồ Chí Minh','Biên Hòa'];

const TRAINS = [
  { id:'SE1', name:'SE1', type:'Tàu nhanh', dep:'06:00', arr:'20:30', dur:'14h 30m', price:520000, seats:45, rating:4.8, premium:false },
  { id:'SE3', name:'SE3', type:'Tàu nhanh', dep:'19:30', arr:'10:00', dur:'14h 30m', price:540000, seats:28, rating:4.7, premium:false },
  { id:'SE5', name:'SE5', type:'Tàu chất lượng cao', dep:'07:00', arr:'20:15', dur:'13h 15m', price:680000, seats:12, rating:4.9, premium:true },
  { id:'SE7', name:'SE7', type:'Tàu thường', dep:'22:00', arr:'13:30', dur:'15h 30m', price:420000, seats:67, rating:4.5, premium:false },
];

const CARRIAGES = [
  { id:1, type:'Ngồi mềm điều hòa', total:64, price:520000 },
  { id:2, type:'Nằm khoang 6', total:36, price:680000 },
  { id:3, type:'Nằm khoang 4', total:24, price:820000 },
  { id:4, type:'VIP', total:12, price:1200000 },
];

const STOPS = [
  { station:'Hà Nội', time:'06:00' }, { station:'Vinh', time:'11:30' },
  { station:'Đồng Hới', time:'15:00' }, { station:'Huế', time:'18:00' }, { station:'Đà Nẵng', time:'20:30' },
];

const MOCK_TICKETS = [
  { id:'TK12345678', trainId:'SE1', from:'Hà Nội', to:'Đà Nẵng', date:'25/04/2026', time:'06:00', seats:['12A','12B'], carriageType:'Ngồi mềm điều hòa', totalPrice:1040000, status:'upcoming', passengers:[{name:'Nguyễn Văn A'},{name:'Trần Thị B'}] },
  { id:'TK12345679', trainId:'SE3', from:'Hà Nội', to:'TP. Hồ Chí Minh', date:'15/03/2026', time:'19:30', seats:['C2-3'], carriageType:'Nằm khoang 6', totalPrice:1360000, status:'completed', passengers:[{name:'Nguyễn Văn A'}] },
  { id:'TK12345677', trainId:'SE5', from:'Đà Nẵng', to:'TP. Hồ Chí Minh', date:'10/02/2026', time:'07:00', seats:['V1A'], carriageType:'VIP', totalPrice:1200000, status:'cancelled', passengers:[{name:'Nguyễn Văn A'}] },
];

const POPULAR = [
  { from:'Hà Nội', to:'Đà Nẵng', price:'520.000đ', time:'14h 30m', rating:4.8 },
  { from:'Hà Nội', to:'TP. Hồ Chí Minh', price:'1.200.000đ', time:'29h 45m', rating:4.9 },
  { from:'Đà Nẵng', to:'TP. Hồ Chí Minh', price:'680.000đ', time:'15h 20m', rating:4.7 },
  { from:'Hà Nội', to:'Huế', price:'450.000đ', time:'12h 15m', rating:4.8 },
];

const PROMOS = [
  { title:'Giảm 20% tất cả tuyến', sub:'Cho chuyến đi đầu tiên', bg:'linear-gradient(135deg,#ea580c,#dc2626)' },
  { title:'Ưu đãi cuối tuần', sub:'Giảm đến 15%', bg:'linear-gradient(135deg,#0d9488,#0f766e)' },
];

const NOTIFS = [
  { id:1, title:'Vé của bạn đã được xác nhận', body:'Tàu SE1 ngày 25/04/2026 - Hà Nội → Đà Nẵng', time:'5 phút trước', read:false, icon:'✅' },
  { id:2, title:'Khuyến mãi đặc biệt', body:'Giảm 20% cho chuyến đi tiếp theo. Dùng mã SAVE20', time:'2 giờ trước', read:false, icon:'🎁' },
  { id:3, title:'Nhắc nhở khởi hành', body:'Chuyến tàu SE1 của bạn khởi hành sau 2 ngày', time:'Hôm qua', read:true, icon:'🚄' },
  { id:4, title:'Cập nhật ứng dụng', body:'Phiên bản 1.1.0 đã có nhiều cải tiến mới', time:'2 ngày trước', read:true, icon:'📱' },
];

// Deterministic seat status
const seatStatus = (idx) => {
  const v = Math.abs(Math.sin(idx * 7.3 + 1.5));
  return v > 0.65 ? 'occupied' : v > 0.55 ? 'holding' : 'available';
};

// ─── Card ────────────────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background:'white', borderRadius:16, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', padding:'20px', ...style, cursor: onClick ? 'pointer' : 'default' }}>
    {children}
  </div>
);

// ─── Header ──────────────────────────────────────────────────────
const Header = ({ title, sub, back, right }) => (
  <div style={{ background:GRAD, padding:'calc(env(safe-area-inset-top) + 8px) 20px 12px', position:'sticky', top:0, zIndex:10, boxShadow:'0 2px 10px rgba(0,0,0,0.1)' }}>
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      {back && (
        <button onClick={back} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <ChevronLeft size={20} color="white" />
        </button>
      )}
      <div style={{ flex:1 }}>
        <div style={{ color:'white', fontSize:18, fontWeight:700, letterSpacing:'-0.5px' }}>{title}</div>
        {sub && <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12 }}>{sub}</div>}
      </div>
      {right}
    </div>
  </div>
);

// ─── Toast ───────────────────────────────────────────────────────
let toastTimer;
const useToast = () => {
  const [toast, setToast] = useState(null);
  const show = (msg, type='success') => {
    setToast({ msg, type });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => setToast(null), 2500);
  };
  return [toast, show];
};

const Toast = ({ toast }) => {
  if (!toast) return null;
  const bg = toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? P : '#10b981';
  return (
    <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', background:bg, color:'white', padding:'12px 20px', borderRadius:12, zIndex:9999, fontSize:14, fontWeight:600, boxShadow:'0 4px 16px rgba(0,0,0,0.2)', maxWidth:360, textAlign:'center' }}>
      {toast.msg}
    </div>
  );
};

// ─── Btn ─────────────────────────────────────────────────────────
const Btn = ({ children, onClick, disabled, style={}, variant='primary' }) => {
  const base = { border:'none', borderRadius:12, padding:'14px 24px', fontWeight:700, fontSize:15, cursor: disabled ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'opacity 0.2s', opacity: disabled ? 0.5 : 1, width:'100%', ...style };
  if (variant === 'primary') return <button onClick={onClick} disabled={disabled} style={{ ...base, background:GRAD, color:'white' }}>{children}</button>;
  if (variant === 'outline') return <button onClick={onClick} disabled={disabled} style={{ ...base, background:'white', color:P, border:`2px solid ${P}` }}>{children}</button>;
  if (variant === 'ghost') return <button onClick={onClick} disabled={disabled} style={{ ...base, background:'transparent', color:'#6b7280' }}>{children}</button>;
};

// ─── SplashScreen ────────────────────────────────────────────────
function SplashScreen({ navigate, setUser }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { value: token } = await Preferences.get({ key: 'auth_token' });
        const { value: userData } = await Preferences.get({ key: 'user_data' });

        // Giả lập delay để hiển thị thương hiệu
        setTimeout(() => {
          if (token && userData) {
            setUser(JSON.parse(userData));
            navigate('home');
          } else {
            navigate('login');
          }
        }, 2500);
      } catch (e) {
        setTimeout(() => navigate('login'), 2500);
      }
    };
    checkAuth();
  }, []);
  return (
    <div style={{ height:'100vh', background:GRAD, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0 }}>
      <style>{`
        @keyframes trainMove { 0%,100%{transform:translateX(0)} 50%{transform:translateX(16px)} }
        @keyframes pulse3 { 0%,100%{opacity:0.3} 50%{opacity:1} }
        .train-anim { animation: trainMove 2s ease-in-out infinite; }
        .dot1 { animation: pulse3 1.5s infinite 0s; }
        .dot2 { animation: pulse3 1.5s infinite 0.2s; }
        .dot3 { animation: pulse3 1.5s infinite 0.4s; }
      `}</style>
      <div className="train-anim" style={{ background:'rgba(255,255,255,0.15)', borderRadius:'50%', padding:32, marginBottom:32 }}>
        <Train size={80} color="white" strokeWidth={2} />
      </div>
      <div style={{ fontSize:40, fontWeight:800, color:'white', marginBottom:4 }}>Vé Tàu</div>
      <div style={{ fontSize:22, color:'rgba(255,255,255,0.9)' }}>Bắc – Nam</div>
      <div style={{ display:'flex', gap:8, marginTop:48 }}>
        <div className="dot1" style={{ width:8, height:8, background:'white', borderRadius:'50%' }} />
        <div className="dot2" style={{ width:8, height:8, background:'white', borderRadius:'50%' }} />
        <div className="dot3" style={{ width:8, height:8, background:'white', borderRadius:'50%' }} />
      </div>
    </div>
  );
}

// ─── LoginScreen ─────────────────────────────────────────────────
function LoginScreen({ navigate, setUser }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, showToast] = useToast();

  const handleLogin = async () => {
    if (!email || !pass) { showToast('Vui lòng nhập đầy đủ thông tin', 'error'); return; }
    setLoading(true);

    try {
      // Mock API call - To be replaced with: const res = await api.post('/login', { email, pass });
      setTimeout(async () => {
        const mockUser = { email, name: email.split('@')[0] };
        const mockToken = 'mock-jwt-token-' + Date.now();

        await Preferences.set({ key: 'auth_token', value: mockToken });
        await Preferences.set({ key: 'user_data', value: JSON.stringify(mockUser) });

        setUser(mockUser);
        navigate('home');
      }, 1200);
    } catch (err) {
      showToast('Đăng nhập thất bại. Kiểm tra lại thông tin.', 'error');
      setLoading(false);
    }
  };

  const inp = { width:'100%', padding:'14px 14px 14px 48px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:15, outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ minHeight:'100vh', background:BG }}>
      <Toast toast={toast} />
      <div style={{ background:GRAD, padding:'calc(env(safe-area-inset-top) + 16px) 24px 40px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, background:'rgba(255,255,255,0.08)', borderRadius:'50%' }} />
        <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:'16px', padding:12, display:'inline-block', marginBottom:12 }}>
          <Train size={32} color="white" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:'white', marginBottom:2, letterSpacing:'-0.5px' }}>Vé Tàu Bắc Nam</div>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>Đăng nhập để đặt vé dễ dàng</div>
      </div>
      <div style={{ padding:'0 20px', marginTop:-20, position:'relative', zIndex:1 }}>
        <Card style={{ marginBottom:20, borderRadius:20, paddingTop:24 }}>
          <div style={{ fontSize:20, fontWeight:700, color:'#111827', marginBottom:20, textAlign:'center' }}>Đăng nhập</div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Email</label>
            <div style={{ position:'relative' }}>
              <Mail size={18} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
              <input style={inp} type="email" placeholder="example@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Mật khẩu</label>
            <div style={{ position:'relative' }}>
              <CreditCard size={18} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
              <input style={inp} type={showPass?'text':'password'} placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} />
              <button onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer' }}>
                {showPass ? <EyeOff size={18} color="#9ca3af"/> : <Eye size={18} color="#9ca3af"/>}
              </button>
            </div>
          </div>
          <Btn onClick={handleLogin} disabled={loading}>
            {loading ? <div style={{ width:20, height:20, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> : null}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Btn>
          <div style={{ textAlign:'center', marginTop:16, fontSize:14, color:'#6b7280' }}>
            Chưa có tài khoản? <span style={{ color:P, fontWeight:600, cursor:'pointer' }} onClick={()=>navigate('register')}>Đăng ký ngay</span>
          </div>
        </Card>
        <div style={{ textAlign:'center', fontSize:12, color:'#9ca3af', marginBottom:24 }}>
          Bằng cách đăng nhập, bạn đồng ý với Điều khoản sử dụng của chúng tôi
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── RegisterScreen ──────────────────────────────────────────────
function RegisterScreen({ navigate, setUser }) {
  const [form, setForm] = useState({ name: '', email: '', pass: '', confirmPass: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, showToast] = useToast();

  const handleRegister = async () => {
    const { name, email, pass, confirmPass } = form;
    if (!name || !email || !pass) { showToast('Vui lòng điền đủ thông tin', 'error'); return; }
    if (pass !== confirmPass) { showToast('Mật khẩu xác nhận không khớp', 'error'); return; }

    setLoading(true);
    try {
      // Mock API call - To be replaced with: const res = await api.post('/register', { name, email, pass });
      setTimeout(async () => {
        const mockUser = { name, email };
        const mockToken = 'mock-register-token-' + Date.now();

        await Preferences.set({ key: 'auth_token', value: mockToken });
        await Preferences.set({ key: 'user_data', value: JSON.stringify(mockUser) });

        setUser(mockUser);
        showToast('Đăng ký thành công!');
        navigate('home');
      }, 1500);
    } catch (err) {
      showToast('Lỗi đăng ký. Vui lòng thử lại sau.', 'error');
      setLoading(false);
    }
  };

  const inp = { width:'100%', padding:'14px 14px 14px 48px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:15, outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ minHeight:'100vh', background:BG }}>
      <Toast toast={toast} />
      <div style={{ background:GRAD, padding:'calc(env(safe-area-inset-top) + 16px) 24px 40px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <button onClick={() => navigate('login')} style={{ position:'absolute', left:20, top:'calc(env(safe-area-inset-top) + 16px)', background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:10 }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <div style={{ position:'absolute', top:-40, right:-40, width:140, height:140, background:'rgba(255,255,255,0.08)', borderRadius:'50%' }} />
        <div style={{ background:'rgba(255,255,255,0.15)', borderRadius:'16px', padding:12, display:'inline-block', marginBottom:12 }}>
          <User size={32} color="white" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize:22, fontWeight:800, color:'white', marginBottom:2, letterSpacing:'-0.5px' }}>Tạo tài khoản</div>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>Tham gia cùng hàng nghìn hành khách</div>
      </div>
      <div style={{ padding:'0 20px', marginTop:-20, position:'relative', zIndex:1 }}>
        <Card style={{ marginBottom:20, borderRadius:20, paddingTop:24 }}>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Họ và tên</label>
            <div style={{ position:'relative' }}>
              <User size={18} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
              <input style={inp} placeholder="Nguyễn Văn A" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Email</label>
            <div style={{ position:'relative' }}>
              <Mail size={18} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
              <input style={inp} type="email" placeholder="example@email.com" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Mật khẩu</label>
            <div style={{ position:'relative' }}>
              <Shield size={18} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
              <input style={inp} type={showPass?'text':'password'} placeholder="••••••••" value={form.pass} onChange={e=>setForm({...form, pass: e.target.value})} />
              <button onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer' }}>
                {showPass ? <EyeOff size={18} color="#9ca3af"/> : <Eye size={18} color="#9ca3af"/>}
              </button>
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Xác nhận mật khẩu</label>
            <div style={{ position:'relative' }}>
              <CheckCircle2 size={18} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }} />
              <input style={inp} type={showPass?'text':'password'} placeholder="••••••••" value={form.confirmPass} onChange={e=>setForm({...form, confirmPass: e.target.value})} />
            </div>
          </div>
          <Btn onClick={handleRegister} disabled={loading}>
            {loading ? <div style={{ width:20, height:20, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/> : null}
            {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
          </Btn>
          <div style={{ textAlign:'center', marginTop:16, fontSize:14, color:'#6b7280' }}>
            Đã có tài khoản? <span style={{ color:P, fontWeight:600, cursor:'pointer' }} onClick={()=>navigate('login')}>Đăng nhập</span>
          </div>
        </Card>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── HomeScreen ──────────────────────────────────────────────────
function HomeScreen({ navigate, user }) {
  const [form, setForm] = useState({ from:'', to:'', date:'', passengers:1 });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const inpSt = { width:'100%', padding:'12px 14px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:14, outline:'none', boxSizing:'border-box' };

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:80 }}>
      {/* Header */}
      <div style={{ background:GRAD, padding:'calc(env(safe-area-inset-top) + 16px) 24px 50px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-32, right:-32, width:140, height:140, background:'rgba(255,255,255,0.06)', borderRadius:'50%' }} />
        <div style={{ fontSize:22, fontWeight:800, color:'white', marginBottom:2, letterSpacing:'-0.5px' }}>Xin chào! 👋</div>
        <div style={{ color:'rgba(255,255,255,0.8)', fontSize:12 }}>Bạn muốn đi đâu hôm nay?</div>
      </div>

      <div style={{ padding:'0 16px', marginTop:-30, position:'relative', zIndex:1 }}>
        {/* Search Card */}
        <Card style={{ marginBottom:20, borderRadius:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:16, color:'#111827', marginBottom:16 }}>
            <MapPin size={18} color={P} /> Tìm chuyến tàu
          </div>
          <div style={{ marginBottom:10 }}>
            <input style={inpSt} placeholder="Ga đi" value={form.from} onChange={e=>set('from',e.target.value)} />
          </div>
          <div style={{ marginBottom:10 }}>
            <input style={inpSt} placeholder="Ga đến" value={form.to} onChange={e=>set('to',e.target.value)} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <input style={inpSt} type="date" value={form.date} onChange={e=>set('date',e.target.value)} />
            <select style={inpSt} value={form.passengers} onChange={e=>set('passengers',parseInt(e.target.value))}>
              {[1,2,3,4].map(n=><option key={n} value={n}>{n} người</option>)}
            </select>
          </div>
          <Btn onClick={()=>navigate('trains',{searchData:{...form, from: form.from||'Hà Nội', to: form.to||'Đà Nẵng', date: form.date||'2026-04-25'}})}>
            <Search size={18}/> Tìm chuyến
          </Btn>
        </Card>

        {/* Quick Actions */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {[
            { icon:Search, label:'Tìm chuyến', sc:'search', bg:'#dbeafe', ic:'#2563eb' },
            { icon:Ticket, label:'Vé của tôi', sc:'myTickets', bg:'#ccfbf1', ic:'#0d9488' },
            { icon:Clock, label:'Lịch sử', sc:'myTickets', bg:'#ffedd5', ic:'#ea580c' },
            { icon:Headphones, label:'Hỗ trợ', sc:'profile', bg:'#ede9fe', ic:'#7c3aed' },
          ].map(a=>(
            <button key={a.label} onClick={()=>navigate(a.sc)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <div style={{ background:a.bg, width:56, height:56, borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <a.icon size={24} color={a.ic} />
              </div>
              <span style={{ fontSize:11, fontWeight:600, color:'#374151', textAlign:'center' }}>{a.label}</span>
            </button>
          ))}
        </div>

        {/* Promos */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:15, color:'#111827' }}>
              <Gift size={18} color="#ea580c" /> Ưu đãi hot
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {PROMOS.map((p,i)=>(
              <div key={i} style={{ background:p.bg, borderRadius:14, padding:16 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'white', marginBottom:4 }}>{p.title}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.9)' }}>{p.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Routes */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:700, fontSize:15, color:'#111827' }}>
              <TrendingUp size={18} color={P} /> Tuyến phổ biến
            </div>
            <button style={{ fontSize:13, fontWeight:600, color:P, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:2 }}>
              Xem tất cả <ChevronRight size={14}/>
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {POPULAR.map((r,i)=>(
              <Card key={i} onClick={()=>navigate('trains',{searchData:{from:r.from,to:r.to,date:'2026-04-25',passengers:1}})} style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontWeight:700, color:'#111827', marginBottom:6 }}>
                      {r.from} <ChevronRight size={14} color="#9ca3af"/> {r.to}
                    </div>
                    <div style={{ display:'flex', gap:14, fontSize:12, color:'#6b7280' }}>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}><Clock size={12}/>{r.time}</span>
                      <span style={{ display:'flex', alignItems:'center', gap:4 }}><Star size={12} fill="#facc15" color="#facc15"/>{r.rating}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:12, color:'#6b7280' }}>Từ</div>
                    <div style={{ fontWeight:700, color:P }}>{r.price}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SearchScreen ────────────────────────────────────────────────
function SearchScreen({ navigate, back }) {
  const [form, setForm] = useState({ from:'', to:'', date:'', passengers:1 });
  const [modal, setModal] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const [toast, showToast] = useToast();

  const recent = [
    { from:'Hà Nội', to:'Đà Nẵng', date:'2026-04-25' },
    { from:'Hà Nội', to:'TP. Hồ Chí Minh', date:'2026-05-01' },
  ];

  const inpBtn = (label, field, icon, color) => (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>{label}</div>
      <button onClick={()=>setModal(field)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'14px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:12, cursor:'pointer', textAlign:'left' }}>
        {icon} <span style={{ color: form[field] ? '#111827' : '#9ca3af', fontWeight: form[field] ? 600 : 400 }}>{form[field] || `Chọn ${label.toLowerCase()}`}</span>
      </button>
    </div>
  );

  const handleSearch = () => {
    if (!form.from||!form.to||!form.date) { showToast('Vui lòng điền đầy đủ thông tin','error'); return; }
    navigate('trains', { searchData: form });
  };

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:80 }}>
      <Toast toast={toast}/>
      <Header title="Tìm chuyến tàu" back={back}/>
      <div style={{ padding:'16px' }}>
        <Card style={{ marginBottom:20 }}>
          {inpBtn('Ga đi','from',<MapPin size={18} color={P}/>)}
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
            <button onClick={()=>setForm(f=>({...f,from:f.to,to:f.from}))} style={{ width:36, height:36, borderRadius:'50%', border:`2px solid ${P}`, background:'white', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
              <ArrowRight size={18} color={P} style={{ transform:'rotate(90deg)' }}/>
            </button>
          </div>
          {inpBtn('Ga đến','to',<MapPin size={18} color={T}/>)}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Ngày khởi hành</div>
            <div style={{ position:'relative' }}>
              <Calendar size={18} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input type="date" value={form.date} onChange={e=>set('date',e.target.value)} style={{ width:'100%', padding:'14px 14px 14px 44px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Số hành khách</div>
            <div style={{ position:'relative' }}>
              <Users size={18} color="#9ca3af" style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <select value={form.passengers} onChange={e=>set('passengers',parseInt(e.target.value))} style={{ width:'100%', padding:'14px 14px 14px 44px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:14, outline:'none', boxSizing:'border-box' }}>
                {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} người</option>)}
              </select>
            </div>
          </div>
          <Btn onClick={handleSearch} disabled={!form.from||!form.to||!form.date}><Search size={18}/>Tìm chuyến</Btn>
        </Card>

        <div style={{ marginBottom:8, display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:15, color:'#111827' }}>
          <Clock size={16} color="#6b7280"/> Tìm kiếm gần đây
        </div>
        {recent.map((r,i)=>(
          <Card key={i} onClick={()=>setForm(f=>({...f,...r}))} style={{ marginBottom:10, padding:14, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ background:'#dbeafe', padding:8, borderRadius:10 }}><MapPin size={18} color={P}/></div>
              <div>
                <div style={{ fontWeight:600, color:'#111827', fontSize:14 }}>{r.from} → {r.to}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>{r.date}</div>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af"/>
          </Card>
        ))}
      </div>

      {/* Station Modal */}
      {modal && (
        <div onClick={()=>setModal(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', width:'100%', borderRadius:'24px 24px 0 0', padding:24, maxHeight:'70vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:18, fontWeight:700 }}>{modal==='from'?'Chọn ga đi':'Chọn ga đến'}</div>
              <button onClick={()=>setModal(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#6b7280' }}>✕</button>
            </div>
            {STATIONS.map(s=>(
              <button key={s} onClick={()=>{set(modal,s);setModal(null);}} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 4px', background:'none', border:'none', borderBottom:'1px solid #f3f4f6', cursor:'pointer' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <MapPin size={18} color={P}/><span style={{ fontWeight:500, color:'#111827' }}>{s}</span>
                </div>
                {form[modal]===s && <div style={{ width:8, height:8, background:P, borderRadius:'50%' }}/>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TrainListScreen ─────────────────────────────────────────────
function TrainListScreen({ navigate, back, searchData={} }) {
  const [sort, setSort] = useState('price');
  const [showFilter, setShowFilter] = useState(false);
  const { from='Hà Nội', to='Đà Nẵng', date='2026-04-25' } = searchData;

  const sorted = [...TRAINS].sort((a,b)=>{
    if(sort==='price') return a.price-b.price;
    if(sort==='time') return a.dep.localeCompare(b.dep);
    return a.dur.localeCompare(b.dur);
  });

  const sortBtns = [
    { v:'price', label:'Giá thấp nhất', icon:TrendingUp },
    { v:'time', label:'Giờ sớm nhất', icon:Clock },
    { v:'dur', label:'Nhanh nhất', icon:Zap },
  ];

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:80 }}>
      <Header
        title={`${from} → ${to}`}
        sub={date}
        back={back}
        right={
          <button onClick={()=>setShowFilter(true)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <SlidersHorizontal size={20} color="white"/>
          </button>
        }
      />
      <div style={{ background:'white', borderBottom:'1px solid #e5e7eb', padding:'10px 16px' }}>
        <div style={{ display:'flex', gap:8, overflowX:'auto' }}>
          {sortBtns.map(b=>(
            <button key={b.v} onClick={()=>setSort(b.v)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:20, border:'none', cursor:'pointer', whiteSpace:'nowrap', background: sort===b.v ? P : '#f3f4f6', color: sort===b.v ? 'white' : '#374151', fontWeight:600, fontSize:13 }}>
              <b.icon size={14}/>{b.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        <div style={{ fontSize:13, color:'#6b7280', marginBottom:12 }}>
          Tìm thấy <strong style={{ color:'#111827' }}>{TRAINS.length}</strong> chuyến
        </div>
        {sorted.map((tr,i)=>(
          <Card key={tr.id} onClick={()=>navigate('trainDetail',{selectedTrain:tr, searchData})} style={{ marginBottom:14, padding:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:17, fontWeight:700, color:'#111827' }}>{tr.name}</span>
                  {tr.premium && <span style={{ background:'linear-gradient(90deg,#ea580c,#dc2626)', color:'white', fontSize:11, padding:'2px 8px', borderRadius:20, fontWeight:700 }}>Premium</span>}
                </div>
                <div style={{ fontSize:13, color:'#6b7280' }}>{tr.type}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:12, color:'#9ca3af' }}>Từ</div>
                <div style={{ fontSize:19, fontWeight:800, color:P }}>{(tr.price/1000).toFixed(0)}.000đ</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div>
                <div style={{ fontSize:24, fontWeight:800, color:'#111827' }}>{tr.dep}</div>
                <div style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}><MapPin size={12}/>{from}</div>
              </div>
              <div style={{ flex:1, padding:'0 16px' }}>
                <div style={{ height:3, background:GRAD, borderRadius:3, position:'relative' }}>
                  <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:8, height:8, background:P, borderRadius:'50%' }}/>
                  <div style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)', width:8, height:8, background:T, borderRadius:'50%' }}/>
                </div>
                <div style={{ fontSize:11, color:'#9ca3af', textAlign:'center', marginTop:6, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <Clock size={11}/>{tr.dur}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:24, fontWeight:800, color:'#111827' }}>{tr.arr}</div>
                <div style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}><MapPin size={12}/>{to}</div>
              </div>
            </div>
            <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', gap:16, fontSize:13, color:'#6b7280' }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><Armchair size={14}/>{tr.seats} chỗ trống</span>
                <span>⭐ {tr.rating}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:P, display:'flex', alignItems:'center', gap:4 }}>Xem chi tiết<ChevronRight size={14}/></span>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Modal */}
      {showFilter && (
        <div onClick={()=>setShowFilter(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', width:'100%', borderRadius:'24px 24px 0 0', padding:24, maxHeight:'80vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ fontSize:20, fontWeight:700 }}>Bộ lọc</div>
              <button onClick={()=>setShowFilter(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#6b7280' }}>✕</button>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:600, marginBottom:10 }}>Giờ khởi hành</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {['Sáng sớm (04-08)','Buổi sáng (08-12)','Buổi chiều (12-18)','Buổi tối (18-24)'].map(t=>(
                  <button key={t} style={{ padding:'12px 8px', background:'#f3f4f6', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:500 }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontWeight:600, marginBottom:10 }}>Loại tàu</div>
              {['Tàu chất lượng cao','Tàu nhanh','Tàu thường'].map(t=>(
                <label key={t} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, cursor:'pointer' }}>
                  <input type="checkbox" style={{ width:18, height:18 }}/> <span style={{ fontSize:14 }}>{t}</span>
                </label>
              ))}
            </div>
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:600, marginBottom:10 }}>Khoảng giá</div>
              <input type="range" min={0} max={1000000} style={{ width:'100%', accentColor:P }}/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#9ca3af' }}><span>0đ</span><span>1.000.000đ</span></div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <Btn variant="outline" onClick={()=>setShowFilter(false)}>Đặt lại</Btn>
              <Btn onClick={()=>setShowFilter(false)}>Áp dụng</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TrainDetailScreen ───────────────────────────────────────────
function TrainDetailScreen({ navigate, back, selectedTrain, searchData }) {
  const tr = selectedTrain || TRAINS[0];

  const facilities = [
    { icon:Wifi, label:'WiFi miễn phí' },
    { icon:Coffee, label:'Căn tin' },
    { icon:Snowflake, label:'Điều hòa' },
    { icon:Users, label:'Phòng chờ VIP' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:100 }}>
      <div style={{ background:GRAD, padding:'calc(env(safe-area-inset-top) + 12px) 24px 32px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:160, height:160, background:'rgba(255,255,255,0.07)', borderRadius:'50%' }}/>
        <button onClick={back} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:'50%', width:40, height:40, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginBottom:16 }}>
          <ChevronLeft size={22} color="white"/>
        </button>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <div style={{ fontSize:30, fontWeight:800, color:'white', marginBottom:2 }}>Tàu {tr.name}</div>
            <div style={{ color:'rgba(255,255,255,0.9)', fontSize:14 }}>{tr.type}</div>
          </div>
          <div style={{ background:'rgba(255,255,255,0.2)', padding:'8px 12px', borderRadius:12, display:'flex', alignItems:'center', gap:4 }}>
            <Star size={14} fill="#facc15" color="#facc15"/>
            <span style={{ fontWeight:700, color:'white' }}>{tr.rating}</span>
          </div>
        </div>
      </div>

      <div style={{ padding:'0 16px', marginTop:-8 }}>
        {/* Journey Card */}
        <Card style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:30, fontWeight:800 }}>{tr.dep}</div>
              <div style={{ fontSize:13, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}><MapPin size={13}/>{searchData?.from||'Hà Nội'}</div>
            </div>
            <div style={{ flex:1, padding:'0 16px' }}>
              <div style={{ height:3, background:GRAD, borderRadius:3 }}/>
              <div style={{ textAlign:'center', fontSize:12, color:'#9ca3af', marginTop:6, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}><Clock size={12}/>{tr.dur}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:30, fontWeight:800 }}>{tr.arr}</div>
              <div style={{ fontSize:13, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}><MapPin size={13}/>{searchData?.to||'Đà Nẵng'}</div>
            </div>
          </div>
          <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:12, fontSize:13, color:'#6b7280', display:'flex', alignItems:'center', gap:6 }}>
            <Calendar size={14}/>{searchData?.date||'2026-04-25'}
          </div>
        </Card>

        {/* Facilities */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>Tiện ích trên tàu</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {facilities.map((f,i)=>(
              <div key={i} style={{ background:'white', borderRadius:12, padding:14, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ background:'#dbeafe', padding:8, borderRadius:10 }}><f.icon size={18} color={P}/></div>
                <span style={{ fontSize:13, fontWeight:500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Carriages */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:10 }}>Chọn loại toa</div>
          {CARRIAGES.map(c=>(
            <Card key={c.id} onClick={()=>navigate('seats',{carriage:c, selectedTrain:tr, searchData})} style={{ marginBottom:10, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <div style={{ fontWeight:600, color:'#111827', marginBottom:4 }}>{c.type}</div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>{Math.floor(c.total*0.6)}/{c.total} chỗ trống</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:P }}>{(c.price/1000).toFixed(0)}.000đ</div>
                  <div style={{ fontSize:11, color:'#9ca3af' }}>/ người</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ flex:1, height:6, background:'#f3f4f6', borderRadius:3, overflow:'hidden' }}>
                  <div style={{ width:`${(Math.floor(c.total*0.6)/c.total)*100}%`, height:'100%', background:GRAD, borderRadius:3 }}/>
                </div>
                <ChevronRight size={16} color="#9ca3af"/>
              </div>
            </Card>
          ))}
        </div>

        {/* Stops */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <Info size={16} color={P}/> Các ga dừng
          </div>
          <Card style={{ padding:16 }}>
            {STOPS.map((s,i)=>(
              <div key={i} style={{ display:'flex', gap:16 }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', background: i===0||i===STOPS.length-1 ? P : '#d1d5db', marginTop:2 }}/>
                  {i<STOPS.length-1 && <div style={{ width:2, height:44, background:'#e5e7eb' }}/>}
                </div>
                <div style={{ paddingBottom: i<STOPS.length-1?8:0, paddingTop:0 }}>
                  <div style={{ fontWeight:600, color:'#111827', fontSize:14 }}>{s.station}</div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>{s.time}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:'white', borderTop:'1px solid #e5e7eb', padding:'16px 20px', boxShadow:'0 -4px 16px rgba(0,0,0,0.08)' }}>
        <Btn onClick={()=>navigate('seats',{carriage:CARRIAGES[0], selectedTrain:tr, searchData})}>
          Tiếp tục chọn chỗ
        </Btn>
      </div>
    </div>
  );
}

// ─── SeatSelectionScreen ─────────────────────────────────────────
function SeatSelectionScreen({ navigate, back, carriage, selectedTrain, searchData }) {
  const c = carriage || CARRIAGES[0];
  const tr = selectedTrain || TRAINS[0];
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (timeLeft <= 0) { showToast('Hết thời gian giữ chỗ!','error'); return; }
    const t = setInterval(()=>setTimeLeft(v=>v-1),1000);
    return ()=>clearInterval(t);
  }, [timeLeft]);

  const fmtTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const handleSeat = (num, idx) => {
    const st = seatStatus(idx);
    if (st==='occupied'||st==='holding') { showToast('Ghế này đã được đặt!','error'); return; }
    if (selectedSeats.includes(num)) setSelectedSeats(v=>v.filter(s=>s!==num));
    else {
      if (selectedSeats.length>=4) { showToast('Tối đa 4 chỗ mỗi lần đặt','error'); return; }
      setSelectedSeats(v=>[...v,num]);
    }
  };

  const seatStyle = (num, idx) => {
    const st = seatStatus(idx);
    const sel = selectedSeats.includes(num);
    if (sel) return { background:'#dbeafe', border:`2px solid ${P}`, color:P };
    if (st==='occupied') return { background:'#d1d5db', color:'#6b7280', cursor:'not-allowed' };
    if (st==='holding') return { background:'#fef9c3', border:'2px solid #facc15', color:'#854d0e', cursor:'not-allowed' };
    return { background:'#f9fafb', border:'2px solid #d1d5db', color:'#374151' };
  };

  const isSeated = c.type.includes('Ngồi');
  const totalPrice = c.price * selectedSeats.length;

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:160 }}>
      <Toast toast={toast}/>
      <div style={{ background:GRAD, padding:'calc(env(safe-area-inset-top) + 12px) 20px 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <button onClick={back} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <ChevronLeft size={20} color="white"/>
          </button>
          <div><div style={{ color:'white', fontSize:17, fontWeight:700 }}>Chọn chỗ ngồi</div><div style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>{c.type}</div></div>
        </div>
        <div style={{ background:'rgba(255,255,255,0.1)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10 }}>
          <Clock size={18} color="white"/>
          <div style={{ flex:1 }}>
            <div style={{ color:'rgba(255,255,255,0.7)', fontSize:11 }}>Thời gian giữ chỗ</div>
            <div style={{ color:'white', fontSize:20, fontWeight:800, fontFamily:'monospace' }}>{fmtTime(timeLeft)}</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ background:'white', borderBottom:'1px solid #e5e7eb', padding:'12px 16px', display:'flex', justifyContent:'space-around' }}>
        {[['#f9fafb','#d1d5db','Trống'],['#dbeafe',P,'Đã chọn'],['#d1d5db','#d1d5db','Đã đặt'],['#fef9c3','#facc15','Đang giữ']].map(([bg,bo,lb])=>(
          <div key={lb} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:24, height:24, background:bg, border:`2px solid ${bo}`, borderRadius:6 }}/>
            <span style={{ fontSize:12, color:'#374151' }}>{lb}</span>
          </div>
        ))}
      </div>

      {/* Direction */}
      <div style={{ padding:'12px 16px' }}>
        <div style={{ background:'#eff6ff', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:8 }}>
          <Train size={16} color={P}/> <span style={{ fontSize:13, fontWeight:500, color:'#1e40af' }}>Hướng đầu tàu</span>
        </div>
      </div>

      {/* Seat Map */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{ background:'white', borderRadius:16, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', padding:16, overflowX:'auto' }}>
          {isSeated ? (
            <div style={{ minWidth:200 }}>
              {Array.from({length:16}).map((_,row)=>(
                <div key={row} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <div style={{ width:24, fontSize:11, fontWeight:600, color:'#9ca3af', textAlign:'center' }}>{row+1}</div>
                  {['A','B'].map(col=>{
                    const num=`${row+1}${col}`;
                    const idx=row*4+['A','B','C','D'].indexOf(col);
                    const sel=selectedSeats.includes(num);
                    return (
                      <button key={col} onClick={()=>handleSeat(num,idx)} disabled={['occupied','holding'].includes(seatStatus(idx))} style={{ width:36, height:36, borderRadius:8, border:'none', fontWeight:700, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', ...seatStyle(num,idx) }}>
                        {sel?<Check size={14}/>:col}
                      </button>
                    );
                  })}
                  <div style={{ width:24 }}/>
                  {['C','D'].map(col=>{
                    const num=`${row+1}${col}`;
                    const idx=row*4+['A','B','C','D'].indexOf(col);
                    const sel=selectedSeats.includes(num);
                    return (
                      <button key={col} onClick={()=>handleSeat(num,idx)} disabled={['occupied','holding'].includes(seatStatus(idx))} style={{ width:36, height:36, borderRadius:8, border:'none', fontWeight:700, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', ...seatStyle(num,idx) }}>
                        {sel?<Check size={14}/>:col}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {Array.from({length:6}).map((_,comp)=>{
                const cnt = c.type.includes('khoang 4')?4:6;
                return (
                  <div key={comp} style={{ border:'2px solid #e5e7eb', borderRadius:12, padding:12 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#6b7280', textAlign:'center', marginBottom:8 }}>Khoang {comp+1}</div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {Array.from({length:cnt}).map((_,b)=>{
                        const num=`C${comp+1}-${b+1}`;
                        const idx=comp*cnt+b;
                        const sel=selectedSeats.includes(num);
                        return (
                          <button key={b} onClick={()=>handleSeat(num,idx)} disabled={['occupied','holding'].includes(seatStatus(idx))} style={{ height:36, borderRadius:8, border:'none', fontWeight:700, fontSize:11, display:'flex', alignItems:'center', justifyContent:'center', ...seatStyle(num,idx) }}>
                            {sel?<Check size={13}/>:b+1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:'white', borderTop:'1px solid #e5e7eb', boxShadow:'0 -4px 16px rgba(0,0,0,0.1)' }}>
        {selectedSeats.length>0 && (
          <div style={{ padding:'12px 20px', borderBottom:'1px solid #f3f4f6' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#374151' }}>Đã chọn ({selectedSeats.length})</span>
              <button onClick={()=>setSelectedSeats([])} style={{ background:'none', border:'none', cursor:'pointer', fontSize:13, color:'#ef4444', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}><X size={14}/>Xóa hết</button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {selectedSeats.map(s=>(
                <div key={s} style={{ background:'#dbeafe', color:P, padding:'4px 10px', borderRadius:8, fontSize:13, fontWeight:700 }}>{s}</div>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Tổng tiền</div>
            <div style={{ fontSize:22, fontWeight:800, color:P }}>{fmt(totalPrice)}</div>
          </div>
          <button onClick={()=>{
            if(!selectedSeats.length){showToast('Vui lòng chọn ít nhất 1 chỗ','error');return;}
            navigate('passengerInfo',{selectedSeats,carriage:c,selectedTrain:tr,searchData,totalPrice});
          }} disabled={!selectedSeats.length} style={{ background: selectedSeats.length?GRAD:'#d1d5db', color:'white', border:'none', borderRadius:12, padding:'14px 28px', fontWeight:700, fontSize:15, cursor: selectedSeats.length?'pointer':'not-allowed' }}>
            Tiếp tục
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PassengerInfoScreen ─────────────────────────────────────────
function PassengerInfoScreen({ navigate, back, selectedSeats=[], totalPrice=0, carriage, selectedTrain, searchData }) {
  const [pax, setPax] = useState(selectedSeats.map((_,i)=>({id:`p${i}`,name:'',idCard:'',phone:'',email:''})));
  const [showSaved, setShowSaved] = useState(false);
  const [activePax, setActivePax] = useState(0);
  const [toast, showToast] = useToast();

  const saved = [
    { id:'s1', name:'Nguyễn Văn A', idCard:'001234567890', phone:'0912345678', email:'nguyenvana@email.com' },
    { id:'s2', name:'Trần Thị B', idCard:'001234567891', phone:'0912345679', email:'tranthib@email.com' },
  ];

  const upd = (i, k, v) => setPax(p=>p.map((x,j)=>j===i?{...x,[k]:v}:x));
  const inpSt = { width:'100%', padding:'12px 12px 12px 44px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:14, outline:'none', boxSizing:'border-box' };

  const handleContinue = () => {
    for(let i=0;i<pax.length;i++) {
      if(!pax[i].name||!pax[i].idCard||!pax[i].phone) { showToast(`Điền đầy đủ thông tin hành khách ${i+1}`,'error'); return; }
    }
    navigate('payment',{selectedSeats,totalPrice,passengers:pax,carriage,selectedTrain,searchData});
  };

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:120 }}>
      <Toast toast={toast}/>
      <Header title="Thông tin hành khách" sub={`${selectedSeats.length} hành khách`} back={back}/>
      <div style={{ padding:'16px' }}>
        {pax.map((p,i)=>(
          <Card key={i} style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ background:'#dbeafe', padding:8, borderRadius:10 }}><User size={18} color={P}/></div>
                <div>
                  <div style={{ fontWeight:700, color:'#111827' }}>Hành khách {i+1}</div>
                  <div style={{ fontSize:12, color:'#9ca3af' }}>Ghế: {selectedSeats[i]}</div>
                </div>
              </div>
              <button onClick={()=>{setActivePax(i);setShowSaved(true);}} style={{ background:'none', border:'none', cursor:'pointer', color:P, fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:4 }}>
                <Plus size={14}/>Chọn có sẵn
              </button>
            </div>
            {[['name','Họ và tên *',<User size={16} color="#9ca3af"/>,'text','Nguyễn Văn A'],
              ['idCard','CMND/CCCD *',<CreditCard size={16} color="#9ca3af"/>,'text','001234567890'],
              ['phone','Số điện thoại *',<Phone size={16} color="#9ca3af"/>,'tel','0912345678'],
              ['email','Email (Tùy chọn)',<Mail size={16} color="#9ca3af"/>,'email','example@email.com'],
            ].map(([k,lb,ic,tp,ph])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>{lb}</div>
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)' }}>{ic}</span>
                  <input type={tp} style={inpSt} placeholder={ph} value={p[k]} onChange={e=>upd(i,k,e.target.value)}/>
                </div>
              </div>
            ))}
          </Card>
        ))}
        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:14, fontSize:13, color:'#1e40af' }}>
          <strong>Lưu ý:</strong> Vui lòng nhập chính xác thông tin để tránh sai sót khi làm thủ tục lên tàu.
        </div>
      </div>

      {showSaved && (
        <div onClick={()=>setShowSaved(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', alignItems:'flex-end' }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white', width:'100%', borderRadius:'24px 24px 0 0', padding:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontSize:18, fontWeight:700 }}>Hành khách đã lưu</div>
              <button onClick={()=>setShowSaved(false)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#6b7280' }}>✕</button>
            </div>
            {saved.map(s=>(
              <button key={s.id} onClick={()=>{setPax(p=>p.map((x,j)=>j===activePax?{...s,id:`p${j}`}:x));setShowSaved(false);showToast('Đã chọn hành khách');}} style={{ width:'100%', background:'#f9fafb', borderRadius:12, padding:14, border:'none', cursor:'pointer', textAlign:'left', marginBottom:10 }}>
                <div style={{ fontWeight:600, marginBottom:4 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'#6b7280' }}>CMND: {s.idCard} · SĐT: {s.phone}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:'white', borderTop:'1px solid #e5e7eb', padding:'16px 20px', boxShadow:'0 -4px 16px rgba(0,0,0,0.08)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div><div style={{ fontSize:12, color:'#6b7280' }}>Tổng tiền</div><div style={{ fontSize:22, fontWeight:800, color:P }}>{fmt(totalPrice)}</div></div>
          <button onClick={handleContinue} style={{ background:GRAD, color:'white', border:'none', borderRadius:12, padding:'14px 28px', fontWeight:700, fontSize:15, cursor:'pointer' }}>Tiếp tục</button>
        </div>
      </div>
    </div>
  );
}

// ─── PaymentScreen ───────────────────────────────────────────────
function PaymentScreen({ navigate, back, selectedSeats=[], totalPrice=0, passengers=[], carriage, selectedTrain }) {
  const [method, setMethod] = useState('vnpay');
  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, showToast] = useToast();

  const svc = Math.round(totalPrice * 0.02);
  const final = totalPrice + svc - discount;

  const methods = [
    { id:'vnpay', name:'VNPay', icon:'💳', desc:'Thanh toán qua VNPay' },
    { id:'momo', name:'MoMo', icon:'📱', desc:'Ví điện tử MoMo' },
    { id:'wallet', name:'Ví nội bộ', icon:'💰', desc:'Số dư: 2.500.000đ' },
  ];

  const applyPromo = () => {
    if(promo.toUpperCase()==='SAVE20') { setDiscount(Math.round(totalPrice*0.2)); showToast('Áp dụng mã giảm giá thành công!'); }
    else if(promo) showToast('Mã giảm giá không hợp lệ','error');
  };

  const pay = () => {
    setLoading(true);
    setTimeout(()=>{
      const ok=Math.random()>0.1;
      if(ok) navigate('paymentSuccess',{selectedSeats,passengers,finalTotal:final,carriage,selectedTrain});
      else { showToast('Thanh toán thất bại. Vui lòng thử lại!','error'); setLoading(false); }
    },2000);
  };

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:100 }}>
      <Toast toast={toast}/>
      <Header title="Thanh toán" sub="Hoàn tất đặt vé" back={back}/>
      <div style={{ padding:'16px' }}>
        {/* Summary */}
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:16, marginBottom:14 }}>Thông tin đặt vé</div>
          {[['Loại toa', carriage?.type||'Ngồi mềm điều hòa'],['Số ghế', selectedSeats.join(', ')||'-'],['Số hành khách', `${passengers.length} người`]].map(([l,v])=>(
            <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:14 }}>
              <span style={{ color:'#6b7280' }}>{l}</span><span style={{ fontWeight:600 }}>{v}</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid #f3f4f6', paddingTop:12, marginTop:8 }}>
            {[['Tiền vé', totalPrice],['Phí dịch vụ', svc]].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14 }}>
                <span style={{ color:'#6b7280' }}>{l}</span><span style={{ fontWeight:600 }}>{fmt(v)}</span>
              </div>
            ))}
            {discount>0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14 }}><span style={{ color:'#10b981' }}>Giảm giá</span><span style={{ fontWeight:600, color:'#10b981' }}>-{fmt(discount)}</span></div>}
            <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #f3f4f6', paddingTop:10, marginTop:4 }}>
              <span style={{ fontWeight:700 }}>Tổng cộng</span><span style={{ fontSize:20, fontWeight:800, color:P }}>{fmt(final)}</span>
            </div>
          </div>
        </Card>

        {/* Promo */}
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><Tag size={18} color="#ea580c"/>Mã giảm giá</div>
          <div style={{ display:'flex', gap:10 }}>
            <input value={promo} onChange={e=>setPromo(e.target.value.toUpperCase())} placeholder="Nhập mã giảm giá" style={{ flex:1, padding:'12px 14px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:12, fontSize:14, outline:'none', fontFamily:'monospace', letterSpacing:1 }}/>
            <button onClick={applyPromo} style={{ background:GRAD, color:'white', border:'none', borderRadius:12, padding:'12px 18px', fontWeight:700, cursor:'pointer' }}>Áp dụng</button>
          </div>
          <div style={{ background:'#fff7ed', borderRadius:10, padding:'10px 12px', marginTop:10, fontSize:13, color:'#c2410c' }}>
            💡 Sử dụng mã <strong>SAVE20</strong> để giảm 20%
          </div>
        </Card>

        {/* Methods */}
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:12, display:'flex', alignItems:'center', gap:8 }}><CreditCard size={18} color={P}/>Phương thức thanh toán</div>
          {methods.map(m=>(
            <div key={m.id} onClick={()=>setMethod(m.id)} style={{ padding:14, borderRadius:12, border:`2px solid ${method===m.id?P:'#e5e7eb'}`, background: method===m.id?'#eff6ff':'white', marginBottom:10, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:24 }}>{m.icon}</span>
                <div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{m.name}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{m.desc}</div>
                </div>
              </div>
              {method===m.id && <div style={{ background:P, borderRadius:'50%', width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center' }}><Check size={14} color="white"/></div>}
            </div>
          ))}
        </Card>

        <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:12, padding:14, fontSize:13, color:'#1e40af', display:'flex', gap:10 }}>
          <AlertCircle size={18} style={{ flexShrink:0 }}/>
          <span><strong>Lưu ý:</strong> Sau khi thanh toán thành công, vé điện tử sẽ được gửi đến email và hiển thị trong mục "Vé của tôi".</span>
        </div>
      </div>

      <div style={{ position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430, background:'white', borderTop:'1px solid #e5e7eb', padding:'16px 20px' }}>
        <button onClick={pay} disabled={loading} style={{ width:'100%', background: loading?'#9ca3af':GRAD2, color:'white', border:'none', borderRadius:12, padding:'16px', fontWeight:700, fontSize:16, cursor: loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          {loading ? <><div style={{ width:20, height:20, border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>Đang xử lý...</> : <><CreditCard size={20}/>Thanh toán {fmt(final)}</>}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── PaymentSuccessScreen ────────────────────────────────────────
function PaymentSuccessScreen({ navigate, selectedSeats=[], passengers=[], finalTotal=0 }) {
  const ticketId = `TK${Date.now().toString().slice(-8)}`;
  const [confetti, setConfetti] = useState(true);

  useEffect(()=>{ const t=setTimeout(()=>setConfetti(false),3000); return()=>clearTimeout(t); },[]);

  const dots = Array.from({length:16}).map((_,i)=>({
    x: Math.abs(Math.sin(i*2.5))*100, speed: 1.5+Math.abs(Math.cos(i*1.3)), color:['#3b82f6','#14b8a6','#f97316','#10b981'][i%4]
  }));

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0fdf4,#f0fdfa)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      <style>{`
        @keyframes fall{from{transform:translateY(-60px) rotate(0deg);opacity:1}to{transform:translateY(110vh) rotate(720deg);opacity:0}}
        @keyframes popIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
      `}</style>
      {confetti && dots.map((d,i)=>(
        <div key={i} style={{ position:'absolute', width:10, height:10, borderRadius:'50%', background:d.color, left:`${d.x}%`, top:0, animation:`fall ${d.speed}s ease-out ${i*0.1}s forwards`, pointerEvents:'none' }}/>
      ))}
      <div style={{ animation:'popIn 0.6s spring', position:'relative', zIndex:1, width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ position:'relative', display:'inline-block', marginBottom:20 }}>
            <div style={{ position:'absolute', inset:-8, background:'rgba(34,197,94,0.15)', borderRadius:'50%', animation:'popIn 0.8s ease' }}/>
            <CheckCircle2 size={96} color="#22c55e" style={{ animation:'popIn 0.6s ease 0.2s both' }}/>
          </div>
          <div style={{ fontSize:28, fontWeight:800, color:'#111827', marginBottom:8, animation:'slideUp 0.5s ease 0.3s both' }}>Thanh toán thành công!</div>
          <div style={{ color:'#6b7280', animation:'slideUp 0.5s ease 0.4s both' }}>Vé điện tử đã được lưu vào "Vé của tôi"</div>
        </div>

        <div style={{ background:'white', borderRadius:20, boxShadow:'0 8px 32px rgba(0,0,0,0.12)', padding:24, marginBottom:20, animation:'slideUp 0.5s ease 0.4s both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:20, paddingBottom:20, borderBottom:'2px dashed #e5e7eb' }}>
            <Ticket size={20} color={P}/>
            <span style={{ fontWeight:700, fontSize:16 }}>Mã vé: {ticketId}</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
              <span style={{ color:'#6b7280' }}>Số ghế</span>
              <span style={{ fontWeight:600 }}>{selectedSeats.join(', ')||'-'}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:14 }}>
              <span style={{ color:'#6b7280' }}>Số hành khách</span>
              <span style={{ fontWeight:600 }}>{passengers.length} người</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', borderTop:'1px solid #f3f4f6', paddingTop:12 }}>
              <span style={{ fontWeight:700 }}>Tổng thanh toán</span>
              <span style={{ fontSize:20, fontWeight:800, color:'#22c55e' }}>{fmt(finalTotal)}</span>
            </div>
          </div>
          <div style={{ marginTop:20, background:'#f9fafb', borderRadius:12, padding:16, display:'flex', justifyContent:'center' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:2 }}>
              {Array.from({length:64}).map((_,i)=>(
                <div key={i} style={{ width:8, height:8, background: Math.abs(Math.sin(i*0.7+1))>0.5?'#111827':'transparent', borderRadius:1 }}/>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10, animation:'slideUp 0.5s ease 0.5s both' }}>
          <Btn onClick={()=>navigate('myTickets')}><Ticket size={18}/>Xem vé của tôi</Btn>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <Btn variant="outline"><Download size={16}/>Tải vé</Btn>
            <Btn variant="outline"><Share2 size={16}/>Chia sẻ</Btn>
          </div>
          <Btn variant="ghost" onClick={()=>navigate('home')}><Home size={16}/>Về trang chủ</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── MyTicketsScreen ─────────────────────────────────────────────
function MyTicketsScreen({ navigate, tickets=MOCK_TICKETS }) {
  const [tab, setTab] = useState('upcoming');
  const [q, setQ] = useState('');

  const statCfg = {
    upcoming:{ label:'Sắp đi', color:'#dbeafe', tc:'#1d4ed8' },
    completed:{ label:'Đã hoàn thành', color:'#dcfce7', tc:'#15803d' },
    cancelled:{ label:'Đã hủy', color:'#fee2e2', tc:'#b91c1c' },
  };

  const tabs = ['upcoming','completed','cancelled'].map(id=>({
    id, label:{upcoming:'Sắp đi',completed:'Đã đi',cancelled:'Đã hủy'}[id],
    count: tickets.filter(t=>t.status===id).length
  }));

  const filtered = tickets.filter(t=>t.status===tab && (!q||t.id.includes(q)||t.from.includes(q)||t.to.includes(q)));

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:80 }}>
      <div style={{ background:GRAD, padding:'48px 24px 24px' }}>
        <div style={{ fontSize:24, fontWeight:800, color:'white', marginBottom:4 }}>Vé của tôi</div>
        <div style={{ color:'rgba(255,255,255,0.85)', fontSize:14 }}>Quản lý vé tàu của bạn</div>
      </div>
      <div style={{ padding:'0 16px', marginTop:-8, marginBottom:12 }}>
        <div style={{ background:'white', borderRadius:14, boxShadow:'0 4px 12px rgba(0,0,0,0.08)', padding:14 }}>
          <div style={{ position:'relative' }}>
            <Search size={18} color="#9ca3af" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Tìm kiếm vé..." style={{ width:'100%', padding:'10px 10px 10px 40px', background:'#f9fafb', border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box' }}/>
          </div>
        </div>
      </div>

      <div style={{ background:'white', borderBottom:'1px solid #e5e7eb', padding:'0 16px', display:'flex' }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ flex:1, padding:'12px 4px', background:'none', border:'none', cursor:'pointer', borderBottom:`2px solid ${tab===t.id?P:'transparent'}`, color: tab===t.id?P:'#6b7280', fontWeight:600, fontSize:14, transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {t.label}
            <span style={{ background: tab===t.id?'#dbeafe':'#f3f4f6', color: tab===t.id?P:'#6b7280', borderRadius:20, padding:'2px 8px', fontSize:11, fontWeight:700 }}>{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ padding:'14px 16px' }}>
        {filtered.length===0 ? (
          <div style={{ textAlign:'center', padding:'60px 0' }}>
            <div style={{ background:'#f3f4f6', borderRadius:'50%', width:80, height:80, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Ticket size={36} color="#9ca3af"/>
            </div>
            <div style={{ fontSize:17, fontWeight:700, marginBottom:8 }}>Chưa có vé</div>
            <div style={{ color:'#6b7280', marginBottom:20 }}>Bạn chưa có vé nào trong mục này</div>
            {tab==='upcoming' && <Btn onClick={()=>navigate('search')} style={{ width:'auto', display:'inline-flex' }}>Đặt vé ngay</Btn>}
          </div>
        ) : filtered.map(tk=>(
          <Card key={tk.id} onClick={()=>navigate('ticketDetail',{ticket:tk})} style={{ marginBottom:12, padding:0, overflow:'hidden' }}>
            <div style={{ padding:'16px 16px 14px', borderBottom:'2px dashed #e5e7eb' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:16, marginBottom:2 }}>Tàu {tk.trainId}</div>
                  <div style={{ fontSize:12, color:'#6b7280' }}>{tk.carriageType}</div>
                </div>
                <div style={{ background:statCfg[tk.status].color, color:statCfg[tk.status].tc, padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:700, height:'fit-content' }}>
                  {statCfg[tk.status].label}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div><div style={{ fontSize:22, fontWeight:800 }}>{tk.time}</div><div style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}><MapPin size={12}/>{tk.from}</div></div>
                <div style={{ flex:1 }}><div style={{ height:3, background:GRAD, borderRadius:3 }}/></div>
                <div style={{ textAlign:'right' }}><div style={{ fontSize:22, fontWeight:800 }}>--:--</div><div style={{ fontSize:12, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}><MapPin size={12}/>{tk.to}</div></div>
              </div>
            </div>
            <div style={{ padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:14, fontSize:13, color:'#6b7280' }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><Calendar size={13}/>{tk.date}</span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}><Ticket size={13}/>{tk.seats.join(', ')}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:600, color:P, display:'flex', alignItems:'center', gap:4 }}>Xem<ChevronRight size={13}/></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── TicketDetailScreen ──────────────────────────────────────────
function TicketDetailScreen({ navigate, back, ticket=MOCK_TICKETS[0] }) {
  const statCfg = {
    upcoming:{ label:'Sắp đi', bg:'#dbeafe', color:'#1d4ed8' },
    completed:{ label:'Đã hoàn thành', bg:'#dcfce7', color:'#15803d' },
    cancelled:{ label:'Đã hủy', bg:'#fee2e2', color:'#b91c1c' },
  };
  const cfg = statCfg[ticket.status] || statCfg.upcoming;

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:30 }}>
      <Header title="Chi tiết vé" back={back}/>
      <div style={{ padding:'16px' }}>
        {/* Ticket Card */}
        <div style={{ background:'white', borderRadius:20, boxShadow:'0 8px 24px rgba(0,0,0,0.1)', overflow:'hidden', marginBottom:14 }}>
          <div style={{ background:GRAD, padding:'20px 20px 28px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ color:'rgba(255,255,255,0.7)', fontSize:12, marginBottom:4 }}>Mã vé</div>
                <div style={{ color:'white', fontWeight:800, fontSize:18, fontFamily:'monospace' }}>{ticket.id}</div>
              </div>
              <div style={{ background:cfg.bg, color:cfg.color, padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>{cfg.label}</div>
            </div>
          </div>
          <div style={{ height:0, borderTop:'2px dashed #e5e7eb', margin:'0 20px', position:'relative' }}>
            <div style={{ position:'absolute', left:-20, top:-10, width:20, height:20, background:BG, borderRadius:'0 10px 10px 0' }}/>
            <div style={{ position:'absolute', right:-20, top:-10, width:20, height:20, background:BG, borderRadius:'10px 0 0 10px' }}/>
          </div>
          <div style={{ padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div><div style={{ fontSize:28, fontWeight:800 }}>{ticket.time}</div><div style={{ fontSize:13, color:'#6b7280', display:'flex', alignItems:'center', gap:4 }}><MapPin size={13}/>{ticket.from}</div></div>
              <div style={{ flex:1, padding:'0 16px' }}><div style={{ height:3, background:GRAD, borderRadius:3 }}/></div>
              <div style={{ textAlign:'right' }}><div style={{ fontSize:28, fontWeight:800 }}>--:--</div><div style={{ fontSize:13, color:'#6b7280', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:4 }}><MapPin size={13}/>{ticket.to}</div></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[['Tàu', `SE${ticket.trainId}`],['Ngày', ticket.date],['Toa', ticket.carriageType],['Ghế', ticket.seats.join(', ')]].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontSize:12, color:'#9ca3af', marginBottom:2 }}>{l}</div>
                  <div style={{ fontWeight:600, fontSize:14 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop:'2px dashed #e5e7eb', margin:'0 20px', position:'relative' }}>
            <div style={{ position:'absolute', left:-20, top:-10, width:20, height:20, background:BG, borderRadius:'0 10px 10px 0' }}/>
            <div style={{ position:'absolute', right:-20, top:-10, width:20, height:20, background:BG, borderRadius:'10px 0 0 10px' }}/>
          </div>
          <div style={{ padding:'20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div><div style={{ fontSize:12, color:'#9ca3af' }}>Tổng thanh toán</div><div style={{ fontSize:24, fontWeight:800, color:P }}>{fmt(ticket.totalPrice)}</div></div>
              <div style={{ background:'#f9fafb', borderRadius:12, padding:12, display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:2 }}>
                {Array.from({length:64}).map((_,i)=>(
                  <div key={i} style={{ width:6, height:6, background: Math.abs(Math.sin(i*0.7+ticket.id.charCodeAt(2)))>0.5?'#111827':'transparent', borderRadius:1 }}/>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Passengers */}
        <Card style={{ marginBottom:14 }}>
          <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Hành khách</div>
          {ticket.passengers.map((p,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i<ticket.passengers.length-1?'1px solid #f3f4f6':'none' }}>
              <div style={{ background:GRAD, borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ color:'white', fontWeight:700, fontSize:14 }}>{p.name.charAt(0)}</span>
              </div>
              <div>
                <div style={{ fontWeight:600, fontSize:14 }}>{p.name}</div>
                <div style={{ fontSize:12, color:'#9ca3af' }}>Ghế {ticket.seats[i]||ticket.seats[0]}</div>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Btn variant="outline"><Download size={16}/>Tải vé PDF</Btn>
          <Btn variant="outline"><Share2 size={16}/>Chia sẻ</Btn>
        </div>
        {ticket.status==='upcoming' && (
          <div style={{ marginTop:10 }}>
            <Btn variant="ghost" style={{ color:'#ef4444' }}><X size={16}/>Yêu cầu hủy vé</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── NotificationsScreen ─────────────────────────────────────────
function NotificationsScreen({ back }) {
  const [notifs, setNotifs] = useState(NOTIFS);
  const unread = notifs.filter(n=>!n.read).length;

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:80 }}>
      <div style={{ background:GRAD, padding:'48px 24px 24px', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <div style={{ fontSize:24, fontWeight:800, color:'white', marginBottom:2 }}>Thông báo</div>
          {unread>0 && <div style={{ color:'rgba(255,255,255,0.85)', fontSize:13 }}>{unread} thông báo chưa đọc</div>}
        </div>
        {unread>0 && <button onClick={()=>setNotifs(v=>v.map(n=>({...n,read:true})))} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:10, padding:'6px 12px', color:'white', cursor:'pointer', fontSize:12, fontWeight:600 }}>Đọc tất cả</button>}
      </div>
      <div style={{ padding:'16px' }}>
        {notifs.map(n=>(
          <div key={n.id} onClick={()=>setNotifs(v=>v.map(x=>x.id===n.id?{...x,read:true}:x))} style={{ background: n.read?'white':'#eff6ff', borderRadius:14, padding:'14px 16px', marginBottom:10, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', cursor:'pointer', display:'flex', gap:14, borderLeft: n.read?'none':`3px solid ${P}` }}>
            <div style={{ fontSize:28, flexShrink:0 }}>{n.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <div style={{ fontWeight: n.read?500:700, fontSize:14, color:'#111827' }}>{n.title}</div>
                {!n.read && <div style={{ width:8, height:8, background:P, borderRadius:'50%', flexShrink:0, marginTop:3 }}/>}
              </div>
              <div style={{ fontSize:13, color:'#6b7280', marginBottom:6 }}>{n.body}</div>
              <div style={{ fontSize:11, color:'#9ca3af' }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ProfileScreen ───────────────────────────────────────────────
function ProfileScreen({ navigate, back, user={}, setUser }) {
  const [toast, showToast] = useToast();
  const name = user?.name || 'Nguyễn Văn A';
  const email = user?.email || 'nguyenvana@email.com';

  const sections = [
    { title:'Tài khoản', items:[
      { icon:User, label:'Thông tin cá nhân' },
      { icon:CreditCard, label:'Phương thức thanh toán' },
      { icon:Users, label:'Hành khách thường dùng', badge:'2' },
      { icon:History, label:'Lịch sử giao dịch', action:()=>navigate('myTickets') },
    ]},
    { title:'Cài đặt', items:[
      { icon:Bell, label:'Thông báo' },
      { icon:Globe, label:'Ngôn ngữ', badge:'VI' },
      { icon:Shield, label:'Bảo mật' },
      { icon:Settings, label:'Cài đặt chung' },
    ]},
    { title:'Hỗ trợ', items:[
      { icon:HelpCircle, label:'Trung tâm trợ giúp' },
      { icon:Star, label:'Đánh giá ứng dụng' },
    ]},
  ];

  const logout = async () => {
    await Preferences.remove({ key: 'auth_token' });
    await Preferences.remove({ key: 'user_data' });
    setUser(null);
    navigate('login');
    showToast('Đăng xuất thành công');
  };

  return (
    <div style={{ minHeight:'100vh', background:BG, paddingBottom:80 }}>
      <Toast toast={toast}/>
      <div style={{ background:GRAD, padding:'48px 24px 80px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-32, right:-32, width:160, height:160, background:'rgba(255,255,255,0.07)', borderRadius:'50%' }}/>
        <div style={{ fontSize:24, fontWeight:800, color:'white', marginBottom:20 }}>Cá nhân</div>
        <div style={{ background:'white', borderRadius:20, padding:'20px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ width:68, height:68, background:GRAD, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ color:'white', fontWeight:800, fontSize:28 }}>{name.charAt(0)}</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>{name}</div>
            <div style={{ fontSize:13, color:'#6b7280', display:'flex', alignItems:'center', gap:6, marginBottom:2 }}><Mail size={13}/>{email}</div>
            <div style={{ fontSize:13, color:'#6b7280', display:'flex', alignItems:'center', gap:6 }}><Phone size={13}/>0912 345 678</div>
          </div>
          <ChevronRight size={20} color="#9ca3af"/>
        </div>
      </div>

      <div style={{ padding:'0 16px', marginTop:-16 }}>
        {sections.map((sec,si)=>(
          <div key={si} style={{ marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:1, marginBottom:8, paddingLeft:4 }}>{sec.title}</div>
            <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)', overflow:'hidden' }}>
              {sec.items.map((item,ii)=>(
                <button key={ii} onClick={item.action || (()=>showToast('Tính năng đang phát triển','info'))} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', background:'none', border:'none', borderBottom: ii<sec.items.length-1?'1px solid #f3f4f6':'none', cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ background:'#f3f4f6', padding:8, borderRadius:10 }}><item.icon size={18} color="#374151"/></div>
                    <span style={{ fontWeight:500, fontSize:14, color:'#111827' }}>{item.label}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {item.badge && <span style={{ background:'#dbeafe', color:P, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20 }}>{item.badge}</span>}
                    <ChevronRight size={16} color="#9ca3af"/>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
        <button onClick={logout} style={{ width:'100%', background:'white', border:'none', borderRadius:16, padding:'14px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'center', gap:10, color:'#ef4444', fontWeight:700, cursor:'pointer', marginBottom:16 }}>
          <LogOut size={18}/>Đăng xuất
        </button>
        <div style={{ textAlign:'center', fontSize:12, color:'#9ca3af', paddingBottom:16 }}>Vé Tàu Bắc – Nam v1.0.0</div>
      </div>
    </div>
  );
}

// ─── BottomNav ───────────────────────────────────────────────────
function BottomNav({ screen, navigate }) {
  const items = [
    { id:'home', icon:Home, label:'Trang chủ' },
    { id:'search', icon:Search, label:'Tìm vé' },
    { id:'myTickets', icon:Ticket, label:'Vé của tôi' },
    { id:'notifications', icon:Bell, label:'Thông báo' },
    { id:'profile', icon:User, label:'Cá nhân' },
  ];
  return (
    <div style={{
      background:'white',
      borderTop:'1px solid #e5e7eb',
      padding:`8px 0 calc(env(safe-area-inset-bottom) + 8px)`,
      boxShadow:'0 -4px 16px rgba(0,0,0,0.06)',
      zIndex:100,
      position: 'relative'
    }}>
      <div style={{ display:'flex', justifyContent:'space-around' }}>
        {items.map(({id,icon:Icon,label})=>{
          const active=screen===id;
          return (
            <button key={id} onClick={()=>navigate(id)} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'4px 0' }}>
              <Icon size={24} color={active?P:'#9ca3af'} strokeWidth={active?2.5:2} fill={active?'#dbeafe':'none'}/>
              <span style={{ fontSize:10, fontWeight: active?700:500, color: active?P:'#9ca3af' }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('splash');
  const [history, setHistory] = useState([]);
  const [data, setData] = useState({});
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [user, setUser] = useState(null);

  const navigate = (newScreen, newData={}) => {
    setHistory(h=>[...h, screen]);
    setScreen(newScreen);
    if (Object.keys(newData).length>0) setData(prev=>({...prev,...newData}));
  };

  const back = () => {
    if (history.length>0) {
      const prev = history[history.length-1];
      setHistory(h=>h.slice(0,-1));
      setScreen(prev);
    }
  };

  const onPaymentSuccess = (d) => {
    const newTicket = {
      id:`TK${Date.now().toString().slice(-8)}`,
      trainId: data.selectedTrain?.id||'SE1',
      from: data.searchData?.from||'Hà Nội',
      to: data.searchData?.to||'Đà Nẵng',
      date: data.searchData?.date||'2026-04-25',
      time: data.selectedTrain?.dep||'06:00',
      seats: data.selectedSeats||[],
      carriageType: data.carriage?.type||'Ngồi mềm điều hòa',
      totalPrice: d.finalTotal||0,
      status:'upcoming',
      passengers: d.passengers||[],
    };
    setTickets(v=>[newTicket,...v]);
    navigate('paymentSuccess', d);
  };

  const mainTabs = ['home','search','myTickets','notifications','profile'];
  const showNav = mainTabs.includes(screen);

  const renderScreen = () => {
    const p = { navigate, back, user, setUser, tickets, ...data };
    switch(screen) {
      case 'splash': return <SplashScreen {...p}/>;
      case 'login': return <LoginScreen {...p}/>;
      case 'register': return <RegisterScreen {...p}/>;
      case 'home': return <HomeScreen {...p}/>;
      case 'search': return <SearchScreen {...p}/>;
      case 'trains': return <TrainListScreen {...p}/>;
      case 'trainDetail': return <TrainDetailScreen {...p}/>;
      case 'seats': return <SeatSelectionScreen {...p}/>;
      case 'passengerInfo': return <PassengerInfoScreen {...p}/>;
      case 'payment': return <PaymentScreen {...p} navigate={(s,d)=>{ if(s==='paymentSuccess') onPaymentSuccess(d); else navigate(s,d); }}/>;
      case 'paymentSuccess': return <PaymentSuccessScreen {...p}/>;
      case 'myTickets': return <MyTicketsScreen {...p}/>;
      case 'ticketDetail': return <TicketDetailScreen {...p}/>;
      case 'notifications': return <NotificationsScreen {...p}/>;
      case 'profile': return <ProfileScreen {...p}/>;
      default: return <HomeScreen {...p}/>;
    }
  };

  return (
    <div style={{ display:'flex', justifyContent:'center', height:'100vh', height:'100svh', background:'#f1f5f9', overflow:'hidden' }}>
      <div style={{ width:'100%', maxWidth:430, height:'100%', background:'white', display:'flex', flexDirection:'column', boxShadow:'0 0 60px rgba(0,0,0,0.15)', position:'relative', overflow:'hidden' }}>
        <div style={{ flex:1, overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling: 'touch' }}>
          {renderScreen()}
        </div>
        {showNav && <BottomNav screen={screen} navigate={navigate}/>}
      </div>
    </div>
  );
}
