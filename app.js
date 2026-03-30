// ===========================
// LENDIT – APP.JS (Backend-Integrated Edition)
// API: http://localhost:3000  |  All prices in ₹ INR
// ===========================

const API_BASE = 'http://localhost:3000';

// ===== AUTH HELPERS =====
function getToken() { return localStorage.getItem('lendit_token'); }
function getUser() { try { return JSON.parse(localStorage.getItem('lendit_user') || 'null'); } catch { return null; } }
function setSession(token, user) { localStorage.setItem('lendit_token', token); localStorage.setItem('lendit_user', JSON.stringify(user)); }
function clearSession() { localStorage.removeItem('lendit_token'); localStorage.removeItem('lendit_user'); }
function isLoggedIn() { return !!getToken(); }

function authHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
    return res.json();
}
async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
    return res.json();
}
async function apiPatch(path, body) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) });
    return res.json();
}

// ===== SOCKET.IO =====
let socket = null;
function initSocket() {
    if (typeof io === 'undefined') return;
    socket = io(API_BASE);
    const user = getUser();
    if (user) socket.emit('user_online', { userId: user.user_id, name: user.name });
}

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
if (navbar) {
    window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));
}

// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${type === 'success' ? '✅' : '⚠️'} ${msg}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3500);
}

// ===== SCROLL REVEAL =====
function initReveal() {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
}

// ===== PAYMENT MODAL =====
function openPaymentModal(amount, itemTitle, itemId, startDate, endDate, onSuccess) {
    const existing = document.getElementById('paymentModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'paymentModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-card">
            <div class="modal-header">
                <div>
                    <div class="modal-title">💳 Complete Payment</div>
                    <div class="modal-subtitle">Booking: ${itemTitle}</div>
                </div>
                <button class="modal-close" onclick="document.getElementById('paymentModal').remove()">✕</button>
            </div>
            <div class="pay-amount-display">
                <span class="pay-currency">₹</span>
                <span class="pay-amount">${amount.toLocaleString('en-IN')}</span>
                <span class="pay-label">Total payable</span>
            </div>
            <div class="pay-method-tabs">
                <button class="pay-tab active" data-tab="upi" onclick="switchPayTab(this,'upi')">📱 UPI</button>
                <button class="pay-tab" data-tab="card" onclick="switchPayTab(this,'card')">💳 Card</button>
                <button class="pay-tab" data-tab="wallet" onclick="switchPayTab(this,'wallet')">👛 Wallet</button>
            </div>
            <div class="pay-tab-content" id="payTab-upi">
                <div class="upi-options">
                    <button class="upi-btn" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')">📱 Pay via UPI App</button>
                    <div class="divider-or">or enter UPI ID</div>
                    <div class="form-group" style="margin:0">
                        <input type="text" class="form-input" id="upiId" placeholder="yourname@upi" style="text-align:center">
                    </div>
                    <button class="btn-primary" style="width:100%;justify-content:center;padding:14px;border-radius:12px;margin-top:8px" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')">                        Pay ₹${amount.toLocaleString('en-IN')}
                    </button>
                </div>
                <div class="upi-apps">
                    <div class="upi-app-btn" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')">🟣<br><span>PhonePe</span></div>
                    <div class="upi-app-btn" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')">🔵<br><span>GPay</span></div>
                    <div class="upi-app-btn" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')">🟢<br><span>Paytm</span></div>
                    <div class="upi-app-btn" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')">🔴<br><span>BHIM</span></div>
                </div>
            </div>
            <div class="pay-tab-content" id="payTab-card" style="display:none">
                <div class="form-group"><label>Card Number</label><input type="text" class="form-input" placeholder="4242 4242 4242 4242" maxlength="19" oninput="formatCard(this)"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group"><label>Expiry</label><input type="text" class="form-input" placeholder="MM / YY" maxlength="7"></div>
                    <div class="form-group"><label>CVV</label><input type="password" class="form-input" placeholder="•••" maxlength="4"></div>
                </div>
                <div class="form-group"><label>Cardholder Name</label><input type="text" class="form-input" placeholder="Full Name on Card"></div>
                <button class="btn-primary" style="width:100%;justify-content:center;padding:14px;border-radius:12px" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')">                    Pay ₹${amount.toLocaleString('en-IN')} Securely
                </button>
                <div style="text-align:center;margin-top:12px;font-size:0.78rem;color:#9B97B2">🔒 256-bit SSL Encrypted · Powered by Razorpay</div>
            </div>
            <div class="pay-tab-content" id="payTab-wallet" style="display:none">
                <div class="wallet-options">
                    <div class="wallet-opt" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')"><span class="wallet-icon">🟢</span><span>Paytm Wallet</span><span class="wallet-balance">₹1,240 available</span></div>
                    <div class="wallet-opt" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')"><span class="wallet-icon">🔵</span><span>Amazon Pay</span><span class="wallet-balance">₹750 available</span></div>
                    <div class="wallet-opt" onclick="simulatePayment('${itemTitle}',${amount},${itemId || 0},'${startDate || ''}','${endDate || ''}')"><span class="wallet-icon">🟠</span><span>MobiKwik</span><span class="wallet-balance">₹320 available</span></div>
                </div>
            </div>
            <div class="pay-secure-note">🔒 Funds held in escrow · Released after safe return · 100% refundable deposit</div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 20);
}

function switchPayTab(btn, tab) {
    document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.pay-tab-content').forEach(c => c.style.display = 'none');
    document.getElementById(`payTab-${tab}`).style.display = 'block';
}
function formatCard(input) { input.value = input.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim(); }

async function simulatePayment(title, amount, itemId, startDate, endDate) {
    const modal = document.getElementById('paymentModal');
    if (!modal) return;
    const card = modal.querySelector('.modal-card');
    card.innerHTML = `<div style="text-align:center;padding:40px 20px"><div style="font-size:3rem;margin-bottom:16px">⏳</div><div style="font-weight:700;font-size:1.1rem;margin-bottom:8px">Processing Payment...</div><div style="color:#9B97B2;font-size:0.9rem">Please wait</div></div>`;

    // === Actually create the booking in the database ===
    let bookingCreated = false;
    const user = getUser();
    if (user && itemId) {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        try {
            const resp = await apiPost('/api/bookings', {
                itemId: itemId,
                borrowerId: user.user_id || user.userId || user.id,
                startDate: startDate || today,
                endDate: endDate || tomorrow,
                totalPrice: amount
            });
            if (resp.booking) bookingCreated = true;
        } catch (e) {
            console.warn('Booking save failed', e);
        }
    }

    setTimeout(() => {
        card.innerHTML = `
            <div style="text-align:center;padding:40px 20px">
                <div style="font-size:3rem;margin-bottom:16px">✅</div>
                <div style="font-weight:800;font-size:1.3rem;margin-bottom:8px;color:#00C9A7">Payment Successful!</div>
                <div style="color:#9B97B2;font-size:0.9rem;margin-bottom:4px">₹${amount.toLocaleString('en-IN')} paid for <strong style="color:#E8E6F0">${title}</strong></div>
                <div style="color:#9B97B2;font-size:0.82rem;margin-bottom:24px">Booking confirmed · Lender notified · Check your dashboard</div>
                <div style="background:rgba(0,201,167,0.1);border:1px solid rgba(0,201,167,0.3);border-radius:12px;padding:12px;font-size:0.82rem;color:#00C9A7;margin-bottom:24px">🔒 Funds safely held in escrow until you return the tool</div>
                <button class="btn-primary" style="justify-content:center;width:100%;padding:14px;border-radius:12px" onclick="document.getElementById('paymentModal').remove();window.location.href='dashboard.html'">View in Dashboard →</button>
            </div>`;
    }, 1800);
}

// ===== LEAFLET MAP =====
let heroMapInstance = null, discoverMapInstance = null;
let ALL_ITEMS = []; // Populated from backend

async function loadItemsFromBackend() {
    try {
        const data = await apiGet('/api/items');
        ALL_ITEMS = (data.items || []).map(item => ({
            id: item.item_id,
            icon: item.icon || '🔧',
            title: item.title,
            owner: item.owner_name,
            owner_id: item.owner_id,
            price: item.price_per_day,
            rating: item.owner_rating || 4.8,
            distance: `${(Math.random() * 2.5 + 0.2).toFixed(1)} km`,
            lat: item.lat,
            lon: item.lon,
            deposit: item.deposit_amount,
            category: item.category,
            description: item.description,
            tags: [item.category || 'Tools'],
        }));
    } catch (e) {
        console.warn('Backend offline – using fallback data');
        ALL_ITEMS = FALLBACK_ITEMS;
    }
    return ALL_ITEMS;
}

// Fallback items if backend is offline
const FALLBACK_ITEMS = [
    { id: 1, icon: '🔨', title: 'Power Drill', owner: 'Priya S.', price: 199, rating: 4.9, distance: '0.3 km', lat: 19.082, lon: 72.885, tags: ['Power Tools'], deposit: 999, category: 'Power Tools', description: '12V cordless drill. Comes with 3 drill bits.' },
    { id: 2, icon: '🌿', title: 'Lawn Mower', owner: 'Rahul M.', price: 599, rating: 4.7, distance: '0.7 km', lat: 19.07, lon: 72.87, tags: ['Garden'], deposit: 2999, category: 'Garden', description: 'Petrol lawn mower.' },
    { id: 3, icon: '🪜', title: '6ft Ladder', owner: 'Anjali R.', price: 299, rating: 4.8, distance: '1.2 km', lat: 19.09, lon: 72.86, tags: ['Home'], deposit: 799, category: 'Home', description: 'Aluminium step ladder.' },
    { id: 4, icon: '🔧', title: 'Pressure Washer', owner: 'Vikram S.', price: 799, rating: 4.6, distance: '1.5 km', lat: 19.065, lon: 72.89, tags: ['Power Tools'], deposit: 1999, category: 'Power Tools', description: '2000 PSI pressure washer.' },
    { id: 5, icon: '🪚', title: 'Circular Saw', owner: 'Neha P.', price: 499, rating: 5.0, distance: '0.9 km', lat: 19.08, lon: 72.875, tags: ['Power Tools'], deposit: 1499, category: 'Power Tools', description: 'Cordless circular saw.' },
    { id: 6, icon: '🎨', title: 'Paint Sprayer', owner: 'Amit J.', price: 699, rating: 4.5, distance: '2.1 km', lat: 19.06, lon: 72.865, tags: ['Home'], deposit: 1799, category: 'Home', description: 'HVLP paint sprayer.' },
    { id: 7, icon: '⚙️', title: 'Angle Grinder', owner: 'Sneha G.', price: 299, rating: 4.8, distance: '0.5 km', lat: 19.095, lon: 72.882, tags: ['Power Tools'], deposit: 899, category: 'Power Tools', description: '4.5 inch angle grinder.' },
    { id: 8, icon: '🌊', title: 'Wet/Dry Vacuum', owner: 'Karan V.', price: 249, rating: 4.6, distance: '1.8 km', lat: 19.072, lon: 72.858, tags: ['Cleaning'], deposit: 699, category: 'Cleaning', description: '8-gallon wet/dry vac.' },
];

function initHeroMap() {
    const el = document.getElementById('heroMap');
    if (!el || heroMapInstance) return;
    const center = [19.076, 72.877];
    heroMapInstance = L.map('heroMap', { zoomControl: false, scrollWheelZoom: false, dragging: false, keyboard: false }).setView(center, 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '' }).addTo(heroMapInstance);
    ALL_ITEMS.slice(0, 5).forEach(item => {
        const marker = L.circleMarker([item.lat, item.lon], { radius: 10, fillColor: '#6C63FF', color: '#fff', weight: 2, fillOpacity: 0.9 }).addTo(heroMapInstance);
        marker.bindPopup(`<b>${item.icon} ${item.title}</b><br><span style="color:#00C9A7">₹${item.price}/day</span>`);
    });
}

function initDiscoverMapWithData(mapId, items) {
    const el = document.getElementById(mapId);
    if (!el || discoverMapInstance) return;
    const center = [19.076, 72.877];
    discoverMapInstance = L.map(mapId, { zoomControl: true, scrollWheelZoom: true }).setView(center, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors' }).addTo(discoverMapInstance);

    items.forEach(item => {
        if (!item.lat || !item.lon) return;
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:linear-gradient(135deg,#6C63FF,#00C9A7);color:#fff;font-size:1.1rem;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,0.35);cursor:pointer">${item.icon}</div>`,
            iconSize: [38, 38], iconAnchor: [19, 19]
        });
        const marker = L.marker([item.lat, item.lon], { icon }).addTo(discoverMapInstance);
        marker.bindPopup(`
            <div style="font-family:Outfit,sans-serif;min-width:180px;padding:4px">
                <b style="font-size:1rem">${item.icon} ${item.title}</b><br>
                <span style="color:#9B97B2;font-size:0.82rem">Lender: ${item.owner}</span><br>
                <span style="color:#00C9A7;font-weight:800;font-size:1rem">₹${item.price}/day</span>
                <span style="color:#9B97B2;font-size:0.8rem"> · Deposit ₹${item.deposit}</span><br>
                <a href="item.html?id=${item.id}" style="color:#6C63FF;font-weight:600;font-size:0.82rem;display:inline-block;margin-top:6px">View &amp; Book →</a>
            </div>`);
    });
}

// ===== HOME PAGE =====
async function initHomePage() {
    await loadItemsFromBackend();
    if (typeof L !== 'undefined') setTimeout(initHeroMap, 200);

    const itemList = document.getElementById('itemList');
    if (itemList) {
        ALL_ITEMS.slice(0, 8).forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-card-icon">${item.icon}</div>
                <div class="item-card-title">${item.title}</div>
                <div class="item-card-meta">${item.owner} · ${item.distance}</div>
                <div class="item-card-price">₹${item.price}/day</div>`;
            card.addEventListener('click', () => window.location.href = `item.html?id=${item.id}`);
            itemList.appendChild(card);
        });
    }

    const discoverMapEl = document.getElementById('discoverMap');
    if (discoverMapEl && typeof L !== 'undefined') setTimeout(() => initDiscoverMapWithData('discoverMap', ALL_ITEMS), 200);

    const toolsGrid = document.getElementById('toolsGrid');
    if (toolsGrid) {
        ALL_ITEMS.forEach(item => {
            const card = document.createElement('a');
            card.className = 'tool-card';
            card.href = `item.html?id=${item.id}`;
            card.innerHTML = `
                <div class="tool-card-icon">${item.icon}</div>
                <div class="tool-card-name">${item.title}</div>
                <div class="tool-card-owner">${item.owner}</div>
                <div class="tool-card-footer">
                    <span class="tool-card-price">₹${item.price}/day</span>
                    <span class="tool-card-rating">⭐ ${item.rating}</span>
                </div>`;
            toolsGrid.appendChild(card);
        });
    }

    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            roleCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });

    initReveal();
}

// ===== DISCOVER PAGE =====
async function initDiscoverPage() {
    await loadItemsFromBackend();
    const listEl = document.getElementById('discoverItemsList');

    function renderList(items) {
        if (!listEl) return;
        listEl.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('a');
            card.className = 'discover-item-card';
            card.href = `item.html?id=${item.id}`;
            card.innerHTML = `
                <div class="dic-top"><span class="dic-icon">${item.icon}</span><span class="dic-price">₹${item.price}/day</span></div>
                <div class="dic-name">${item.title}</div>
                <div class="dic-meta">By: ${item.owner} · ${item.distance || 'Nearby'}</div>
                <div class="dic-tags">${(item.tags || []).map(t => `<span class="dic-tag">${t}</span>`).join('')}</div>`;
            listEl.appendChild(card);
        });
    }
    renderList(ALL_ITEMS);
    if (typeof L !== 'undefined') setTimeout(() => initDiscoverMapWithData('fullMap', ALL_ITEMS), 200);

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            const q = e.target.value.toLowerCase();
            renderList(ALL_ITEMS.filter(i => i.title.toLowerCase().includes(q) || (i.tags || []).some(t => t.toLowerCase().includes(q))));
        });
    }

    const pills = document.querySelectorAll('.radius-pill');
    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            showToast(`Showing items within ${pill.dataset.radius} km`);
        });
    });
}

// ===== ITEM DETAIL PAGE =====
async function initItemPage() {
    await loadItemsFromBackend();
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    const id = idParam ? parseInt(idParam, 10) : 1;

    alert(`Debug Info:\nID in URL: ${idParam}\nTotal Items Loaded: ${ALL_ITEMS.length}\nAPI Base: ${API_BASE}`);
    console.log(`[DEBUG] idParam: ${idParam}, parsed id: ${id}, type of idParam: ${typeof idParam}`);
    console.log(`[DEBUG] ALL_ITEMS length: ${ALL_ITEMS.length}`);

    // Explicitly check finding the item
    const matchedItem = ALL_ITEMS.find(i => String(i.id) === String(idParam || id));
    console.log(`[DEBUG] matchedItem:`, matchedItem);

    const item = matchedItem || ALL_ITEMS[0] || FALLBACK_ITEMS[0];
    if (!item) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('itemIcon', item.icon);
    set('itemTitle', item.title);
    set('itemOwner', item.owner);
    set('breadcrumbTitle', item.title);
    set('lenderName', item.owner);
    set('itemPrice', `₹${item.price.toLocaleString('en-IN')}`);
    set('itemDeposit', `Security deposit: ₹${item.deposit.toLocaleString('en-IN')} (refundable)`);
    set('itemRating', `⭐ ${item.rating} rating`);
    set('itemDistance', `📍 ${item.distance || 'Nearby'}`);

    const startInput = document.getElementById('startDate');
    const endInput = document.getElementById('endDate');
    const totalEl = document.getElementById('bookingTotal');

    function updateTotal() {
        if (startInput?.value && endInput?.value) {
            const days = Math.max(1, Math.round((new Date(endInput.value) - new Date(startInput.value)) / 86400000));
            const rental = days * item.price;
            const fee = Math.round(rental * 0.05);
            if (totalEl) totalEl.textContent = `₹${(rental + item.deposit + fee).toLocaleString('en-IN')} (${days} day${days !== 1 ? 's' : ''} + deposit)`;
            const rentalFeeEl = document.getElementById('rentalFeeDisplay');
            const depositEl = document.getElementById('depositDisplay');
            const feeEl = document.getElementById('serviceFeeDisplay');
            if (rentalFeeEl) rentalFeeEl.textContent = `₹${rental.toLocaleString('en-IN')}`;
            if (depositEl) depositEl.textContent = `₹${item.deposit.toLocaleString('en-IN')}`;
            if (feeEl) feeEl.textContent = `₹${fee.toLocaleString('en-IN')}`;
        }
    }
    if (startInput) { startInput.addEventListener('change', updateTotal); endInput.addEventListener('change', updateTotal); }

    const bookBtn = document.getElementById('bookBtn');
    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            if (!isLoggedIn()) { showToast('Please login to book this item 🔐'); window.location.href = 'login.html'; return; }
            const days = (startInput?.value && endInput?.value) ? Math.max(1, Math.round((new Date(endInput.value) - new Date(startInput.value)) / 86400000)) : 1;
            const total = (days * item.price) + item.deposit + Math.round(days * item.price * 0.05);
            const sDate = startInput?.value || new Date().toISOString().split('T')[0];
            const eDate = endInput?.value || new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
            openPaymentModal(total, item.title, item.id, sDate, eDate);
        });
    }
}

// ===== DASHBOARD PAGE =====
function initDashboardPage() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const panels = document.querySelectorAll('.dash-panel');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            const target = link.dataset.panel;
            if (target) panels.forEach(p => { p.style.display = p.id === target ? 'block' : 'none'; });
        });
    });

    document.querySelectorAll('.star-rating').forEach(container => {
        const stars = container.querySelectorAll('span');
        stars.forEach((star, i) => {
            star.addEventListener('mouseover', () => stars.forEach((s, j) => s.classList.toggle('active', j <= i)));
            star.addEventListener('mouseleave', () => { const sel = container.dataset.selected || -1; stars.forEach((s, j) => s.classList.toggle('active', j <= sel)); });
            star.addEventListener('click', () => { container.dataset.selected = i; showToast(`Rating of ${i + 1} stars submitted! ⭐`); });
        });
    });

    document.querySelectorAll('.unlock-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.textContent = '📍 Verifying...'; btn.disabled = true;
            setTimeout(() => { showToast('✅ Location verified! Rental timer started.'); btn.textContent = '✓ Unlocked'; btn.style.background = 'rgba(0,201,167,0.25)'; }, 1500);
        });
    });

    document.querySelectorAll('.pay-now-btn').forEach(btn => {
        btn.addEventListener('click', () => openPaymentModal(parseInt(btn.dataset.amount) || 499, btn.dataset.title || 'Tool Rental'));
    });

    // ===== INJECT LOGGED-IN USER DATA (ROLE-BASED) =====
    const user = getUser();
    if (!user) { window.location.replace('login.html'); return; }

    const ut = user.user_type || 'both';

    const avatarEl = document.getElementById('dashAvatar');
    const nameEl = document.getElementById('dashName');
    const roleEl = document.getElementById('dashRole');
    const badgeEl = document.getElementById('dashRoleBadge');
    const sidebarNav = document.getElementById('sidebarNav');
    const dashMain = document.getElementById('dashMain');

    if (avatarEl) avatarEl.textContent = user.name ? user.name[0].toUpperCase() : '?';
    if (nameEl) nameEl.textContent = user.name || 'User';
    if (roleEl) roleEl.textContent = ut === 'borrower' ? 'Active Borrower' : ut === 'lender' ? 'Tool Lender' : 'Lender & Borrower';
    if (badgeEl) badgeEl.innerHTML = `<span class="role-badge ${ut}">${ut === 'borrower' ? '🛒 Borrower' : ut === 'lender' ? '💼 Lender' : '🔄 Both'}</span>`;

    if (ut === 'borrower') {
        // === BORROWER VIEW ===
        if (sidebarNav) sidebarNav.innerHTML = `
            <button class="sidebar-link active" data-panel="bookingsPanel"><span class="sidebar-icon">📦</span> My Bookings</button>
            <a href="discover.html" class="sidebar-link"><span class="sidebar-icon">🔍</span> Find Services</a>
            <a href="chat.html" class="sidebar-link"><span class="sidebar-icon">💬</span> Messages</a>`;

        if (dashMain) dashMain.innerHTML = `
            <div id="bookingsPanel" class="dash-panel" style="display:block">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
                    <h2 style="color:var(--text);margin:0">📦 My Bookings</h2>
                    <a href="discover.html" class="btn-sm btn-sm-primary">+ Book Something</a>
                </div>
                <div id="myBookingsList"><div style="text-align:center;padding:40px;color:#9B97B2"><div style="font-size:2.5rem;margin-bottom:12px">⏳</div><p>Loading your bookings…</p></div></div>
            </div>`;

        // === Fetch real bookings from the API ===
        (async () => {
            const listEl = document.getElementById('myBookingsList');
            const panelEl = document.getElementById('bookingsPanel');
            const exploreCtaHtml = `
                <div class="explore-cta" style="margin-top:24px">
                    <h3>Need Something Else? 🔍</h3>
                    <p>Browse 200+ tools, services, workers and helpers near you</p>
                    <a href="discover.html" class="btn-primary" style="margin-bottom:16px;display:inline-flex">Explore All Listings →</a>
                    <div class="service-quick-links">
                        <a href="discover.html?filter=maid" class="svc-chip">🧹 Find Maid</a>
                        <a href="discover.html?filter=service" class="svc-chip">🏠 Home Services</a>
                        <a href="discover.html?filter=worker" class="svc-chip">👷 Hire Worker</a>
                        <a href="discover.html?filter=tool" class="svc-chip">🔨 Borrow Tools</a>
                        <a href="discover.html?filter=cook" class="svc-chip">👨‍🍳 Find Cook</a>
                        <a href="discover.html" class="svc-chip">➕ Check More</a>
                    </div>
                </div>`;

            try {
                const resp = await apiGet('/api/bookings');
                const bookings = resp.bookings || [];
                if (!bookings.length) {
                    listEl.innerHTML = `<div style="text-align:center;padding:40px;color:#9B97B2">
                        <div style="font-size:3rem;margin-bottom:14px">📭</div>
                        <p style="margin-bottom:16px">No bookings yet! Start exploring services near you.</p>
                        <a href="discover.html" class="btn-primary" style="display:inline-flex">Browse Listings →</a></div>`;
                    if (panelEl) panelEl.insertAdjacentHTML('beforeend', exploreCtaHtml);
                    return;
                }
                const statusClass = s => s === 'Active' || s === 'Pending' ? 'status-rented'
                    : s === 'Completed' ? 'status-completed' : 'status-pending';
                const statusLabel = s => s === 'Active' ? '🟢 Active'
                    : s === 'Confirmed' ? '🟢 Confirmed'
                        : s === 'Completed' ? '✅ Done'
                            : s === 'Rejected' ? '❌ Rejected'
                                : s === 'Pending' ? '🕐 Pending' : s || 'Pending';

                const getCardHtml = (b) => {
                    const sClass = statusClass(b.status);
                    const sLabel = statusLabel(b.status);
                    const priceFormatted = Number(b.total_price || 0).toLocaleString('en-IN');
                    return `
                    <div class="booked-card">
                        <div class="booked-card-icon">${b.icon || '📦'}</div>
                        <div class="booked-card-info">
                            <div class="booked-card-title">${b.item_title || 'Item'}</div>
                            <div class="booked-card-meta">From ${b.lender_name || 'Lender'} · ${b.start_date || ''} – ${b.end_date || ''}</div>
                            <div class="booked-card-meta" style="margin-top:2px;font-size:0.72rem">₹${b.price_per_day || 0}/day</div>
                        </div>
                        <div style="text-align:right;flex-shrink:0">
                            <div class="booked-card-price">₹${priceFormatted}</div>
                            <span class="status-badge ${sClass}" style="font-size:0.72rem;margin-top:4px;display:inline-block">${sLabel}</span>
                        </div>
                    </div>`;
                };

                listEl.innerHTML = `<div class="booked-grid">${bookings.map(getCardHtml).join('')}</div>`;
                if (panelEl) panelEl.insertAdjacentHTML('beforeend', exploreCtaHtml);

            } catch (e) {
                listEl.innerHTML = `<div style="text-align:center;padding:30px;color:#FF6B9D">Failed to load bookings. Is the backend running?</div>`;
                if (panelEl) panelEl.insertAdjacentHTML('beforeend', exploreCtaHtml);
            }
        })();



    } else {
        // === LENDER / BOTH VIEW ===
        try {
            if (sidebarNav) sidebarNav.innerHTML = `
                <button class="sidebar-link active" data-panel="overviewPanel"><span class="sidebar-icon">🏠</span> Overview</button>
                <button class="sidebar-link" data-panel="lendingPanel"><span class="sidebar-icon">🔧</span> My Listings</button>
                <button class="sidebar-link" data-panel="ordersPanel"><span class="sidebar-icon">📋</span> Confirm Orders</button>
                <button class="sidebar-link" data-panel="earningsPanel"><span class="sidebar-icon">💰</span> Earnings</button>
                ${ut === 'both' ? '<button class="sidebar-link" data-panel="borrowPanel"><span class="sidebar-icon">📦</span> My Borrows</button>' : ''}
                <a href="chat.html" class="sidebar-link"><span class="sidebar-icon">💬</span> Messages</a>
                <a href="discover.html" class="sidebar-link"><span class="sidebar-icon">🗺️</span> Discover</a>
                <a href="list-tool.html" class="sidebar-link" style="color:#00C9A7"><span class="sidebar-icon">➕</span> Add Listing</a>`;

            if (dashMain) dashMain.innerHTML = `
                <div id="overviewPanel" class="dash-panel">
                    <div class="stat-cards">
                        <div class="stat-card"><div class="stat-card-icon">🔧</div><div><div class="stat-card-value" id="statListings">—</div><div class="stat-card-label">My Listings</div></div></div>
                        <div class="stat-card"><div class="stat-card-icon">💰</div><div><div class="stat-card-value" id="statEarned">₹—</div><div class="stat-card-label">Total Earned</div></div></div>
                        <div class="stat-card"><div class="stat-card-icon">⭐</div><div><div class="stat-card-value">${parseFloat(user.rating_avg || 4.8).toFixed(1)}</div><div class="stat-card-label">Your Rating</div></div></div>
                    </div>
                    <div class="panel">
                        <div class="panel-header"><span class="panel-title">🔧 Your Listings</span><a href="list-tool.html" class="btn-sm btn-sm-primary">+ Add Listing</a></div>
                        <div id="overviewListings"><div style="text-align:center;padding:30px;color:#9B97B2">Loading your listings…</div></div>
                    </div>
                </div>
                <div id="lendingPanel" class="dash-panel" style="display:none">
                    <div class="panel">
                        <div class="panel-header"><span class="panel-title">All My Listings</span><a href="list-tool.html" class="btn-sm btn-sm-primary">+ Add New</a></div>
                        <div id="allListings"><div style="text-align:center;padding:30px;color:#9B97B2">Loading…</div></div>
                    </div>
                </div>
                <div id="ordersPanel" class="dash-panel" style="display:none">
                    <div class="panel"><div class="panel-header"><span class="panel-title">Bookings To Confirm</span></div>
                        <div id="confirmOrdersList"><div style="text-align:center;padding:30px;color:#9B97B2">Loading…</div></div>
                    </div>
                </div>
                <div id="earningsPanel" class="dash-panel" style="display:none">
                    <div class="stat-cards">
                        <div class="stat-card"><div class="stat-card-icon">💰</div><div><div class="stat-card-value" id="statEarned2">₹—</div><div class="stat-card-label">Total Earned</div></div></div>
                        <div class="stat-card"><div class="stat-card-icon">📊</div><div><div class="stat-card-value" id="statRentals">—</div><div class="stat-card-label">Total Bookings</div></div></div>
                        <div class="stat-card"><div class="stat-card-icon">⭐</div><div><div class="stat-card-value">${parseFloat(user.rating_avg || 4.8).toFixed(1)}</div><div class="stat-card-label">Rating</div></div></div>
                    </div>
                    <div class="panel"><div class="panel-header"><span class="panel-title">All Bookings on Your Listings</span></div>
                        <div id="earningsBookings"><div style="text-align:center;padding:30px;color:#9B97B2">Loading…</div></div>
                    </div>
                </div>
                ${ut === 'both' ? `<div id="borrowPanel" class="dash-panel" style="display:none">
                    <h2 style="color:var(--text);margin-bottom:20px">📦 Items I've Borrowed</h2>
                    <div id="myBorrows"><div style="text-align:center;padding:30px;color:#9B97B2">Loading…</div></div>
                </div>`: ''}`;

            // === Async: Load real lender data from API ===
            async function loadLenderData() {
                try {
                    const itemsResp = await apiGet('/api/items?radius=100&lat=19.076&lon=72.877').catch(() => ({ items: [] }));
                    const allItems = itemsResp.items || [];
                    const myItems = allItems.filter(it => it.owner_id === user.user_id);

                    // Stat: listing count
                    const statEl = document.getElementById('statListings');
                    if (statEl) statEl.textContent = myItems.length || '0';

                    const listingRow = (it) => `
                        <div class="booking-item">
                            <div class="booking-icon">${it.icon || '🔧'}</div>
                            <div class="booking-info">
                                <div class="booking-title">${it.title}</div>
                                <div class="booking-meta">${it.category || it.service_type || 'Listing'} · ₹${it.price_per_day}/day · ${it.distance_km ? parseFloat(it.distance_km).toFixed(1) + 'km away' : ''}</div>
                            </div>
                            <span class="status-badge ${it.status === 'Rented' ? 'status-rented' : 'status-pending'}" style="font-size:0.75rem">${it.status || 'Available'}</span>
                        </div>`;

                    const emptyState = `<div style="text-align:center;padding:40px;color:#9B97B2">
                        <div style="font-size:3rem;margin-bottom:14px">📦</div>
                        <p>No listings yet.</p>
                        <a href="list-tool.html" class="btn-primary" style="margin-top:12px;display:inline-flex">+ Add Your First Listing</a>
                    </div>`;

                    // Global function so buttons can call it
                    window.updateLenderBooking = async (bookingId, newStatus) => {
                        if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;
                        try {
                            await apiPatch(`/api/bookings/${bookingId}/status`, { status: newStatus });
                            showToast(`Booking marked as ${newStatus}`, 'success');
                            loadLenderData(); // Refresh panel
                        } catch (e) {
                            showToast('Failed to update booking status', 'error');
                        }
                    };

                    const overEl = document.getElementById('overviewListings');
                    const allEl = document.getElementById('allListings');
                    if (overEl) overEl.innerHTML = myItems.length ? myItems.slice(0, 5).map(listingRow).join('') : emptyState;
                    if (allEl) allEl.innerHTML = myItems.length ? myItems.map(listingRow).join('') : emptyState;

                    // Bookings (earnings) - LENDERS see bookings on their items
                    const bookResp = await apiGet('/api/bookings/lender').catch(() => ({ bookings: [] }));
                    const bookings = bookResp.bookings || [];

                    // Filter completed/active ones for pure "earnings" stat, but let's just sum all confirmed/completed
                    const earningBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Active' || b.status === 'Completed');
                    const totalEarned = earningBookings.reduce((s, b) => s + (b.total_price || 0), 0);
                    const earnStr = totalEarned ? '₹' + totalEarned.toLocaleString('en-IN') : '₹0';

                    ['statEarned', 'statEarned2'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = earnStr; });
                    const srEl = document.getElementById('statRentals'); if (srEl) srEl.textContent = bookings.length || '0';

                    const bookRow = (b) => {
                        let actionHtml = '';
                        if (b.status === 'Pending') {
                            actionHtml = `
                        <div style="margin-top:8px; display:flex; gap:6px; justify-content:flex-end">
                            <button onclick="updateLenderBooking(${b.booking_id}, 'Confirmed')" class="btn-sm btn-sm-primary" style="padding:4px 10px;font-size:0.7rem">Confirm</button>
                            <button onclick="updateLenderBooking(${b.booking_id}, 'Rejected')" class="btn-sm" style="padding:4px 10px;font-size:0.7rem;background:#FFEAEA;color:#FF4B4B">Reject</button>
                        </div>
                    `;
                        } else if (b.status === 'Confirmed' || b.status === 'Active') {
                            actionHtml = `
                        <div style="margin-top:8px; display:flex; gap:6px; justify-content:flex-end">
                            <button onclick="updateLenderBooking(${b.booking_id}, 'Completed')" class="btn-sm" style="padding:4px 10px;font-size:0.7rem;background:#E8F5E9;color:#2E7D32">Mark Completed</button>
                        </div>
                    `;
                        }

                        return `
                <div class="booked-card">
                    <div class="booked-card-icon">${b.item_icon || '📦'}</div>
                    <div class="booked-card-info">
                        <div class="booked-card-title">${b.item_title || 'Item'}</div>
                        <div class="booked-card-meta">By ${b.borrower_name || 'Borrower'} · ${b.start_date || ''} – ${b.end_date || ''}</div>
                    </div>
                    <div style="text-align:right;flex-shrink:0">
                        <div class="booked-card-price">₹${(b.total_price || 0).toLocaleString('en-IN')}</div>
                        <span class="status-badge ${b.status === 'Confirmed' || b.status === 'Active' ? 'status-rented' : b.status === 'Completed' ? 'status-completed' : b.status === 'Rejected' ? 'status-pending' : 'status-pending'}"
                              style="font-size:0.72rem;margin-top:4px;display:inline-block">${b.status || 'Pending'}</span>
                        ${actionHtml}
                    </div>
                </div>`;
                    };

                    const confirmList = bookings.filter(b => b.status === 'Pending');

                    const coEl = document.getElementById('confirmOrdersList');
                    if (coEl) coEl.innerHTML = confirmList.length
                        ? `<div class="booked-grid">${confirmList.map(bookRow).join('')}</div>`
                        : `<div style="text-align:center;padding:40px;color:#9B97B2"><div style="font-size:2.5rem;margin-bottom:12px">📋</div><p>No orders pending confirmation.</p></div>`;

                    const earEl = document.getElementById('earningsBookings');
                    if (earEl) earEl.innerHTML = bookings.length
                        ? `<div class="booked-grid">${bookings.map(bookRow).join('')}</div>`
                        : `<div style="text-align:center;padding:40px;color:#9B97B2"><div style="font-size:2.5rem;margin-bottom:12px">💰</div><p>No bookings yet. Share your listings to start earning!</p><a href="discover.html" style="color:#6C63FF;font-weight:600">View on map →</a></div>`;


                    if (ut === 'both') {
                        const myBorrowsEl = document.getElementById('myBorrows');
                        if (myBorrowsEl) myBorrowsEl.innerHTML = bookings.length
                            ? `<div class="booked-grid">${bookings.slice(0, 3).map(bookRow).join('')}</div>`
                            : `<div class="explore-cta"><h3>Nothing borrowed yet 🔍</h3><p>Explore nearby tools and services</p><a href="discover.html" class="btn-primary" style="display:inline-flex;margin-top:8px">Browse Listings →</a></div>`;
                    }
                } catch (err) {
                    if (dashMain) dashMain.innerHTML += `<div style="padding:20px;color:red;border:1px solid red">Inner Async Error: ${err.message}</div>`;
                    console.error('Inner Async loadLenderData Error:', err);
                }
            } // End of loadLenderData function

            // Call the async function and let its rejections be unhandled here (or we could await it, but we don't need to block UI rendering)
            loadLenderData();

        } catch (err) {
            if (dashMain) dashMain.innerHTML = `<div style="padding:40px;color:#FF4B4B"><h2>Dashboard crashed</h2><pre style="background:#1a1a24;padding:15px;border-radius:8px;overflow-x:auto">${err.stack}</pre></div>`;
            console.error('Lender Dashboard Outer Try Error:', err);
        }
    } // End of if-else role block

    // Wire sidebar panel switching FOR ALL ROLES
    setTimeout(() => {
        document.querySelectorAll('.sidebar-link[data-panel]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.querySelectorAll('.dash-panel').forEach(p => p.style.display = 'none');
                const p = document.getElementById(btn.dataset.panel);
                if (p) {
                    p.style.display = 'block';
                }
            });
        });
    }, 50);
}


// ===== CHAT PAGE =====

async function initChatPage() {
    await loadItemsFromBackend();
    initSocket();

    const currentUser = getUser() || { user_id: 999, name: 'You' };
    const convList = document.getElementById('conversationList');
    const messagesArea = document.getElementById('messagesArea');
    const chatName = document.getElementById('chatName');
    const chatStatus = document.getElementById('chatStatus');

    // Build conversations from lenders (all items = lenders to chat with)
    const lenders = ALL_ITEMS.map(item => ({
        id: item.owner_id || item.id,
        name: item.owner,
        tool: item.title,
        icon: item.icon,
        price: item.price,
        deposit: item.deposit,
        description: item.description || `${item.title} available for rent.`,
        category: item.category,
        avatar: item.owner[0].toUpperCase(),
        online: Math.random() > 0.4
    }));

    // In-memory message store { [lenderId]: [{...}] }
    const messageStore = {};
    let activeLenderId = lenders[0]?.id || 1;

    function getBotReply(lender, userMsg) {
        const msg = userMsg.toLowerCase();
        const greetings = ['hi', 'hey', 'hello', 'hii', 'hiii', 'yo', 'sup', 'namaste'];
        const priceWords = ['price', 'cost', 'charge', 'rate', 'how much', 'kitna', 'rent'];
        const availWords = ['available', 'free', 'when', 'book', 'slot'];
        const depositWords = ['deposit', 'security', 'refund'];
        const descWords = ['tell', 'what', 'about', 'detail', 'info', 'describe', 'condition'];

        if (greetings.some(g => msg.includes(g))) {
            return `Hey! 👋 I'm ${lender.name}. I lend out the **${lender.icon} ${lender.tool}** for ₹${lender.price}/day. Interested? Just ask me anything!`;
        }
        if (priceWords.some(w => msg.includes(w))) {
            return `My ${lender.tool} is priced at **₹${lender.price}/day**. Security deposit is ₹${lender.deposit} (fully refunded when you return it). 💰`;
        }
        if (depositWords.some(w => msg.includes(w))) {
            return `The security deposit is **₹${lender.deposit}**. It's held in escrow and 100% refunded after you safely return the ${lender.tool}. No worries! 🔒`;
        }
        if (availWords.some(w => msg.includes(w))) {
            return `Yes, the ${lender.tool} is available right now! 🟢 You can book it for any dates. Want me to hold it for you?`;
        }
        if (descWords.some(w => msg.includes(w))) {
            return `Sure! ${lender.description} — Category: ${lender.category}. It's in excellent condition. Rating: ⭐ 4.8+`;
        }
        if (msg.includes('ok') || msg.includes('great') || msg.includes('sure') || msg.includes('perfect')) {
            return `Awesome! 🎉 Go ahead and book via the app. Once you pay, I'll get notified and we can arrange pickup. 📍`;
        }
        if (msg.includes('thank') || msg.includes('thanks')) {
            return `You're welcome! 😊 Feel free to contact me anytime. Happy renting!`;
        }
        if (msg.includes('location') || msg.includes('address') || msg.includes('where') || msg.includes('pickup')) {
            return `I'm based nearby, around ${(Math.random() * 2 + 0.3).toFixed(1)} km from you! We can arrange pickup at my place. I'll share the exact address after booking. 📍`;
        }
        // Default
        const defaults = [
            `My ${lender.tool} is available for ₹${lender.price}/day. Want to book it? 🛠️`,
            `Hey! Ask me anything about the ${lender.tool}. I'm happy to help! 😊`,
            `Sure thing! The ${lender.tool} is well-maintained and ready to rent. Deposit ₹${lender.deposit} refundable. 👍`,
        ];
        return defaults[Math.floor(Math.random() * defaults.length)];
    }

    function renderFormattedText(text) {
        return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    function renderConversations() {
        if (!convList) return;
        convList.innerHTML = '';
        lenders.forEach(lender => {
            const msgs = messageStore[lender.id] || [];
            const lastMsg = msgs[msgs.length - 1];
            const item = document.createElement('div');
            item.className = `conversation-item${lender.id === activeLenderId ? ' active' : ''}`;
            item.innerHTML = `
                <div class="conversation-avatar" style="${lender.online ? 'border:2px solid #00C9A7' : ''}">${lender.avatar}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${lender.name} ${lender.online ? '<span style="color:#00C9A7;font-size:0.65rem">● online</span>' : ''}</div>
                    <div class="conversation-preview">${lastMsg ? lastMsg.text.slice(0, 35) : `re: ${lender.tool}`}</div>
                </div>
                <div class="conversation-time">${lastMsg ? 'Now' : lender.icon}</div>`;
            item.addEventListener('click', () => {
                activeLenderId = lender.id;
                if (chatStatus) chatStatus.textContent = `${lender.online ? '● Online' : '○ Offline'} · re: ${lender.tool}`;
                if (chatName) chatName.textContent = lender.name;
                renderConversations();
                renderMessages(lender.id);

                // Send greeting from bot if no messages yet
                if (!messageStore[lender.id] || messageStore[lender.id].length === 0) {
                    setTimeout(() => {
                        const greeting = getBotReply(lender, 'hi');
                        if (!messageStore[lender.id]) messageStore[lender.id] = [];
                        messageStore[lender.id].push({ id: Date.now(), sender: lender.name, mine: false, text: greeting, time: now() });
                        renderMessages(lender.id);
                        renderConversations();
                    }, 600);
                }
            });
            convList.appendChild(item);
        });
    }

    function renderMessages(lenderId) {
        if (!messagesArea) return;
        const msgs = messageStore[lenderId] || [];
        messagesArea.innerHTML = '';
        if (msgs.length === 0) {
            messagesArea.innerHTML = `<div style="text-align:center;color:#555070;font-size:0.88rem;margin-top:40px">👆 Click a conversation to start chatting<br><span style="font-size:0.75rem">Lenders respond instantly!</span></div>`;
            return;
        }
        msgs.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.mine ? 'mine' : 'theirs'}`;
            div.innerHTML = `
                ${!msg.mine ? `<div class="message-avatar">${msg.sender[0]}</div>` : ''}
                <div>
                    <div class="message-bubble">${renderFormattedText(msg.text)}</div>
                    <div class="message-time">${msg.time}</div>
                </div>
                ${msg.mine ? `<div class="message-avatar" style="background:linear-gradient(135deg,#6C63FF,#00C9A7)">${currentUser.name[0]}</div>` : ''}`;
            messagesArea.appendChild(div);
        });
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }

    function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');

    function sendMsg() {
        const text = chatInput?.value.trim();
        if (!text) return;
        if (!messageStore[activeLenderId]) messageStore[activeLenderId] = [];
        messageStore[activeLenderId].push({ id: Date.now(), sender: currentUser.name, mine: true, text, time: now() });
        if (chatInput) chatInput.value = '';
        renderMessages(activeLenderId);
        renderConversations();

        // Bot typing indicator then reply
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message theirs';
        const lender = lenders.find(l => l.id === activeLenderId);
        typingDiv.innerHTML = `<div class="message-avatar">${lender?.avatar || '?'}</div><div><div class="message-bubble" style="color:#9B97B2">✍️ typing...</div></div>`;
        messagesArea?.appendChild(typingDiv);
        messagesArea.scrollTop = messagesArea.scrollHeight;

        setTimeout(() => {
            typingDiv.remove();
            const reply = getBotReply(lender, text);
            messageStore[activeLenderId].push({ id: Date.now() + 1, sender: lender.name, mine: false, text: reply, time: now() });
            renderMessages(activeLenderId);
            renderConversations();

            // Also save to backend if logged in
            if (isLoggedIn() && lender?.id) {
                apiPost('/api/chat/messages', { senderId: currentUser.user_id, receiverId: lender.id, text: reply })
                    .catch(() => { });
            }
        }, 800 + Math.random() * 600);

        // Save user message to backend
        if (isLoggedIn() && lender?.id) {
            apiPost('/api/chat/messages', { senderId: currentUser.user_id, receiverId: lender.id, text })
                .catch(() => { });
        }
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMsg);
    if (chatInput) chatInput.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } });

    renderConversations();
    renderMessages(activeLenderId);

    // Auto-open first conversation
    if (lenders.length > 0) {
        if (chatName) chatName.textContent = lenders[0].name;
        if (chatStatus) chatStatus.textContent = `${lenders[0].online ? '● Online' : '○ Offline'} · re: ${lenders[0].tool}`;
        setTimeout(() => {
            if (!messageStore[lenders[0].id]) messageStore[lenders[0].id] = [];
            messageStore[lenders[0].id].push({ id: Date.now(), sender: lenders[0].name, mine: false, text: getBotReply(lenders[0], 'hi'), time: now() });
            renderMessages(lenders[0].id);
            renderConversations();
        }, 500);
    }
}

// ===== LOGIN PAGE =====
async function initLoginPage() {
    const tabs = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const adminForm = document.getElementById('adminForm');

    // If already logged in (and not admin page), redirect
    if (isLoggedIn()) {
        const user = getUser();
        if (user?.role === 'admin') { window.location.href = 'admin.html'; return; }
        window.location.href = 'dashboard.html'; return;
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.dataset.tab;
            if (loginForm) loginForm.style.display = mode === 'login' ? 'block' : 'none';
            if (signupForm) signupForm.style.display = mode === 'signup' ? 'block' : 'none';
            if (adminForm) adminForm.style.display = mode === 'admin' ? 'block' : 'none';
        });
    });

    // LOGIN
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('loginBtn');
        const email = document.getElementById('loginEmail')?.value?.trim();
        const pass = document.getElementById('loginPassword')?.value;
        if (!email || !pass) { showToast('Please enter email and password', 'error'); return; }
        btn.textContent = 'Logging in...'; btn.disabled = true;
        const data = await apiPost('/api/auth/login', { email, password: pass });
        btn.disabled = false; btn.textContent = 'Log In';
        if (data.token) {
            setSession(data.token, data.user);
            showToast(`Welcome back, ${data.user.name}! 👋`);
            setTimeout(() => window.location.href = 'dashboard.html', 800);
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    });

    // SIGNUP
    document.getElementById('signupBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('signupBtn');
        const name = document.getElementById('signupName')?.value?.trim();
        const email = document.getElementById('signupEmail')?.value?.trim();
        const pass = document.getElementById('signupPassword')?.value;
        const phone = document.getElementById('signupPhone')?.value?.trim();
        const userType = document.getElementById('signupRole')?.value || 'both';
        if (!name || !email || !pass) { showToast('Please fill all required fields', 'error'); return; }
        if (pass.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
        btn.textContent = 'Creating account...'; btn.disabled = true;
        const data = await apiPost('/api/auth/register', { name, email, password: pass, phone, user_type: userType });
        btn.disabled = false; btn.textContent = 'Create Account 🚀';
        if (data.token) {
            // Merge user_type into stored session
            const sessionUser = { ...data.user, user_type: userType };
            setSession(data.token, sessionUser);
            showToast(`Welcome to LendIt, ${data.user.name}! 🎉`);
            setTimeout(() => window.location.href = 'dashboard.html', 800);
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    });

    // ADMIN LOGIN
    document.getElementById('adminLoginBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('adminLoginBtn');
        const email = document.getElementById('adminEmail')?.value?.trim();
        const pass = document.getElementById('adminPassword')?.value;
        if (!email || !pass) { showToast('Please enter admin credentials', 'error'); return; }
        btn.textContent = 'Verifying...'; btn.disabled = true;
        const data = await apiPost('/api/auth/login', { email, password: pass, adminLogin: true });
        btn.disabled = false; btn.textContent = 'Admin Sign In';
        if (data.token && data.user?.role === 'admin') {
            setSession(data.token, data.user);
            showToast('Admin access granted! 🛡️');
            setTimeout(() => window.location.href = 'admin.html', 800);
        } else {
            showToast(data.error || 'Admin access denied', 'error');
        }
    });
}

// ===== LIST TOOL PAGE =====
function initListToolPage() {
    const form = document.getElementById('listToolForm');
    const preview = document.getElementById('toolPreview');

    function updatePreview() {
        const title = document.getElementById('lt-title')?.value || 'Your Tool';
        const price = document.getElementById('lt-price')?.value || '0';
        const deposit = document.getElementById('lt-deposit')?.value || '0';
        const category = document.getElementById('lt-category')?.value || 'home';
        const ICONS = { 'power-tools': '🔧', 'garden': '🌿', 'home': '🏠', 'cleaning': '🧹', 'construction': '🔨', 'vehicles': '🚗', 'electronics': '💻', 'sports': '⚽' };
        const icon = ICONS[category] || '🔧';
        if (preview) {
            preview.innerHTML = `
                <div style="text-align:center;padding:20px;background:var(--dark);border-radius:16px;border:1px solid var(--card-border)">
                    <div style="font-size:3rem;margin-bottom:8px">${icon}</div>
                    <div style="font-weight:700;font-size:1.1rem;margin-bottom:4px">${title}</div>
                    <div style="color:#9B97B2;font-size:0.85rem;margin-bottom:12px">by You · Nearby</div>
                    <div style="display:flex;justify-content:center;gap:16px">
                        <div style="text-align:center"><div style="color:#00C9A7;font-weight:800;font-size:1.1rem">₹${parseInt(price || 0).toLocaleString('en-IN')}/day</div><div style="font-size:0.75rem;color:#9B97B2">Rental</div></div>
                        <div style="text-align:center"><div style="font-weight:700">₹${parseInt(deposit || 0).toLocaleString('en-IN')}</div><div style="font-size:0.75rem;color:#9B97B2">Deposit</div></div>
                    </div>
                    <div style="margin-top:16px"><span style="background:rgba(0,201,167,0.15);color:#00C9A7;padding:4px 12px;border-radius:50px;font-size:0.75rem;font-weight:700">✅ Available</span></div>
                </div>`;
        }
    }
    document.querySelectorAll('#listToolForm input, #listToolForm select, #listToolForm textarea').forEach(el => {
        el.addEventListener('input', updatePreview);
    });
    updatePreview();

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('lt-title').value;
            const price = parseInt(document.getElementById('lt-price').value);
            const deposit = parseInt(document.getElementById('lt-deposit').value);
            const category = document.getElementById('lt-category').value;
            const location = document.getElementById('lt-location')?.value || 'Mumbai';
            const ICONS = { 'power-tools': '🔧', 'garden': '🌿', 'home': '🏠', 'cleaning': '🧹', 'construction': '🔨', 'vehicles': '🚗', 'electronics': '💻', 'sports': '⚽' };

            const user = getUser();
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = '📤 Publishing...'; submitBtn.disabled = true;

            if (user && isLoggedIn()) {
                try {
                    const data = await apiPost('/api/items', {
                        ownerId: user.user_id, title, price, deposit, category, icon: ICONS[category] || '🔧',
                        description: `${title} for rent. ${location}`, lat: 19.076 + (Math.random() - 0.5) * 0.02, lon: 72.877 + (Math.random() - 0.5) * 0.02
                    });
                    if (data.item) {
                        submitBtn.textContent = '🎉 Listing Published!';
                        submitBtn.style.background = 'linear-gradient(135deg,#00C9A7,#00A88A)';
                        showToast(`${title} listed successfully! 🎉`);
                        setTimeout(() => window.location.href = 'dashboard.html', 2000);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to publish listing:', e);
                    submitBtn.textContent = '❌ Error publishing!';
                    submitBtn.style.background = '#e74c3c';
                    showToast(`Error: Could not save to database. Please refresh and try again.`, true);
                    setTimeout(() => {
                        submitBtn.textContent = 'Publish Listing →';
                        submitBtn.disabled = false;
                        submitBtn.style.background = 'linear-gradient(135deg,#6C63FF,#5A52D5)';
                    }, 3000);
                    return;
                }
            } else {
                // Fallback if not logged in
                submitBtn.textContent = '❌ Please Log In!';
                submitBtn.style.background = '#e74c3c';
                showToast(`You must be logged in to list a tool.`);
                setTimeout(() => window.location.href = 'login.html', 2000);
            }
        });
    }
}

// ===== ADMIN PAGE =====
async function initAdminPage() {
    // GUARD: Only admins can access this page
    const token = getToken();
    const user = getUser();
    if (!token || !user || user.role !== 'admin') {
        document.body.innerHTML = `
            <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0E0C1A;font-family:Outfit,sans-serif">
                <div style="text-align:center;max-width:400px;padding:40px">
                    <div style="font-size:4rem;margin-bottom:16px">🛡️</div>
                    <h2 style="color:#fff;margin-bottom:8px">Admin Access Only</h2>
                    <p style="color:#9B97B2;margin-bottom:24px">You must be logged in as an administrator to access this page.</p>
                    <a href="login.html" style="background:linear-gradient(135deg,#6C63FF,#00C9A7);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700">Login as Admin →</a>
                </div>
            </div>`;
        return;
    }

    // Fetch real stats from backend
    let stats = { totalUsers: 0, totalListings: 0, activeRentals: 0, totalRevenue: 0, escrowAmount: 0 };
    let adminUsers = [], adminListings = [], adminTransactions = [];

    try {
        const [statsRes, usersRes, listingsRes, txRes] = await Promise.all([
            apiGet('/api/admin/stats'),
            apiGet('/api/admin/users'),
            apiGet('/api/admin/listings'),
            apiGet('/api/admin/transactions'),
        ]);
        stats = statsRes;
        adminUsers = usersRes.users || [];
        adminListings = listingsRes.listings || [];
        adminTransactions = txRes.transactions || [];
    } catch (e) {
        console.warn('Admin data fetch failed, using fallback');
    }

    // Update stat cards
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('adminTotalUsers', stats.totalUsers || adminUsers.length);
    set('adminTotalListings', stats.totalListings || adminListings.length);
    set('adminTotalRevenue', `₹${(stats.totalRevenue || 41000).toLocaleString('en-IN')}`);
    set('adminActiveRentals', stats.activeRentals || 3);

    // Render users table
    function renderUsers(filter) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;
        let users = adminUsers.filter(u => u.role !== 'admin');
        if (filter === 'active') users = users.filter(u => u.is_verified == 1);
        if (filter === 'inactive') users = users.filter(u => u.is_verified == 0);
        tbody.innerHTML = users.map(u => `
            <tr>
                <td><div style="display:flex;align-items:center;gap:10px">
                    <div style="width:36px;height:36px;background:var(--gradient);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0">${u.name[0]}</div>
                    <div><div style="font-weight:600">${u.name}</div><div style="font-size:0.78rem;color:#9B97B2">${u.email}</div></div>
                </div></td>
                <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
                <td style="font-weight:600">${u.listing_count || 0}</td>
                <td>${u.rental_count || 0}</td>
                <td style="color:#00C9A7;font-weight:700">₹${((u.listing_count || 0) * 1200).toLocaleString('en-IN')}</td>
                <td>⭐ ${u.rating_avg || 4.8}</td>
                <td><span class="status-dot ${u.is_verified ? 'dot-active' : 'dot-inactive'}"></span>${u.is_verified ? 'active' : 'suspended'}</td>
                <td style="color:#9B97B2;font-size:0.82rem">${u.created_at?.split('T')[0] || u.created_at?.split(' ')[0] || '—'}</td>
                <td>
                    <button class="btn-sm btn-sm-primary" onclick="showToast('Viewing ${u.name}')">View</button>
                    <button class="btn-sm ${u.is_verified ? 'btn-sm-danger' : 'btn-sm-green'}" onclick="toggleUserStatus(${u.user_id}, ${u.is_verified})" style="margin-left:4px">
                        ${u.is_verified ? 'Suspend' : 'Activate'}
                    </button>
                </td>
            </tr>`).join('');
    }

    function renderListings(filter) {
        const tbody = document.getElementById('listingsTableBody');
        if (!tbody) return;
        let listings = adminListings;
        if (filter !== 'all') listings = listings.filter(l => l.status?.toLowerCase() === filter);
        tbody.innerHTML = listings.map(l => `
            <tr>
                <td><div style="display:flex;align-items:center;gap:10px">
                    <span style="font-size:1.4rem">${l.icon || '🔧'}</span>
                    <span style="font-weight:600">${l.title}</span>
                </div></td>
                <td>${l.owner_name}</td>
                <td style="color:#00C9A7;font-weight:700">₹${l.price_per_day}/day</td>
                <td style="color:#9B97B2">₹${l.deposit_amount}</td>
                <td>${l.category || 'Tools'}</td>
                <td style="font-weight:600">${l.booking_count || 0}</td>
                <td><span class="listing-status-badge lst-${l.status?.toLowerCase() || 'available'}">${l.status || 'Available'}</span></td>
                <td style="color:#9B97B2;font-size:0.82rem">${l.created_at?.split('T')[0] || l.created_at?.split(' ')[0] || '—'}</td>
                <td>
                    <button class="btn-sm btn-sm-primary" onclick="showToast('Viewing: ${l.title}')">View</button>
                    <button class="btn-sm btn-sm-danger" onclick="showToast('${l.title} flagged')" style="margin-left:4px">Flag</button>
                </td>
            </tr>`).join('');
    }

    renderUsers('all');
    renderListings('all');

    document.querySelectorAll('[data-user-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-user-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderUsers(btn.dataset.userFilter);
        });
    });
    document.querySelectorAll('[data-listing-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-listing-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderListings(btn.dataset.listingFilter);
        });
    });

    const adminNavLinks = document.querySelectorAll('.admin-nav-link');
    const adminPanels = document.querySelectorAll('.admin-panel');
    adminNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            adminNavLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            adminPanels.forEach(p => p.style.display = 'none');
            const target = document.getElementById(link.dataset.panel);
            if (target) target.style.display = 'block';
        });
    });

    document.getElementById('userSearch')?.addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#usersTableBody tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });

    // Logout
    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
        clearSession(); window.location.href = 'login.html';
    });
}

window.toggleUserStatus = async function (id, currentStatus) {
    const newStatus = currentStatus ? 0 : 1;
    await apiPatch(`/api/admin/users/${id}/status`, { is_verified: newStatus });
    showToast(`User ${newStatus ? 'activated' : 'suspended'} successfully`);
    // Re-render
    document.querySelector('[data-user-filter].active')?.click();
};

// ===== PAGE DETECTION & INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    const page = document.body.dataset.page;
    switch (page) {
        case 'home': await initHomePage(); break;
        case 'discover': await initDiscoverPage(); break;
        case 'item': await initItemPage(); break;
        case 'dashboard': initDashboardPage(); break;
        case 'chat': await initChatPage(); break;
        case 'login': await initLoginPage(); break;
        case 'list-tool': initListToolPage(); break;
        case 'admin': await initAdminPage(); break;
    }

    if (isLoggedIn()) {
        const user = getUser();
        document.querySelectorAll('.nav-cta a[href="login.html"], .mobile-menu a[href="login.html"]').forEach(btn => {
            btn.href = 'dashboard.html';
            btn.innerHTML = `👤 ${user.name.split(' ')[0]}`;
        });
    }

    initReveal();
});
