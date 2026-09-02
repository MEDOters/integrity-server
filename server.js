const express = require("express");
const path = require("path");

const app = express();

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

let data = {
    username: "في انتظار البيانات",
    pc_name: "في انتظار البيانات",
    os: "في انتظار البيانات",
    cpu: "في انتظار البيانات",
    ram: "في انتظار البيانات",
    mac: "في انتظار البيانات",
    public_ip: "في انتظار البيانات",
    hwid: "في انتظار البيانات",
    is_vm: false
};

let expectedMD5 = "";

function checkAuth(req) {
    const auth = req.headers.authorization;
    return auth === ADMIN_TOKEN || auth === `Bearer ${ADMIN_TOKEN}`;
}

// ===== Integrity =====
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

// ===== System Info =====
app.post("/api/system-info", (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    data = { ...req.body, received_at: new Date().toISOString() };
    res.json({ success: true, data });
});

app.get("/api/system-info", (req, res) => {
    res.json(data);
});

app.delete("/api/system-info", (req, res) => {
    if (!checkAuth(req)) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    data = { username: "تم المسح" };
    res.json({ success: true });
});

// ===== Pages =====
app.get("/system-info", (req, res) => {
    res.sendFile(path.join(__dirname, "system-info.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/test", (req, res) => {
    res.json({ status: "ok", message: "السيرفر يعمل! 🚀" });
});

app.get("/", (req, res) => {
    res.send(`
        <h1>🚀 Integrity Server</h1>
        <ul>
            <li><a href="/system-info">📊 معلومات النظام</a></li>
            <li><a href="/api/system-info">📡 API</a></li>
            <li><a href="/test">🧪 اختبار</a></li>
            <li><a href="/admin">🔐 لوحة التحكم</a></li>
        </ul>
        <p>Token: <code>medo123</code></p>
    `);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
});
