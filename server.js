require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase bağlantısı
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Klasör kontrolleri
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Kullanıcılar
const users = JSON.parse(fs.readFileSync('users.json'));
let memoryList = fs.existsSync('data.json')
  ? JSON.parse(fs.readFileSync('data.json'))
  : [];

const upload = multer({ dest: 'uploads/' });

// Giriş kontrolü
function auth(req, res, next) {
  const user = req.cookies.kullanici;
  if (!user) {
    return res.redirect('/login.html');
  }
  next();
}

// Login
app.post('/login', (req, res) => {
  const { ad, soyad, sifre } = req.body;
  const user = users.find(
    (u) => u.ad === ad && u.soyad === soyad && u.sifre === sifre
  );
  if (user) {
    res.cookie('kullanici', `${ad} ${soyad}`, { maxAge: 3600000 });
    res.redirect('/');
  } else {
    res.send('Hatalı giriş! <a href="/login.html">Tekrar dene</a>');
  }
});

// Ana sayfa
app.get('/', auth, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Upload sayfası
app.get('/upload.html', auth, (req, res) => {
  res.sendFile(__dirname + '/public/upload.html');
});

// Data listesi
app.get('/data', auth, (req, res) => {
  res.json(memoryList);
});

// Upload işlemi
app.post('/upload', auth, upload.single('media'), async (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname);
  const newName = `${file.filename}${ext}`;
  const newPath = path.join('uploads', newName);
  fs.renameSync(file.path, newPath);

  try {
    // Supabase'e yükle
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(newName, fs.readFileSync(newPath), {
        contentType: file.mimetype,
      });

    if (error) {
      console.error('Supabase yükleme hatası:', error);
      return res.status(500).send('Yükleme başarısız!');
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/uploads/${newName}`;

    const item = {
      url: publicUrl,
      type: file.mimetype,
      ekleyen: req.cookies.kullanici,
      date: new Date(),
    };

    memoryList.push(item);
    fs.writeFileSync('data.json', JSON.stringify(memoryList, null, 2));
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Bir hata oluştu');
  }
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('kullanici');
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`Site çalışıyor: http://localhost:${PORT}`);
});

