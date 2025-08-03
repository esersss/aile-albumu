const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Upload klasörünü oluştur (recursive ile hata çözümü)
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// Multer ayarı
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Basit veritabanı (JSON dosyası)
const USERS_FILE = path.join(__dirname, 'users.json');

// Kullanıcıları oku
function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE));
}

// Kullanıcıları kaydet
function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Kayıt olma endpoint
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).send('Kullanıcı zaten var.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword });
    saveUsers(users);

    res.send('Kayıt başarılı.');
});

// Giriş yapma endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(400).send('Kullanıcı bulunamadı.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        return res.status(400).send('Hatalı şifre.');
    }

    res.send('Giriş başarılı.');
});

// Fotoğraf yükleme endpoint
app.post('/upload', upload.single('photo'), (req, res) => {
    res.send('Fotoğraf yüklendi: ' + req.file.filename);
});

// HTML dosyaları
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});

