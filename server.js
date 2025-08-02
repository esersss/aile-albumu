const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Uploads klasörü yolu
const uploadDir = path.join(__dirname, 'uploads');

// Klasör oluşturma (varsa hata vermesin)
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('uploads klasörü oluşturuldu.');
  } else {
    console.log('uploads klasörü zaten var.');
  }
} catch (err) {
  console.error('Uploads klasörü oluşturulamadı:', err);
}

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// users.json dosyası varsa oku
let users = [];
try {
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  }
} catch (err) {
  console.error('users.json okunamadı:', err);
}

let memoryList = [];
try {
  if (fs.existsSync('data.json')) {
    memoryList = JSON.parse(fs.readFileSync('data.json', 'utf8'));
  }
} catch (err) {
  console.error('data.json okunamadı:', err);
}

const upload = multer({ dest: 'uploads/' });

function auth(req, res, next) {
  if (req.cookies.kullanici) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

app.post('/login', (req, res) => {
  const { ad, soyad, sifre } = req.body;
  const user = users.find(
    u => u.ad === ad && u.soyad === soyad && u.sifre === sifre
  );
  if (user) {
    res.cookie('kullanici', `${ad} ${soyad}`, { maxAge: 3600000 });
    res.redirect('/');
  } else {
    res.send('Hatalı giriş! <a href="/login.html">Tekrar dene</a>');
  }
});

app.get('/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/upload.html', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/upload.html'));
});

app.get('/data', auth, (req, res) => {
  res.json(memoryList);
});

app.post('/upload', auth, upload.single('media'), (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname);
  const newName = `${file.filename}${ext}`;
  const newPath = path.join('uploads', newName);

  try {
    fs.renameSync(file.path, newPath);
  } catch (err) {
    console.error('Dosya taşınamadı:', err);
  }

  const item = {
    url: `/uploads/${newName}`,
    type: file.mimetype,
    ekleyen: req.cookies.kullanici,
    date: new Date()
  };

  memoryList.push(item);

  try {
    fs.writeFileSync('data.json', JSON.stringify(memoryList, null, 2));
  } catch (err) {
    console.error('data.json kaydedilemedi:', err);
  }

  res.redirect('/');
});

app.get('/logout', (req, res) => {
  res.clearCookie('kullanici');
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`Site çalışıyor: http://localhost:${PORT}`);
});

