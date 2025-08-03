const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Uploads klasörü kontrolü
const uploadDir = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('uploads klasörü oluşturuldu.');
    } else {
        console.log('uploads klasörü zaten var.');
    }
} catch (err) {
    console.error('Klasör kontrolü hatası:', err);
}

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

// Basit JSON kullanıcı "veritabanı"
const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    if (users.find(u => u.username === username)) {
        return res.status(400).send('Kullanıcı zaten var.');
    }

    const hashed = await bcrypt.hash(password, 10);
    users.push({ username, password: hashed });
    saveUsers(users);

    res.send('Kayıt başarılı.');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).send('Kullanıcı bulunamadı.');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).send('Hatalı şifre.');

    res.send('Giriş başarılı.');
});

app.post('/upload', upload.single('photo'), (req, res) => {
    res.send('Fotoğraf yüklendi: ' + req.file.filename);
});

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


