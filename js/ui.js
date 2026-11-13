/*
 * Antarmuka (dipakai viewer.html dan ar.html)
 * Mengatur: pilihan koleksi, panel info, tombol belah, narasi suara, zoom, petunjuk marker.
 */
(function () {
  'use strict';

  var daftar = window.KOLEKSI;
  var mode = document.body.getAttribute('data-mode'); // 'viewer' atau 'ar'
  var param = new URLSearchParams(location.search);
  var modelEls = Array.prototype.slice.call(document.querySelectorAll('[koleksi-3d]'));
  var banyakMarker = modelEls.length > 1;
  var modelAktif = modelEls[0];
  var terbelah = false;

  function $(s) { return document.querySelector(s); }
  var el = {
    nama: $('#nama'), kategori: $('#kategori'), ringkas: $('#ringkas'), detail: $('#detail'),
    dalam: $('#daftar-dalam'), pilih: $('#pilih'), belah: $('#btn-belah'), suara: $('#btn-suara'),
    info: $('#btn-info'), panel: $('#panel'), muat: $('#memuat'), petunjuk: $('#petunjuk')
  };

  function item(id) {
    for (var i = 0; i < daftar.length; i++) if (daftar[i].id === id) return daftar[i];
    return daftar[0];
  }
  function idModel(m) {
    if (m.components && m.components['koleksi-3d']) return m.components['koleksi-3d'].data.id;
    var cocok = String(m.getAttribute('koleksi-3d')).match(/id:\s*([\w-]+)/);
    return cocok ? cocok[1] : daftar[0].id;
  }

  var awal = param.get('id');
  var aktifId = (awal && daftar.some(function (k) { return k.id === awal; })) ? awal : daftar[0].id;
  if (!banyakMarker && modelAktif) modelAktif.setAttribute('koleksi-3d', 'id', aktifId);

  // ---------- pilihan koleksi ----------
  if (el.pilih) {
    if (banyakMarker) {
      el.pilih.style.display = 'none';
    } else {
      daftar.forEach(function (k) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = k.nama;
        b.setAttribute('data-id', k.id);
        b.addEventListener('click', function () { gantiKoleksi(k.id); });
        el.pilih.appendChild(b);
      });
    }
  }

  function gantiKoleksi(id) {
    if (id === aktifId) return;
    aktifId = id;
    hentikanSuara();
    modelAktif.setAttribute('koleksi-3d', 'id', id);
    var u = new URL(location.href); u.searchParams.set('id', id);
    history.replaceState(null, '', u.toString());
    tampilkan(id);
  }

  function tampilkan(id) {
    var k = item(id);
    el.nama.textContent = k.nama;
    el.kategori.textContent = k.kategori;
    el.ringkas.textContent = k.ringkas;
    el.detail.innerHTML =
      '<p><b>Pembentukan.</b> ' + k.pembentukan + '</p>' +
      '<p><b>Kegunaan.</b> ' + k.kegunaan + '</p>' +
      '<p><b>Lokasi.</b> ' + k.lokasi + '</p>';
    el.dalam.innerHTML = k.dalam.map(function (x) {
      return '<li><span class="titik" style="background:' + x.warna + '"></span>' +
             '<div><b>' + x.nama + '</b><small>' + x.ket + '</small></div></li>';
    }).join('');
    document.title = k.nama + ' | AR Museum Geoteknologi';
    if (el.pilih) Array.prototype.forEach.call(el.pilih.querySelectorAll('button'), function (b) {
      b.classList.toggle('aktif', b.getAttribute('data-id') === id);
    });
    aturBelah(false, true);
  }

  // ---------- belah ----------
  function aturBelah(buka, diam) {
    terbelah = buka;
    document.body.classList.toggle('terbelah', buka);
    el.belah.textContent = buka ? 'Satukan kembali' : (item(aktifId).jenis === 'fosil' ? 'Belah fosil' : 'Belah batu');
    if (!diam && modelAktif && modelAktif.components['koleksi-3d']) modelAktif.components['koleksi-3d'].belah(buka);
    if (!diam && mode === 'viewer' && window.aturZoomBelah) window.aturZoomBelah(buka);
    if (buka && el.panel) el.panel.classList.remove('tertutup');
  }
  el.belah.addEventListener('click', function () {
    hentikanSuara();
    aturBelah(!terbelah);
  });

  // ---------- panel info buka/tutup ----------
  if (el.info) el.info.addEventListener('click', function () { el.panel.classList.toggle('tertutup'); });

  // ---------- narasi suara (Text-to-Speech bawaan HP) ----------
  var bicara = window.speechSynthesis;
  function hentikanSuara() {
    if (bicara) bicara.cancel();
    if (el.suara) el.suara.classList.remove('aktif');
  }
  if (el.suara) {
    if (!bicara) el.suara.style.display = 'none';
    el.suara.addEventListener('click', function () {
      if (bicara.speaking) { hentikanSuara(); return; }
      var k = item(aktifId);
      var teks = terbelah
        ? 'Bagian dalam ' + k.nama + '. ' + k.dalam.map(function (x) { return x.nama + '. ' + x.ket; }).join(' ')
        : k.nama + '. ' + k.ringkas + ' ' + k.pembentukan;
      var u = new SpeechSynthesisUtterance(teks);
      u.lang = 'id-ID';
      u.rate = 0.95;
      var suaraId = bicara.getVoices().filter(function (v) { return /^id/i.test(v.lang); })[0];
      if (suaraId) u.voice = suaraId;
      u.onend = function () { el.suara.classList.remove('aktif'); };
      el.suara.classList.add('aktif');
      bicara.speak(u);
    });
  }

  // ---------- status memuat ----------
  modelEls.forEach(function (m) {
    m.addEventListener('koleksi-memuat', function () { if (m === modelAktif && el.muat) el.muat.classList.add('tampil'); });
    m.addEventListener('koleksi-siap', function () { if (m === modelAktif && el.muat) el.muat.classList.remove('tampil'); });
    m.addEventListener('koleksi-gagal', function () {
      if (el.muat) { el.muat.textContent = 'Model gagal dibuat. Coba muat ulang halaman.'; el.muat.classList.add('tampil'); }
    });
  });

  // ---------- AR: petunjuk marker & mode banyak marker ----------
  if (mode === 'ar') {
    if (el.panel) el.panel.classList.add('tertutup'); // panel dibuka lewat tombol i atau saat dibelah
    var terlihat = 0;
    document.querySelectorAll('[mindar-image-target]').forEach(function (t) {
      var m = t.querySelector('[koleksi-3d]');
      t.addEventListener('targetFound', function () {
        terlihat++;
        if (el.petunjuk) el.petunjuk.classList.add('sembunyi');
        if (banyakMarker && m) {
          if (m !== modelAktif) {
            modelAktif = m;
            aktifId = idModel(m);
            hentikanSuara();
            tampilkan(aktifId);
          }
          if (m.components['koleksi-3d']) m.components['koleksi-3d'].muat();
        }
      });
      t.addEventListener('targetLost', function () {
        terlihat = Math.max(0, terlihat - 1);
        if (!terlihat && el.petunjuk) el.petunjuk.classList.remove('sembunyi');
      });
    });
  }

  // ---------- viewer: zoom dengan scroll / cubit ----------
  if (mode === 'viewer') {
    var kamera = document.querySelector('#kamera');
    var jarakK = 2.0;
    function aturZoom(z) {
      jarakK = Math.max(1.0, Math.min(5, z));
      if (!kamera || !kamera.object3D) return;
      kamera.object3D.position.z = jarakK;
      // di layar HP tegak, geser kamera turun supaya model tampil di atas panel info
      kamera.object3D.position.y = window.innerWidth < 900 && window.innerHeight > window.innerWidth ? -0.32 * jarakK : 0.05;
    }
    if (kamera.hasLoaded) aturZoom(jarakK); else kamera.addEventListener('loaded', function () { aturZoom(jarakK); });
    // saat dibelah, kamera mundur sedikit supaya kedua belahan muat di layar
    window.aturZoomBelah = function (buka) { aturZoom(buka ? jarakK * 1.4 : jarakK / 1.4); };
    window.addEventListener('resize', function () { aturZoom(jarakK); });
    window.addEventListener('wheel', function (e) {
      if (e.target.closest && e.target.closest('.ui')) return;
      aturZoom(jarakK + e.deltaY * 0.0015);
    }, { passive: true });
    var jari = {}, jarakAwal = 0, zoomAwal = 0;
    window.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.ui')) return;
      jari[e.pointerId] = [e.clientX, e.clientY];
      var k = Object.keys(jari);
      if (k.length === 2) {
        jarakAwal = Math.hypot(jari[k[0]][0] - jari[k[1]][0], jari[k[0]][1] - jari[k[1]][1]);
        zoomAwal = jarakK;
      }
    });
    window.addEventListener('pointermove', function (e) {
      if (!jari[e.pointerId]) return;
      jari[e.pointerId] = [e.clientX, e.clientY];
      var k = Object.keys(jari);
      if (k.length === 2 && jarakAwal > 0) {
        var d = Math.hypot(jari[k[0]][0] - jari[k[1]][0], jari[k[0]][1] - jari[k[1]][1]);
        aturZoom(zoomAwal * jarakAwal / d);
      }
    });
    function lepas(e) { delete jari[e.pointerId]; jarakAwal = 0; }
    window.addEventListener('pointerup', lepas);
    window.addEventListener('pointercancel', lepas);
  }

  // ---------- kecerahan lampu (?cahaya=1.5 untuk lebih terang) ----------
  var cahaya = parseFloat(param.get('cahaya'));
  if (cahaya > 0) {
    document.querySelectorAll('[data-lampu]').forEach(function (l) {
      var dasar = parseFloat(l.getAttribute('data-lampu'));
      l.setAttribute('light', 'intensity', dasar * cahaya);
    });
  }

  tampilkan(aktifId);
})();
