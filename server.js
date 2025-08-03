const express = require("express");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const fs = require("fs");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// uploads klasörünü güvenli bir şekilde oluştur
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Multer ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Basit login sistemi
const PASSWORD = process.env.ADMIN_PASSWORD || "1234";

// Login sayfası
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Login post
app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    res.cookie("auth", "true", { httpOnly: true });
    res.redirect("/");
  } else {
    res.send("Hatalı şifre!");
  }
});

// Auth kontrolü middleware
function checkAuth(req, res, next) {
  if (req.cookies.auth === "true") {
    next();
  } else {
    res.redirect("/login");
  }
}

// Ana sayfa
app.get("/", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Fotoğraf yükleme
app.post("/upload", checkAuth, upload.single("photo"), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("Dosya yüklenemedi");
  }

  // Supabase storage'a yükleme
  const { data, error } = await supabase.storage
    .from("photos")
    .upload(file.filename, fs.createReadStream(file.path), {
      cacheControl: "3600",
      upsert: false,
      contentType: file.mimetype,
    });

  if (error) {
    console.error(error);
    return res.status(500).send("Supabase upload hatası");
  }

  res.send("Fotoğraf başarıyla yüklendi!");
});

// Sunucu başlat
app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});


