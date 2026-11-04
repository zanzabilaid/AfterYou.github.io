<p align="center">
  <img src="icon-192.png" alt="AFTERYOU icon" width="120">
</p>

<h1 align="center">AFTERYOU</h1>

<p align="center"><i>Survive the reflections of your past.</i></p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="Made with HTML, CSS, JavaScript" src="https://img.shields.io/badge/made%20with-HTML%20%2B%20CSS%20%2B%20JS-informational">
</p>

> 🙋 **Catatan jujur:** game ini dibuat oleh **orang awam, bukan programmer**.
> Idenya, arahnya, dan semua ide fiturnya dari saya, lalu dikerjakan dengan bantuan AI ([Claude](https://claude.ai)).
> Kodenya mungkin belum serapi buatan programmer profesional, tapi game-nya jalan dan seru dimainkan. Saran dan perbaikan sangat diterima! 🙏

---

## 🎮 Tentang game

**AFTERYOU** adalah game survival *bullet hell* minimalis di browser. Kamu mengendalikan sebuah titik cahaya, mengumpulkan bola poin, dan bertahan dari **bayangan dirimu sendiri** yang mengulang gerakanmu dari masa lalu dengan berbagai pola (cermin, rotasi, orbit, dan lainnya).

Makin tinggi skormu, makin banyak bayangan, puing luar angkasa, dan **boss** yang muncul. Saat nyawa habis di tengah boss, kamu diberi pilihan terakhir: menyerah, atau masuk ke **The Void** untuk pertarungan bullet hell penuh.

### Fitur utama

- Bayangan masa lalu dengan banyak jenis pola gerak
- Arena luas dengan kamera yang mengikuti, warna arena berganti tiap stage
- Boss tiap kelipatan skor 25, dengan sistem waktu dan bola poin yang memberi damage
- **The Void**: pertarungan boss dengan pola tembakan terinspirasi gaya danmaku (kipas, cincin, spiral, bunga, dan lainnya)
- Bola poin dan bola nyawa yang jatuh dari atas saat di The Void
- Dash, nyawa, dan shield dengan efek visual dinamis
- Kontrol keyboard dan sentuh (layar HP)
- Skor terbaik tersimpan di browser (`localStorage`)

## 🕹️ Kontrol

| Aksi | Keyboard | Layar sentuh |
|---|---|---|
| Bergerak | `W A S D` / tombol panah | Geser jari (joystick virtual) |
| Dash | `Space` / `Shift` | Sentuh dengan jari kedua |
| Pause | `P` / `Esc` | Tombol **PAUSE** |

## ▶️ Cara menjalankan

Tidak perlu install apa pun.

1. Unduh atau clone repo ini.
2. Buka file `index.html` di browser (Chrome, Firefox, Edge, dan sejenisnya).
3. Klik **START GAME**.

Mau dihosting gratis? Aktifkan **GitHub Pages** di *Settings → Pages* dan pilih branch `main`.

## 📁 Isi repo

```
index.html          halaman utama
style.css           tampilan HUD dan menu
script.js           seluruh logika game
favicon.ico         ikon situs
favicon-16x16.png   ikon tab kecil
favicon-32x32.png   ikon tab
apple-touch-icon.png ikon layar utama iOS
icon-192.png        ikon aplikasi 192px
icon-512.png        ikon aplikasi 512px
LICENSE             lisensi MIT
```

## 🤝 Kontribusi

Karena dibuat oleh pemula, kontribusi dalam bentuk laporan bug, saran balancing, atau perapihan kode sangat membantu. Silakan buka **Issue** atau **Pull Request**.

## 📄 Lisensi

Dirilis di bawah [Lisensi MIT](LICENSE). Bebas dipakai, diubah, dan dibagikan, dengan syarat menyertakan pemberitahuan hak cipta dan lisensi.

---

## 🇬🇧 English (short)

**AFTERYOU** is a minimalist browser bullet-hell survival game. Collect points, dodge the shadows of your own past movements, defeat bosses, and enter The Void for a full danmaku-style fight.

This game was made by a **layperson / non-programmer** with the help of AI ([Claude](https://claude.ai)). Feedback and contributions are very welcome.

**Run it:** open `index.html` in any modern browser. Controls: `WASD`/arrows to move, `Space`/`Shift` to dash, `P`/`Esc` to pause. Touch: drag to move, second finger to dash.

Licensed under the [MIT License](LICENSE).
