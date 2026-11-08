/* S&J Wash - data disimpan di localStorage browser */
const $ = id => document.getElementById(id);
const rp = n => 'Rp' + Number(n || 0).toLocaleString('id-ID');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = new Date().toISOString().slice(0, 10);
const STATUS = { Menunggu: 'bg-warning text-dark', Diproses: 'bg-primary', Selesai: 'bg-success', Diambil: 'bg-secondary' };
const badge = s => `<span class="badge ${STATUS[s] || 'bg-secondary'}">${esc(s)}</span>`;
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

const seed = {
  pelanggan: [
    { id: 'p1', nama: 'Budi Santoso', hp: '081234567890', alamat: 'Batam Centre' },
    { id: 'p2', nama: 'Siti Aminah', hp: '082198765432', alamat: 'Nagoya' }
  ],
  layanan: [
    { id: 'l1', nama: 'Cuci Kering', harga: 5000, hari: 1 },
    { id: 'l2', nama: 'Cuci Setrika', harga: 7000, hari: 2 },
    { id: 'l3', nama: 'Setrika', harga: 4000, hari: 1 }
  ],
  order: [
    { id: 'o1', no: 'ORD001', nama: 'Budi Santoso', layanan: 'Cuci Setrika', berat: 3, total: 21000, masuk: today, estimasi: today, status: 'Diproses' },
    { id: 'o2', no: 'ORD002', nama: 'Siti Aminah', layanan: 'Cuci Kering', berat: 5, total: 25000, masuk: today, estimasi: today, status: 'Menunggu' }
  ]
};
const DB = {
  get(k) {
    try { const v = JSON.parse(localStorage.getItem('sjw_' + k)); if (v) return v; } catch (e) { }
    this.set(k, seed[k]); return seed[k];
  },
  set(k, v) { localStorage.setItem('sjw_' + k, JSON.stringify(v)); }
};

/* ---------- Sesi & navigasi ---------- */
const AKUN = { pemilik: ['admin', 'admin123'], pengelola: ['kasir', 'kasir123'] };
const page = document.body.dataset.page;
const sesi = JSON.parse(localStorage.getItem('sjw_sesi') || 'null');

if (page !== 'login') {
  if (!sesi) location.replace('index.html');
  if (sesi && sesi.role === 'pengelola') {
    if (page === 'laporan') location.replace('dashboard.html');
    const l = document.querySelector('a[href="laporan.html"]'); if (l) l.parentElement.remove();
  }
  document.querySelectorAll('a[href="index.html"]').forEach(a => a.addEventListener('click', () => localStorage.removeItem('sjw_sesi')));
  const nav = document.querySelector('nav form');
  if (nav) nav.addEventListener('submit', e => e.preventDefault());
  const cari = $('searchOrder');
  if (cari) cari.addEventListener('input', () => {
    const q = cari.value.toLowerCase();
    document.querySelectorAll('#tblBody tr').forEach(r => r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none');
  });
}

/* ---------- Login ---------- */
function initLogin() {
  if (sesi) location.replace('dashboard.html');
  $('formLogin').addEventListener('submit', e => {
    e.preventDefault();
    const role = $('role').value, u = $('username').value.trim(), p = $('password').value;
    if (AKUN[role][0] === u && AKUN[role][1] === p) {
      localStorage.setItem('sjw_sesi', JSON.stringify({ user: u, role }));
      location.href = 'dashboard.html';
    } else {
      const er = $('loginError');
      er.textContent = 'Username atau password salah untuk peran ini.'; er.classList.remove('d-none');
    }
  });
}

/* ---------- CRUD generik (tabel + modal) ---------- */
function crud(c) {
  const modalEl = $('modalTambahOrder'), form = $('formData');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  let eid = null;
  const render = () => {
    const d = DB.get(c.key);
    $('tblBody').innerHTML = d.length ? d.map(c.row).join('') : `<tr><td colspan="${c.cols}" class="text-center text-muted">Belum ada data. Klik tombol tambah untuk mulai.</td></tr>`;
    const q = $('searchOrder'); if (q && q.value) q.dispatchEvent(new Event('input'));
    c.after && c.after();
  };
  modalEl.addEventListener('show.bs.modal', e => {
    const b = e.relatedTarget; eid = (b && b.dataset.id) || null;
    form.reset();
    const rec = eid ? DB.get(c.key).find(x => x.id === eid) : null;
    c.fields.forEach(k => $('f_' + k).value = rec ? rec[k] : (c.defaults && c.defaults[k]) ?? '');
    c.fill && c.fill(rec);
    modalEl.querySelector('.modal-title').textContent = (eid ? 'Edit ' : 'Tambah ') + c.label;
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const v = {}; c.fields.forEach(k => v[k] = $('f_' + k).value.trim());
    (c.num || []).forEach(k => v[k] = Number(v[k]));
    const d = DB.get(c.key), i = d.findIndex(x => x.id === eid);
    c.pre && c.pre(v, i > -1 ? d[i] : null);
    if (i > -1) d[i] = { ...d[i], ...v }; else d.push({ id: uid(), ...v });
    DB.set(c.key, d); modal.hide(); render();
  });
  $('tblBody').addEventListener('click', e => {
    const b = e.target.closest('[data-del]');
    if (b && confirm('Hapus data ini?')) { DB.set(c.key, DB.get(c.key).filter(x => x.id !== b.dataset.del)); render(); }
  });
  render();
  return render;
}
const aksi = id => `<button class="btn btn-sm" data-bs-toggle="modal" data-bs-target="#modalTambahOrder" data-id="${id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
 <button class="btn btn-sm btn-cancel font-cancel" data-del="${id}" title="Hapus"><i class="fa-solid fa-trash"></i></button>`;
const tahunList = sel => {
  const ys = new Set(DB.get('order').map(o => o.masuk.slice(0, 4))); ys.add(today.slice(0, 4));
  sel.innerHTML = '<option value="all">Semua tahun</option>' + [...ys].sort().reverse().map(y => `<option>${y}</option>`).join('');
  sel.value = today.slice(0, 4);
};

/* ---------- Pelanggan ---------- */
function initPelanggan() {
  crud({
    key: 'pelanggan', label: 'Pelanggan', cols: 6, fields: ['nama', 'hp', 'alamat'],
    row: (x, i) => {
      const n = DB.get('order').filter(o => o.nama.toLowerCase() === x.nama.toLowerCase()).length;
      return `<tr class="text-center"><td>${i + 1}</td><td>${esc(x.nama)}</td><td>${esc(x.hp)}</td><td>${esc(x.alamat)}</td><td>${n}</td><td>${aksi(x.id)}</td></tr>`;
    }
  });
}

/* ---------- Layanan ---------- */
function initLayanan() {
  crud({
    key: 'layanan', label: 'Layanan', cols: 5, fields: ['nama', 'harga', 'hari'], num: ['harga', 'hari'],
    row: (x, i) => `<tr class="text-center"><td>${i + 1}</td><td>${esc(x.nama)}</td><td>${rp(x.harga)} / Kg</td><td>${x.hari} hari</td><td>${aksi(x.id)}</td></tr>`
  });
}

/* ---------- Order ---------- */
function initOrder() {
  const layananSel = $('f_layanan'), hitung = () => {
    const l = DB.get('layanan').find(x => x.nama === layananSel.value);
    $('totalPreview').textContent = rp(l ? l.harga * Number($('f_berat').value || 0) : 0);
    return l;
  };
  const render = crud({
    key: 'order', label: 'Order', cols: 8, num: ['berat'],
    fields: ['nama', 'layanan', 'berat', 'masuk', 'estimasi', 'status'],
    defaults: { masuk: today, estimasi: today, status: 'Menunggu' },
    fill: rec => {
      layananSel.innerHTML = '<option value="" disabled selected>Pilih layanan</option>' + DB.get('layanan').map(l => `<option>${esc(l.nama)}</option>`).join('');
      $('dlPelanggan').innerHTML = DB.get('pelanggan').map(p => `<option value="${esc(p.nama)}">`).join('');
      if (rec) layananSel.value = rec.layanan;
      hitung();
    },
    pre: (v, old) => {
      const l = DB.get('layanan').find(x => x.nama === v.layanan);
      v.total = v.berat * (l ? l.harga : 0);
      if (!old) v.no = 'ORD' + Date.now().toString().slice(-6);
      const p = DB.get('pelanggan');
      if (!p.some(x => x.nama.toLowerCase() === v.nama.toLowerCase())) { p.push({ id: uid(), nama: v.nama, hp: '-', alamat: '-' }); DB.set('pelanggan', p); }
    },
    row: x => `<tr class="text-center"><td>${esc(x.no)}</td><td>${esc(x.nama)}</td><td>${esc(x.layanan)}</td><td>${x.berat} Kg</td><td>${rp(x.total)}</td>
      <td>${badge(x.status)}<select class="form-select form-select-sm mt-1 st" data-id="${x.id}">${Object.keys(STATUS).map(s => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select></td>
      <td>${aksi(x.id)}</td></tr>`
  });
  layananSel.addEventListener('change', () => {
    const l = hitung(), m = $('f_masuk').value;
    if (l && m) { const d = new Date(m); d.setDate(d.getDate() + l.hari); $('f_estimasi').value = d.toISOString().slice(0, 10); }
  });
  $('f_berat').addEventListener('input', hitung);
  $('tblBody').addEventListener('change', e => {
    if (!e.target.classList.contains('st')) return;
    const d = DB.get('order'), o = d.find(x => x.id === e.target.dataset.id);
    o.status = e.target.value; DB.set('order', d); render();
  });
}

/* ---------- Dashboard ---------- */
function initDashboard() {
  const th = $('filterTahun'); tahunList(th);
  const draw = () => {
    const y = th.value, o = DB.get('order').filter(x => y === 'all' || x.masuk.startsWith(y));
    $('sOrder').textContent = o.length;
    $('sPendapatan').textContent = rp(o.reduce((a, x) => a + x.total, 0));
    $('sProses').textContent = o.filter(x => x.status === 'Menunggu' || x.status === 'Diproses').length;
    $('sPelanggan').textContent = DB.get('pelanggan').length;
    $('statusBars').innerHTML = Object.keys(STATUS).map(s => {
      const n = o.filter(x => x.status === s).length, p = o.length ? Math.round(n / o.length * 100) : 0;
      return `<div class="mb-2"><div class="d-flex justify-content-between small"><span>${s}</span><span>${n} order</span></div>
        <div class="progress"><div class="progress-bar ${STATUS[s].split(' ')[0]}" style="width:${p}%"></div></div></div>`;
    }).join('');
    const last = [...o].reverse().slice(0, 5);
    $('tblBody').innerHTML = last.length ? last.map(x => `<tr class="text-center"><td>${esc(x.no)}</td><td>${esc(x.nama)}</td><td>${esc(x.layanan)}</td><td>${rp(x.total)}</td><td>${badge(x.status)}</td></tr>`).join('')
      : '<tr><td colspan="5" class="text-center text-muted">Belum ada order pada periode ini.</td></tr>';
  };
  th.addEventListener('change', draw); draw();
}

/* ---------- Laporan ---------- */
function initLaporan() {
  const th = $('filterTahun'), bl = $('filterBulan'); tahunList(th);
  bl.innerHTML = '<option value="0">Semua bulan</option>' + BULAN.map((b, i) => `<option value="${i + 1}">${b}</option>`).join('');
  let data = [];
  const draw = () => {
    const y = th.value, m = Number(bl.value);
    data = DB.get('order').filter(x => (y === 'all' || x.masuk.startsWith(y)) && (!m || Number(x.masuk.slice(5, 7)) === m));
    $('rOrder').textContent = data.length;
    $('rKg').textContent = data.reduce((a, x) => a + x.berat, 0) + ' Kg';
    $('rTotal').textContent = rp(data.reduce((a, x) => a + x.total, 0));
    const per = {}; data.forEach(x => { const p = per[x.layanan] ||= { n: 0, kg: 0, t: 0 }; p.n++; p.kg += x.berat; p.t += x.total; });
    $('tblLayanan').innerHTML = Object.entries(per).map(([k, p]) => `<tr class="text-center"><td>${esc(k)}</td><td>${p.n}</td><td>${p.kg} Kg</td><td>${rp(p.t)}</td></tr>`).join('') || '<tr><td colspan="4" class="text-center text-muted">Tidak ada data.</td></tr>';
    $('tblBody').innerHTML = data.map(x => `<tr class="text-center"><td>${esc(x.no)}</td><td>${x.masuk}</td><td>${esc(x.nama)}</td><td>${esc(x.layanan)}</td><td>${x.berat} Kg</td><td>${rp(x.total)}</td><td>${badge(x.status)}</td></tr>`).join('') || '<tr><td colspan="7" class="text-center text-muted">Tidak ada data.</td></tr>';
  };
  th.addEventListener('change', draw); bl.addEventListener('change', draw);
  $('btnCetak').addEventListener('click', () => window.print());
  $('btnCsv').addEventListener('click', () => {
    const rows = [['No Order', 'Tanggal', 'Pelanggan', 'Layanan', 'Berat (Kg)', 'Total', 'Status'], ...data.map(x => [x.no, x.masuk, x.nama, x.layanan, x.berat, x.total, x.status])];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
    a.download = 'laporan-sjwash.csv'; a.click();
  });
  draw();
}

({ login: initLogin, pelanggan: initPelanggan, layanan: initLayanan, order: initOrder, dashboard: initDashboard, laporan: initLaporan })[page]?.();
