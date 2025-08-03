require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Multer memory storage (dosyayı geçici bellekte tutacağız)
const upload = multer({ storage: multer.memoryStorage() });

// Auth middleware
function auth(req, res, next) {
  if (req.cookies.kullanici) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Register endpoint
app.post('/register', async (req, res) => {
  const { first_name, last_name, password } = req.body;

  if (!first_name || !last_name || !password) {
    return res.status(400).send('Eksik bilgi!');
  }

  // Şifreyi hashle
  const password_hash = await bcrypt.hash(password, 10);

  // Supabase'e kaydet
  const { data, error } = await supabase
    .from('users')
    .insert([{ first_name, last_name, password_hash }]);

  if (error) {
    console.error(error);
    return res.status(500).send('Kayıt sırasında hata oluştu!');
  }

  res.send('Kayıt başarılı! <a href="/login.html">Giriş yap</a>');
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { first_name, last_name, password } = req.body;

  // Kullanıcıyı bul
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('first_name', first_name)
    .eq('last_name', last_name);

  if (error || users.length === 0) {
    return res.send('Hatalı giriş! <a href="/login.html">Tekrar dene</a>');
  }

  const user = users[0];

  // Şifre kontrol
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.send('Hatalı şifre! <a href="/login.html">Tekrar dene</a>');
  }

  // Cookie ata
  res.cookie('kullanici', `${first_name} ${last_name}`, { maxAge: 3600000 });
  res.redirect('/');
});

// Ana sayfa
app.get('/', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Upload sayfası
app.get('/upload.html', auth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/upload.html'));
});

// Upload endpoint (Supabase Storage)
app.post('/upload', auth, upload.single('media'), async (req, res) => {
  const file = req.file;
  const fileExt = path.extname(file.originalname);
  const fileName = `${Date.now()}${fileExt}`;

  // Supabase Storage'a yükle
  const { data, error } = await supabase.storage
    .from('uploads') // storage bucket adı "uploads" olmalı
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    console.error(error);
    return res.status(500).send('Dosya yüklenemedi!');
  }

  // Public URL oluştur
  const { data: publicData } = supabase.storage
    .from('uploads')
    .getPublicUrl(fileName);

  // Yüklenen dosya bilgisi
  console.log('Yüklendi:', publicData.publicUrl);

  res.redirect('/');
});

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('kullanici');
  res.redirect('/login.html');
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Site çalışıyor: http://localhost:${PORT}`);
});



