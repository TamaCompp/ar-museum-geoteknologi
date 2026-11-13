/*
 * GEOLOGI 3D
 * ----------
 * Membuat model 3D batuan & fosil langsung dengan kode (tanpa file .glb):
 *   - bentuk luar dari bola yang diberi potongan bidang (faset) + noise,
 *   - tekstur luar & tekstur bidang potong digambar per piksel,
 *   - model selalu terdiri dari 2 belahan, jadi bisa "dibelah" untuk melihat isinya.
 *
 * Pemakaian:
 *   const model = Geologi3D.buat(THREE, 'granit');
 *   scene.add(model.grup);
 *   model.setBelah(0..1);   // 0 = utuh, 1 = terbelah penuh
 *   model.buang();          // bebaskan memori
 *
 * Resep yang tersedia: granit, geode, batubara, amonit, kayu
 */
(function (global) {
  'use strict';

  var PI = Math.PI, TAU = Math.PI * 2;

  // ------------------------------------------------------------------
  // 1. Angka acak & noise
  // ------------------------------------------------------------------
  function acak(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash3(x, y, z, s) {
    var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^
            Math.imul(z | 0, 1440662683) ^ Math.imul(s | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  function noise3(x, y, z, s) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = x - xi, yf = y - yi, zf = z - zi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    var c000 = hash3(xi, yi, zi, s), c100 = hash3(xi + 1, yi, zi, s);
    var c010 = hash3(xi, yi + 1, zi, s), c110 = hash3(xi + 1, yi + 1, zi, s);
    var c001 = hash3(xi, yi, zi + 1, s), c101 = hash3(xi + 1, yi, zi + 1, s);
    var c011 = hash3(xi, yi + 1, zi + 1, s), c111 = hash3(xi + 1, yi + 1, zi + 1, s);
    var x00 = c000 + (c100 - c000) * u, x10 = c010 + (c110 - c010) * u;
    var x01 = c001 + (c101 - c001) * u, x11 = c011 + (c111 - c011) * u;
    var y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
    return (y0 + (y1 - y0) * w) * 2 - 1; // -1 .. 1
  }

  function fbm(x, y, z, s, okt) {
    var a = 0, amp = 0.5, f = 1;
    for (var i = 0; i < okt; i++) {
      a += amp * noise3(x * f, y * f, z * f, s + i * 17);
      f *= 2.03; amp *= 0.5;
    }
    return a; // kira-kira -1 .. 1
  }

  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function frac(x) { return x - Math.floor(x); }
  function hex(h) {
    var n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function campur(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function kali(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }
  function smin(a, b, k) {
    var h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  }
  function arahAcak(rnd) {
    var z = rnd() * 2 - 1, t = rnd() * TAU, r = Math.sqrt(1 - z * z);
    return [r * Math.cos(t), z, r * Math.sin(t)];
  }

  // Potongan bidang (faset): membuat permukaan batu bersudut seperti pecahan alami
  function buatFaset(rnd, jumlah, min, max) {
    var hasil = [];
    for (var i = 0; i < jumlah; i++) hasil.push({ n: arahAcak(rnd), off: min + rnd() * (max - min) });
    return hasil;
  }
  function potong(d, faset, r, k) {
    for (var i = 0; i < faset.length; i++) {
      var f = faset[i];
      var p = d[0] * f.n[0] + d[1] * f.n[1] + d[2] * f.n[2];
      if (p > 1e-4) r = smin(r, f.off / p, k);
    }
    return r;
  }

  // Worley/Voronoi 2D sederhana (untuk kristal di bidang potong)
  function voronoi2(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y);
    var f1 = 9, f2 = 9, id = 0;
    for (var j = -1; j <= 1; j++) {
      for (var i = -1; i <= 1; i++) {
        var cx = xi + i, cy = yi + j;
        var px = cx + hash3(cx, cy, 1, s), py = cy + hash3(cx, cy, 2, s);
        var dx = px - x, dy = py - y, dd = dx * dx + dy * dy;
        if (dd < f1) { f2 = f1; f1 = dd; id = hash3(cx, cy, 3, s); }
        else if (dd < f2) { f2 = dd; }
      }
    }
    return { f1: Math.sqrt(f1), f2: Math.sqrt(f2), id: id };
  }
  // Voronoi 3D untuk bintik kristal di permukaan luar
  function voronoi3id(x, y, z, s) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var best = 9, id = 0, best2 = 9;
    for (var k = -1; k <= 1; k++) for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
      var cx = xi + i, cy = yi + j, cz = zi + k;
      var px = cx + hash3(cx, cy, cz, s), py = cy + hash3(cx, cy, cz, s + 1), pz = cz + hash3(cx, cy, cz, s + 2);
      var dx = px - x, dy = py - y, dz = pz - z, dd = dx * dx + dy * dy + dz * dz;
      if (dd < best) { best2 = best; best = dd; id = hash3(cx, cy, cz, s + 3); }
      else if (dd < best2) best2 = dd;
    }
    return { id: id, tepi: Math.sqrt(best2) - Math.sqrt(best) };
  }


  // ------------------------------------------------------------------
  // 1b. Bagian tambahan (kristal, gigi, gading) sebagai daftar segitiga
  //     jenis 'cembung' : bentuk cembung, ikut terpotong & punya bidang potong sendiri
  //     jenis 'utuh'    : tidak dipotong, masuk ke belahan sesuai posisinya (gading)
  // ------------------------------------------------------------------
  function tV(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function kV(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function sV(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function silang(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function titik(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function nV(a) { var l = Math.sqrt(titik(a, a)) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }
  function lV(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function basis(arah) {
    var bantu = Math.abs(arah[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    var u = nV(silang(arah, bantu));
    return [u, silang(arah, u)];
  }
  function linear(hexWarna) {
    return hex(hexWarna).map(function (c) { return Math.pow(c / 255, 2.2); });
  }

  // prisma heksagonal + ujung piramida (kristal kuarsa/beril)
  function prisma(pangkal, arah, panjang, jari, ujung, putar, warnaFn, bahan) {
    arah = nV(arah);
    var b = basis(arah), u = b[0], v = b[1];
    function cincin(c) {
      var p = [];
      for (var i = 0; i < 6; i++) {
        var a = putar + i * PI / 3;
        p.push(tV(c, tV(sV(u, Math.cos(a) * jari), sV(v, Math.sin(a) * jari))));
      }
      return p;
    }
    var atas = tV(pangkal, sV(arah, panjang));
    var r0 = cincin(pangkal), r1 = cincin(atas), puncak = tV(atas, sV(arah, ujung));
    var tri = [];
    for (var i = 0; i < 6; i++) {
      var j = (i + 1) % 6;
      tri.push([pangkal, r0[j], r0[i]]);
      tri.push([r0[i], r0[j], r1[j]]);
      tri.push([r0[i], r1[j], r1[i]]);
      if (ujung > 0.001) tri.push([r1[i], r1[j], puncak]);
      else tri.push([r1[i], r1[j], atas]);
    }
    var total = panjang + Math.max(ujung, 0);
    return {
      jenis: 'cembung', bahan: bahan, tri: tri,
      warna: warnaFn ? function (p) { return warnaFn(titik(kV(p, pangkal), arah) / total); } : null
    };
  }

  // balok (gigi)
  function balok(pusat, ukuran, bahan, warna) {
    var hx = ukuran[0] / 2, hy = ukuran[1] / 2, hz = ukuran[2] / 2;
    var p = [];
    for (var i = 0; i < 8; i++) p.push([pusat[0] + (i & 1 ? hx : -hx), pusat[1] + (i & 2 ? hy : -hy), pusat[2] + (i & 4 ? hz : -hz)]);
    var f = [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]];
    var tri = [];
    f.forEach(function (q) { tri.push([p[q[0]], p[q[1]], p[q[2]]]); tri.push([p[q[0]], p[q[2]], p[q[3]]]); });
    return { jenis: 'cembung', bahan: bahan, tri: tri, warna: warna ? function () { return warna; } : null };
  }

  // tabung melengkung meruncing (gading) dari titik kontrol Catmull-Rom
  function tabung(kontrol, jariFn, nPanjang, nKeliling, warnaFn, bahan) {
    function titikKurva(t) {
      var n = kontrol.length - 1, x = t * n, i = Math.min(Math.floor(x), n - 1), f = x - i;
      var p0 = kontrol[Math.max(i - 1, 0)], p1 = kontrol[i], p2 = kontrol[i + 1], p3 = kontrol[Math.min(i + 2, n)];
      var f2 = f * f, f3 = f2 * f;
      var hasil = [];
      for (var k = 0; k < 3; k++) {
        hasil.push(0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * f + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * f2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * f3));
      }
      return hasil;
    }
    var pusat = [], arahT = [];
    for (var i = 0; i <= nPanjang; i++) pusat.push(titikKurva(i / nPanjang));
    for (i = 0; i <= nPanjang; i++) arahT.push(nV(kV(pusat[Math.min(i + 1, nPanjang)], pusat[Math.max(i - 1, 0)])));
    var N = basis(arahT[0])[0], cincin = [], norm = [];
    for (i = 0; i <= nPanjang; i++) {
      var T = arahT[i];
      N = nV(kV(N, sV(T, titik(N, T))));
      var Bv = silang(T, N), r = jariFn(i / nPanjang), ring = [], nr = [];
      for (var k = 0; k <= nKeliling; k++) {
        var a = TAU * k / nKeliling;
        var dir = tV(sV(N, Math.cos(a)), sV(Bv, Math.sin(a)));
        ring.push(tV(pusat[i], sV(dir, r))); nr.push(dir);
      }
      cincin.push(ring); norm.push(nr);
    }
    var tri = [], normal = [], uvt = [];
    for (i = 0; i < nPanjang; i++) for (k = 0; k < nKeliling; k++) {
      var a0 = cincin[i][k], a1 = cincin[i][k + 1], b0 = cincin[i + 1][k], b1 = cincin[i + 1][k + 1];
      var na0 = norm[i][k], na1 = norm[i][k + 1], nb0 = norm[i + 1][k], nb1 = norm[i + 1][k + 1];
      tri.push([a0, b0, a1]); normal.push([na0, nb0, na1]); uvt.push([[i / nPanjang, k / nKeliling], [(i + 1) / nPanjang, k / nKeliling], [i / nPanjang, (k + 1) / nKeliling]]);
      tri.push([a1, b0, b1]); normal.push([na1, nb0, nb1]); uvt.push([[i / nPanjang, (k + 1) / nKeliling], [(i + 1) / nPanjang, k / nKeliling], [(i + 1) / nPanjang, (k + 1) / nKeliling]]);
    }
    // tutup pangkal
    var nb = sV(arahT[0], -1);
    for (k = 0; k < nKeliling; k++) {
      tri.push([pusat[0], cincin[0][k + 1], cincin[0][k]]); normal.push([nb, nb, nb]);
      uvt.push([[0, 0], [0, (k + 1) / nKeliling], [0, k / nKeliling]]);
    }
    // pastikan menghadap keluar
    for (i = 0; i < tri.length; i++) {
      var t3 = tri[i], nn = silang(kV(t3[1], t3[0]), kV(t3[2], t3[0]));
      if (titik(nn, normal[i][0]) < 0) {
        tri[i] = [t3[0], t3[2], t3[1]]; normal[i] = [normal[i][0], normal[i][2], normal[i][1]]; uvt[i] = [uvt[i][0], uvt[i][2], uvt[i][1]];
      }
    }
    return {
      jenis: 'utuh', bahan: bahan, tri: tri, normal: normal,
      warna: warnaFn ? function (p, uv) { return warnaFn(uv[0], uv[1], p); } : null, uvt: uvt
    };
  }

  // potong poligon segitiga terhadap bidang x = 0, simpan sisi (sisi * x >= 0)
  function klip(ps, cs, sisi) {
    var keluar = [], warna = [];
    for (var i = 0; i < ps.length; i++) {
      var a = ps[i], b = ps[(i + 1) % ps.length];
      var da = sisi * a[0], db = sisi * b[0];
      if (da >= 0) { keluar.push(a); warna.push(cs ? cs[i] : null); }
      if ((da >= 0) !== (db >= 0)) {
        var t = da / (da - db);
        var p = lV(a, b, t); p[0] = 0;
        keluar.push(p); warna.push(cs ? lV(cs[i], cs[(i + 1) % ps.length], t) : null);
      }
    }
    return { p: keluar, c: warna };
  }

  // selubung cembung 2D (monotone chain), titik [z, y], hasil berlawanan jarum jam
  function selubung(titikList) {
    var p = titikList.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    if (p.length < 3) return p;
    function cr(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var bawah = [], atas = [];
    for (var i = 0; i < p.length; i++) {
      while (bawah.length >= 2 && cr(bawah[bawah.length - 2], bawah[bawah.length - 1], p[i]) <= 1e-12) bawah.pop();
      bawah.push(p[i]);
    }
    for (i = p.length - 1; i >= 0; i--) {
      while (atas.length >= 2 && cr(atas[atas.length - 2], atas[atas.length - 1], p[i]) <= 1e-12) atas.pop();
      atas.push(p[i]);
    }
    atas.pop(); bawah.pop();
    return bawah.concat(atas);
  }

  // ------------------------------------------------------------------
  // 2. Resep tiap koleksi
  //    radius(d)            -> jarak permukaan pada arah d (vektor satuan)
  //    luar(d, p)           -> [r,g,b, bump] warna permukaan luar (p = posisi)
  //    dalam(y, z, s, a)    -> [r,g,b, bump] warna bidang potong
  //                            s = 0 di tengah .. 1 di tepi, a = sudut
  // ------------------------------------------------------------------
  var RESEP = {};

  // ---------- GRANIT ----------
  RESEP.granit = function () {
    var rnd = acak(11);
    var faset = buatFaset(rnd, 12, 0.62, 0.9);
    var M = {
      kuarsa: hex('#9c9d9b'), ortoklas: hex('#d49a86'), plagioklas: hex('#e6e1d6'),
      biotit: hex('#1f1c1a'), hornblende: hex('#34402f')
    };
    function mineral(id) {
      if (id < 0.30) return M.kuarsa;
      if (id < 0.62) return M.ortoklas;
      if (id < 0.82) return M.plagioklas;
      if (id < 0.94) return M.biotit;
      return M.hornblende;
    }
    return {
      skala: [1.15, 0.82, 1.0], kasarLuar: 0.82, kasarDalam: 0.32, bump: 0.012,
      radius: function (d) {
        var r = potong(d, faset, 1, 0.05);
        r *= 1 + 0.05 * fbm(d[0] * 3, d[1] * 3, d[2] * 3, 5, 3) + 0.012 * fbm(d[0] * 14, d[1] * 14, d[2] * 14, 9, 2);
        return r;
      },
      luar: function (d) {
        var v = voronoi3id(d[0] * 26, d[1] * 26, d[2] * 26, 21);
        var c = mineral(v.id);
        var lapuk = 0.18 + 0.12 * fbm(d[0] * 4, d[1] * 4, d[2] * 4, 3, 3);
        c = campur(c, [178, 160, 138], clamp(lapuk, 0, 0.4)); // lapuk kecokelatan
        c = kali(c, 0.92 + 0.12 * hash3(v.id * 1e6, 1, 2, 7) - (v.tepi < 0.06 ? 0.15 : 0));
        return [c[0], c[1], c[2], 0.5 + 0.35 * v.id - (v.tepi < 0.06 ? 0.3 : 0)];
      },
      dalam: function (y, z) {
        var v = voronoi2(z * 15, y * 15, 31);
        var c = mineral(v.id);
        var serat = fbm(z * 40, y * 40, v.id * 9, 4, 2);
        c = kali(c, 0.9 + 0.1 * hash3(v.id * 1e6, 4, 4, 2) + 0.06 * serat);
        if (v.f2 - v.f1 < 0.035) c = kali(c, 0.72); // batas antar kristal
        return [c[0], c[1], c[2], 0.5];
      }
    };
  };

  // ---------- GEODE AMETIS ----------
  RESEP.geode = function () {
    var rnd = acak(23);
    var faset = buatFaset(rnd, 6, 0.82, 0.96);
    var kulit = hex('#7a6a58'), kulit2 = hex('#5f5244'), agat = hex('#b9c3c8'), agat2 = hex('#e9ebea'),
        agat3 = hex('#8f99a1'), ungu = hex('#7d4f9e'), pucat = hex('#d9d4de'), rongga = hex('#2a1f33');
    return {
      skala: [1.0, 0.9, 1.05], kasarLuar: 0.95, kasarDalam: 0.25, bump: 0.02, kristal: true,
      radius: function (d) {
        var r = potong(d, faset, 1, 0.12);
        r *= 1 + 0.12 * fbm(d[0] * 2.2, d[1] * 2.2, d[2] * 2.2, 41, 3) + 0.03 * fbm(d[0] * 9, d[1] * 9, d[2] * 9, 43, 2);
        return r;
      },
      luar: function (d) {
        var n = fbm(d[0] * 5, d[1] * 5, d[2] * 5, 51, 4);
        var c = campur(hex('#8f7f69'), kulit2, smoothstep(-0.3, 0.5, n));
        var lubang = fbm(d[0] * 30, d[1] * 30, d[2] * 30, 53, 2);
        if (lubang > 0.35) c = kali(c, 0.75);
        if (hash3(Math.floor(d[0] * 90), Math.floor(d[1] * 90), Math.floor(d[2] * 90), 55) > 0.985) c = campur(c, [225, 220, 210], 0.7);
        return [c[0], c[1], c[2], 0.5 + 0.4 * n - (lubang > 0.35 ? 0.3 : 0)];
      },
      dalam: function (y, z, s, a) {
        var s2 = s + 0.05 * fbm(y * 3, z * 3, 1, 61, 3);
        var c, b = 0.5;
        if (s2 > 0.88) {
          c = campur(kulit, kulit2, 0.5 + 0.5 * fbm(y * 12, z * 12, 2, 63, 3));
        } else if (s2 > 0.74) {
          var t = (s2 - 0.74) / 0.14;
          var pita = Math.sin(t * TAU * 4.5 + 2 * fbm(y * 6, z * 6, 3, 65, 2));
          c = campur(agat, agat2, 0.5 + 0.5 * pita);
          if (pita > 0.85) c = campur(c, agat3, 0.6);
        } else if (s2 > 0.42) {
          var q = (s2 - 0.42) / 0.32; // 0 dalam .. 1 luar
          c = campur(ungu, pucat, Math.pow(q, 1.6));
          var sel = Math.floor(a * 46 / TAU + q * 2.5);
          var terang = 0.78 + 0.4 * hash3(sel, Math.floor(q * 3), 0, 67);
          c = kali(c, terang);
          if (frac(a * 46 / TAU + q * 2.5) < 0.05) c = kali(c, 0.7);
          b = terang * 0.6;
        } else {
          var kedalaman = s2 / 0.42;
          c = kali(rongga, 0.6 + 0.6 * kedalaman + 0.25 * fbm(y * 20, z * 20, 4, 69, 2));
          b = 0.2;
        }
        return [c[0], c[1], c[2], b];
      }
    };
  };

  // ---------- BATU BARA ----------
  RESEP.batubara = function () {
    var rnd = acak(37);
    var faset = [
      { n: [1, 0, 0], off: 0.8 }, { n: [-1, 0, 0], off: 0.76 },
      { n: [0, 1, 0], off: 0.74 }, { n: [0, -1, 0], off: 0.78 },
      { n: [0, 0, 1], off: 0.82 }, { n: [0, 0, -1], off: 0.8 }
    ].concat(buatFaset(rnd, 6, 0.82, 0.95));
    var vitrain = hex('#0d0d10'), clarain = hex('#1b1b1f'), durain = hex('#2b2a2e'),
        fusain = hex('#454039'), pirit = hex('#c9a93c'), cleat = hex('#5d5a55');
    function lapisan(L) {
      var h = hash3(Math.floor(L), 3, 5, 71);
      if (h < 0.35) return 'v';
      if (h < 0.6) return 'c';
      if (h < 0.85) return 'd';
      return 'f';
    }
    return {
      skala: [1.2, 0.82, 0.95], kasarLuar: 0.5, kasarDalam: 0.3, bump: 0.015,
      radius: function (d) {
        var r = potong(d, faset, 1, 0.02);
        r *= 1 + 0.025 * fbm(d[0] * 4, d[1] * 4, d[2] * 4, 73, 3) + 0.01 * fbm(d[0] * 20, d[1] * 20, d[2] * 20, 75, 2);
        return r;
      },
      luar: function (d, p) {
        var L = p[1] * 15 + 0.8 * fbm(d[0] * 2, d[1] * 2, d[2] * 2, 77, 3);
        var jenis = lapisan(L);
        var c = jenis === 'v' ? vitrain : jenis === 'c' ? clarain : jenis === 'd' ? durain : fusain;
        c = kali(c, 1.15 + 0.25 * fbm(d[0] * 12, d[1] * 12, d[2] * 12, 79, 2));
        if (fbm(d[0] * 3, d[1] * 3, d[2] * 3, 81, 3) > 0.42) c = campur(c, hex('#5a4632'), 0.35);
        return [c[0], c[1], c[2], jenis === 'v' ? 0.7 : 0.4 + 0.2 * fbm(d[0] * 25, d[1] * 25, d[2] * 25, 83, 2)];
      },
      dalam: function (y, z, s) {
        var L = y * 15 + 0.9 * fbm(z * 1.5, y * 1.5, 0, 85, 3);
        var jenis = lapisan(L);
        var c, b = 0.5;
        if (jenis === 'v') { c = kali(vitrain, 1 + 0.6 * Math.max(0, fbm(z * 8, y * 8, 1, 87, 2))); b = 0.6; }
        else if (jenis === 'c') { c = clarain; }
        else if (jenis === 'd') { c = kali(durain, 0.95 + 0.15 * fbm(z * 30, y * 30, 2, 89, 2)); b = 0.45; }
        else { c = kali(fusain, 0.8 + 0.35 * noise3(z * 45, y * 5, 3, 91)); b = 0.35; }
        if ((jenis === 'v' || jenis === 'c') && frac(z * 7 + 0.15 * fbm(y * 3, z, 4, 93, 2)) < 0.025) {
          c = campur(c, cleat, 0.65); b = 0.2;
        }
        var px = Math.floor(z * 55), py = Math.floor(y * 55);
        if (hash3(px, py, 9, 95) > 0.993) { c = pirit; b = 0.8; }
        if (s > 0.96) c = campur(c, hex('#4a3e30'), 0.4);
        return [c[0], c[1], c[2], b];
      }
    };
  };

  // ---------- FOSIL AMONIT ----------
  RESEP.amonit = function () {
    var B = Math.log(2.2) / TAU;             // laju pelebaran spiral
    var THMAX = 4.3 * TAU;                   // jumlah putaran
    var A = Math.exp(-B * THMAX);
    var cangkang = hex('#8a6b4a'), cangkang2 = hex('#6e5236'), alur = hex('#4a3626'), sutur = hex('#cdb38c');
    var sedimen = hex('#8b8378'), kalsit = hex('#d9a465'), kalsit2 = hex('#f0d2a0'), kalsit3 = hex('#b07a3f'),
        septa = hex('#efe6d6'), sifunkel = hex('#5a3d26');
    function spiral(rho, a) {
      var r = Math.max(rho, 1e-4);
      var theta = Math.log(r / A) / B;
      var w = (theta - a) / TAU;
      var n = Math.floor(w);
      return { n: n, f: w - n, theta: theta };
    }
    return {
      skala: [0.42, 1, 1], kasarLuar: 0.7, kasarDalam: 0.35, bump: 0.02, pusatAsal: true,
      radius: function (d) {
        var ax = Math.abs(d[0]);
        var a = Math.atan2(d[1], d[2]);
        var r = 1 - 0.3 * smoothstep(0.72, 1.0, ax);       // pusar (umbilikus) cekung
        r *= 1 + 0.028 * Math.sin(a * 26) * Math.pow(1 - ax, 1.5); // rusuk
        r *= 1 + 0.012 * fbm(d[0] * 6, d[1] * 6, d[2] * 6, 101, 2);
        return r;
      },
      luar: function (d) {
        var ax = Math.abs(d[0]);
        var rho = Math.sqrt(d[1] * d[1] + d[2] * d[2]);
        var a = Math.atan2(d[1], d[2]);
        var c = campur(cangkang, cangkang2, 0.5 + 0.5 * fbm(d[0] * 5, d[1] * 5, d[2] * 5, 103, 3));
        var rusuk = Math.sin(a * 26);
        c = kali(c, 0.92 + 0.12 * rusuk * (1 - ax));
        var b = 0.5 + 0.3 * rusuk * (1 - ax);
        if (ax > 0.3) {
          var sp = spiral(rho, a);
          if (sp.f < 0.06) { c = alur; b = 0.1; }
        }
        if (frac(a * 11 / TAU + 0.03 * Math.sin(rho * 60 + a * 3)) < 0.012) c = campur(c, sutur, 0.8);
        return [c[0], c[1], c[2], b];
      },
      dalam: function (y, z, s, a) {
        if (s < 0.03 || s > 0.965) return [cangkang2[0], cangkang2[1], cangkang2[2], 0.5];
        var sp = spiral(s, a);
        var c, b = 0.5;
        var thetaUjung = a + TAU * (sp.n + 1);
        if (sp.f < 0.07) { c = kali(cangkang2, 0.9 + 0.2 * noise3(y * 30, z * 30, 1, 105)); b = 0.7; }
        else if (thetaUjung > THMAX + 0.35 * TAU) {
          c = kali(sedimen, 0.9 + 0.2 * fbm(y * 15, z * 15, 2, 107, 3)); b = 0.4;
        } else if (Math.abs(sp.f - 0.14) < 0.025) {
          c = sifunkel; b = 0.3;
        } else {
          var g = frac((a + TAU * sp.n) / (TAU / 12) + 0.28 * sp.f);
          if (g < 0.035) { c = septa; b = 0.8; }
          else {
            var v = voronoi2(z * 30, y * 30, 109);
            c = campur(kalsit, kalsit2, v.id);
            var tengah = 1 - Math.abs(sp.f - 0.55) * 2.2;
            if (tengah > 0.6) c = campur(c, kalsit3, (tengah - 0.6) * 1.5);
            if (v.f2 - v.f1 < 0.05) c = kali(c, 0.85);
            b = 0.5 + 0.3 * v.id;
          }
        }
        return [c[0], c[1], c[2], b];
      }
    };
  };

  // ---------- FOSIL KAYU ----------
  RESEP.kayu = function () {
    var R = 0.55, L = 1.0;
    var kulit = hex('#4a3b2f'), kulit2 = hex('#6b5a48'), kulit3 = hex('#2f2620'), kilau = hex('#a89a84'),
        terang = hex('#d8c7a6'), madu = hex('#c98a4b'), gelap = hex('#8a5a32'), besi = hex('#9c4a2a'),
        jari = hex('#e3cfae'), retak = hex('#2c241d'), empulur = hex('#5a4632');
    var retakan = [0.3, 1.9, 3.2, 4.4, 5.6];
    function cincin(y, z, s, a) {
      var s2 = s + 0.03 * fbm(y * 4, z * 4, 0, 121, 3);
      var c, b = 0.5;
      if (s2 > 0.9) { c = campur(kulit, kulit3, 0.5 + 0.5 * fbm(y * 20, z * 20, 1, 123, 2)); b = 0.3; }
      else if (s2 < 0.04) { c = empulur; }
      else {
        var posisi = s2 * 16 + 0.5 * fbm(y * 2, z * 2, 2, 125, 3);
        var f = frac(posisi);
        c = campur(terang, madu, 0.5 + 0.5 * fbm(y * 3, z * 3, 3, 127, 3));
        if (f > 0.78) { c = campur(c, gelap, 0.75); b = 0.35; }
        var oks = fbm(y * 1.5, z * 1.5, 4, 129, 3);
        if (oks > 0.15) c = campur(c, besi, clamp((oks - 0.15) * 2.2, 0, 0.6));
        if (frac(a * 60 / TAU + 0.3 * fbm(y * 2, z * 2, 5, 131, 2)) < 0.05) c = campur(c, jari, 0.35);
        for (var i = 0; i < retakan.length; i++) {
          var da = Math.abs(((a - retakan[i]) % TAU + TAU + PI) % TAU - PI);
          if (s2 > 0.35 && da < 0.012 * (1.2 - s2)) { c = retak; b = 0.1; }
        }
      }
      return [c[0], c[1], c[2], b];
    }
    return {
      skala: [1, 1, 1], kasarLuar: 0.88, kasarDalam: 0.3, bump: 0.02, pusatAsal: true,
      jariJari: R,
      radius: function (d) {
        var rho = Math.sqrt(d[1] * d[1] + d[2] * d[2]);
        var ax = Math.abs(d[0]);
        var r = smin(R / Math.max(rho, 1e-4), L / Math.max(ax, 1e-4), 0.06);
        r *= 1 + 0.03 * fbm(d[0] * 2, d[1] * 10, d[2] * 10, 133, 3) * smoothstep(0.3, 0.9, rho);
        r *= 1 + 0.04 * fbm(d[0] * 3, d[1] * 3, d[2] * 3, 135, 3) * smoothstep(0.5, 0.95, ax);
        return Math.min(r, 3);
      },
      luar: function (d, p) {
        var rho = Math.sqrt(d[1] * d[1] + d[2] * d[2]);
        var ax = Math.abs(d[0]);
        var ujung = (L / Math.max(ax, 1e-4)) < (R / Math.max(rho, 1e-4));
        if (ujung) {
          var py = p[1], pz = p[2];
          var sr = Math.sqrt(py * py + pz * pz) / R;
          return cincin(py, pz, Math.min(sr, 1), Math.atan2(py, pz));
        }
        var alur2 = fbm(d[0] * 1.5, d[1] * 9, d[2] * 9, 137, 4);
        var c = campur(kulit2, kulit, smoothstep(-0.2, 0.3, alur2));
        if (alur2 > 0.3) c = campur(c, kulit3, 0.6);
        if (fbm(d[0] * 20, d[1] * 20, d[2] * 20, 139, 2) > 0.4) c = campur(c, kilau, 0.35);
        return [c[0], c[1], c[2], 0.5 - 0.6 * alur2];
      },
      dalam: cincin
    };
  };

  // ==================================================================
  //  KOLEKSI MUSEUM UPN
  // ==================================================================

  // ---------- KRISTAL KUARSA (gerombol kristal di atas batuan induk) ----------
  RESEP.kuarsa = function () {
    var rnd = acak(201);
    var faset = buatFaset(rnd, 8, 0.7, 0.95);
    var susu = linear('#f1eee8'), bening = linear('#fbfdff'), pangkal = linear('#e9d9cc');
    return {
      skala: [0.95, 0.45, 0.75], kasarLuar: 0.55, kasarDalam: 0.3, bump: 0.012, env: 0.7,
      radius: function (d) {
        var r = potong(d, faset, 1, 0.06);
        r *= 1 + 0.08 * fbm(d[0] * 3, d[1] * 3, d[2] * 3, 203, 3) + 0.02 * fbm(d[0] * 12, d[1] * 12, d[2] * 12, 205, 2);
        return r;
      },
      luar: function (d) {
        var v = voronoi3id(d[0] * 14, d[1] * 14, d[2] * 14, 207);
        var c = campur(hex('#ece8e1'), hex('#d8d2c8'), v.id);
        var noda = fbm(d[0] * 3, d[1] * 3, d[2] * 3, 209, 3) + (d[1] < 0 ? 0.25 : 0);
        if (noda > 0.2) c = campur(c, hex('#d6a07a'), clamp((noda - 0.2) * 1.4, 0, 0.6));
        if (v.tepi < 0.05) c = kali(c, 0.88);
        return [c[0], c[1], c[2], 0.4 + 0.4 * v.id];
      },
      dalam: function (y, z, s) {
        var v = voronoi2(z * 12, y * 12, 211);
        var c = campur(hex('#efece6'), hex('#cfcac2'), v.id * 0.8);
        if (v.id > 0.86) c = hex('#d9a27c');
        if (v.f2 - v.f1 < 0.04) c = kali(c, 0.86);
        if (hash3(Math.floor(z * 70), Math.floor(y * 70), 3, 213) > 0.992) c = hex('#9aa3a8');
        if (s > 0.95) c = campur(c, hex('#d6a07a'), 0.4);
        return [c[0], c[1], c[2], 0.5];
      },
      bahan: {
        kristal: { warna: '#ffffff', vertexWarna: true, kasar: 0.04, opasitas: 0.82, env: 1.8, kilap: true, tutup: 'potongKristal' },
        potongKristal: { peta: 'zonaKuarsa', kasar: 0.08, opasitas: 0.95, env: 1.0, kilap: true }
      },
      gradien: {
        zonaKuarsa: function (s, v) {
          var c = hex('#e3e9ec');
          if (s < 0.32) c = campur(hex('#f4f2ed'), c, s / 0.32);           // inti susu
          [0.45, 0.62, 0.8].forEach(function (z) { if (Math.abs(s - z) < 0.012) c = hex('#aab4b9'); }); // zona tumbuh
          if (hash3(Math.floor(s * 40), Math.floor(v * 80), 1, 215) > 0.965) c = hex('#8e979c');      // inklusi fluida
          if (s > 0.97) c = hex('#ffffff');
          return c;
        }
      },
      tambahan: function (k) {
        var r = acak(217), hasil = [];
        function warnaKristal(keruh) {
          return function (t) {
            var c = t < 0.12 ? lV(pangkal, susu, t / 0.12) : lV(susu, bening, smoothstep(0.15, 0.9, t) * (1 - keruh));
            return c;
          };
        }
        // kristal besar di tengah (pasti terbelah)
        var dasar = k.permukaan([0.02, 1, 0.05]);
        hasil.push(prisma(sV(dasar, 0.55), [0.12, 1, 0.08], 1.35, 0.24, 0.3, 0.2, warnaKristal(0.15), 'kristal'));
        for (var i = 0; i < 15; i++) {
          var d = nV([(r() - 0.5) * 1.7, 0.5 + r() * 0.5, (r() - 0.5) * 1.3]);
          var p = sV(k.permukaan(d), 0.7);
          var arah = [d[0] * 1.1 + (r() - 0.5) * 0.5, 1, d[2] * 0.8 + (r() - 0.5) * 0.4];
          var jari = 0.08 + r() * 0.13;
          hasil.push(prisma(p, arah, 0.45 + r() * 0.85, jari, jari * 1.25, r() * PI, warnaKristal(r() * 0.7), 'kristal'));
        }
        return hasil;
      }
    };
  };

  // ---------- ZAMRUD (kristal beril hijau dalam batuan induk) ----------
  RESEP.zamrud = function () {
    var rnd = acak(301);
    var faset = buatFaset(rnd, 9, 0.68, 0.95);
    var hijau = [hex('#1fa883'), hex('#127a5c'), hex('#3cc79e')];
    var mika = hex('#8d8f8c'), gelap = hex('#3d3d3a'), karat = hex('#7a5a3e');
    return {
      skala: [1.45, 0.75, 0.85], kasarLuar: 0.8, kasarDalam: 0.3, bump: 0.02, env: 0.7, petaKasar: true,
      radius: function (d) {
        var r = potong(d, faset, 1, 0.08);
        r *= 1 + 0.1 * fbm(d[0] * 2.5, d[1] * 2.5, d[2] * 2.5, 303, 3) + 0.03 * fbm(d[0] * 10, d[1] * 10, d[2] * 10, 305, 2);
        return r;
      },
      luar: function (d) {
        var v = voronoi3id(d[0] * 9, d[1] * 9, d[2] * 9, 307);
        var c, kasar, b;
        if (v.id < 0.4) {
          c = hijau[Math.floor(hash3(v.id * 1e6, 1, 1, 309) * 3)];
          c = kali(c, 0.85 + 0.3 * fbm(d[0] * 30, d[1] * 30, d[2] * 30, 311, 2));
          kasar = 0.22; b = 0.7;
        } else {
          var f = voronoi3id(d[0] * 40, d[1] * 40, d[2] * 40, 313);
          c = f.id < 0.5 ? mika : f.id < 0.8 ? gelap : karat;
          c = kali(c, 0.85 + 0.3 * f.id);
          kasar = f.id < 0.5 ? 0.3 : 0.85; b = 0.4 * f.id;
        }
        if (v.tepi < 0.04) { c = kali(c, 0.7); b = 0.1; }
        return [c[0], c[1], c[2], b, kasar];
      },
      dalam: function (y, z, s) {
        var v = voronoi2(z * 4, y * 4, 317);
        var c;
        if (v.id < 0.2) {
          var pusat = clamp(1 - v.f1 * 2.2, 0, 1);
          c = campur(hex('#2fc49a'), hex('#0f7d5c'), pusat);
          if (hash3(Math.floor(z * 60), Math.floor(y * 60), 2, 319) > 0.985) c = hex('#0b4a37');
        } else {
          var f = voronoi2(z * 6, y * 22, 321); // lembaran mika memanjang (foliasi)
          c = f.id < 0.45 ? mika : f.id < 0.75 ? gelap : f.id < 0.9 ? hex('#cfcbc2') : karat;
          if (frac(y * 90 + f.id * 3) < 0.15) c = kali(c, 0.8);
        }
        if (v.f2 - v.f1 < 0.03) c = kali(c, 0.75);
        if (s > 0.96) c = campur(c, karat, 0.4);
        return [c[0], c[1], c[2], 0.5];
      },
      bahan: {
        beril: { warna: '#1aa37a', kasar: 0.12, opasitas: 0.9, env: 1.4, kilap: true, tutup: 'potongBeril' },
        potongBeril: { peta: 'zonaBeril', kasar: 0.1, opasitas: 0.96, env: 1.0, kilap: true }
      },
      gradien: {
        zonaBeril: function (s, v) {
          var c = campur(hex('#0f7d5c'), hex('#36cfa3'), smoothstep(0.1, 0.95, s));
          if (Math.abs(s - 0.55) < 0.015) c = hex('#0d6a4e');
          if (hash3(Math.floor(s * 35), Math.floor(v * 70), 3, 323) > 0.955) c = hex('#0a3b2c'); // inklusi "jardin"
          return c;
        }
      },
      tambahan: function (k) {
        var r = acak(325), hasil = [];
        for (var i = 0; i < 8; i++) {
          var d = nV([(r() - 0.5) * 2, 0.2 + r() * 0.8, (r() - 0.5) * 1.6]);
          if (i === 0) d = nV([0.05, 1, 0.2]);
          var p = sV(k.permukaan(d), 0.78);
          var arah = tV(d, [(r() - 0.5) * 0.5, 0.2, (r() - 0.5) * 0.5]);
          var jari = 0.08 + r() * 0.08;
          hasil.push(prisma(p, arah, 0.25 + r() * 0.25, jari, 0, r() * PI, null, 'beril'));
        }
        return hasil;
      }
    };
  };

  // ---------- BIOTITE (batuan hitam kaya mika dari Antartika) ----------
  RESEP.biotite = function () {
    var rnd = acak(401);
    var faset = buatFaset(rnd, 14, 0.6, 0.92);
    return {
      skala: [1.35, 0.85, 0.8], kasarLuar: 0.6, kasarDalam: 0.3, bump: 0.02, env: 1.1, petaKasar: true,
      radius: function (d) {
        var r = potong(d, faset, 1, 0.03);
        r *= 1 + 0.04 * fbm(d[0] * 4, d[1] * 4, d[2] * 4, 403, 3) + 0.015 * fbm(d[0] * 18, d[1] * 18, d[2] * 18, 405, 2);
        return r;
      },
      luar: function (d) {
        var v = voronoi3id(d[0] * 30, d[1] * 30, d[2] * 30, 407);
        var c, kasar;
        if (v.id < 0.025) { c = hex('#8c8c88'); kasar = 0.6; }
        else if (v.id < 0.04) { c = hex('#d8d3c8'); kasar = 0.7; }
        else {
          c = v.id < 0.7 ? hex('#121110') : v.id < 0.93 ? hex('#22201d') : hex('#4a3a2a');
          kasar = 0.12 + 0.3 * hash3(v.id * 1e6, 3, 3, 409);
        }
        if (v.tepi < 0.05) { c = kali(c, 0.6); kasar = 0.8; }
        return [c[0], c[1], c[2], 0.3 + 0.6 * hash3(v.id * 1e6, 5, 5, 411), kasar];
      },
      dalam: function (y, z) {
        var v = voronoi2(z * 22, y * 8, 413);
        var c;
        if (v.id < 0.86) {
          c = hash3(v.id * 1e6, 1, 2, 415) > 0.75 ? hex('#4a3726') : hex('#1d1a17');
          if (frac(y * 140 + v.id * 7) < 0.25) c = kali(c, 1.35);   // lamela mika
        } else if (v.id < 0.91) c = hex('#9a9b98');
        else if (v.id < 0.95) c = hex('#e2ded4');
        else c = hex('#2f3a2c');
        if (v.f2 - v.f1 < 0.03) c = kali(c, 0.7);
        return [c[0], c[1], c[2], 0.5];
      }
    };
  };

  // ---------- TENGKORAK HOMO ERECTUS (P VIII) ----------
  // sumbu: x = kiri-kanan, y = atas, z = depan (wajah). Dibelah tepat di garis tengah.
  RESEP.homoerectus = function () {
    var arahWajah = nV([0, -0.45, 0.89]);
    var orbit = [nV([0.36, 0.02, 0.93]), nV([-0.36, 0.02, 0.93])];
    var zigo = [nV([0.8, -0.12, 0.55]), nV([-0.8, -0.12, 0.55])];
    var foramen = nV([0, -0.95, -0.3]);
    function dalamOrbit(d) {
      return Math.max(smoothstep(0.955, 0.99, titik(d, orbit[0])), smoothstep(0.955, 0.99, titik(d, orbit[1])));
    }
    function hidung(d) {
      if (d[2] < 0.88) return 0;
      var q = (d[0] / 0.07) * (d[0] / 0.07) + ((d[1] + 0.2) / 0.11) * ((d[1] + 0.2) / 0.11);
      return clamp(1 - q, 0, 1);
    }
    return {
      skala: [1, 1, 1], kasarLuar: 0.75, kasarDalam: 0.5, bump: 0.02, env: 0.45, pusatAsal: true,
      radius: function (d) {
        var ey = d[1] > 0 ? 0.6 : 0.5;
        var r = 1 / Math.sqrt(d[0] * d[0] / 0.49 + d[1] * d[1] / (ey * ey) + d[2] * d[2]);
        r = r + (0.92 - r) * smoothstep(0.8, 0.95, titik(d, arahWajah));               // rahang atas/wajah
        r += 0.07 * smoothstep(0.75, 0.92, d[2]) * Math.exp(-Math.pow((d[1] - 0.17) / 0.07, 2)); // torus alis
        r -= 0.07 * smoothstep(0.35, 0.6, d[2]) * (1 - smoothstep(0.75, 0.9, d[2])) * smoothstep(0.4, 0.8, Math.abs(d[0]));
        r -= 0.16 * dalamOrbit(d);
        r -= 0.12 * hidung(d);
        r += 0.05 * smoothstep(0.85, 0.97, -d[2]) * Math.exp(-Math.pow((d[1] + 0.05) / 0.1, 2)); // torus oksipital
        r += 0.06 * Math.max(smoothstep(0.96, 0.99, titik(d, zigo[0])), smoothstep(0.96, 0.99, titik(d, zigo[1])));
        r *= 1 - 0.1 * smoothstep(0.6, 0.95, -d[1]);
        r -= 0.1 * smoothstep(0.985, 0.997, titik(d, foramen));
        r += 0.02 * Math.exp(-Math.pow(d[0] / 0.06, 2)) * smoothstep(0.5, 0.9, d[1]);   // lunas sagital
        r *= 1 + 0.012 * fbm(d[0] * 5, d[1] * 5, d[2] * 5, 501, 3);
        return r;
      },
      luar: function (d) {
        var n = fbm(d[0] * 4, d[1] * 4, d[2] * 4, 503, 4);
        var c = campur(hex('#d9a05a'), hex('#a8743c'), smoothstep(-0.4, 0.4, n));
        if (fbm(d[0] * 2.5, d[1] * 2.5, d[2] * 2.5, 505, 3) > 0.28) c = campur(c, hex('#6d6a62'), 0.45);  // noda matriks
        var ao = Math.max(dalamOrbit(d), hidung(d));
        c = kali(c, 1 - 0.55 * ao);
        var b = 0.5 + 0.3 * n;
        if (Math.abs(fbm(d[0] * 6, d[1] * 6, d[2] * 6, 507, 3)) < 0.012) { c = hex('#4a3020'); b = 0.05; } // retakan
        return [c[0], c[1], c[2], b];
      },
      dalam: function (y, z, s) {
        var c, b = 0.5;
        var wajah = z > 0.5 && y < 0.15;
        function spons() {
          var v = voronoi2(z * 30, y * 30, 509);
          return v.f1 < 0.32 ? hex('#6e4a2c') : hex('#c99a5e');
        }
        if (s > 0.97) { c = hex('#e3c08a'); b = 0.7; }
        else if (s > 0.9) { c = spons(); b = 0.4; }
        else if (s > 0.86 && !wajah) { c = hex('#dcb683'); b = 0.6; }
        else if (!wajah) {
          var g = voronoi2(z * 45, y * 45, 511);
          c = campur(hex('#8a8170'), hex('#6f675a'), g.id);   // endapan pengisi rongga otak
          b = 0.3;
        } else {
          c = spons();
          var hx = (z - 0.72) / 0.12, hy = (y + 0.2) / 0.16;
          if (hx * hx + hy * hy < 1) { c = hex('#3a2a1e'); b = 0.1; }               // rongga hidung
          if (y < -0.36 && y > -0.44) { c = hex('#d8b47e'); b = 0.7; }              // langit-langit
        }
        var sx = (z - 0.78) / 0.08, sy = (y - 0.2) / 0.07;
        if (sx * sx + sy * sy < 1) { c = hex('#4a3424'); b = 0.1; }                  // sinus frontal
        return [c[0], c[1], c[2], b];
      },
      bahan: { gigi: { warna: '#c9b48a', kasar: 0.35, env: 0.6 } },
      tambahan: function () {
        var hasil = [];
        [1, -1].forEach(function (s) {
          for (var i = 0; i < 6; i++) {
            var t = i / 5;
            var x = s * (0.035 + 0.17 * Math.sin(t * PI / 2));
            var z = 0.8 - 0.36 * t;
            hasil.push(balok([x, -0.5, z], [0.045 + 0.02 * t, 0.07 - 0.015 * t, 0.05 + 0.025 * t], 'gigi'));
          }
        });
        return hasil;
      }
    };
  };

  // ---------- KEPALA GAJAH PURBA (Gajah Blora, Elephas hysudrindicus) ----------
  RESEP.gajah = function () {
    var dahi = [{ n: nV([0, 0.25, 1]), off: 0.66 }, { n: nV([0, 0.1, -1]), off: 0.74 }];
    var gadingArah = [nV([0.32, -0.7, 0.64]), nV([-0.32, -0.7, 0.64])];
    var orbit = [nV([0.82, 0.08, 0.55]), nV([-0.82, 0.08, 0.55])];
    var zigo = [nV([0.85, -0.2, 0.4]), nV([-0.85, -0.2, 0.4])];
    return {
      skala: [1, 1, 1], kasarLuar: 0.8, kasarDalam: 0.5, bump: 0.022, env: 0.4, pusatAsal: true,
      radius: function (d) {
        var ey = d[1] > 0 ? 0.95 : 0.7, ez = d[2] > 0 ? 0.72 : 0.8;
        var r = 1 / Math.sqrt(d[0] * d[0] / 0.6084 + d[1] * d[1] / (ey * ey) + d[2] * d[2] / (ez * ez));
        r = potong(d, dahi, r, 0.08);
        r -= 0.04 * Math.exp(-Math.pow(d[0] / 0.12, 2)) * smoothstep(0.6, 0.95, d[1]);  // lekuk kubah ganda
        for (var i = 0; i < 2; i++) {
          r = r + (1.22 - r) * smoothstep(0.88, 0.97, titik(d, gadingArah[i]));         // sarung gading
          r -= 0.12 * smoothstep(0.975, 0.995, titik(d, orbit[i]));
          r += 0.05 * smoothstep(0.96, 0.99, titik(d, zigo[i]));
        }
        if (d[2] > 0.6) {
          var q = (d[0] / 0.3) * (d[0] / 0.3) + ((d[1] - 0.32) / 0.12) * ((d[1] - 0.32) / 0.12);
          r -= 0.1 * clamp(1 - q, 0, 1);                                                 // lubang hidung
        }
        r *= 1 + 0.015 * fbm(d[0] * 5, d[1] * 5, d[2] * 5, 601, 3);
        return r;
      },
      luar: function (d) {
        var n = fbm(d[0] * 4, d[1] * 4, d[2] * 4, 603, 4);
        var c = campur(hex('#a7845c'), hex('#5e4630'), smoothstep(-0.35, 0.45, n));
        if (fbm(d[0] * 2, d[1] * 2, d[2] * 2, 605, 3) > 0.3) c = campur(c, hex('#8a8476'), 0.35);
        var b = 0.5 + 0.35 * n;
        if (Math.abs(fbm(d[0] * 5, d[1] * 5, d[2] * 5, 607, 3)) < 0.014) { c = hex('#3a2a1c'); b = 0.05; }
        return [c[0], c[1], c[2], b];
      },
      dalam: function (y, z, s) {
        var c, b = 0.5;
        if (s > 0.95) { c = hex('#b8935f'); b = 0.7; }
        else {
          var v = voronoi2(z * 9, y * 9, 609);                     // sel udara seperti sarang lebah
          c = v.f2 - v.f1 < 0.09 ? hex('#c9a87a') : kali(hex('#3b2c20'), 0.9 + 0.3 * v.id);
          b = v.f2 - v.f1 < 0.09 ? 0.7 : 0.15;
          var ox = (z + 0.32) / 0.33, oy = (y + 0.12) / 0.3;
          if (ox * ox + oy * oy < 1) { c = campur(hex('#847a68'), hex('#6c6354'), voronoi2(z * 40, y * 40, 611).id); b = 0.3; } // rongga otak
          var nx = (z - 0.42) / 0.11, ny = (y - 0.05) / 0.3;
          if (nx * nx + ny * ny < 1) { c = hex('#2a2018'); b = 0.05; }                     // rongga hidung
        }
        return [c[0], c[1], c[2], b];
      },
      bahan: {
        gading: { warna: '#ffffff', vertexWarna: true, kasar: 0.45, env: 0.6 },
        geraham: { warna: '#b8a27a', kasar: 0.5, env: 0.5 }
      },
      tambahan: function () {
        var hasil = [];
        [1, -1].forEach(function (s) {
          var kontrol = [[s * 0.3, -0.82, 0.62], [s * 0.36, -1.2, 1.05], [s * 0.42, -1.4, 1.6], [s * 0.36, -1.3, 2.15], [s * 0.18, -0.95, 2.55]];
          hasil.push(tabung(kontrol, function (t) { return 0.12 * (1 - t) + 0.025 * t; }, 40, 14, function (t, sudut, p) {
            var gading = linear('#d9c7a0'), cokelat = linear('#9b7b52');
            var garis = fbm(t * 30, sudut * 6, s, 613, 3);
            var w = clamp(0.25 + garis * 1.2, 0, 0.85) * (0.6 + 0.4 * t);
            return lV(gading, cokelat, w);
          }, 'gading'));
          hasil.push(balok([s * 0.22, -0.72, 0.0], [0.16, 0.16, 0.42], 'geraham'));
        });
        return hasil;
      }
    };
  };

  // ------------------------------------------------------------------
  // 3. Membuat geometri (grid bola penuh, lalu dibagi 2 belahan)
  // ------------------------------------------------------------------
  function buatData(namaResep, opsi) {
    opsi = opsi || {};
    var pabrik = RESEP[namaResep];
    if (!pabrik) throw new Error('Resep tidak dikenal: ' + namaResep);
    var R = pabrik();
    var S = R.skala;
    var nT = opsi.nT || 96;          // kolom per belahan
    var nP = opsi.nP || 88;          // baris (kutub ke kutub)
    var kol = nT * 2;                // kolom bola penuh (melingkar)

    // posisi grid penuh: theta dari -pi/2, kolom 0..kol-1 (melingkar)
    var P = new Float32Array(kol * (nP + 1) * 3);
    var D = new Float32Array(kol * (nP + 1) * 3);
    for (var j = 0; j <= nP; j++) {
      var phi = -PI / 2 + PI * j / nP;
      var cp = Math.cos(phi), sp = Math.sin(phi);
      if (j === 0 || j === nP) cp = 0;
      for (var i = 0; i < kol; i++) {
        var th = -PI / 2 + PI * i / nT;
        var dx = cp * Math.cos(th), dz = cp * Math.sin(th);
        if (i === 0) { dx = 0; dz = -cp; }
        if (i === nT) { dx = 0; dz = cp; }
        var d = [dx, sp, dz];
        var r = R.radius(d);
        var k = (j * kol + i) * 3;
        P[k] = dx * r * S[0]; P[k + 1] = sp * r * S[1]; P[k + 2] = dz * r * S[2];
        D[k] = dx; D[k + 1] = sp; D[k + 2] = dz;
      }
    }

    // normal dari selisih tetangga (sama untuk kedua belahan -> tidak ada garis sambungan)
    var N = new Float32Array(P.length);
    function idx(i, j) { return (j * kol + ((i % kol) + kol) % kol) * 3; }
    for (j = 0; j <= nP; j++) {
      for (i = 0; i < kol; i++) {
        k = idx(i, j);
        var nx, ny, nz;
        if (j === 0 || j === nP) {
          nx = 0; ny = j === 0 ? -1 : 1; nz = 0;
        } else {
          var a1 = idx(i + 1, j), a0 = idx(i - 1, j), b1 = idx(i, j + 1), b0 = idx(i, j - 1);
          var ux = P[a1] - P[a0], uy = P[a1 + 1] - P[a0 + 1], uz = P[a1 + 2] - P[a0 + 2];
          var vx = P[b1] - P[b0], vy = P[b1 + 1] - P[b0 + 1], vz = P[b1 + 2] - P[b0 + 2];
          nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx;
          if (nx * P[k] + ny * P[k + 1] + nz * P[k + 2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
        }
        var ln = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        N[k] = nx / ln; N[k + 1] = ny / ln; N[k + 2] = nz / ln;
      }
    }

    // belahan: sisi +1 = kolom 0..nT (x >= 0), sisi -1 = kolom nT..2nT (x <= 0)
    function belahan(sisi) {
      var mulai = sisi > 0 ? 0 : nT;
      var nV = (nT + 1) * (nP + 1);
      var pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), uv = new Float32Array(nV * 2);
      var v = 0;
      for (var j = 0; j <= nP; j++) {
        for (var i = 0; i <= nT; i++) {
          var src = idx(mulai + i, j);
          pos[v * 3] = P[src]; pos[v * 3 + 1] = P[src + 1]; pos[v * 3 + 2] = P[src + 2];
          nor[v * 3] = N[src]; nor[v * 3 + 1] = N[src + 1]; nor[v * 3 + 2] = N[src + 2];
          uv[v * 2] = (mulai + i) / kol;
          uv[v * 2 + 1] = j / nP;
          v++;
        }
      }
      var ind = new Uint32Array(nT * nP * 6), t = 0;
      for (j = 0; j < nP; j++) {
        for (i = 0; i < nT; i++) {
          var a = j * (nT + 1) + i, b = a + 1, c = a + nT + 1, dd = c + 1;
          ind[t++] = a; ind[t++] = c; ind[t++] = b;
          ind[t++] = b; ind[t++] = c; ind[t++] = dd;
        }
      }
      return { posisi: pos, normal: nor, uv: uv, indeks: ind };
    }

    // tepi bidang potong (x = 0): kolom nT (z > 0) naik, lalu kolom 0 (z < 0) turun
    var tepi = [];
    for (j = 0; j <= nP; j++) { k = idx(nT, j); tepi.push([P[k + 1], P[k + 2]]); }
    for (j = nP - 1; j >= 1; j--) { k = idx(0, j); tepi.push([P[k + 1], P[k + 2]]); }

    // titik tengah bidang potong
    var cy = 0, cz = 0, luas = 0;
    for (i = 0; i < tepi.length; i++) {
      var p0 = tepi[i], p1 = tepi[(i + 1) % tepi.length];
      var cr = p0[1] * p1[0] - p1[1] * p0[0];
      luas += cr; cy += (p0[0] + p1[0]) * cr; cz += (p0[1] + p1[1]) * cr;
    }
    if (Math.abs(luas) > 1e-6) { cy /= 3 * luas; cz /= 3 * luas; } else { cy = 0; cz = 0; }
    if (R.pusatAsal) { cy = 0; cz = 0; }

    var Rm = 0;
    for (i = 0; i < tepi.length; i++) Rm = Math.max(Rm, Math.abs(tepi[i][0]), Math.abs(tepi[i][1]));
    Rm *= 1.02;

    // jari-jari tepi per sudut (untuk menghitung s = 0 tengah .. 1 tepi)
    var BIN = 720, rTepi = new Float32Array(BIN);
    for (var bI = 0; bI < BIN; bI++) {
      var ang = -PI + TAU * (bI + 0.5) / BIN;
      var ry = Math.sin(ang), rz = Math.cos(ang), terjauh = 0;
      for (i = 0; i < tepi.length; i++) {
        var q0 = tepi[i], q1 = tepi[(i + 1) % tepi.length];
        var ay = q0[0] - cy, az = q0[1] - cz, by = q1[0] - cy, bz = q1[1] - cz;
        // potong sinar (0 + t*[rz,ry]) dengan segmen a-b, koordinat (z, y)
        var ez = bz - az, ey = by - ay;
        var den = rz * ey - ry * ez;
        if (Math.abs(den) < 1e-9) continue;
        var tt = (az * ey - ay * ez) / den;
        var uu = (az * ry - ay * rz) / den;
        if (tt > 0 && uu >= 0 && uu <= 1 && tt > terjauh) terjauh = tt;
      }
      rTepi[bI] = terjauh || Rm;
    }
    function nilaiS(y, z) {
      var dy = y - cy, dz = z - cz;
      var a = Math.atan2(dy, dz);
      var bi = Math.floor((a + PI) / TAU * BIN);
      if (bi < 0) bi = 0; if (bi >= BIN) bi = BIN - 1;
      return { s: Math.sqrt(dy * dy + dz * dz) / rTepi[bi], a: a };
    }

    function tutup(sisi) {
      var n = tepi.length;
      var pos = new Float32Array((n + 1) * 3), nor = new Float32Array((n + 1) * 3), uv = new Float32Array((n + 1) * 2);
      pos[0] = 0; pos[1] = cy; pos[2] = cz;
      for (var i = 0; i <= n; i++) { nor[i * 3] = sisi > 0 ? -1 : 1; }
      uv[0] = 0.5 + cz / (2 * Rm); uv[1] = 0.5 + cy / (2 * Rm);
      for (i = 0; i < n; i++) {
        var y = tepi[i][0], z = tepi[i][1];
        pos[(i + 1) * 3] = 0; pos[(i + 1) * 3 + 1] = y; pos[(i + 1) * 3 + 2] = z;
        uv[(i + 1) * 2] = 0.5 + z / (2 * Rm); uv[(i + 1) * 2 + 1] = 0.5 + y / (2 * Rm);
      }
      var ind = new Uint32Array(n * 3);
      for (i = 0; i < n; i++) {
        var a = i + 1, b = ((i + 1) % n) + 1;
        if (sisi > 0) { ind[i * 3] = 0; ind[i * 3 + 1] = a; ind[i * 3 + 2] = b; }
        else { ind[i * 3] = 0; ind[i * 3 + 1] = b; ind[i * 3 + 2] = a; }
      }
      return { posisi: pos, normal: nor, uv: uv, indeks: ind };
    }

    // kristal 3D di rongga (khusus geode)
    var kristal = [];
    if (R.kristal) {
      var rk = acak(77);
      for (i = 0; i < 70; i++) {
        var sudut = rk() * TAU, sPos = 0.12 + rk() * 0.3;
        var bin = Math.floor((sudut) / TAU * BIN) % BIN;
        var aSudut = -PI + TAU * (bin + 0.5) / BIN;
        var rr = rTepi[bin] * sPos;
        var yy = cy + Math.sin(aSudut) * rr, zz = cz + Math.cos(aSudut) * rr;
        kristal.push({
          y: yy, z: zz,
          tinggi: 0.05 + rk() * 0.1 * (1 - sPos),
          lebar: 0.018 + rk() * 0.022,
          condong: [-Math.sin(aSudut), -Math.cos(aSudut)], // ke arah tengah rongga
          putar: rk() * TAU,
          warna: rk()
        });
      }
    }

    // ---------- bagian tambahan (kristal, gigi, gading) ----------
    var ekstraKerja = [{}, {}];
    function wadah(si, bahan) {
      var w = ekstraKerja[si][bahan];
      if (!w) w = ekstraKerja[si][bahan] = { p: [], n: [], c: [], uv: [] };
      return w;
    }
    function dorong(si, bahan, t3, n3, c3, uv3) {
      var w = wadah(si, bahan);
      for (var q = 0; q < 3; q++) {
        w.p.push(t3[q][0], t3[q][1], t3[q][2]);
        w.n.push(n3[q][0], n3[q][1], n3[q][2]);
        if (c3) w.c.push(c3[q][0], c3[q][1], c3[q][2]);
        if (uv3) w.uv.push(uv3[q][0], uv3[q][1]);
      }
    }
    var konteks = {
      skala: S, acak: acak,
      permukaan: function (d) { d = nV(d); var r = R.radius(d); return [d[0] * r * S[0], d[1] * r * S[1], d[2] * r * S[2]]; }
    };
    var bagian = R.tambahan ? R.tambahan(konteks) : [];
    bagian.forEach(function (bg) {
      var spek = (R.bahan && R.bahan[bg.bahan]) || {};
      if (bg.jenis === 'utuh') {
        var sx = 0, nn = 0;
        bg.tri.forEach(function (t) { sx += t[0][0] + t[1][0] + t[2][0]; nn += 3; });
        var si = sx / nn >= 0 ? 0 : 1;
        bg.tri.forEach(function (t, i) {
          var nor = bg.normal ? bg.normal[i] : (function () { var n = nV(silang(kV(t[1], t[0]), kV(t[2], t[0]))); return [n, n, n]; })();
          var col = bg.warna ? t.map(function (p, q) { return bg.warna(p, bg.uvt ? bg.uvt[i][q] : null); }) : null;
          dorong(si, bg.bahan, t, nor, col, null);
        });
        return;
      }
      // cembung: arahkan semua segitiga keluar, potong di x = 0, buat bidang potong
      var pc = [0, 0, 0], m = 0;
      bg.tri.forEach(function (t) { t.forEach(function (p) { pc = tV(pc, p); m++; }); });
      pc = sV(pc, 1 / m);
      var irisan = [];
      bg.tri.forEach(function (t0) {
        var t = t0.slice();
        var n = silang(kV(t[1], t[0]), kV(t[2], t[0]));
        if (titik(n, n) < 1e-14) return;
        var ct = sV(tV(tV(t[0], t[1]), t[2]), 1 / 3);
        if (titik(n, kV(ct, pc)) < 0) { t = [t[0], t[2], t[1]]; n = sV(n, -1); }
        n = nV(n);
        var col = bg.warna ? t.map(function (p) { return bg.warna(p); }) : null;
        for (var q = 0; q < 3; q++) {
          var a = t[q], b = t[(q + 1) % 3];
          if ((a[0] > 0) !== (b[0] > 0) && a[0] !== b[0]) {
            var pp = lV(a, b, a[0] / (a[0] - b[0]));
            irisan.push([pp[2], pp[1]]);
          }
        }
        for (var s = 0; s < 2; s++) {
          var k = klip(t, col, s === 0 ? 1 : -1);
          for (var f = 1; f + 1 < k.p.length; f++) {
            dorong(s, bg.bahan, [k.p[0], k.p[f], k.p[f + 1]], [n, n, n], col ? [k.c[0], k.c[f], k.c[f + 1]] : null, null);
          }
        }
      });
      if (irisan.length >= 3 && spek.tutup) {
        var h = selubung(irisan);
        if (h.length < 3) return;
        var hz = 0, hy = 0;
        h.forEach(function (p) { hz += p[0]; hy += p[1]; });
        var pusatT = [0, hy / h.length, hz / h.length];
        for (var s2 = 0; s2 < 2; s2++) {
          var kanan = s2 === 0, nn2 = [kanan ? -1 : 1, 0, 0];
          for (var e = 0; e < h.length; e++) {
            var e2 = (e + 1) % h.length;
            var A = [0, h[e][1], h[e][0]], B = [0, h[e2][1], h[e2][0]];
            var va = e / h.length, vb = (e + 1) / h.length, vm = (va + vb) / 2;
            if (kanan) dorong(s2, spek.tutup, [pusatT, A, B], [nn2, nn2, nn2], null, [[0, vm], [1, va], [1, vb]]);
            else dorong(s2, spek.tutup, [pusatT, B, A], [nn2, nn2, nn2], null, [[0, vm], [1, vb], [1, va]]);
          }
        }
      }
    });
    var ekstra = [[], []];
    for (var si2 = 0; si2 < 2; si2++) {
      Object.keys(ekstraKerja[si2]).forEach(function (bahan) {
        var w = ekstraKerja[si2][bahan];
        ekstra[si2].push({
          bahan: bahan,
          posisi: new Float32Array(w.p), normal: new Float32Array(w.n),
          warna: w.c.length ? new Float32Array(w.c) : null,
          uv: w.uv.length ? new Float32Array(w.uv) : null
        });
      });
    }

    // normalisasi ukuran: dimensi terbesar = 1, lalu titik tengah kotak pembatas ke (0, 0, 0)
    var min = [9, 9, 9], max = [-9, -9, -9];
    function catat(arr) {
      for (var i = 0; i < arr.length; i += 3) for (var c = 0; c < 3; c++) {
        if (arr[i + c] < min[c]) min[c] = arr[i + c];
        if (arr[i + c] > max[c]) max[c] = arr[i + c];
      }
    }
    catat(P);
    ekstra.forEach(function (sisi) { sisi.forEach(function (g) { catat(g.posisi); }); });
    var ukuran = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);

    return {
      resep: R, nama: namaResep,
      belahan: [belahan(1), belahan(-1)],
      tutup: [tutup(1), tutup(-1)],
      kristal: kristal,
      ekstra: ekstra,
      geser: [0, -(min[1] + max[1]) / 2, -(min[2] + max[2]) / 2],
      faktor: 1 / ukuran,
      lebarX: (max[0] - min[0]) / ukuran,
      bidang: { tepi: tepi, cy: cy, cz: cz, Rm: Rm, nilaiS: nilaiS },
      buatTeksturLuar: function (W, H) { return bakarLuar(R, W || 512, H || 256); },
      buatTeksturDalam: function (Nn) { return bakarDalam(R, Nn || 512, Rm, nilaiS); }
    };
  }

  // ------------------------------------------------------------------
  // 4. Tekstur (digambar ke canvas)
  // ------------------------------------------------------------------
  function kanvas(w, h) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function bakarLuar(R, W, H) {
    var cw = kanvas(W, H), cb = kanvas(W, H), ck = null, ik = null;
    var xw = cw.getContext('2d'), xb = cb.getContext('2d');
    var iw = xw.createImageData(W, H), ib = xb.createImageData(W, H);
    if (R.petaKasar) { ck = kanvas(W, H); ik = ck.getContext('2d').createImageData(W, H); }
    var S = R.skala;
    for (var py = 0; py < H; py++) {
      var v = 1 - (py + 0.5) / H;
      var phi = v * PI - PI / 2;
      var cp = Math.cos(phi), sp = Math.sin(phi);
      for (var px = 0; px < W; px++) {
        var u = (px + 0.5) / W;
        var th = u * TAU - PI / 2;
        var d = [cp * Math.cos(th), sp, cp * Math.sin(th)];
        var r = R.radius(d);
        var p = [d[0] * r * S[0], d[1] * r * S[1], d[2] * r * S[2]];
        var w = R.luar(d, p);
        var o = (py * W + px) * 4;
        iw.data[o] = clamp(w[0], 0, 255); iw.data[o + 1] = clamp(w[1], 0, 255); iw.data[o + 2] = clamp(w[2], 0, 255); iw.data[o + 3] = 255;
        var b = clamp(w[3], 0, 1) * 255;
        ib.data[o] = b; ib.data[o + 1] = b; ib.data[o + 2] = b; ib.data[o + 3] = 255;
        if (ik) {
          var kk = clamp(w[4] !== undefined ? w[4] : R.kasarLuar, 0, 1) * 255;
          ik.data[o] = kk; ik.data[o + 1] = kk; ik.data[o + 2] = kk; ik.data[o + 3] = 255;
        }
      }
    }
    xw.putImageData(iw, 0, 0); xb.putImageData(ib, 0, 0);
    if (ck) ck.getContext('2d').putImageData(ik, 0, 0);
    return { warna: cw, bump: cb, kasar: ck };
  }

  // tekstur gradien untuk bidang potong kristal: u = 0 tengah .. 1 tepi, v = sudut keliling
  function bakarGradien(fn, W, H) {
    var c = kanvas(W, H), x = c.getContext('2d'), im = x.createImageData(W, H);
    for (var py = 0; py < H; py++) for (var px = 0; px < W; px++) {
      var w = fn((px + 0.5) / W, 1 - (py + 0.5) / H);
      var o = (py * W + px) * 4;
      im.data[o] = clamp(w[0], 0, 255); im.data[o + 1] = clamp(w[1], 0, 255); im.data[o + 2] = clamp(w[2], 0, 255); im.data[o + 3] = 255;
    }
    x.putImageData(im, 0, 0);
    return c;
  }

  // peta lingkungan sederhana (studio) supaya permukaan mengkilap terlihat memantulkan cahaya
  function bakarLingkungan() {
    var W = 256, H = 128, c = kanvas(W, H), x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fbf7f0'); g.addColorStop(0.45, '#b9b0a4'); g.addColorStop(0.55, '#6d655c'); g.addColorStop(1, '#1c1916');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.9)';
    x.fillRect(40, 18, 46, 22); x.fillRect(170, 26, 30, 16);
    x.fillStyle = 'rgba(255,236,210,0.5)'; x.fillRect(110, 8, 60, 12);
    return c;
  }

  function bakarDalam(R, Nn, Rm, nilaiS) {
    var cw = kanvas(Nn, Nn), cb = kanvas(Nn, Nn);
    var xw = cw.getContext('2d'), xb = cb.getContext('2d');
    var iw = xw.createImageData(Nn, Nn), ib = xb.createImageData(Nn, Nn);
    for (var py = 0; py < Nn; py++) {
      var y = ((1 - (py + 0.5) / Nn) * 2 - 1) * Rm;
      for (var px = 0; px < Nn; px++) {
        var z = (((px + 0.5) / Nn) * 2 - 1) * Rm;
        var sa = nilaiS(y, z);
        var w = R.dalam(y, z, Math.min(sa.s, 1.05), sa.a);
        var o = (py * Nn + px) * 4;
        iw.data[o] = clamp(w[0], 0, 255); iw.data[o + 1] = clamp(w[1], 0, 255); iw.data[o + 2] = clamp(w[2], 0, 255); iw.data[o + 3] = 255;
        var b = clamp(w[3], 0, 1) * 255;
        ib.data[o] = b; ib.data[o + 1] = b; ib.data[o + 2] = b; ib.data[o + 3] = 255;
      }
    }
    xw.putImageData(iw, 0, 0); xb.putImageData(ib, 0, 0);
    return { warna: cw, bump: cb };
  }

  // ------------------------------------------------------------------
  // 5. Menyusun objek three.js
  // ------------------------------------------------------------------
  function buat(THREE, namaResep, opsi) {
    opsi = opsi || {};
    var data = buatData(namaResep, opsi);
    var R = data.resep;
    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    var tekL = data.buatTeksturLuar(mobile ? 384 : 512, mobile ? 192 : 256);
    var tekD = data.buatTeksturDalam(mobile ? 384 : 512);
    var sampah = [];

    function teks(canvas, srgb) {
      var t = new THREE.CanvasTexture(canvas);
      if (srgb) {
        if ('colorSpace' in t && THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding !== undefined) t.encoding = THREE.sRGBEncoding;
      }
      t.anisotropy = 4;
      sampah.push(t);
      return t;
    }
    var tWarnaL = teks(tekL.warna, true); tWarnaL.wrapS = THREE.RepeatWrapping;
    var tBumpL = teks(tekL.bump, false); tBumpL.wrapS = THREE.RepeatWrapping;
    var tWarnaD = teks(tekD.warna, true);
    var tBumpD = teks(tekD.bump, false);
    var tKasarL = tekL.kasar ? teks(tekL.kasar, false) : null;
    if (tKasarL) tKasarL.wrapS = THREE.RepeatWrapping;
    var lingkungan = teks(bakarLingkungan(), true);
    lingkungan.mapping = THREE.EquirectangularReflectionMapping;

    var f = data.faktor;
    var matLuar = new THREE.MeshStandardMaterial({
      map: tWarnaL, bumpMap: tBumpL, bumpScale: R.bump * 0.5 * (opsi.bump || 1),
      roughness: tKasarL ? 1 : R.kasarLuar, roughnessMap: tKasarL, metalness: 0,
      envMap: lingkungan, envMapIntensity: R.env || 0.5
    });
    var matDalam = new THREE.MeshStandardMaterial({
      map: tWarnaD, bumpMap: tBumpD, bumpScale: R.bump * 0.25 * (opsi.bump || 1), roughness: R.kasarDalam, metalness: 0,
      envMap: lingkungan, envMapIntensity: (R.env || 0.5) * 0.6
    });
    sampah.push(matLuar, matDalam);

    // bahan untuk bagian tambahan
    var bahanThree = {};
    function bahanUntuk(nama) {
      if (bahanThree[nama]) return bahanThree[nama];
      var sp = (R.bahan && R.bahan[nama]) || {};
      var o = {
        color: new THREE.Color(sp.warna || '#ffffff'),
        roughness: sp.kasar !== undefined ? sp.kasar : 0.5, metalness: sp.logam || 0,
        vertexColors: !!sp.vertexWarna, envMap: lingkungan, envMapIntensity: sp.env !== undefined ? sp.env : 0.6
      };
      if (sp.opasitas !== undefined && sp.opasitas < 1) { o.transparent = true; o.opacity = sp.opasitas; }
      if (sp.peta && R.gradien && R.gradien[sp.peta]) o.map = teks(bakarGradien(R.gradien[sp.peta], 256, 64), true);
      var m;
      if (sp.kilap && THREE.MeshPhysicalMaterial) {
        o.clearcoat = 1; o.clearcoatRoughness = 0.04;
        m = new THREE.MeshPhysicalMaterial(o);
      } else m = new THREE.MeshStandardMaterial(o);
      sampah.push(m);
      bahanThree[nama] = m;
      return m;
    }

    function geo(g) {
      var bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(g.posisi, 3));
      bg.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
      bg.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2));
      bg.setIndex(new THREE.BufferAttribute(g.indeks, 1));
      bg.scale(f, f, f);
      bg.computeBoundingSphere();
      sampah.push(bg);
      return bg;
    }

    var grup = new THREE.Group();
    grup.name = 'koleksi-' + namaResep;
    var poros = [];
    for (var s = 0; s < 2; s++) {
      var sisi = s === 0 ? 1 : -1;
      var p = new THREE.Group();
      var isi = new THREE.Group();
      isi.position.set(data.geser[0] * f, data.geser[1] * f, data.geser[2] * f);
      p.add(isi);
      isi.add(new THREE.Mesh(geo(data.belahan[s]), matLuar));
      isi.add(new THREE.Mesh(geo(data.tutup[s]), matDalam));
      data.ekstra[s].forEach(function (g) {
        var bg = new THREE.BufferGeometry();
        bg.setAttribute('position', new THREE.BufferAttribute(g.posisi, 3));
        bg.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
        if (g.warna) bg.setAttribute('color', new THREE.BufferAttribute(g.warna, 3));
        if (g.uv) bg.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2));
        bg.scale(f, f, f);
        bg.computeBoundingSphere();
        sampah.push(bg);
        isi.add(new THREE.Mesh(bg, bahanUntuk(g.bahan)));
      });
      if (data.kristal.length) {
        var kerucut = new THREE.ConeGeometry(1, 1, 6, 1);
        kerucut.translate(0, 0.5, 0);
        sampah.push(kerucut);
        var matK1 = new THREE.MeshStandardMaterial({ color: 0x8a5cb0, roughness: 0.18, metalness: 0.05, transparent: true, opacity: 0.93 });
        var matK2 = new THREE.MeshStandardMaterial({ color: 0xc9b6dc, roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.9 });
        sampah.push(matK1, matK2);
        for (var i = 0; i < data.kristal.length; i++) {
          var k = data.kristal[i];
          var m = new THREE.Mesh(kerucut, k.warna > 0.3 ? matK1 : matK2);
          m.scale.set(k.lebar * f, k.tinggi * f, k.lebar * f);
          m.position.set(0, k.y * f, k.z * f);
          // arah: keluar dari bidang potong + condong ke tengah rongga
          var arah = new THREE.Vector3(-sisi * 0.55, k.condong[0] * 0.85, k.condong[1] * 0.85).normalize();
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arah);
          m.rotateY(k.putar);
          isi.add(m);
        }
      }
      grup.add(p);
      poros.push({ obj: p, sisi: sisi });
    }

    var jarak = 0.12 + data.lebarX * 0.38;
    var sudut = (opsi.sudutBelah !== undefined ? opsi.sudutBelah : 62) * PI / 180;
    function setBelah(t) {
      for (var i = 0; i < poros.length; i++) {
        var o = poros[i];
        o.obj.position.x = o.sisi * jarak * t;
        o.obj.position.z = 0.12 * t;
        o.obj.rotation.y = o.sisi * sudut * t;
      }
    }
    setBelah(0);

    return {
      grup: grup,
      setBelah: setBelah,
      buang: function () {
        for (var i = 0; i < sampah.length; i++) if (sampah[i] && sampah[i].dispose) sampah[i].dispose();
      }
    };
  }

  global.Geologi3D = {
    buat: buat,
    buatData: buatData,
    daftarResep: Object.keys(RESEP)
  };
})(window);
