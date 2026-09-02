const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const app = express();

// ===== CORS =====
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const ADMIN_TOKEN = "medo123";
const PORT = process.env.PORT || 10000;

// ===== إعداد multer لاستقبال الملفات =====
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ===== التأكد من وجود مجلد screenshots =====
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
}

// ===== التخزين المؤقت =====
let data = {
    username: "في انتظار البيانات",
    pc_name: "في انتظار البيانات",
    os: "في انتظار البيانات",
    cpu: "في انتظار البيانات",
    ram: "في انتظار البيانات",
    mac: "في انتظار البيانات",
    public_ip: "في انتظار البيانات",
    hwid: "في انتظار البيانات",
    is_vm: false,
    received_at: new Date().toISOString()
};

let expectedMD5 = "";

function checkAuth(req) {
    const auth = req.headers.authorization;
    return auth === ADMIN_TOKEN || auth === `Bearer ${ADMIN_TOKEN}`;
}

// ============================================================
// ====== مسار استقبال لقطة الشاشة ======
// ============================================================
app.post("/api/screenshot", upload.single('screenshot'), (req, res) => {
    console.log("📸 POST /api/screenshot");
    
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    
    try {
        const timestamp = Date.now();
        const filename = `screenshot_${timestamp}.png`;
        const filepath = path.join(screenshotsDir, filename);
        
        fs.writeFileSync(filepath, req.file.buffer);
        
        console.log(`✅ تم استقبال لقطة شاشة: ${filename} (${req.file.size} bytes)`);
        res.json({ 
            success: true, 
            message: "تم استقبال لقطة الشاشة",
            filename: filename,
            size: req.file.size
        });
    } catch (error) {
        console.error("❌ خطأ في حفظ الصورة:", error);
        res.status(500).json({ error: error.message });
    }
});

// ===== مسار عرض لقطات الشاشة =====
app.get("/api/screenshots", (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
        const files = fs.readdirSync(screenshotsDir);
        const screenshots = files.map(file => ({
            filename: file,
            url: `/screenshots/${file}`,
            size: fs.statSync(path.join(screenshotsDir, file)).size
        }));
        res.json({ success: true, screenshots });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== خدمة ملفات لقطات الشاشة =====
app.use('/screenshots', express.static(screenshotsDir));

// ============================================================
// ====== مسار الهاش (Integrity) ======
// ============================================================
app.get("/integrity", (req, res) => {
    res.json({ success: true, hash: expectedMD5 || "" });
});

app.post("/integrity", (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    expectedMD5 = req.body.hash?.toLowerCase() || "";
    res.json({ success: true });
});

// ============================================================
// ====== مسارات معلومات النظام ======
// ============================================================
app.post("/api/system-info", (req, res) => {
    console.log("📥 POST /api/system-info");
    
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
        data = { 
            ...req.body, 
            received_at: new Date().toISOString() 
        };
        console.log(`✅ تم استقبال من: ${data.username || 'مجهول'}`);
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/system-info", (req, res) => {
    res.json(data);
});

app.delete("/api/system-info", (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    data = { 
        username: "تم مسح البيانات",
        pc_name: "تم مسح البيانات",
        os: "تم مسح البيانات",
        cpu: "تم مسح البيانات",
        ram: "تم مسح البيانات",
        mac: "تم مسح البيانات",
        public_ip: "تم مسح البيانات",
        hwid: "تم مسح البيانات",
        is_vm: false,
        received_at: new Date().toISOString()
    };
    res.json({ success: true });
});

// ============================================================
// ====== الصفحات ======
// ============================================================
app.get("/system-info", (req, res) => {
    res.sendFile(path.join(__dirname, "system-info.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/test", (req, res) => {
    res.json({ 
        status: "ok", 
        message: "السيرفر يعمل! 🚀",
        time: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>🚀 Integrity Server</title>
            <style>
                body { font-family: Arial; background: #0d0d0d; color: #fff; padding: 30px; }
                h1 { color: #00e676; }
                a { color: #00e676; text-decoration: none; }
                a:hover { text-decoration: underline; }
                .box { background: #1a1a2e; padding: 20px; border-radius: 10px; margin: 10px 0; }
                code { background: #333; padding: 2px 8px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <h1>🚀 Integrity Server</h1>
            <div class="box">
                <h3>📊 الروابط المتاحة:</h3>
                <ul>
                    <li><a href="/system-info">📊 معلومات النظام</a></li>
                    <li><a href="/api/system-info">📡 API</a></li>
                    <li><a href="/test">🧪 اختبار</a></li>
                    <li><a href="/admin">🔐 لوحة التحكم</a></li>
                    <li><a href="/api/screenshots">📸 لقطات الشاشة</a></li>
                </ul>
            </div>
            <div class="box">
                <p>✅ السيرفر يعمل 🚀</p>
                <p>🔑 التوكن: <code>medo123</code></p>
                <p>📸 مجلد اللقطات: <code>${screenshotsDir}</code></p>
            </div>
        </body>
        </html>
    `);
});

// ============================================================
// ====== تشغيل السيرفر ======
// ============================================================
app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 السيرفر يعمل على port ${PORT}`);
    console.log(`📊 /system-info`);
    console.log(`📡 /api/system-info`);
    console.log(`🧪 /test`);
    console.log(`🔐 /admin`);
    console.log(`📸 /api/screenshot (POST)`);
    console.log(`📸 /api/screenshots (GET)\n`);
});
