/*
 * DATA KOLEKSI MUSEUM GEOTEKNOLOGI MINERAL UPNVYK
 * -----------------------------------------------
 * Deskripsi utama diambil dari halaman koleksi di website Museum Geologi
 * (koleksi UPN ikut ditampilkan di sana). Bagian "dalam" (isi saat dibelah)
 * disusun dari pengetahuan geologi umum, jadi sebaiknya dicek ke staf museum.
 *
 * Kolom penting:
 *  - id         : dipakai di alamat, misalnya viewer.html?id=kuarsa
 *  - resep      : bentuk & tekstur 3D buatan kode (lihat js/geologi3d.js)
 *  - targetIndex: urutan marker di file targets.mind (0 = marker pertama)
 *  - dalam      : daftar isi bagian dalam yang tampil saat koleksi dibelah.
 *                 "warna" disamakan dengan warna di bidang belahan.
 */
window.KOLEKSI = [
  {
    id: 'kuarsa',
    nama: 'Kristal Kuarsa',
    kategori: 'Mineral',
    jenis: 'batu',
    resep: 'kuarsa',
    targetIndex: 0,
    ringkas: 'Mineral dari golongan silika dengan struktur kristal heksagonal. Kuarsa adalah mineral paling melimpah di kerak bumi dan bisa ditemukan di berbagai jenis batuan.',
    pembentukan: 'Kuarsa memiliki kekerasan 7 pada skala Mohs dan sangat tahan terhadap pelapukan. Dalam mitologi suku Aborigin Australia, kuarsa dianggap sebagai "maban", benda spiritual yang melambangkan hubungan dengan leluhur.',
    kegunaan: 'Bahan pembuatan kaca, keramik, dan komponen industri elektronik.',
    lokasi: 'Ruang koleksi: Geologi Indonesia.',
    dalam: [
      { nama: 'Kristal kuarsa (SiO₂)', warna: '#e3e9ec', ket: 'Kristal bening berbentuk prisma enam sisi dengan ujung runcing.' },
      { nama: 'Zona tumbuh (phantom)', warna: '#aab4b9', ket: 'Garis-garis sejajar sisi kristal, jejak tahap-tahap pertumbuhan kristal.' },
      { nama: 'Kuarsa susu', warna: '#f4f2ed', ket: 'Bagian putih keruh karena berisi gelembung mikro yang sangat banyak.' },
      { nama: 'Inklusi fluida', warna: '#8e979c', ket: 'Gelembung cairan kecil yang terperangkap saat kristal tumbuh.' },
      { nama: 'Batuan induk', warna: '#d9a27c', ket: 'Dasar tempat kristal tumbuh, berisi kuarsa masif dan noda oksida besi.' }
    ]
  },
  {
    id: 'zamrud',
    nama: 'Zamrud',
    kategori: 'Batu Mulia (Mineral Beril)',
    jenis: 'batu',
    resep: 'zamrud',
    targetIndex: 1,
    ringkas: 'Batu mulia yang terkenal dengan warna hijaunya yang cerah. Terdapat dua koleksi zamrud di Ruang Geologi Indonesia, berasal dari Tiongkok dan Kolombia.',
    pembentukan: 'Zamrud adalah jenis mineral beril yang mengandung unsur berilium, dengan kekerasan 7,5 sampai 8 pada skala Mohs. Warna hijaunya berasal dari unsur pengotor kromium dan vanadium, sedangkan besi menyebabkan variasi warna.',
    kegunaan: 'Batu permata untuk perhiasan dan benda koleksi.',
    lokasi: 'Ruang koleksi: Geologi Indonesia.',
    dalam: [
      { nama: 'Kristal beril (zamrud)', warna: '#1fa883', ket: 'Kristal hijau berpenampang segi enam.' },
      { nama: 'Zona warna', warna: '#0f7d5c', ket: 'Inti kristal lebih gelap, menunjukkan kadar kromium/vanadium yang berubah selama pertumbuhan.' },
      { nama: 'Inklusi "jardin"', warna: '#0a3b2c', ket: 'Retakan halus dan inklusi di dalam zamrud. Disebut jardin (taman) karena tampak seperti tanaman.' },
      { nama: 'Mika (batuan induk)', warna: '#8d8f8c', ket: 'Lembaran mika berkilau pada batuan tempat zamrud tumbuh.' },
      { nama: 'Oksida besi', warna: '#7a5a3e', ket: 'Noda cokelat kemerahan hasil pelapukan.' }
    ]
  },
  {
    id: 'biotitit',
    nama: 'Biotitit (Batuan Antartika)',
    kategori: 'Batuan dari Pegmatit',
    jenis: 'batu',
    resep: 'biotitit',
    targetIndex: 2,
    ringkas: 'Batuan hitam berkilap kaca yang sebagian besar tersusun dari mineral biotit. Koleksi ini berasal dari Antartika.',
    pembentukan: 'Biotitit ini merupakan bagian dari retas pegmatit (pegmatite dyke) yang memotong batuan metamorf. Komposisinya sebagian besar biotit dengan sedikit kuarsa, plagioklas, dan hornblende.',
    kegunaan: 'Bahan penelitian geologi Antartika. Koleksi ini merupakan hibah dari Ir. Nugroho Imam Setiawan, S.T., M.T., D.Sc., IPM., hasil Ekspedisi Geologi Antartika bersama Japan Antarctic Research Expedition 58 (JARE58), 27 November 2016 sampai 22 Maret 2017.',
    lokasi: 'Antartika.',
    dalam: [
      { nama: 'Biotit', warna: '#1d1a17', ket: 'Mika hitam yang mendominasi batuan, berupa lembaran tipis berkilau.' },
      { nama: 'Lembaran mika', warna: '#4a3726', ket: 'Lapisan-lapisan tipis yang mudah terkelupas, berkilau perunggu bila terkena cahaya.' },
      { nama: 'Kuarsa', warna: '#9a9b98', ket: 'Butiran abu-abu bening dalam jumlah sedikit.' },
      { nama: 'Plagioklas', warna: '#e2ded4', ket: 'Butiran putih susu dari kelompok feldspar.' },
      { nama: 'Hornblende', warna: '#2f3a2c', ket: 'Mineral hijau kehitaman berbentuk memanjang.' }
    ]
  },
  {
    id: 'homoerectus',
    nama: 'Tengkorak Homo erectus P VIII',
    kategori: 'Fosil Manusia Purba',
    jenis: 'fosil',
    resep: 'homoerectus',
    targetIndex: 3,
    ringkas: 'Fosil tengkorak Homo erectus P VIII (Pithecanthropus delapan) yang memiliki fitur anatomi kepala paling lengkap di Asia Tenggara. Umurnya sekitar 800.000 sampai 700.000 tahun.',
    pembentukan: 'Ditemukan tahun 1969 di Sungai Cemoro, Dukuh Pucung, Desa Dayu, Kecamatan Gondangrejo, Kabupaten Karanganyar, Jawa Tengah. Fosil ini sering dijadikan referensi utama anatomi Homo erectus di museum-museum paleoantropologi dunia.',
    kegunaan: 'Fosil asli P VIII menjadi koleksi unggulan Museum Geologi dan disimpan di ruang penyimpanan koleksi khusus, sedangkan replikanya dipamerkan.',
    lokasi: 'Ruang koleksi: Sejarah Kehidupan.',
    dalam: [
      { nama: 'Rongga otak', warna: '#8a8170', ket: 'Tempat otak berada, volumenya sekitar 1.000 cc. Pada fosil, rongga ini terisi endapan batuan.' },
      { nama: 'Lapisan tulang padat', warna: '#e3c08a', ket: 'Lapisan luar dan dalam tulang tengkorak yang keras.' },
      { nama: 'Diploe (tulang spons)', warna: '#c99a5e', ket: 'Tulang berpori di antara lapisan padat. Tengkorak Homo erectus terkenal tebal.' },
      { nama: 'Sinus frontal', warna: '#4a3424', ket: 'Rongga udara di balik tonjolan alis (torus supraorbital) yang menonjol.' },
      { nama: 'Rongga hidung', warna: '#3a2a1e', ket: 'Saluran pernapasan di bagian wajah.' }
    ]
  },
  {
    id: 'gajah',
    nama: 'Kepala Gajah Blora',
    kategori: 'Fosil Gajah Purba',
    jenis: 'fosil',
    resep: 'gajah',
    targetIndex: 4,
    ringkas: 'Bagian kepala Elephas hysudrindicus, spesies gajah purba yang dianggap sebagai leluhur gajah Asia. Gajah Blora adalah seekor jantan yang hidup sekitar 165.000 tahun lalu.',
    pembentukan: 'Gajah ini memiliki berat sekitar 6 sampai 8 ton dan mati pada usia 49 tahun. Ditemukan tahun 2009 di tepi Bengawan Solo purba, Dusun Sunggun, Blora. Sekitar 85% kerangkanya ditemukan utuh dari satu individu. Ekskavasinya melibatkan Museum Geologi, Dinas Pariwisata Blora, dan Wollongong University.',
    kegunaan: 'Proses pengangkatan hingga rekonstruksi fosil untuk pameran memakan waktu sekitar empat tahun. Koleksi di museum UPN berupa bagian kepala.',
    lokasi: 'Blora, Jawa Tengah.',
    dalam: [
      { nama: 'Sel-sel udara (sinus)', warna: '#3b2c20', ket: 'Rongga-rongga seperti sarang lebah yang membuat kepala besar tetap ringan.' },
      { nama: 'Sekat tulang', warna: '#c9a87a', ket: 'Dinding tipis tulang di antara sel-sel udara.' },
      { nama: 'Rongga otak', warna: '#847a68', ket: 'Relatif kecil dibanding ukuran kepala, letaknya di bagian belakang bawah. Terisi endapan.' },
      { nama: 'Rongga hidung', warna: '#2a2018', ket: 'Saluran napas yang tersambung ke belalai.' },
      { nama: 'Lapisan tulang luar', warna: '#b8935f', ket: 'Tulang padat pelindung bagian luar tengkorak.' }
    ]
  }
];
