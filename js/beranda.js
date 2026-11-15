/* Beranda: isi kartu koleksi dari js/koleksi.js */
(function () {
  'use strict';
  var grid = document.getElementById('daftar-koleksi');
  if (!grid || !window.KOLEKSI) return;
  window.KOLEKSI.forEach(function (k) {
    var kartu = document.createElement('div');
    kartu.className = 'mineral-card';
    kartu.innerHTML =
      '<a class="mineral-image' + (k.jenis === 'fosil' ? ' fosil' : '') + '" href="viewer.html?id=' + k.id + '">' +
        '<img src="assets/img/' + k.id + '.webp" alt="Model 3D ' + k.nama + '" loading="lazy">' +
      '</a>' +
      '<div class="card-content">' +
        '<div class="card-kategori">' + k.kategori + '</div>' +
        '<h3>' + k.nama + '</h3>' +
        '<p class="ringkas">' + k.ringkas + '</p>' +
        '<div class="card-aksi">' +
          '<a href="viewer.html?id=' + k.id + '" class="detail-link">Lihat 3D &rarr;</a>' +
          '<a href="ar.html?id=' + k.id + '" class="detail-link">Mode AR &rarr;</a>' +
        '</div>' +
      '</div>';
    grid.appendChild(kartu);
  });
})();
