(function(){
  'use strict';

  var DRAFT_KEY = 'instrumen-pm-asrama-draft-v1';
  var TTD_TETAP = {
    penanggung: 'Martin Hamonangan',
    kapokja: 'Tuti Nurhayati'
  };
  var currentPengasuhSignImg = null;

  var INDIKATOR = [
    { key:'ibadah',        nama:'Ibadah & Mental Spiritual',        desc:'Kedisiplinan ibadah harian, partisipasi pembinaan rohani dan bimbingan mental' },
    { key:'kebersihan',    nama:'Kebersihan & Kerapihan Asrama',    desc:'Merawat kebersihan kamar, tempat tidur, pakaian pribadi dan area bersama' },
    { key:'kejujuran',     nama:'Kejujuran & Integritas',           desc:'Keterbukaan dalam berinteraksi, tidak mengambil milik orang lain, mengakui kesalahan' },
    { key:'etika',         nama:'Etika & Sopan Santun',             desc:'Penggunaan bahasa yang santun, sikap menghormati pengasuh, Peksos, dan teman sebaya' },
    { key:'kemandirian',   nama:'Inisiatif & Kemandirian (Life Skills)', desc:'Kemampuan mengurus diri sendiri, jadwal kegiatan harian tanpa selalu diperintah' },
    { key:'kedisiplinan',  nama:'Kedisiplinan & Kepatuhan Jadwal',  desc:'Tepat waktu bangun pagi, makan, mengikuti kegiatan, kembali ke asrama dan jam tidur malam' },
    { key:'tanggung_jawab',nama:'Tanggung Jawab Tugas Asrama',      desc:'Pelaksanaan piket kebersihan, menjaga fasilitas asrama, serta kepatuhan aturan' },
    { key:'interpersonal', nama:'Hubungan Interpersonal',           desc:'Adaptasi lingkungan, tidak berkonflik, dan aktif berpartisipasi dalam kelompok' },
    { key:'kepatuhan',     nama:'Kepatuhan dan Respon Pada Petugas',desc:'Sikap kooperatif terhadap pengasuh, mengikuti arahan bimbingan dan terapi' },
    { key:'regulasi_emosi',nama:'Regulasi Emosi & Resiliensi',      desc:'Kemampuan mengontrol emosi dan menyelesaikan masalah pribadi secara baik' }
  ];

  var SKALA = [
    { nilai:1, label:'Sangat Kurang', desc:'PM menolak aturan, belum menunjukkan kemauan berubah atau membutuhkan pengawasan ketat dan intervensi intensif dari pengasuh.' },
    { nilai:2, label:'Kurang',        desc:'Menunjukkan kesadaran sesekali, namun masih sering melakukan pelanggaran/hambatan dan memerlukan arahan berulang-ulang.' },
    { nilai:3, label:'Baik',          desc:'PM mampu menjalankan aktivitas dan tata tertib asrama secara mandiri dengan sedikit arahan.' },
    { nilai:4, label:'Sangat Baik',   desc:'Konsisten menjalankan norma, disiplin, dan etika, serta mampu menjadi teladan bagi rekan sebaya di asrama.' }
  ];

  var LAYANAN = [
    'Dukungan pemenuhan hidup layak: kebutuhan nutrisi, kelengkapan alat bersih diri dan kelayakan kamar asrama',
    'Perawatan sosial & pengasuhan: pendampingan 24 jam dan pengayoman oleh pengasuh asrama',
    'Terapi fisik & kesehatan: olahraga rutin, kebugaran jasmani dan penanganan medis',
    'Terapi psikososial & mental spiritual: konseling individu/kelompok, terapi, bimbingan keagamaan',
    'Pelatihan vokasional & kewirausahaan: keterampilan kerja dan pengenalan ke Sentra Kreasi'
  ];

  var KEBERFUNGSIAN = [
    'Belum Mandiri (memerlukan pendampingan penuh)',
    'Mandiri Sebagian (memerlukan bimbingan berkala)',
    'Mandiri Penuh (siap untuk terminasi/reunifikasi)'
  ];

  var TINDAK_LANJUT = [
    'Melanjutkan layanan residensial di asrama',
    'Rencana terminasi / pengembalian ke keluarga/masyarakat',
    'Rujukan ke layanan / lembaga lain'
  ];

  var els = {};
  var saveTimer = null;
  var sheetTimer = null;
  var lastSavedAt = null;
  var confirmResolver = null;
  var toastTimer = null;

  function $(id){ return document.getElementById(id); }
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }
  function nl2br(v){ return esc(v).replace(/\r?\n/g, '<br>'); }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function nowLabel(){
    var d = new Date();
    return pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function formatDateID(iso){
    if(!iso) return '';
    var parts = String(iso).split('-');
    if(parts.length !== 3) return iso;
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
  function checkedValues(selector){
    return Array.prototype.map.call(document.querySelectorAll(selector), function(el){ return el.value; });
  }

  /* ---------- RENDER STATIS ---------- */
  function renderIndicators(){
    els.indicatorList.innerHTML = INDIKATOR.map(function(ind, idx){
      return '' +
      '<div class="ind-row" data-row="' + ind.key + '">' +
        '<div class="ind-no">' + (idx + 1) + '</div>' +
        '<div>' +
          '<p class="ind-name">' + esc(ind.nama) + '</p>' +
          '<p class="ind-desc">' + esc(ind.desc) + '</p>' +
        '</div>' +
        '<div class="ind-score">' +
          '<div class="rating" role="radiogroup" aria-label="Nilai ' + esc(ind.nama) + '">' +
            SKALA.map(function(sk){
              return '<label data-value="' + sk.nilai + '" title="' + sk.nilai + ' - ' + esc(sk.label) + '">' +
                '<input type="radio" name="nilai-' + ind.key + '" value="' + sk.nilai + '">' +
                '<span>' + sk.nilai + '</span>' +
              '</label>';
            }).join('') +
          '</div>' +
          '<span class="score-txt" data-score-label="' + ind.key + '">Belum diisi</span>' +
        '</div>' +
        '<div class="ind-note">' +
          '<textarea data-catatan="' + ind.key + '" rows="2" placeholder="Catatan perilaku & intervensi..."></textarea>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderLists(){
    els.legend.innerHTML = '<span class="legend-title">Keterangan Nilai</span>' +
      SKALA.map(function(sk){
        return '<div class="legend-item"><span class="legend-num ln' + sk.nilai + '">' + sk.nilai + '</span>' +
          '<span><b>' + esc(sk.label) + ':</b> ' + esc(sk.desc) + '</span></div>';
      }).join('');

    els.layananList.innerHTML = LAYANAN.map(function(item, i){
      return '<label class="check-item"><input type="checkbox" data-layanan value="' + esc(item) + '" id="layanan-' + i + '">' +
        '<span>' + esc(item) + '</span></label>';
    }).join('');

    els.keberfungsianList.innerHTML = KEBERFUNGSIAN.map(function(item, i){
      return '<label class="check-item"><input type="checkbox" data-keberfungsian value="' + esc(item) + '" id="keberfungsian-' + i + '">' +
        '<span>' + esc(item) + '</span></label>';
    }).join('');

    els.tindakLanjutList.innerHTML = TINDAK_LANJUT.map(function(item, i){
      return '<label class="check-item"><input type="checkbox" data-tindak-lanjut value="' + esc(item) + '" id="tindak-' + i + '">' +
        '<span>' + esc(item) + '</span></label>';
    }).join('');
  }

  /* ---------- STATE ---------- */
  function collect(){
    var nilai = {};
    var catatan = {};
    INDIKATOR.forEach(function(ind){
      nilai[ind.key] = 0;
      var checked = document.querySelector('input[name="nilai-' + ind.key + '"]:checked');
      if(checked) nilai[ind.key] = Number(checked.value) || 0;
      var ta = document.querySelector('[data-catatan="' + ind.key + '"]');
      catatan[ind.key] = ta ? ta.value.trim() : '';
    });

    return {
      identitas: {
        nama: els.inNama.value.trim(),
        asrama: els.inAsrama.value.trim(),
        masuk: els.inMasuk.value,
        pengasuh: els.inPengasuh.value.trim(),
        peksos: els.inPeksos.value.trim(),
        klaster: els.inKlaster.value.trim(),
        bulan: els.inBulan.value,
        tahun: els.inTahun.value.trim()
      },
      nilai: nilai,
      catatan: catatan,
      layanan: Array.prototype.map.call(document.querySelectorAll('[data-layanan]:checked'), function(el){ return el.value; }),
      keberfungsian: checkedValues('[data-keberfungsian]:checked'),
      tindakLanjut: checkedValues('[data-tindak-lanjut]:checked'),
      catatanTambahan: els.inCatatan.value.trim(),
      ttd: {
        pengasuh: els.ttdPengasuh.value.trim(),
        peksos: els.ttdPeksos.value.trim(),
        penanggung: TTD_TETAP.penanggung,
        kapokja: TTD_TETAP.kapokja,
        pengasuhImg: currentPengasuhSignImg || ''
      }
    };
  }

  function saveDraft(manual){
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ savedAt: Date.now(), data: collect() }));
      lastSavedAt = new Date();
      setStatus('Tersimpan otomatis \u00b7 ' + nowLabel(), false);
      if(manual) toast('Draft berhasil disimpan di perangkat ini.', 'ok');
    } catch(e) {
      setStatus('Gagal menyimpan draft', false);
    }
  }

  function scheduleSave(){
    clearTimeout(saveTimer);
    setStatus('Menyimpan...', true);
    saveTimer = setTimeout(function(){ saveDraft(false); }, 450);
  }

  function restoreDraft(){
    var raw;
    try { raw = localStorage.getItem(DRAFT_KEY); } catch(e) { return false; }
    if(!raw) return false;

    var saved;
    try { saved = JSON.parse(raw); } catch(e) { return false; }
    if(!saved || !saved.data) return false;

    var d = saved.data;
    var id = d.identitas || {};
    els.inNama.value = id.nama || '';
    els.inAsrama.value = id.asrama || '';
    els.inMasuk.value = id.masuk || '';
    els.inPengasuh.value = id.pengasuh || '';
    els.inPeksos.value = id.peksos || '';
    els.inKlaster.value = id.klaster || '';
    els.inBulan.value = id.bulan || '';
    els.inTahun.value = id.tahun || '';

    INDIKATOR.forEach(function(ind){
      var v = d.nilai && d.nilai[ind.key] ? String(d.nilai[ind.key]) : '';
      if(v){
        var radio = document.querySelector('input[name="nilai-' + ind.key + '"][value="' + v + '"]');
        if(radio) radio.checked = true;
      }
      var ta = document.querySelector('[data-catatan="' + ind.key + '"]');
      if(ta) ta.value = (d.catatan && d.catatan[ind.key]) || '';
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-layanan]'), function(cb){
      cb.checked = (d.layanan || []).indexOf(cb.value) !== -1;
    });

    var kebList = Array.isArray(d.keberfungsian) ? d.keberfungsian : (d.keberfungsian ? [d.keberfungsian] : []);
    Array.prototype.forEach.call(document.querySelectorAll('[data-keberfungsian]'), function(cb){
      cb.checked = kebList.indexOf(cb.value) !== -1;
    });

    var tlList = Array.isArray(d.tindakLanjut) ? d.tindakLanjut : (d.tindakLanjut ? [d.tindakLanjut] : []);
    Array.prototype.forEach.call(document.querySelectorAll('[data-tindak-lanjut]'), function(cb){
      cb.checked = tlList.indexOf(cb.value) !== -1;
    });

    els.inCatatan.value = d.catatanTambahan || '';
    var ttd = d.ttd || {};
    els.ttdPengasuh.value = ttd.pengasuh || '';
    els.ttdPeksos.value = ttd.peksos || '';
    els.ttdPenanggung.value = TTD_TETAP.penanggung;
    els.ttdKapokja.value = TTD_TETAP.kapokja;

    if(ttd.pengasuhImg){
      setPengasuhSignature(ttd.pengasuhImg, false);
    } else {
      clearPengasuhSignature(false);
    }

    if(saved.savedAt){
      var dt = new Date(saved.savedAt);
      lastSavedAt = dt;
      setStatus('Draft dimuat \u00b7 ' + pad2(dt.getHours()) + ':' + pad2(dt.getMinutes()), false);
    }
    return true;
  }

  /* ---------- SUMMARY ---------- */
  function predikatOf(avg){
    if(avg >= 3.5) return { label:'Sangat Baik', tone:'emerald' };
    if(avg >= 2.5) return { label:'Baik', tone:'sky' };
    if(avg >= 1.5) return { label:'Kurang', tone:'amber' };
    return { label:'Sangat Kurang', tone:'rose' };
  }

  function updateSummary(){
    var s = collect();
    var filled = 0, total = 0;
    var low = [];

    INDIKATOR.forEach(function(ind){
      var v = s.nilai[ind.key] || 0;
      var row = document.querySelector('[data-row="' + ind.key + '"]');
      var label = document.querySelector('[data-score-label="' + ind.key + '"]');
      var seg = document.querySelector('[data-seg="' + ind.key + '"]');
      if(v > 0){
        filled++;
        total += v;
        if(v <= 2) low.push({ nama: ind.nama, nilai: v });
      }
      if(row) row.classList.toggle('is-scored', v > 0);
      if(label){
        var sk = SKALA.filter(function(x){ return x.nilai === v; })[0];
        label.textContent = sk ? (v + ' \u00b7 ' + sk.label) : 'Belum diisi';
        label.classList.toggle('is-scored', v > 0);
      }
      if(seg) seg.className = v > 0 ? ('f' + v) : '';
    });

    var avg = filled > 0 ? total / filled : 0;
    els.totalScore.textContent = String(total);
    els.filledCount.textContent = String(filled);
    els.avgScore.textContent = avg.toFixed(2);
    els.miniText.textContent = filled + '/10';
    els.miniBar.style.width = (filled * 10) + '%';

    var badge = els.predikatBadge;
    badge.className = 'badge';
    if(filled === 0){
      badge.textContent = 'Belum dinilai';
    } else {
      var p = predikatOf(avg);
      badge.textContent = p.label;
      badge.classList.add('tone-' + p.tone);
    }

    if(low.length === 0){
      els.lowBox.innerHTML = filled === 0
        ? 'Nilai setiap aspek untuk melihat ringkasan dan aspek yang perlu perhatian.'
        : (filled < 10 ? 'Belum ada aspek bernilai kurang dari 3.' : '<strong>Seluruh aspek</strong> berada pada kategori baik (3&ndash;4).');
    } else {
      els.lowBox.innerHTML = '<strong>Perlu perhatian:</strong><ul>' +
        low.map(function(x){ return '<li>' + esc(x.nama) + ' (' + x.nilai + ')</li>'; }).join('') +
        '</ul>';
    }

    document.querySelectorAll('.ind-note textarea').forEach(function(ta){
      ta.style.height = 'auto';
      ta.style.height = Math.max(62, ta.scrollHeight) + 'px';
    });
  }

  /* ---------- TANDA TANGAN (AUTO REMOVE BACKGROUND) ---------- */
  function removeSignatureBackground(img){
    var maxDim = 1200;
    var w = img.naturalWidth || img.width;
    var h = img.naturalHeight || img.height;
    if(w > maxDim || h > maxDim){
      if(w > h){
        h = Math.round(h * (maxDim / w));
        w = maxDim;
      } else {
        w = Math.round(w * (maxDim / h));
        h = maxDim;
      }
    }

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);

    var imgData = ctx.getImageData(0, 0, w, h);
    var data = imgData.data;
    var totalPixels = w * h;

    // Cek jika gambar sudah memiliki background transparan (misal PNG transparan)
    var transparentCount = 0;
    for(var i = 3; i < data.length; i += 4){
      if(data[i] < 30) transparentCount++;
    }
    if((transparentCount / totalPixels) > 0.20){
      return autoCropCanvas(canvas, ctx, data, w, h);
    }

    // Estimasi background berbasis grid lokal (adaptif terhadap bayangan / pencahayaan kertas foto)
    var gridCols = 24;
    var gridRows = 24;
    var blockW = Math.ceil(w / gridCols);
    var blockH = Math.ceil(h / gridRows);
    var bgLumGrid = [];

    for(var gy = 0; gy < gridRows; gy++){
      bgLumGrid[gy] = [];
      for(var gx = 0; gx < gridCols; gx++){
        var xStart = gx * blockW;
        var yStart = gy * blockH;
        var xEnd = Math.min(w, xStart + blockW);
        var yEnd = Math.min(h, yStart + blockH);

        var blockLums = [];
        for(var py = yStart; py < yEnd; py += 2){
          for(var px = xStart; px < xEnd; px += 2){
            var idx = (py * w + px) * 4;
            var r = data[idx], g = data[idx + 1], b = data[idx + 2];
            var lum = 0.299 * r + 0.587 * g + 0.114 * b;
            blockLums.push(lum);
          }
        }

        if(blockLums.length > 0){
          blockLums.sort(function(a, b){ return a - b; });
          var p90 = blockLums[Math.floor(blockLums.length * 0.90)];
          bgLumGrid[gy][gx] = p90;
        } else {
          bgLumGrid[gy][gx] = 245;
        }
      }
    }

    // Smoothing nilai background antar grid
    var smoothBg = [];
    for(var gy = 0; gy < gridRows; gy++){
      smoothBg[gy] = [];
      for(var gx = 0; gx < gridCols; gx++){
        var sum = 0, count = 0;
        for(var dy = -1; dy <= 1; dy++){
          for(var dx = -1; dx <= 1; dx++){
            var ny = gy + dy, nx = gx + dx;
            if(ny >= 0 && ny < gridRows && nx >= 0 && nx < gridCols){
              sum += bgLumGrid[ny][nx];
              count++;
            }
          }
        }
        smoothBg[gy][gx] = sum / count;
      }
    }

    function getLocalBg(x, y){
      var gx = (x / w) * (gridCols - 1);
      var gy = (y / h) * (gridRows - 1);
      var x0 = Math.floor(gx), x1 = Math.min(gridCols - 1, x0 + 1);
      var y0 = Math.floor(gy), y1 = Math.min(gridRows - 1, y0 + 1);
      var fx = gx - x0, fy = gy - y0;
      var top = smoothBg[y0][x0] * (1 - fx) + smoothBg[y0][x1] * fx;
      var btm = smoothBg[y1][x0] * (1 - fx) + smoothBg[y1][x1] * fx;
      return top * (1 - fy) + btm * fy;
    }

    // Cek warna tinta dominan (tinta biru pulpen vs hitam)
    var blueHits = 0, strokeHits = 0;
    for(var y = 0; y < h; y += 4){
      for(var x = 0; x < w; x += 4){
        var idx = (y * w + x) * 4;
        var r = data[idx], g = data[idx + 1], b = data[idx + 2];
        var lum = 0.299 * r + 0.587 * g + 0.114 * b;
        var bg = getLocalBg(x, y);
        if((bg - lum) > 28){
          strokeHits++;
          if(b > r + 15 && b > g + 8) blueHits++;
        }
      }
    }
    var isBlueInk = (strokeHits > 25 && (blueHits / strokeHits) > 0.25);

    // Hapus background dan isolasi goresan tanda tangan
    var minDiff = 14;
    var maxDiff = 42;

    for(var y = 0; y < h; y++){
      for(var x = 0; x < w; x++){
        var idx = (y * w + x) * 4;
        var r = data[idx], g = data[idx + 1], b = data[idx + 2];
        var lum = 0.299 * r + 0.587 * g + 0.114 * b;
        var bg = getLocalBg(x, y);
        var diff = bg - lum;

        if(diff <= minDiff){
          data[idx + 3] = 0; // Kertas background dijadikan transparan
        } else {
          var t = Math.min(1, (diff - minDiff) / (maxDiff - minDiff));
          var alpha = Math.round(Math.pow(t, 0.85) * 255);
          data[idx + 3] = alpha;

          if(isBlueInk){
            // Tinta biru pulpen tajam dan bersih
            data[idx] = Math.round(Math.min(r, 22 + (1 - t) * 35));
            data[idx + 1] = Math.round(Math.min(g, 45 + (1 - t) * 45));
            data[idx + 2] = Math.round(Math.max(125, Math.min(210, b)));
          } else {
            // Tinta hitam tajam dan pekat
            var darkVal = Math.round(Math.min(28, lum * 0.18));
            data[idx] = darkVal;
            data[idx + 1] = darkVal;
            data[idx + 2] = darkVal;
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return autoCropCanvas(canvas, ctx, data, w, h);
  }

  function autoCropCanvas(canvas, ctx, data, w, h){
    var minX = w, minY = h, maxX = 0, maxY = 0;
    var found = false;

    for(var y = 0; y < h; y++){
      for(var x = 0; x < w; x++){
        var a = data[(y * w + x) * 4 + 3];
        if(a > 20){
          if(x < minX) minX = x;
          if(x > maxX) maxX = x;
          if(y < minY) minY = y;
          if(y > maxY) maxY = y;
          found = true;
        }
      }
    }

    if(!found) return null;

    var pad = 8;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);

    var cropW = maxX - minX + 1;
    var cropH = maxY - minY + 1;

    var cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropW;
    cropCanvas.height = cropH;
    var cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    return cropCanvas.toDataURL('image/png');
  }

  function setPengasuhSignature(dataUrl, notify){
    currentPengasuhSignImg = dataUrl;
    if(els.ttdDropzone) els.ttdDropzone.classList.remove('is-invalid');
    if(els.ttdPreviewImg) els.ttdPreviewImg.src = dataUrl;
    if(els.ttdDropzone) els.ttdDropzone.style.display = 'none';
    if(els.ttdPreviewCard) els.ttdPreviewCard.style.display = 'flex';
    scheduleSheet();
    scheduleSave();
    if(notify) toast('Tanda tangan berhasil diproses & background dihapus.', 'ok');
  }

  function clearPengasuhSignature(notify){
    currentPengasuhSignImg = null;
    if(els.ttdPreviewImg) els.ttdPreviewImg.src = '';
    if(els.ttdDropzone) els.ttdDropzone.style.display = '';
    if(els.ttdPreviewCard) els.ttdPreviewCard.style.display = 'none';
    if(els.inTtdFile) els.inTtdFile.value = '';
    scheduleSheet();
    scheduleSave();
    if(notify) toast('Tanda tangan dihapus.', 'warn');
  }

  function handleTtdFile(file){
    if(!file) return;
    if(file.type && file.type.indexOf('image/') !== 0){
      toast('File harus berupa gambar (JPG, PNG, atau WEBP).', 'warn');
      return;
    }
    toast('Memproses gambar & menghapus background...', '');
    var reader = new FileReader();
    reader.onload = function(e){
      var img = new Image();
      img.onload = function(){
        try {
          var cleanDataUrl = removeSignatureBackground(img);
          if(!cleanDataUrl){
            toast('Goresan tanda tangan tidak terdeteksi. Pastikan foto tanda tangan jelas.', 'warn');
            return;
          }
          setPengasuhSignature(cleanDataUrl, true);
        } catch(err){
          toast('Gagal memproses tanda tangan: ' + err.message, 'warn');
        }
      };
      img.onerror = function(){
        toast('Gagal memuat gambar tanda tangan.', 'warn');
      };
      img.src = e.target.result;
    };
    reader.onerror = function(){
      toast('Gagal membaca file.', 'warn');
    };
    reader.readAsDataURL(file);
  }

  /* ---------- PRINT SHEET ---------- */
  function signatureName(name, fallback){
    var n = (name || '').trim() || (fallback || '').trim();
    return n ? '( ' + n + ' )' : '( ________________________ )';
  }

  function buildPrintContent(){
    var s = collect();
    var id = s.identitas;
    var blank = '&nbsp;';

    var identRow = function(k1, v1, k2, v2){
      return '<tr>' +
        '<td class="k">' + esc(k1) + '</td><td class="c">:</td><td class="v">' + (v1 ? esc(v1) : blank) + '</td>' +
        '<td class="k2">' + esc(k2) + '</td><td class="c">:</td><td class="v2">' + (v2 ? esc(v2) : blank) + '</td>' +
      '</tr>';
    };

    var rows = INDIKATOR.map(function(ind, idx){
      var nilai = s.nilai[ind.key] || 0;
      var catatan = s.catatan[ind.key] || '';
      return '<tr>' +
        '<td class="ps-no">' + (idx + 1) + '</td>' +
        '<td>' +
          '<div class="ps-ind-name">' + esc(ind.nama) + '</div>' +
          '<div class="ps-ind-desc">' + esc(ind.desc) + '</div>' +
        '</td>' +
        '<td class="ps-nilai">' + SKALA.map(function(sk){
          return '<span class="ps-nbox' + (nilai === sk.nilai ? ' on' : '') + '">' + sk.nilai + '</span>';
        }).join('') + '</td>' +
        '<td class="ps-catatan">' + (catatan ? nl2br(catatan) : '&nbsp;') + '</td>' +
      '</tr>';
    }).join('');

    var checkRow = function(checked, label){
      return '<div class="ps-check"><span class="ps-box">' + (checked ? '&#10003;' : '') + '</span><span>' + esc(label) + '</span></div>';
    };

    var ttdPengasuh = signatureName(s.ttd.pengasuh, id.pengasuh);
    var ttdPeksos = signatureName(s.ttd.peksos, id.peksos);
    var ttdPenanggung = signatureName(s.ttd.penanggung, '');
    var ttdKapokja = signatureName(s.ttd.kapokja, '');

    var ttdPengasuhHtml = '<span class="name' + (s.ttd.pengasuhImg ? ' ps-has-ttd' : '') + '">' +
      (s.ttd.pengasuhImg ? '<img class="ps-ttd-img" src="' + s.ttd.pengasuhImg + '" alt="Tanda Tangan Pengasuh">' : '') +
      '<span class="ps-name-text">' + esc(ttdPengasuh) + '</span>' +
    '</span>';

    var periodeBulan = id.bulan ? esc(id.bulan) : '__________';
    var periodeTahun = id.tahun ? esc(id.tahun) : '__________';

    return '' +
      '<div class="ps-periode">Bulan: ' + periodeBulan + ' &nbsp;&nbsp;&nbsp; Tahun: ' + periodeTahun + '</div>' +
      '<div class="ps-title">INSTRUMEN EVALUASI &amp; PERKEMBANGAN PENERIMA MANFAAT (PM) di ASRAMA</div>' +

      '<p class="ps-h">I. Identitas Penerima Manfaat &amp; Petugas</p>' +
      '<table class="ps-ident">' +
        identRow('Nama PM', id.nama, 'Pengasuh Asrama', id.pengasuh) +
        identRow('Asrama', id.asrama, 'Pekerja Sosial', id.peksos) +
        identRow('Tanggal Masuk', formatDateID(id.masuk), 'Klaster PM', id.klaster) +
      '</table>' +

      '<p class="ps-h">II. Evaluasi Perkembangan PM Asrama</p>' +
      '<table class="ps-table">' +
        '<thead><tr>' +
          '<th class="ps-col-no">No</th>' +
          '<th>Indikator / Aspek Perkembangan</th>' +
          '<th class="ps-col-nilai">Nilai (1 - 4)</th>' +
          '<th class="ps-col-catatan">Catatan Perilaku &amp; Intervensi Pengasuh</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
      '<div class="ps-legend">' +
        '<div class="ps-legend-title">Nilai</div>' +
        SKALA.map(function(sk){
          return '<p>&bull; <strong>' + sk.nilai + ' (' + esc(sk.label) + '):</strong> ' + esc(sk.desc) + '</p>';
        }).join('') +
      '</div>' +

      '<p class="ps-h">III. Layanan yang Sudah Diberikan:</p>' +
      '<div class="ps-checks">' +
        LAYANAN.map(function(item){ return checkRow(s.layanan.indexOf(item) !== -1, item); }).join('') +
      '</div>' +

      '<p class="ps-h">IV. Kesimpulan &amp; Rekomendasi Pekerja Sosial</p>' +
      '<p class="ps-sub">Tingkat Keberfungsian Sosial saat ini:</p>' +
      '<div class="ps-checks">' +
        KEBERFUNGSIAN.map(function(item){ return checkRow(s.keberfungsian.indexOf(item) !== -1, item); }).join('') +
      '</div>' +
      '<p class="ps-sub">Rekomendasi tindak lanjut (TL):</p>' +
      '<div class="ps-checks">' +
        TINDAK_LANJUT.map(function(item){ return checkRow(s.tindakLanjut.indexOf(item) !== -1, item); }).join('') +
      '</div>' +
      (s.catatanTambahan
        ? '<p class="ps-sub">Catatan tambahan:</p><p style="font-size:7.6pt;margin-left:10pt;line-height:1.35">' + nl2br(s.catatanTambahan) + '</p>'
        : '') +

      '<table class="ps-sign">' +
        '<tr>' +
          '<td><div class="ps-sign-row"><span class="role">Pengasuh Asrama</span>' + ttdPengasuhHtml + '</div></td>' +
          '<td><div class="ps-sign-row"><span class="role">Pekerja Sosial</span><span class="name"><span class="ps-name-text">' + esc(ttdPeksos) + '</span></span></div></td>' +
        '</tr>' +
        '<tr>' +
          '<td><div class="ps-sign-row"><span class="role">Penanggungjawab Pengasuhan</span><span class="name"><span class="ps-name-text">' + esc(ttdPenanggung) + '</span></span></div></td>' +
          '<td><div class="ps-sign-row"><span class="role">Kapokja Residensial</span><span class="name"><span class="ps-name-text">' + esc(ttdKapokja) + '</span></span></div></td>' +
        '</tr>' +
      '</table>';
  }

  function refreshPrintSheet(){
    els.printSheet.innerHTML = '<div class="ps">' + buildPrintContent() + '</div>';
  }

  function scheduleSheet(){
    clearTimeout(sheetTimer);
    sheetTimer = setTimeout(refreshPrintSheet, 250);
  }

  /* ---------- WHATSAPP ---------- */
  function buildWaText(){
    var id = collect().identitas;
    return 'Pengasuh: ' + (id.pengasuh || '-') + '\n' +
      'PM: ' + (id.nama || '-') + '\n' +
      'Periode Penilaian: ' + (id.bulan || '-') + (id.tahun ? ' ' + id.tahun : '');
  }

  function sendWhatsApp(){
    if(!validateForm()) return;
    var url = 'https://wa.me/?text=' + encodeURIComponent(buildWaText());
    window.open(url, '_blank', 'noopener');
    toast('Membuka WhatsApp. Pilih grup atau chat tujuan, lalu lampirkan file PDF.', 'ok', 6000);
  }

  function copySummary(){
    var text = buildWaText();
    var done = function(){ toast('Ringkasan teks disalin. Tempel di chat WhatsApp.', 'ok'); };
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(done).catch(function(){ fallbackCopy(text, done); });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch(e) { toast('Gagal menyalin teks.', 'warn'); }
    document.body.removeChild(ta);
  }

  /* ---------- EXPORT ---------- */
  function doPrint(){
    refreshPrintSheet();
    closePreview();
    closeConfirm();

    var nama = collect().identitas.nama || 'PM';
    var prevTitle = document.title;
    document.title = 'Instrumen Perkembangan PM - ' + nama;

    var finished = false;
    var restore = function(){
      if(finished) return;
      finished = true;
      document.title = prevTitle;
      setTimeout(askWhatsApp, 250);
    };

    window.addEventListener('afterprint', restore, { once: true });
    setTimeout(restore, 60000);
    window.print();
  }

  /* ---------- VALIDASI FORM ---------- */
  function validateForm(){
    var s = collect();
    var id = s.identitas;

    // Bersihkan penanda invalid sebelumnya
    document.querySelectorAll('.field.is-invalid, .ind-row.is-invalid, .ttd-dropzone.is-invalid').forEach(function(el){
      el.classList.remove('is-invalid');
    });

    var errors = [];
    var firstEl = null;

    function markError(inputEl, labelName){
      if(!inputEl) return;
      var f = inputEl.closest('.field');
      if(f) f.classList.add('is-invalid');
      errors.push(labelName + ' wajib diisi.');
      if(!firstEl) firstEl = inputEl;
    }

    // 1. Validasi Identitas (Semua kolom pada Bagian I)
    if(!id.nama) markError(els.inNama, 'Nama PM');
    if(!id.pengasuh) markError(els.inPengasuh, 'Pengasuh Asrama');
    if(!id.asrama) markError(els.inAsrama, 'Asrama');
    if(!id.peksos) markError(els.inPeksos, 'Pekerja Sosial');
    if(!id.masuk) markError(els.inMasuk, 'Tanggal Masuk');
    if(!id.klaster) markError(els.inKlaster, 'Klaster PM');
    if(!id.bulan) markError(els.inBulan, 'Bulan Penilaian');
    if(!id.tahun) markError(els.inTahun, 'Tahun Penilaian');

    // 2. Validasi Evaluasi Perkembangan PM Asrama (Semua 10 Indikator Wajib Dinilai)
    var missingInd = INDIKATOR.filter(function(ind){ return !s.nilai[ind.key]; });
    if(missingInd.length > 0){
      missingInd.forEach(function(ind){
        var row = document.querySelector('[data-row="' + ind.key + '"]');
        if(row){
          row.classList.add('is-invalid');
          if(!firstEl) firstEl = row;
        }
      });
      errors.push('Seluruh 10 indikator evaluasi perkembangan wajib dinilai (' + missingInd.length + ' indikator belum diisi).');
    }

    // 3. Validasi Upload Tanda Tangan Pengasuh (Wajib di-upload)
    if(!s.ttd.pengasuhImg){
      if(els.ttdDropzone){
        els.ttdDropzone.classList.add('is-invalid');
        if(!firstEl) firstEl = els.ttdDropzone;
      }
      errors.push('Tanda tangan Pengasuh Asrama wajib di-upload.');
    }

    if(errors.length > 0){
      toast(errors[0], 'warn', errors.length > 1 ? ('Cek ' + errors.length + ' Isian') : null, function(){
        confirmDialog({
          title: 'Formulir Belum Lengkap',
          message: 'Silakan lengkapi data wajib berikut sebelum melanjutkan:\n\n• ' + errors.join('\n• '),
          okLabel: 'Saya Lengkapi',
          cancelLabel: ''
        });
      });

      if(firstEl){
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if(typeof firstEl.focus === 'function') firstEl.focus();
      }
      return false;
    }

    return true;
  }

  function startExport(){
    if(!validateForm()) return;
    doPrint();
  }

  function askWhatsApp(){
    confirmDialog({
      title: 'PDF selesai diekspor',
      message: 'Lampirkan file PDF yang baru disimpan ke chat atau grup WhatsApp tujuan.\n\nBuka WhatsApp sekarang?',
      okLabel: 'Buka WhatsApp',
      cancelLabel: 'Nanti'
    }).then(function(ok){ if(ok) sendWhatsApp(); });
  }

  /* ---------- PREVIEW ---------- */
  function openPreview(){
    els.previewBody.innerHTML = '<div class="ps-wrap"><div class="ps">' + buildPrintContent() + '</div></div>';
    els.previewModal.hidden = false;
    document.body.classList.add('modal-open');
    requestAnimationFrame(fitPreview);
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitPreview);
  }

  function fitPreview(){
    var wrap = els.previewBody.querySelector('.ps-wrap');
    if(!wrap) return;
    var sheet = wrap.querySelector('.ps');
    if(!sheet) return;

    sheet.style.position = 'absolute';
    sheet.style.left = '0';
    sheet.style.top = '0';
    sheet.style.transformOrigin = 'top left';

    var avail = wrap.clientWidth;
    var w = 210 * 96 / 25.4;
    var scale = Math.min(1, avail / w);
    sheet.style.transform = 'scale(' + scale + ')';
    wrap.style.height = (sheet.offsetHeight * scale) + 'px';
  }

  function closePreview(){
    els.previewModal.hidden = true;
    els.previewBody.innerHTML = '';
    document.body.classList.remove('modal-open');
  }

  /* ---------- CONFIRM ---------- */
  function confirmDialog(opts){
    els.confirmTitle.textContent = opts.title || 'Konfirmasi';
    els.confirmMsg.textContent = opts.message || '';
    els.confirmOk.textContent = opts.okLabel || 'Lanjut';
    els.confirmCancel.textContent = opts.cancelLabel || 'Batal';
    els.confirmModal.hidden = false;
    document.body.classList.add('modal-open');
    els.confirmOk.focus();

    return new Promise(function(resolve){
      confirmResolver = resolve;
    });
  }

  function closeConfirm(result){
    if(els.confirmModal.hidden){
      return;
    }
    els.confirmModal.hidden = true;
    document.body.classList.remove('modal-open');
    var fn = confirmResolver;
    confirmResolver = null;
    if(fn) fn(!!result);
  }

  /* ---------- TOAST ---------- */
  function toast(message, tone, actionLabel, actionFn){
    els.toastMsg.textContent = message;
    els.toast.className = 'toast show' + (tone ? ' ' + tone : '');
    if(actionLabel && actionFn){
      els.toastAction.hidden = false;
      els.toastAction.textContent = actionLabel;
      els.toastAction.onclick = function(){ hideToast(); actionFn(); };
    } else {
      els.toastAction.hidden = true;
      els.toastAction.onclick = null;
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, actionLabel ? 10000 : 3600);
  }

  function hideToast(){
    els.toast.classList.remove('show');
    clearTimeout(toastTimer);
  }

  function setStatus(text, saving){
    els.saveStatus.textContent = text;
    els.statusDot.classList.toggle('is-saving', !!saving);
  }

  /* ---------- RESET ---------- */
  function resetForm(){
    confirmDialog({
      title: 'Kosongkan form?',
      message: 'Semua isian dan draft yang tersimpan di perangkat ini akan dihapus. Tindakan ini tidak bisa dibatalkan.',
      okLabel: 'Ya, Kosongkan',
      cancelLabel: 'Batal'
    }).then(function(ok){
      if(!ok) return;
      try { localStorage.removeItem(DRAFT_KEY); } catch(e) {}
      location.reload();
    });
  }

  /* ---------- EVENTS ---------- */
  function bindEvents(){
    document.addEventListener('change', function(e){
      if(e.target.matches('input[name^="nilai-"]')){
        var row = e.target.closest('.ind-row');
        if(row) row.classList.remove('is-invalid');
      }
      var field = e.target.closest('.field');
      if(field) field.classList.remove('is-invalid');

      if(e.target.matches('input[name^="nilai-"]') ||
         e.target.matches('[data-keberfungsian]') ||
         e.target.matches('[data-tindak-lanjut]') ||
         e.target.matches('[data-layanan]')){
        updateSummary();
        scheduleSave();
        scheduleSheet();
      }
    });

    document.addEventListener('input', function(e){
      var field = e.target.closest('.field');
      if(field) field.classList.remove('is-invalid');

      if(e.target.matches('textarea, input[type="text"], input[type="date"], input[type="number"], select')){
        updateSummary();
        scheduleSave();
        scheduleSheet();
      }
    });

    els.btnExport.addEventListener('click', startExport);
    els.mBtnExport.addEventListener('click', startExport);
    els.btnWa.addEventListener('click', sendWhatsApp);
    els.mBtnWa.addEventListener('click', sendWhatsApp);
    els.btnPreview.addEventListener('click', openPreview);
    els.btnSave.addEventListener('click', function(){ saveDraft(true); });
    els.btnReset.addEventListener('click', resetForm);
    els.btnCopy.addEventListener('click', copySummary);

    els.previewClose.addEventListener('click', closePreview);
    els.previewCancel.addEventListener('click', closePreview);
    els.previewExport.addEventListener('click', function(){
      if(!validateForm()){
        closePreview();
        return;
      }
      closePreview();
      setTimeout(doPrint, 80);
    });
    els.previewModal.addEventListener('click', function(e){ if(e.target === els.previewModal) closePreview(); });

    els.confirmOk.addEventListener('click', function(){ closeConfirm(true); });
    els.confirmCancel.addEventListener('click', function(){ closeConfirm(false); });
    els.confirmModal.addEventListener('click', function(e){ if(e.target === els.confirmModal) closeConfirm(false); });

    /* Tanda tangan pengasuh: file upload, ganti, hapus, drag & drop, clipboard paste */
    if(els.inTtdFile){
      els.inTtdFile.addEventListener('change', function(e){
        if(e.target.files && e.target.files[0]) handleTtdFile(e.target.files[0]);
      });
    }
    if(els.btnReuploadTtd){
      els.btnReuploadTtd.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        if(els.inTtdFile){
          els.inTtdFile.value = '';
          els.inTtdFile.click();
        }
      });
    }
    if(els.btnRemoveTtd){
      els.btnRemoveTtd.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        clearPengasuhSignature(true);
      });
    }

    if(els.ttdDropzone){
      ['dragenter', 'dragover'].forEach(function(evt){
        els.ttdDropzone.addEventListener(evt, function(e){
          e.preventDefault();
          e.stopPropagation();
          els.ttdDropzone.classList.add('drag-over');
        });
      });
      ['dragleave', 'drop'].forEach(function(evt){
        els.ttdDropzone.addEventListener(evt, function(e){
          e.preventDefault();
          e.stopPropagation();
          els.ttdDropzone.classList.remove('drag-over');
        });
      });
      els.ttdDropzone.addEventListener('drop', function(e){
        if(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]){
          handleTtdFile(e.dataTransfer.files[0]);
        }
      });
    }

    document.addEventListener('paste', function(e){
      if(e.clipboardData && e.clipboardData.items){
        for(var i = 0; i < e.clipboardData.items.length; i++){
          var item = e.clipboardData.items[i];
          if(item.type && item.type.indexOf('image/') === 0){
            var f = item.getAsFile();
            if(f){
              handleTtdFile(f);
              break;
            }
          }
        }
      }
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){
        if(!els.previewModal.hidden) closePreview();
        else if(!els.confirmModal.hidden) closeConfirm(false);
      }
    });

    window.addEventListener('resize', function(){
      if(!els.previewModal.hidden) fitPreview();
    });

    window.addEventListener('beforeprint', refreshPrintSheet);
  }

  /* ---------- INIT ---------- */
  function init(){
    els = {
      indicatorList: $('indicator-list'),
      legend: $('legend'),
      layananList: $('layanan-list'),
      keberfungsianList: $('keberfungsian-list'),
      tindakLanjutList: $('tindak-lanjut-list'),

      inNama: $('in-nama'),
      inAsrama: $('in-asrama'),
      inMasuk: $('in-masuk'),
      inPengasuh: $('in-pengasuh'),
      inPeksos: $('in-peksos'),
      inKlaster: $('in-klaster'),
      inBulan: $('in-bulan'),
      inTahun: $('in-tahun'),
      inCatatan: $('in-catatan'),

      ttdPengasuh: $('ttd-pengasuh'),
      ttdPeksos: $('ttd-peksos'),
      ttdPenanggung: $('ttd-penanggung'),
      ttdKapokja: $('ttd-kapokja'),
      ttdPengasuhUploader: $('ttd-pengasuh-uploader'),
      ttdDropzone: $('ttd-dropzone'),
      inTtdFile: $('in-ttd-file'),
      btnReuploadTtd: $('btn-reupload-ttd'),
      ttdPreviewCard: $('ttd-preview-card'),
      ttdPreviewImg: $('ttd-preview-img'),
      btnRemoveTtd: $('btn-remove-ttd'),

      totalScore: $('total-score'),
      avgScore: $('avg-score'),
      filledCount: $('filled-count'),
      predikatBadge: $('predikat-badge'),
      lowBox: $('low-box'),
      segments: $('segments'),
      miniText: $('mini-text'),
      miniBar: $('mini-bar'),

      btnExport: $('btn-export'),
      btnWa: $('btn-wa'),
      btnPreview: $('btn-preview'),
      btnSave: $('btn-save'),
      btnReset: $('btn-reset'),
      btnCopy: $('btn-copy'),
      mBtnExport: $('m-btn-export'),
      mBtnWa: $('m-btn-wa'),

      previewModal: $('preview-modal'),
      previewBody: $('preview-body'),
      previewClose: $('preview-close'),
      previewCancel: $('preview-cancel'),
      previewExport: $('preview-export'),

      confirmModal: $('confirm-modal'),
      confirmTitle: $('confirm-title'),
      confirmMsg: $('confirm-msg'),
      confirmOk: $('confirm-ok'),
      confirmCancel: $('confirm-cancel'),

      toast: $('toast'),
      toastMsg: $('toast-msg'),
      toastAction: $('toast-action'),

      saveStatus: $('save-status'),
      statusDot: $('status-dot'),
      printSheet: $('print-sheet')
    };

    renderIndicators();
    renderLists();

    els.segments.innerHTML = INDIKATOR.map(function(ind){
      return '<i data-seg="' + ind.key + '"></i>';
    }).join('');

    bindEvents();

    var restored = restoreDraft();

    var now = new Date();
    var NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    if(!els.inBulan.value) els.inBulan.value = NAMA_BULAN[now.getMonth()];
    if(!els.inTahun.value) els.inTahun.value = String(now.getFullYear());
    updateSummary();
    refreshPrintSheet();

    if(!restored){
      setStatus('Draft tersimpan otomatis', false);
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
