const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3000;

// Uploads klasörü güvenli oluşturma (recursive ile)
const uploadDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const users = JSON.parse(fs.readFileSync('users.json'));
let memoryList = fs.existsSync('data.json') ? JSON.parse(fs.readFileSync('data.json')) : [];

const upload = multer({ dest: uploadDir });

function auth(req, res, next) {
  if (req.cookies.kullanici) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

app.post('/login', (req, res) => {
  const { ad, soyad, sifre } = req.body;
  const user = users.find(u => u.ad === ad && u.soyad === soyad && u.sifre === sifre);
  if (user) {
    res.cookie('kullanici', `${ad} ${soyad}`, { maxAge: 3600000 });
    res.redirect('/');
  } else {
    res.send('Hatalı giriş! <a href="/login.html">Tekrar dene</a>');
  }
});

app.get('/', auth, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/upload.html', auth, (req, res) => {
  res.sendFile(__dirname + '/public/upload.html');
});

app.get('/data', auth, (req, res) => {
  res.json(memoryList);
});

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

app.get('/logout', (req, res) => {
  res.clearCookie('kullanici');
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`Site çalışıyor: http://localhost:${PORT}`);
});

