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
        model.grup.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
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

  // Putar bebas ke segala arah relatif terhadap layar (seperti memutar bola),
  // cubit 2 jari untuk memperbesar, ketuk 2x untuk menegakkan kembali.
  AFRAME.registerComponent('putar-geser', {
    schema: {
      otomatis: { type: 'boolean', default: false },     // berputar pelan kalau tidak disentuh
      cubit: { type: 'boolean', default: false },        // cubit 2 jari = ubah ukuran model
      tegakOtomatis: { type: 'boolean', default: false } // tegak menghadap kamera saat marker ditemukan
    },

    init: function () {
      this.jari = {};
      this.diam = 0;
      this.ketukTerakhir = 0;
      this.skala = 1;
      this.qa = new THREE.Quaternion(); this.qb = new THREE.Quaternion(); this.qc = new THREE.Quaternion();
      this.va = new THREE.Vector3(); this.vb = new THREE.Vector3();
      this._mulai = this.mulai.bind(this);
      this._gerak = this.gerak.bind(this);
      this._selesai = this.selesai.bind(this);
      window.addEventListener('pointerdown', this._mulai);
      window.addEventListener('pointermove', this._gerak);
      window.addEventListener('pointerup', this._selesai);
      window.addEventListener('pointercancel', this._selesai);
      var self = this;
      // cari marker induk (kalau ada) untuk tegak otomatis
      var t = this.el.parentEl;
      while (t && !t.hasAttribute('mindar-image-target')) t = t.parentEl;
      if (t && this.data.tegakOtomatis) {
        this._ditemukan = function () { setTimeout(function () { self.tegakkan(); }, 80); };
        t.addEventListener('targetFound', this._ditemukan);
        this.target = t;
      }
    },

    // putar objek di sekitar sumbu yang dinyatakan dalam ruang dunia (kamera)
    putarDunia: function (sumbuDunia, sudut) {
      var o = this.el.object3D;
      if (!o.parent) return;
      o.parent.getWorldQuaternion(this.qa).invert();
      var sumbu = this.vb.copy(sumbuDunia).applyQuaternion(this.qa).normalize();
      this.qb.setFromAxisAngle(sumbu, sudut);
      o.quaternion.premultiply(this.qb);
    },

    putarLayar: function (dx, dy) {
      var kam = this.el.sceneEl.camera;
      if (!kam) return;
      kam.getWorldQuaternion(this.qc);
      this.putarDunia(this.va.set(0, 1, 0).applyQuaternion(this.qc), dx * 0.01);
      this.putarDunia(this.va.set(1, 0, 0).applyQuaternion(this.qc), dy * 0.01);
    },

    // hadapkan model ke kamera dengan sisi atas model = atas layar
    tegakkan: function () {
      var o = this.el.object3D, kam = this.el.sceneEl.camera;
      if (!o.parent || !kam) return;
      o.parent.updateMatrixWorld(true);
      o.parent.getWorldQuaternion(this.qa).invert();
      kam.getWorldQuaternion(this.qc);
      o.quaternion.copy(this.qa.multiply(this.qc));
      this.skala = 1;
      o.scale.setScalar(1);
    },

    mulai: function (e) {
      if (e.target && e.target.closest && e.target.closest('.ui')) return;
      this.jari[e.pointerId] = [e.clientX, e.clientY];
      this.diam = 0;
      var k = Object.keys(this.jari);
      if (k.length === 2) {
        var a = this.jari[k[0]], b = this.jari[k[1]];
        this.jarakAwal = Math.hypot(a[0] - b[0], a[1] - b[1]);
        this.skalaAwal = this.skala;
      }
      if (k.length === 1) {
        var kini = performance.now();
        if (kini - this.ketukTerakhir < 300) this.tegakkan();
        this.ketukTerakhir = kini;
      }
    },

    gerak: function (e) {
      var lama = this.jari[e.pointerId];
      if (!lama) return;
      var k = Object.keys(this.jari);
      if (k.length === 1) {
        this.putarLayar(e.clientX - lama[0], e.clientY - lama[1]);
      }
      this.jari[e.pointerId] = [e.clientX, e.clientY];
      if (k.length === 2 && this.data.cubit && this.jarakAwal > 0) {
        var a = this.jari[k[0]], b = this.jari[k[1]];
        this.skala = Math.max(0.3, Math.min(3, this.skalaAwal * Math.hypot(a[0] - b[0], a[1] - b[1]) / this.jarakAwal));
        this.el.object3D.scale.setScalar(this.skala);
      }
    },

    selesai: function (e) {
      delete this.jari[e.pointerId];
      this.jarakAwal = 0;
    },

    tick: function (waktu, dt) {
      if (!this.data.otomatis || Object.keys(this.jari).length) return;
      this.diam += dt || 16;
      if (this.diam > 2500) this.putarLayar((dt || 16) * 0.025, 0);
    },

    remove: function () {
      window.removeEventListener('pointerdown', this._mulai);
      window.removeEventListener('pointermove', this._gerak);
      window.removeEventListener('pointerup', this._selesai);
      window.removeEventListener('pointercancel', this._selesai);
      if (this.target && this._ditemukan) this.target.removeEventListener('targetFound', this._ditemukan);
    }
  });

  // Lampu utama + bidang penangkap bayangan (bayangan model jatuh ke marker / lantai)
  AFRAME.registerComponent('bayangan', {
    schema: {
      bidang: { type: 'string', default: 'marker' }, // 'marker' = bidang XY (permukaan marker), 'lantai' = bidang XZ
      tinggi: { type: 'number', default: 0 },          // posisi bidang (z untuk marker, y untuk lantai)
      kekuatan: { type: 'number', default: 3 },
      gelap: { type: 'number', default: 0.38 }
    },
    init: function () {
      var scene = this.el.sceneEl;
      var aktifkan = function () {
        var r = scene.renderer;
        r.shadowMap.enabled = true;
        r.shadowMap.type = THREE.PCFSoftShadowMap;
      };
      if (scene.renderer) aktifkan(); else scene.addEventListener('render-target-loaded', aktifkan);

      var lampu = new THREE.DirectionalLight(0xffffff, this.data.kekuatan);
      if (this.data.bidang === 'marker') lampu.position.set(0.7, 1.3, 2.2);
      else lampu.position.set(0.8, 2.2, 1.4);
      lampu.castShadow = true;
      lampu.shadow.mapSize.set(1024, 1024);
      var sc = lampu.shadow.camera;
      sc.left = -1.3; sc.right = 1.3; sc.top = 1.3; sc.bottom = -1.3; sc.near = 0.1; sc.far = 6;
      lampu.shadow.bias = -0.0008;
      lampu.shadow.normalBias = 0.02;
      var sasaran = new THREE.Object3D();
      if (this.data.bidang === 'marker') sasaran.position.set(0, 0, 0.3);
      lampu.target = sasaran;

      var bidang = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.ShadowMaterial({ opacity: this.data.gelap }));
      bidang.receiveShadow = true;
      if (this.data.bidang === 'marker') bidang.position.z = this.data.tinggi;
      else { bidang.rotation.x = -Math.PI / 2; bidang.position.y = this.data.tinggi; }

      var g = new THREE.Group();
      g.add(lampu); g.add(sasaran); g.add(bidang);
      this.el.setObject3D('bayangan', g);
      this.lampu = lampu;
    },
    remove: function () { this.el.removeObject3D('bayangan'); }
  });
})();
