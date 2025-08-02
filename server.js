

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Statik dosyalar
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Orta katmanlar
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Kullanıcılar ve veriler
const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));
let memoryList = fs.existsSync('data.json')
  ? JSON.parse(fs.readFileSync('data.json', 'utf-8'))
  : [];

const upload = multer({ dest: 'uploads/' });

// Basit auth kontrolü
function auth(req, res, next) {
  if (req.cookies && req.cookies.kullanici) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Login
app.post('/login', (req, res) => {
  const { ad, soyad, sifre } = req.body;
  const user = users.find(
    u => u.ad === ad && u.soyad === soyad && u.sifre === sifre
  );

  if (user) {
    res.cookie('kullanici', `${ad} ${soyad}`, { maxAge: 3600000, httpOnly: true });
    res.redirect('/');
  } else {
    res.status(401).send('Hatalı giriş! <a href="/login.html">Tekrar dene</a>');
  }
});

// Ana sayfa
app.get('/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Upload sayfası
app.get('/upload.html', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// Verileri getir
app.get('/data', auth, (req, res) => {
  res.json(memoryList);
});

// Dosya yükleme
app.post('/upload', auth, upload.single('media'), (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname);
  const newName = `${file.filename}${ext}`;
  const newPath = path.join('uploads', newName);

  fs.renameSync(file.path, newPath);

  const item = {
    url: `/uploads/${newName}`,
    type: file.mimetype,
    ekleyen: req.cookies.kullanici,
    date: new Date()
  };

  memoryList.push(item);
  fs.writeFileSync('data.json', JSON.stringify(memoryList, null, 2));

  res.redirect('/');
});

// Çıkış
app.get('/logout', (req, res) => {
  res.clearCookie('kullanici');
  res.redirect('/login.html');
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Site çalışıyor: http://localhost:${PORT}`);
});

