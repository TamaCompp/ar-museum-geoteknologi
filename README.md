# AR Museum Geoteknologi Mineral UPNVYK

Web AR untuk menampilkan 5 koleksi Museum Geoteknologi Mineral UPNVYK (3 batuan/mineral, 2 fosil) dalam 3D. Model bisa diputar dan **dibelah** untuk melihat isi bagian dalamnya, lengkap dengan info dan narasi suara.

Projek akhir mata kuliah Komputer dan Masyarakat, Informatika UPNVYK.

## Halaman

| File | Fungsi |
|---|---|
| `index.html` | Beranda MINERAV (desain tim), daftar koleksi |
| `viewer.html?id=kuarsa` | Lihat 3D tanpa kamera (bisa di laptop) |
| `ar.html?id=kuarsa` | Mode AR dengan kamera HP + marker |

ID koleksi: `kuarsa`, `zamrud`, `biotite`, `homoerectus`, `gajah`.

## Struktur

```
index.html, viewer.html, ar.html
css/beranda.css   tampilan beranda
css/style.css     tampilan halaman 3D dan AR
js/beranda.js     mengisi kartu koleksi di beranda
assets/img/       gambar model untuk kartu koleksi
js/koleksi.js     data teks koleksi (nama, info, isi bagian dalam)
js/geologi3d.js   pembuat model 3D + tekstur + belahan (tanpa file .glb)
js/komponen.js    komponen A-Frame: koleksi-3d, putar-geser
js/ui.js          tombol, panel info, suara, zoom
```

## Mengganti isi informasi

Edit `js/koleksi.js`. Teks ditulis dengan bahasa sehari-hari (ringkas, fakta seru, isi dalam); istilah ilmiah ada di kolom `istilah` dan `selengkapnya`. Cocokkan dengan data dari staf museum.

Setiap kali mengubah file CSS/JS, naikkan angka `?v=` di `index.html`, `viewer.html`, `ar.html` (dan `VERSI` di `ar.html`).

## Kartu marker (1 koleksi = 1 kartu)

Kartu ada di `assets/markers/`: `1-kuarsa.png` sampai `5-gajah.png`, plus `kartu-marker.pdf` untuk dicetak.

1. Buka MindAR Image Targets Compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Upload kelima PNG **berurutan** (1-kuarsa, 2-zamrud, 3-biotite, 4-homoerectus, 5-gajah), tekan Start.
3. Tekan Download, simpan hasilnya sebagai `assets/markers/targets.mind`, lalu push.
4. `ar.html` otomatis memakai file ini. Selama file belum ada, halaman memakai 1 marker contoh dan koleksi dipilih lewat tombol.

Urutan upload harus sama dengan `targetIndex` di `js/koleksi.js` (0 sampai 4). Kalau kartu diletakkan mendatar di meja, ubah `var ORIENTASI = 'meja';` di `ar.html`.

## Tips

- Tampilan terlalu gelap/terang: tambahkan `?cahaya=1.5` (atau `0.7`) di alamat, misalnya `viewer.html?id=kuarsa&cahaya=1.5`.
- Kamera hanya bisa dibuka lewat HTTPS (GitHub Pages sudah HTTPS) atau `localhost` (Live Server).
- Di iPhone, buka lewat Safari, bukan dari dalam WhatsApp/Instagram.

## Catatan

Model 3D dibuat dengan kode (prosedural) sebagai ilustrasi, bukan hasil pindai koleksi asli. Deskripsi koleksi diambil dari website Museum Geologi; isi bagian dalam (saat dibelah) disusun dari pengetahuan geologi umum dan perlu dicek ke staf museum.

Resep lama (granit, geode, batubara, amonit, kayu) masih tersedia di `js/geologi3d.js` kalau ingin menambah koleksi.

Teknologi: A-Frame 1.5.0, MindAR 1.2.5, GitHub Pages.
