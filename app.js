(function(){
  'use strict';

  var WA_NUMBER = '6285212690901';
  var WA_DISPLAY = '+62 852-1269-0901';
  var DRAFT_KEY = 'instrumen-pm-asrama-draft-v1';
  var TTD_TETAP = {
    penanggung: 'Martin Hamonangan',
    kapokja: 'Tuti Nurhayati'
  };

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
        klaster: els.inKlaster.value.trim()
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
        kapokja: TTD_TETAP.kapokja
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

  /* ---------- PRINT SHEET ---------- */
  function signatureName(name, fallback){
    var n = (name || '').trim() || (fallback || '').trim();
    return n ? '( ' + n + ' )' : '( _____________________ )';
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

    return '' +
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
          '<td><div class="ps-sign-row"><span class="role">Pengasuh Asrama</span><span class="name">' + esc(ttdPengasuh) + '</span></div></td>' +
          '<td><div class="ps-sign-row"><span class="role">Pekerja Sosial</span><span class="name">' + esc(ttdPeksos) + '</span></div></td>' +
        '</tr>' +
        '<tr>' +
          '<td><div class="ps-sign-row"><span class="role">Penanggungjawab Pengasuhan</span><span class="name">' + esc(ttdPenanggung) + '</span></div></td>' +
          '<td><div class="ps-sign-row"><span class="role">Kapokja Residensial</span><span class="name">' + esc(ttdKapokja) + '</span></div></td>' +
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
    var s = collect();
    var id = s.identitas;
    var filled = 0, total = 0;
    var lines = [];

    lines.push('*INSTRUMEN EVALUASI & PERKEMBANGAN PM DI ASRAMA*');
    lines.push('Sentra Handayani Jakarta');
    lines.push('');
    lines.push('*I. IDENTITAS*');
    lines.push('Nama PM: ' + (id.nama || '-'));
    lines.push('Asrama: ' + (id.asrama || '-'));
    lines.push('Tanggal Masuk: ' + (formatDateID(id.masuk) || '-'));
    lines.push('Pengasuh Asrama: ' + (id.pengasuh || '-'));
    lines.push('Pekerja Sosial: ' + (id.peksos || '-'));
    lines.push('Klaster PM: ' + (id.klaster || '-'));
    lines.push('');
    lines.push('*II. EVALUASI PERKEMBANGAN*');

    INDIKATOR.forEach(function(ind, idx){
      var v = s.nilai[ind.key] || 0;
      var sk = SKALA.filter(function(x){ return x.nilai === v; })[0];
      if(v > 0){ filled++; total += v; }
      lines.push((idx + 1) + '. ' + ind.nama + ': ' + (v > 0 ? '*' + v + '* (' + sk.label + ')' : '_belum dinilai_'));
      if(s.catatan[ind.key]) lines.push('   _Catatan: ' + s.catatan[ind.key] + '_');
    });

    var avg = filled > 0 ? total / filled : 0;
    lines.push('');
    lines.push('*Total: ' + total + '/40 | Rata-rata: ' + avg.toFixed(2) + (filled > 0 ? ' | Predikat: ' + predikatOf(avg).label : '') + '*');

    lines.push('');
    lines.push('*III. LAYANAN YANG SUDAH DIBERIKAN*');
    if(s.layanan.length === 0){
      lines.push('- Belum ada layanan yang dicentang');
    } else {
      s.layanan.forEach(function(item){ lines.push('- ' + item); });
    }

    lines.push('');
    lines.push('*IV. KESIMPULAN & REKOMENDASI*');
    lines.push('Keberfungsian: ' + (s.keberfungsian.length ? s.keberfungsian.join(', ') : '-'));
    lines.push('Tindak lanjut: ' + (s.tindakLanjut.length ? s.tindakLanjut.join(', ') : '-'));
    if(s.catatanTambahan) lines.push('Catatan: ' + s.catatanTambahan);

    lines.push('');
    lines.push('_Dikirim dari Form Instrumen Perkembangan PM - Sentra Handayani._');

    return lines.join('\n');
  }

  function sendWhatsApp(){
    var s = collect();
    if(!s.identitas.nama){
      toast('Isi Nama PM terlebih dahulu sebelum mengirim.', 'warn');
      els.inNama.focus();
      return;
    }
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(buildWaText());
    window.open(url, '_blank', 'noopener');
    toast('Membuka WhatsApp ' + WA_DISPLAY + '. Lampirkan file PDF pada chat.', 'ok', 6000);
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

  function startExport(){
    var s = collect();
    if(!s.identitas.nama){
      toast('Lengkapi Nama PM sebelum ekspor PDF.', 'warn');
      els.inNama.focus();
      return;
    }

    var missing = INDIKATOR.filter(function(ind){ return !s.nilai[ind.key]; });
    if(missing.length > 0){
      confirmDialog({
        title: 'Masih ada nilai kosong',
        message: 'Ada ' + missing.length + ' indikator yang belum diberi nilai. Tetap ekspor PDF sekarang?',
        okLabel: 'Tetap Ekspor',
        cancelLabel: 'Periksa Lagi'
      }).then(function(ok){ if(ok) doPrint(); });
      return;
    }
    doPrint();
  }

  function askWhatsApp(){
    confirmDialog({
      title: 'PDF selesai diekspor',
      message: 'Lampirkan file PDF yang baru disimpan ke chat WhatsApp, lalu kirim ke ' + WA_DISPLAY + '.\n\nBuka WhatsApp sekarang?',
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
      if(e.target.matches('textarea, input[type="text"], input[type="date"]')){
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
    els.previewExport.addEventListener('click', function(){ closePreview(); setTimeout(doPrint, 80); });
    els.previewModal.addEventListener('click', function(e){ if(e.target === els.previewModal) closePreview(); });

    els.confirmOk.addEventListener('click', function(){ closeConfirm(true); });
    els.confirmCancel.addEventListener('click', function(){ closeConfirm(false); });
    els.confirmModal.addEventListener('click', function(e){ if(e.target === els.confirmModal) closeConfirm(false); });

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
      inCatatan: $('in-catatan'),

      ttdPengasuh: $('ttd-pengasuh'),
      ttdPeksos: $('ttd-peksos'),
      ttdPenanggung: $('ttd-penanggung'),
      ttdKapokja: $('ttd-kapokja'),

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
