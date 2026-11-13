/*
 * Komponen A-Frame
 *  - koleksi-3d  : menampilkan model koleksi (dari js/geologi3d.js) + animasi belah
 *  - putar-geser : memutar model dengan geser jari / mouse
 */
(function () {
  'use strict';
  if (!window.AFRAME) return;
  var THREE = window.AFRAME.THREE;

  function cari(id) {
    var d = window.KOLEKSI || [];
    for (var i = 0; i < d.length; i++) if (d[i].id === id) return d[i];
    return d[0];
  }
  function halus(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  AFRAME.registerComponent('koleksi-3d', {
    schema: {
      id: { type: 'string', default: 'kuarsa' },
      skala: { type: 'number', default: 1 },
      tunda: { type: 'boolean', default: false } // true = model baru dibuat saat muat() dipanggil
    },

    init: function () {
      this.t = 0; this.target = 0; this.model = null; this.token = 0; this.dimuat = !this.data.tunda;
    },

    update: function (lama) {
      if (lama.id !== this.data.id) { if (this.dimuat) this.bangun(); }
      else if (this.model && lama.skala !== this.data.skala) this.model.grup.scale.setScalar(this.data.skala);
    },

    muat: function () {
      if (this.dimuat) return;
      this.dimuat = true;
      this.bangun();
    },

    bangun: function () {
      var self = this, item = cari(this.data.id), token = ++this.token;
      this.el.emit('koleksi-memuat', { item: item });
      // beri jeda agar tulisan "memuat" sempat tampil sebelum proses berat
      setTimeout(function () {
        if (token !== self.token) return;
        var model;
        try { model = window.Geologi3D.buat(THREE, item.resep, {}); }
        catch (e) { console.error(e); self.el.emit('koleksi-gagal', { item: item, error: e }); return; }
        if (self.model) { self.el.removeObject3D('mesh'); self.model.buang(); }
        self.model = model;
        model.grup.scale.setScalar(self.data.skala);
        self.t = 0; self.target = 0; model.setBelah(0);
        self.el.setObject3D('mesh', model.grup);
        self.el.emit('koleksi-siap', { item: item });
      }, 60);
    },

    belah: function (buka) {
      this.target = buka ? 1 : 0;
      this.el.emit('koleksi-belah', { buka: !!buka });
    },

    terbelah: function () { return this.target === 1; },

    tick: function (waktu, dt) {
      if (!this.model || this.t === this.target) return;
      var langkah = Math.min(dt || 16, 50) / 1100;
      this.t = this.target > this.t ? Math.min(1, this.t + langkah) : Math.max(0, this.t - langkah);
      this.model.setBelah(halus(this.t));
    },

    remove: function () {
      this.token++;
      if (this.model) { this.el.removeObject3D('mesh'); this.model.buang(); this.model = null; }
    }
  });

  AFRAME.registerComponent('putar-geser', {
    schema: {
      otomatis: { type: 'boolean', default: false }, // berputar pelan kalau tidak disentuh
      miring: { type: 'boolean', default: true }      // boleh dimiringkan atas-bawah
    },

    init: function () {
      this.jari = {};
      this.aktif = false;
      this.diam = 0;
      this.terakhir = null;
      this._mulai = this.mulai.bind(this);
      this._gerak = this.gerak.bind(this);
      this._selesai = this.selesai.bind(this);
      window.addEventListener('pointerdown', this._mulai);
      window.addEventListener('pointermove', this._gerak);
      window.addEventListener('pointerup', this._selesai);
      window.addEventListener('pointercancel', this._selesai);
    },

    mulai: function (e) {
      if (e.target && e.target.closest && e.target.closest('.ui')) return;
      this.jari[e.pointerId] = true;
      this.aktif = Object.keys(this.jari).length === 1;
      this.terakhir = [e.clientX, e.clientY];
      this.diam = 0;
    },

    gerak: function (e) {
      if (!this.aktif || !this.jari[e.pointerId]) return;
      var dx = e.clientX - this.terakhir[0], dy = e.clientY - this.terakhir[1];
      this.terakhir = [e.clientX, e.clientY];
      var r = this.el.object3D.rotation;
      r.y += dx * 0.01;
      if (this.data.miring) r.x = Math.max(-0.9, Math.min(0.9, r.x + dy * 0.006));
    },

    selesai: function (e) {
      delete this.jari[e.pointerId];
      this.aktif = false;
    },

    tick: function (waktu, dt) {
      if (!this.data.otomatis || this.aktif) return;
      this.diam += dt || 16;
      if (this.diam > 2500) this.el.object3D.rotation.y += (dt || 16) * 0.00025;
    },

    remove: function () {
      window.removeEventListener('pointerdown', this._mulai);
      window.removeEventListener('pointermove', this._gerak);
      window.removeEventListener('pointerup', this._selesai);
      window.removeEventListener('pointercancel', this._selesai);
    }
  });
})();
