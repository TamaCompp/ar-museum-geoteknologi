# AR Museum Geoteknologi Mineral UPNVYK

Web AR untuk menampilkan 5 koleksi Museum Geoteknologi Mineral UPNVYK (3 batuan/mineral, 2 fosil) dalam 3D. Model bisa diputar dan **dibelah** untuk melihat isi bagian dalamnya, lengkap dengan info dan narasi suara.

Projek akhir mata kuliah Komputer dan Masyarakat, Informatika UPNVYK.

## Halaman

| File | Fungsi |
|---|---|
| `index.html` | Beranda, daftar koleksi |
| `viewer.html?id=kuarsa` | Lihat 3D tanpa kamera (bisa di laptop) |
| `ar.html?id=kuarsa` | Mode AR dengan kamera HP + marker |

ID koleksi: `kuarsa`, `zamrud`, `biotitit`, `homoerectus`, `gajah`.

## Struktur

```
index.html, viewer.html, ar.html
css/style.css
js/koleksi.js     data teks koleksi (nama, info, isi bagian dalam)
js/geologi3d.js   pembuat model 3D + tekstur + belahan (tanpa file .glb)
js/komponen.js    komponen A-Frame: koleksi-3d, putar-geser
js/ui.js          tombol, panel info, suara, zoom
```

## Mengganti isi informasi

Edit `js/koleksi.js`. Teks yang ada sekarang adalah informasi geologi umum. Cocokkan dengan data koleksi dari staf museum.

## Memakai marker sendiri (5 marker)

1. Siapkan 5 gambar marker (foto/desain yang detail dan kontras, bukan gambar polos).
2. Compile kelima gambar sekaligus di MindAR Image Target Compiler (cari "mind-ar image targets compiler"). Urutan upload = urutan `targetIndex` (0 sampai 4).
3. Simpan hasilnya sebagai `assets/markers/targets.mind`.
4. Di `js/koleksi.js`, isi `targetIndex` tiap koleksi sesuai urutan marker.
5. Di `ar.html`, ubah pengaturan:
   ```js
   var MARKER = { file: 'assets/markers/targets.mind', banyak: true };
   ```
6. Kalau marker diletakkan mendatar di meja, ubah `var ORIENTASI = 'meja';`.

## Tips

- Tampilan terlalu gelap/terang: tambahkan `?cahaya=1.5` (atau `0.7`) di alamat, misalnya `viewer.html?id=kuarsa&cahaya=1.5`.
- Kamera hanya bisa dibuka lewat HTTPS (GitHub Pages sudah HTTPS) atau `localhost` (Live Server).
- Di iPhone, buka lewat Safari, bukan dari dalam WhatsApp/Instagram.

## Catatan

Model 3D dibuat dengan kode (prosedural) sebagai ilustrasi, bukan hasil pindai koleksi asli. Deskripsi koleksi diambil dari website Museum Geologi; isi bagian dalam (saat dibelah) disusun dari pengetahuan geologi umum dan perlu dicek ke staf museum.

Resep lama (granit, geode, batubara, amonit, kayu) masih tersedia di `js/geologi3d.js` kalau ingin menambah koleksi.

Teknologi: A-Frame 1.5.0, MindAR 1.2.5, GitHub Pages.
