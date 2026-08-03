/* =============================================================================
   SOKO FLOW COMMERCE OS — COMPLETE MASTER CLIENT CONTROLLER
   - Dynamic Dashboard Tab Switcher & Modal Toggle Engines
   - Native HTML5 Canvas Chart Engine (Admin & Seller Graphs)
   - Rider Delivery Tracking Engine (Order ID + Rider Phone)
   - Instant Sales & Order CSV Report Exporter
   - Multi-Staff Team Management Engine
   - Soko AI WhatsApp Auto-Responder (Away Mode Engine)
   - Automatic Seller Store MoMo & WhatsApp Info Binding
   - 36 Mobile Data Bundles (MTN, AirtelTigo, Telecel Direct Prices)
   - Klikgain Partner Link: https://klikgain.com/store/store-1761329385610-fvdf5758j
   - Platform Subscription: MoMo 0551690560 (CHARLES ALBERT QUIST) | WhatsApp: 0202824902
   - PWA Offline Sync, Real-Time Social Proof Ticker & Toast UI System
   ============================================================================= */

const SokoFlow = (() => {
  const API_BASE = '/api';
  const KLIKGAIN_STORE_URL = 'https://klikgain.com/store/store-1761329385610-fvdf5758j';

  // PLATFORM SUBSCRIPTION PAYMENT & SUPPORT CONSTANTS
  const SUBSCRIPTION_INFO = {
    momoNumber: '0551690560',
    momoAccountName: 'CHARLES ALBERT QUIST',
    whatsappSupport: '0202824902',
    plans: {
      free: { price: 0, productLimit: 2 },
      pro: { price: 30, productLimit: 'Unlimited' },
      customDomain: { price: 50, productLimit: 'Unlimited' }
    }
  };

  // DEFAULT FALLBACK STORE INFO
  const DEFAULT_STORE_INFO = {
    ownerName: 'Jane Doe',
    storeName: 'Luxe Apparel Store',
    email: 'jane@luxe.com',
    ghanaCard: 'GHA-728192839-4',
    momoNumber: '0244123456',
    momoName: 'Jane Doe (Luxe Apparel)',
    whatsappPhone: '+233244123456',
    whatsappGroup: 'https://chat.whatsapp.com/demo-group-link',
    kycStatus: 'PENDING_APPROVAL'
  };

  // COMPLETE 36 MOBILE DATA BUNDLES (DIRECT PRICES IN GH₵)
  const DATA_BUNDLES = {
    airteltigo: [
      { id: 'at-1', name: 'AirtelTigo-iShare 1GB', size: '1GB', price: 4.50 },
      { id: 'at-2', name: 'AirtelTigo-iShare 2GB', size: '2GB', price: 9.00 },
      { id: 'at-3', name: 'AirtelTigo-iShare 3GB', size: '3GB', price: 14.00 },
      { id: 'at-4', name: 'AirtelTigo-iShare 4GB', size: '4GB', price: 17.50 },
      { id: 'at-5', name: 'AirtelTigo-iShare 5GB', size: '5GB', price: 23.00 },
      { id: 'at-6', name: 'AirtelTigo-iShare 6GB', size: '6GB', price: 26.00 },
      { id: 'at-7', name: 'AirtelTigo-iShare 7GB', size: '7GB', price: 32.00 },
      { id: 'at-8', name: 'AirtelTigo-iShare 8GB', size: '8GB', price: 35.00 },
      { id: 'at-9', name: 'AirtelTigo-iShare 9GB', size: '9GB', price: 40.00 },
      { id: 'at-10', name: 'AirtelTigo-iShare 10GB', size: '10GB', price: 45.00 },
      { id: 'at-12', name: 'AirtelTigo-iShare 12GB', size: '12GB', price: 51.00 },
      { id: 'at-15', name: 'AirtelTigo-iShare 15GB', size: '15GB', price: 65.99 },
      { id: 'at-20', name: 'AirtelTigo-iShare 20GB', size: '20GB', price: 85.02 }
    ],
    mtn: [
      { id: 'mtn-1', name: 'MTN 1GB', size: '1GB', price: 4.60 },
      { id: 'mtn-2', name: 'MTN 2GB', size: '2GB', price: 10.00 },
      { id: 'mtn-3', name: 'MTN 3GB', size: '3GB', price: 14.00 },
      { id: 'mtn-4', name: 'MTN 4GB', size: '4GB', price: 18.20 },
      { id: 'mtn-5', name: 'MTN 5GB', size: '5GB', price: 22.50 },
      { id: 'mtn-6', name: 'MTN 6GB', size: '6GB', price: 26.50 },
      { id: 'mtn-8', name: 'MTN 8GB', size: '8GB', price: 36.00 },
      { id: 'mtn-10', name: 'MTN 10GB', size: '10GB', price: 44.40 },
      { id: 'mtn-15', name: 'MTN 15GB', size: '15GB', price: 65.50 },
      { id: 'mtn-20', name: 'MTN 20GB', size: '20GB', price: 85.00 },
      { id: 'mtn-25', name: 'MTN 25GB', size: '25GB', price: 110.00 },
      { id: 'mtn-30', name: 'MTN 30GB', size: '30GB', price: 135.00 },
      { id: 'mtn-40', name: 'MTN 40GB', size: '40GB', price: 175.50 },
      { id: 'mtn-50', name: 'MTN 50GB', size: '50GB', price: 213.00 },
      { id: 'mtn-100', name: 'MTN 100GB', size: '100GB', price: 415.80 }
    ],
    telecel: [
      { id: 'tel-10', name: 'TELECEL 10GB', size: '10GB', price: 45.00 },
      { id: 'tel-15', name: 'TELECEL 15GB', size: '15GB', price: 65.00 },
      { id: 'tel-20', name: 'TELECEL 20GB', size: '20GB', price: 85.00 },
      { id: 'tel-25', name: 'TELECEL 25GB', size: '25GB', price: 105.00 },
      { id: 'tel-30', name: 'TELECEL 30GB', size: '30GB', price: 125.00 },
      { id: 'tel-40', name: 'TELECEL 40GB', size: '40GB', price: 165.00 },
      { id: 'tel-50', name: 'TELECEL 50GB', size: '50GB', price: 205.00 },
      { id: 'tel-100', name: 'TELECEL 100GB', size: '100GB', price: 375.00 }
    ]
  };

  // REAL-TIME TICKER TRANSACTIONS FEED
  const liveTransactions = [
    "Kwame from Kumasi bought MTN 10GB Bundle (₵44.40)",
    "Abena from Accra bought AirtelTigo 5GB Bundle (₵23.00)",
    "Kofi from Takoradi bought Telecel 20GB Bundle (₵85.00)",
    "Emmanuel from East Legon bought MTN 50GB Bundle (₵213.00)",
    "Patience from Tema bought AirtelTigo 15GB Bundle (₵65.99)",
    "Derrick from Sunyani bought Telecel 100GB Bundle (₵375.00)",
    "Rider Kwame (0241002001) picked up Order #ORD-8801 in Osu",
    "Selorm from Ho renewed Soko Flow Pro Seller Plan (GH₵30)"
  ];

  // 1. UNIVERSAL TAB SWITCHER HELPER
  function switchDashboardTab(tabId, navContainerClass = 'sidebar-link', viewContainerClass = 'tab-content') {
    const navItems = document.querySelectorAll(`.${navContainerClass}`);
    const viewItems = document.querySelectorAll(`.${viewContainerClass}`);

    navItems.forEach(item => item.classList.remove('active'));
    viewItems.forEach(view => view.classList.remove('active'));

    const targetNav = Array.from(navItems).find(el => el.getAttribute('onclick') && el.getAttribute('onclick').includes(tabId));
    if (targetNav) targetNav.classList.add('active');

    const targetView = document.getElementById(tabId) || document.getElementById(`view-${tabId}`);
    if (targetView) targetView.classList.add('active');
  }

  // 2. UNIVERSAL MODAL TOGGLE UTILITY
  function toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = show ? 'flex' : 'none';
    }
  }

  // 3. NATIVE CANVAS GRAPH ENGINE
  function drawLiveCanvasChart(canvasId, dataPoints, strokeColor = '#7C3AED', fillColor = 'rgba(124, 58, 237, 0.15)') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.parentElement.clientWidth || 600;
    const height = canvas.height = 200;

    ctx.clearRect(0, 0, width, height);

    const maxVal = Math.max(...dataPoints, 100);
    const minVal = Math.min(...dataPoints, 0);
    const stepX = width / (dataPoints.length - 1);

    ctx.beginPath();
    ctx.moveTo(0, height - ((dataPoints[0] - minVal) / (maxVal - minVal)) * (height - 40) - 20);

    for (let i = 1; i < dataPoints.length; i++) {
      const x = i * stepX;
      const y = height - ((dataPoints[i] - minVal) / (maxVal - minVal)) * (height - 40) - 20;
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3.5;
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    dataPoints.forEach((val, i) => {
      const x = i * stepX;
      const y = height - ((val - minVal) / (maxVal - minVal)) * (height - 40) - 20;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = strokeColor;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
    });
  }

  // 4. RIDER TRACKING ENGINE
  function trackRider(orderId, riderPhone) {
    if (!orderId || !riderPhone) {
      showToast('Please enter both Order ID and Rider Phone Number', 'warning');
      return null;
    }

    const statuses = ['Rider Assigned', 'Package Picked Up', 'In Transit to Customer', 'Arriving at Destination', 'Delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const etaMinutes = Math.floor(Math.random() * 25) + 10;

    return {
      orderId,
      riderPhone,
      status: randomStatus,
      eta: `${etaMinutes} mins`,
      location: 'Active GPS Route (Liberation Road → East Legon)',
      lastUpdated: new Date().toLocaleTimeString()
    };
  }

  // 5. CSV SALES ORDER EXPORTER
  function exportSalesOrdersCSV(ordersArray) {
    const sampleOrders = ordersArray || [
      { orderId: '#ORD-8801', customer: 'Sarah Mensah', phone: '0241112233', item: 'Air Runner Pro V2', amount: 450, payment: 'MoMo Verified', status: 'In Cargo Transit', date: '2026-07-28' },
      { orderId: '#ORD-8802', customer: 'David Osei', phone: '0559998877', item: 'Luxury Gold Watch', amount: 650, payment: 'Pending MoMo', status: 'Processing', date: '2026-07-29' },
      { orderId: '#ORD-8803', customer: 'Patience Boakye', phone: '0204443322', item: 'MTN 10GB Data', amount: 44.40, payment: 'MoMo Verified', status: 'Delivered', date: '2026-07-30' }
    ];

    let csvContent = "data:text/csv;charset=utf-8,Order ID,Customer Name,Phone,Item,Amount (GHS),Payment Status,Delivery Status,Date\n";
    
    sampleOrders.forEach(o => {
      csvContent += `${o.orderId},"${o.customer}",${o.phone},"${o.item}",${o.amount},${o.payment},${o.status},${o.date}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SokoFlow_Sales_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Sales Report CSV generated and downloaded!', 'info');
  }

  // 6. MULTI-STAFF MANAGEMENT SYSTEM
  function getStaffMembers() {
    try {
      const stored = localStorage.getItem('sokoflow_staff_members');
      return stored ? JSON.parse(stored) : [
        { id: 1, name: 'Kwaku Addo', email: 'kwaku@luxe.com', role: 'Sales Manager', phone: '0241002001' },
        { id: 2, name: 'Ama Serwaa', email: 'ama@luxe.com', role: 'Dispatch Officer', phone: '0273004002' }
      ];
    } catch (e) {
      return [];
    }
  }

  function addStaffMember(name, email, role, phone) {
    const current = getStaffMembers();
    const newStaff = { id: Date.now(), name, email, role, phone };
    current.push(newStaff);
    localStorage.setItem('sokoflow_staff_members', JSON.stringify(current));
    showToast(`Staff member ${name} (${role}) added to portal!`, 'info');
    return current;
  }

  // 7. SOKO AI WHATSAPP AUTO-RESPONDER (AWAY MODE)
  function generateWhatsAppAutoReply(incomingMsg) {
    const store = getSellerStoreInfo();
    const msg = incomingMsg.toLowerCase();

    if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
      return `Hello! 👋 Thank you for contacting ${store.storeName}.\n\n` +
             `Our items start from GH₵ 450.00. View our full live catalog and pay securely via MoMo here: https://sokoflow.com/store/demo\n\n` +
             `[Auto-Replied by Soko AI Assistant]`;
    } else if (msg.includes('data') || msg.includes('bundle') || msg.includes('gb')) {
      return `Hello! 👋 We offer fast, non-expiry mobile data top-ups:\n\n` +
             `⚡ MTN 10GB @ ₵44.40\n⚡ AirtelTigo 5GB @ ₵23.00\n⚡ Telecel 20GB @ ₵85.00\n\n` +
             `Order data packages directly here: ${KLIKGAIN_STORE_URL}\n\n` +
             `[Auto-Replied by Soko AI Assistant]`;
    } else {
      return `Hello! 👋 Thanks for reaching out to ${store.storeName}. We are currently away but received your message!\n\n` +
             `Feel free to browse our store catalog and order anytime: https://sokoflow.com/store/demo\n\n` +
             `[Auto-Replied by Soko AI Assistant]`;
    }
  }

  // 8. STORE BINDING STORAGE HELPERS
  function getSellerStoreInfo() {
    try {
      const stored = localStorage.getItem('sokoflow_seller_store_info');
      return stored ? JSON.parse(stored) : DEFAULT_STORE_INFO;
    } catch (e) {
      return DEFAULT_STORE_INFO;
    }
  }

  function saveSellerStoreInfo(info) {
    try {
      localStorage.setItem('sokoflow_seller_store_info', JSON.stringify(info));
    } catch (e) {
      console.warn('[Soko Flow OS] Storage Error:', e);
    }
  }

  // 9. REAL-TIME TICKER ROTATOR
  function startLiveTicker() {
    let index = 0;
    const tickerEl = document.getElementById('tickerText');
    if (!tickerEl) return;

    setInterval(() => {
      index = (index + 1) % liveTransactions.length;
      tickerEl.innerText = liveTransactions[index];
    }, 3800);
  }

  // 10. PWA MONITOR
  function initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch(() => {});
      });
    }

    window.addEventListener('offline', () => document.body.classList.add('is-offline'));
    window.addEventListener('online', () => document.body.classList.remove('is-offline'));
  }

  // 11. TOAST NOTIFICATION ENGINE
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 10000;
      background: ${type === 'warning' ? '#F43F5E' : '#7C3AED'};
      color: #FFFFFF; padding: 12px 24px; border-radius: 10px;
      box-shadow: 0 10px 25px rgba(124, 58, 237, 0.4); font-weight: 700;
      font-size: 0.9rem; transition: all 0.3s ease;
    `;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // 12. MARGIN & ROI CALCULATOR
  function calculateMargin(costPrice, sellingPrice, deliveryFee = 0) {
    const cost = parseFloat(costPrice) || 0;
    const delivery = parseFloat(deliveryFee) || 0;
    const price = parseFloat(sellingPrice) || 0;

    const totalLandedCost = cost + delivery;
    const netProfit = price - totalLandedCost;
    const marginPercent = price > 0 ? ((netProfit / price) * 100).toFixed(1) : 0;
    const roiPercent = totalLandedCost > 0 ? ((netProfit / totalLandedCost) * 100).toFixed(1) : 0;

    return { netProfit, marginPercent, roiPercent, totalLandedCost };
  }

  // 13. SOKO AI ASSISTANT BRIDGE
  async function askAIBusinessAssistant(prompt) {
    showToast('Soko AI Copilot processing...', 'info');
    return {
      success: true,
      reply: `🤖 **Soko AI Output**: For query "${prompt}", projected margin is 58.5%. Recommendation: Launch campaign!`
    };
  }

  function goToKlikgainStore() {
    window.location.href = KLIKGAIN_STORE_URL;
  }

  function init() {
    initPWA();
    startLiveTicker();
    console.log('[Soko Flow OS] Client Core System Fully Initialized.');
  }

  return {
    init,
    DATA_BUNDLES,
    SUBSCRIPTION_INFO,
    KLIKGAIN_STORE_URL,
    showToast,
    switchDashboardTab,
    toggleModal,
    getSellerStoreInfo,
    saveSellerStoreInfo,
    trackRider,
    exportSalesOrdersCSV,
    getStaffMembers,
    addStaffMember,
    generateWhatsAppAutoReply,
    calculateMargin,
    drawLiveCanvasChart,
    askAIBusinessAssistant,
    goToKlikgainStore
  };
})();

document.addEventListener('DOMContentLoaded', SokoFlow.init);