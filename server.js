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

// Supabase bağlantısı
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Upload klasörü
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const upload = multer({ dest: 'uploads/' });

function auth(req, res, next) {
  if (req.cookies.kullanici) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

// Kayıt
app.post('/register', async (req, res) => {
  const { ad, soyad, sifre } = req.body;

  const hashedPassword = await bcrypt.hash(sifre, 10);

  const { error } = await supabase
    .from('users')
    .insert([{ ad, soyad, sifre: hashedPassword }]);

  if (error) {
    console.error(error);
    res.send('Kayıt hatası!');
  } else {
    res.redirect('/login.html');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { ad, soyad, sifre } = req.body;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('ad', ad)
    .eq('soyad', soyad)
    .single();

  if (error || !data) {
    return res.send('Kullanıcı bulunamadı! <a href="/login.html">Tekrar dene</a>');
  }

  const match = await bcrypt.compare(sifre, data.sifre);

  if (match) {
    res.cookie('kullanici', `${ad} ${soyad}`, { maxAge: 3600000 });
    res.redirect('/');
  } else {
    res.send('Hatalı şifre! <a href="/login.html">Tekrar dene</a>');
  }
});

app.get('/', auth, (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/upload.html', auth, (req, res) => {
  res.sendFile(__dirname + '/public/upload.html');
});

app.post('/upload', auth, upload.single('media'), async (req, res) => {
  const file = req.file;
  const ext = path.extname(file.originalname);
  const newName = `${file.filename}${ext}`;
  const newPath = path.join('uploads', newName);
  fs.renameSync(file.path, newPath);

  // Supabase'e kayıt at (dosyaları localde tutuyoruz)
  const { error } = await supabase.from('uploads').insert([
    {
      url: `/uploads/${newName}`,
      type: file.mimetype,
      ekleyen: req.cookies.kullanici,
      date: new Date().toISOString()
    }
  ]);

  if (error) {
    console.error(error);
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




