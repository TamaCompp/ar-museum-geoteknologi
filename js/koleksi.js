/*
 * DATA KOLEKSI MUSEUM GEOTEKNOLOGI MINERAL UPNVYK
 * -----------------------------------------------
 * Teks ditulis dengan bahasa sehari-hari supaya mudah dipahami pengunjung umum
 * dan keluarga. Istilah ilmiah tetap ada di kolom "istilah" dan di bagian
 * "Baca selengkapnya".
 *
 * Deskripsi resmi bersumber dari halaman koleksi di website Museum Geologi
 * (koleksi UPN ikut ditampilkan di sana). Isi bagian dalam (saat dibelah)
 * disusun dari pengetahuan geologi umum, jadi sebaiknya dicek ke staf museum.
 *
 * Kolom penting:
 *  - id          : dipakai di alamat, misalnya viewer.html?id=kuarsa
 *  - resep       : bentuk & tekstur 3D buatan kode (lihat js/geologi3d.js)
 *  - targetIndex : urutan kartu marker di file assets/markers/targets.mind (0 = pertama)
 *  - ringkas     : 1-2 kalimat sederhana (tampil pertama & dibacakan)
 *  - fakta       : fakta seru singkat
 *  - selengkapnya: info lengkap untuk yang ingin tahu lebih
 *  - dalam       : isi bagian dalam saat dibelah. "warna" sama dengan warna di bidang belahan.
 */
window.KOLEKSI = [
  {
    id: 'kuarsa',
    nama: 'Kristal Kuarsa',
    kategori: 'Mineral',
    jenis: 'batu',
    resep: 'kuarsa',
    targetIndex: 0,
    ringkas: 'Kristal bening seperti kaca yang tumbuh secara alami di dalam bumi. Kuarsa adalah mineral yang paling banyak ditemukan di kulit bumi.',
    fakta: [
      'Kuarsa sangat keras, bisa menggores kaca jendela.',
      'Kaca, keramik, dan bagian kecil di dalam jam tangan serta HP dibuat dengan bantuan kuarsa.'
    ],
    selengkapnya: [
      ['Termasuk', 'Mineral golongan silika (SiO₂) dengan bentuk kristal segi enam (heksagonal).'],
      ['Kekerasan', '7 pada skala Mohs dan sangat tahan terhadap pelapukan.'],
      ['Kegunaan', 'Bahan pembuatan kaca, keramik, dan industri elektronik.'],
      ['Budaya', 'Suku Aborigin di Australia menganggap kuarsa sebagai "maban", benda yang melambangkan hubungan dengan leluhur.'],
      ['Ruang koleksi', 'Geologi Indonesia']
    ],
    dalam: [
      { nama: 'Kristal bening', istilah: 'Kuarsa (SiO₂)', warna: '#e3e9ec', ket: 'Bagian bening seperti kaca, berbentuk tiang segi enam dengan ujung runcing.' },
      { nama: 'Garis-garis pertumbuhan', istilah: 'Zona tumbuh (phantom)', warna: '#aab4b9', ket: 'Seperti lingkaran tahun pada pohon. Garis ini menunjukkan kristal tumbuh sedikit demi sedikit.' },
      { nama: 'Bagian putih susu', istilah: 'Kuarsa susu', warna: '#f4f2ed', ket: 'Terlihat keruh karena berisi gelembung yang sangat kecil.' },
      { nama: 'Gelembung kecil', istilah: 'Inklusi fluida', warna: '#8e979c', ket: 'Tetesan air yang terkurung di dalam kristal sejak kristal itu tumbuh.' },
      { nama: 'Batu dasar', istilah: 'Batuan induk', warna: '#d9a27c', ket: 'Tempat kristal menempel dan tumbuh.' }
    ]
  },
  {
    id: 'zamrud',
    nama: 'Zamrud',
    kategori: 'Batu Permata',
    jenis: 'batu',
    resep: 'zamrud',
    targetIndex: 1,
    ringkas: 'Batu permata berwarna hijau cerah yang sering dipakai untuk perhiasan. Museum memiliki dua zamrud dari Tiongkok dan Kolombia.',
    fakta: [
      'Warna hijaunya berasal dari sedikit unsur kromium dan vanadium, logam yang juga ada di benda sehari-hari.',
      'Hampir semua zamrud punya retakan halus di dalamnya. Orang menyebutnya "jardin", artinya taman.'
    ],
    selengkapnya: [
      ['Termasuk', 'Mineral beril yang mengandung unsur berilium.'],
      ['Kekerasan', '7,5 sampai 8 pada skala Mohs.'],
      ['Warna', 'Hijau karena kromium dan vanadium, sedangkan unsur besi membuat warnanya bervariasi.'],
      ['Asal', 'Dua koleksi, dari Tiongkok dan Kolombia.'],
      ['Ruang koleksi', 'Geologi Indonesia']
    ],
    dalam: [
      { nama: 'Kristal hijau', istilah: 'Beril (zamrud)', warna: '#1fa883', ket: 'Bagian permatanya. Kalau dipotong, bentuknya segi enam.' },
      { nama: 'Inti lebih gelap', istilah: 'Zona warna', warna: '#0f7d5c', ket: 'Bagian tengah lebih hijau tua karena kristal tumbuh dalam keadaan yang berubah-ubah.' },
      { nama: 'Retakan halus', istilah: 'Inklusi "jardin"', warna: '#0a3b2c', ket: 'Garis dan bintik kecil di dalam permata, mirip tanaman di taman.' },
      { nama: 'Lapisan berkilau', istilah: 'Mika', warna: '#8d8f8c', ket: 'Lembaran tipis mengkilap di batu tempat zamrud tumbuh.' },
      { nama: 'Noda karat', istilah: 'Oksida besi', warna: '#7a5a3e', ket: 'Warna cokelat kemerahan, mirip karat pada besi.' }
    ]
  },
  {
    id: 'biotite',
    nama: 'Batu dari Antartika',
    kategori: 'Batuan',
    jenis: 'batu',
    resep: 'biotite',
    targetIndex: 2,
    ringkas: 'Batu hitam berkilau ini dibawa langsung dari Antartika, benua es di Kutub Selatan. Kilauannya berasal dari lembaran mineral tipis bernama biotit.',
    fakta: [
      'Batu ini didapat dari ekspedisi ilmuwan Indonesia bersama tim peneliti Jepang ke Antartika.',
      'Lembaran biotit sangat tipis dan bisa dikelupas seperti halaman buku.'
    ],
    selengkapnya: [
      ['Nama ilmiah', 'Biotitit, batuan yang sebagian besar tersusun dari mineral biotit, dengan sedikit kuarsa, plagioklas, dan hornblende.'],
      ['Asal batuan', 'Bagian dari retas pegmatit (pegmatite dyke) yang memotong batuan metamorf.'],
      ['Ekspedisi', 'Japan Antarctic Research Expedition 58 (JARE58), 27 November 2016 sampai 22 Maret 2017.'],
      ['Hibah dari', 'Ir. Nugroho Imam Setiawan, S.T., M.T., D.Sc., IPM.']
    ],
    dalam: [
      { nama: 'Lembaran hitam berkilau', istilah: 'Biotit', warna: '#1d1a17', ket: 'Bagian terbanyak di batu ini, berupa lembaran tipis mengkilap.' },
      { nama: 'Kilau perunggu', istilah: 'Lembaran mika', warna: '#4a3726', ket: 'Lapisan tipis yang tampak cokelat keemasan saat terkena cahaya.' },
      { nama: 'Butiran abu-abu', istilah: 'Kuarsa', warna: '#9a9b98', ket: 'Butiran bening keabu-abuan, jumlahnya sedikit.' },
      { nama: 'Butiran putih', istilah: 'Plagioklas', warna: '#e2ded4', ket: 'Butiran berwarna putih susu.' },
      { nama: 'Butiran hijau gelap', istilah: 'Hornblende', warna: '#2f3a2c', ket: 'Butiran hijau kehitaman berbentuk memanjang.' }
    ]
  },
  {
    id: 'homoerectus',
    nama: 'Tengkorak Manusia Purba',
    kategori: 'Fosil Manusia Purba',
    jenis: 'fosil',
    resep: 'homoerectus',
    targetIndex: 3,
    ringkas: 'Tengkorak Homo erectus, manusia purba yang hidup di Jawa sekitar 700.000 tahun lalu. Ini salah satu tengkorak manusia purba paling lengkap di Asia Tenggara.',
    fakta: [
      'Dahinya rendah dan tulang alisnya menonjol, berbeda dengan kepala kita sekarang.',
      'Ukuran otaknya sekitar 1 liter, kira-kira tiga perempat ukuran otak manusia modern.'
    ],
    selengkapnya: [
      ['Nama koleksi', 'Homo erectus P VIII (Pithecanthropus delapan).'],
      ['Umur', 'Sekitar 800.000 sampai 700.000 tahun.'],
      ['Ditemukan', 'Tahun 1969 di Sungai Cemoro, Dukuh Pucung, Desa Dayu, Kecamatan Gondangrejo, Kabupaten Karanganyar, Jawa Tengah.'],
      ['Keistimewaan', 'Menjadi acuan utama bentuk kepala Homo erectus di museum-museum dunia. Fosil aslinya disimpan di ruang penyimpanan khusus Museum Geologi, sedangkan replikanya dipamerkan.'],
      ['Ruang koleksi', 'Sejarah Kehidupan']
    ],
    dalam: [
      { nama: 'Ruang otak', istilah: 'Rongga otak', warna: '#8a8170', ket: 'Tempat otak dulu berada. Sekarang terisi tanah dan pasir yang sudah membatu.' },
      { nama: 'Tulang keras', istilah: 'Lapisan tulang padat', warna: '#e3c08a', ket: 'Lapisan luar dan dalam tulang kepala yang kuat.' },
      { nama: 'Tulang berpori', istilah: 'Diploe', warna: '#c99a5e', ket: 'Bagian tengah tulang yang berongga seperti spons. Tulang kepala Homo erectus tebal.' },
      { nama: 'Rongga di balik alis', istilah: 'Sinus frontal', warna: '#4a3424', ket: 'Ruang udara kecil di belakang tulang alis yang menonjol.' },
      { nama: 'Saluran hidung', istilah: 'Rongga hidung', warna: '#3a2a1e', ket: 'Jalan udara untuk bernapas.' }
    ]
  },
  {
    id: 'gajah',
    nama: 'Kepala Gajah Purba',
    kategori: 'Fosil Gajah Purba',
    jenis: 'fosil',
    resep: 'gajah',
    targetIndex: 4,
    ringkas: 'Kepala gajah raksasa yang hidup di Blora sekitar 165.000 tahun lalu. Gajah ini adalah nenek moyang gajah Asia.',
    fakta: [
      'Beratnya diperkirakan 6 sampai 8 ton, lebih berat dari sebuah truk kecil.',
      'Kepalanya besar tapi ringan, karena di dalamnya banyak rongga udara seperti sarang lebah.'
    ],
    selengkapnya: [
      ['Nama ilmiah', 'Elephas hysudrindicus, dikenal sebagai Gajah Blora.'],
      ['Tentang gajah ini', 'Seekor jantan yang mati pada usia 49 tahun.'],
      ['Ditemukan', 'Tahun 2009 di tepi Bengawan Solo purba, Dusun Sunggun, Blora, Jawa Tengah. Sekitar 85% kerangkanya ditemukan utuh.'],
      ['Penggalian', 'Kerja sama Museum Geologi, Dinas Pariwisata Blora, dan Wollongong University. Dari penggalian sampai siap dipamerkan memakan waktu sekitar empat tahun.'],
      ['Koleksi UPN', 'Berupa bagian kepala.']
    ],
    dalam: [
      { nama: 'Rongga udara', istilah: 'Sinus', warna: '#3b2c20', ket: 'Ruang-ruang kecil seperti sarang lebah yang membuat kepala besar tetap ringan.' },
      { nama: 'Dinding tipis', istilah: 'Sekat tulang', warna: '#c9a87a', ket: 'Tulang tipis yang memisahkan rongga-rongga udara.' },
      { nama: 'Ruang otak', istilah: 'Rongga otak', warna: '#847a68', ket: 'Ukurannya kecil dibanding kepalanya, letaknya di bagian belakang bawah.' },
      { nama: 'Saluran hidung', istilah: 'Rongga hidung', warna: '#2a2018', ket: 'Jalan napas yang tersambung ke belalai.' },
      { nama: 'Tulang luar', istilah: 'Lapisan tulang padat', warna: '#b8935f', ket: 'Tulang keras yang melindungi bagian luar kepala.' }
    ]
  }
];
