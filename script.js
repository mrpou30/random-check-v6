function updateNetworkStatus() {
  const dot = document.getElementById('status-dot');
  const bar = document.getElementById('status-bar');
  if (navigator.onLine) {
    dot.style.background = 'limegreen';
    bar.textContent = '🟢 Online';
  } else {
    dot.style.background = 'red';
    bar.textContent = '🔴 Offline - Mode Lokal';
  }
}

updateNetworkStatus();
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);


// ======================================================
// 🧩 RANDOM CHECK V5.0 CORE SCRIPT
// ======================================================

// ===== Global Setup =====
let db;
const DB_NAME = "RandomCheckDB_V5";
const DB_VERSION = 1;

// =====================================
// ⚙️ 1. Inisialisasi Database IndexedDB (Upgrade Versi 2)
// =====================================
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2); // ⬅️ naikkan versi ke 2

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      
      if (db.objectStoreNames.contains("dataOpname")) {
    const store = request.transaction.objectStore("dataOpname");
    store.createIndex("idx_upc", "upc", { unique: false });
    store.createIndex("idx_article", "article", { unique: false });
    }

      // dataMaster: ubah key ke id supaya bisa punya upc sama beda sloc
      if (db.objectStoreNames.contains("dataMaster")) {
        db.deleteObjectStore("dataMaster");
      }
      const masterStore = db.createObjectStore("dataMaster", { keyPath: "id" });
      masterStore.createIndex("idx_upc", "upc", { unique: false });
      masterStore.createIndex("idx_article", "article", { unique: false });

      if (!db.objectStoreNames.contains("dataOpname"))
        db.createObjectStore("dataOpname", { keyPath: "id" });

      if (!db.objectStoreNames.contains("dataUser"))
        db.createObjectStore("dataUser", { keyPath: "id" });

      if (!db.objectStoreNames.contains("dataHistoriOpname"))
        db.createObjectStore("dataHistoriOpname", { keyPath: "id" });
    };

    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };

    request.onerror = (e) => reject(e);
  });
}

// ======================================================
// 🧩 Modal User Info — Identitas Petugas (inline CSS neumorphic)
// ======================================================
async function openUserInfoModal() {
  if (!db) await initDB();

  // Ambil data lama dari localStorage
  const existing = JSON.parse(localStorage.getItem("userInfo") || "{}");

  // Cegah modal duplikat
  if (document.getElementById("user-info-modal")) {
    document.getElementById("user-info-modal").style.display = "flex";
    isiUserInfoForm(existing);
    return;
  }

  const modal = document.createElement("div");
  modal.id = "user-info-modal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.35)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "9999";
  modal.style.backdropFilter = "blur(4px)";

  modal.innerHTML = `
    <div style="
      width:90%;
      max-width:500px;
      background:#eef3f9;
      border-radius:16px;
      padding:20px 24px;
      box-shadow:9px 9px 18px rgba(0,0,0,0.08), -9px -9px 18px rgba(255,255,255,0.9);
      font-family:Segoe UI, sans-serif;
      animation:popIn 0.25s ease;">
      
      <h3 style="text-align:center; font-weight:700; margin-bottom:16px;">👤 Informasi Petugas</h3>

      <label style="font-weight:600;">Nama</label>
      <input id="user-nama" type="text" placeholder="Nama lengkap" style="
        width:100%; margin-bottom:12px; padding:10px;
        border:none; border-radius:10px;
        background:#eef3f9;
        box-shadow:inset 3px 3px 6px #cbd3db, inset -3px -3px 6px #ffffff;
      ">

      <label style="font-weight:600;">NIP</label>
      <input id="user-nip" type="text" placeholder="Nomor Induk Pegawai" style="
        width:100%; margin-bottom:12px; padding:10px;
        border:none; border-radius:10px;
        background:#eef3f9;
        box-shadow:inset 3px 3px 6px #cbd3db, inset -3px -3px 6px #ffffff;
      ">

      <label style="font-weight:600;">Departemen</label>
      <input id="user-dept" type="text" placeholder="Departemen / Bagian" style="
        width:100%; margin-bottom:12px; padding:10px;
        border:none; border-radius:10px;
        background:#eef3f9;
        box-shadow:inset 3px 3px 6px #cbd3db, inset -3px -3px 6px #ffffff;
      ">

      <label style="font-weight:600;">Link Admin (Opsional)</label>
      <input id="user-link" type="url" placeholder="Tempel link spreadsheet admin" style="
        width:100%; margin-bottom:20px; padding:10px;
        border:none; border-radius:10px;
        background:#eef3f9;
        box-shadow:inset 3px 3px 6px #cbd3db, inset -3px -3px 6px #ffffff;
      ">

      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button id="btn-simpan-user" style="
          flex:1;
          padding:10px;
          border:none;
          border-radius:10px;
          font-weight:600;
          background:#e8fce8;
          color:#006600;
          cursor:pointer;
          box-shadow:3px 3px 8px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.8);
        ">💾 Simpan</button>

        <button id="btn-close-user" style="
          flex:1;
          padding:10px;
          border:none;
          border-radius:10px;
          font-weight:600;
          background:#ff6b00;
          color:#fff;
          cursor:pointer;
          box-shadow:3px 3px 8px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.8);
        ">❌ Tutup</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);

  // Isi data lama kalau ada
  isiUserInfoForm(existing);

  // Tombol Simpan
  document.getElementById("btn-simpan-user").onclick = async () => {
    await saveUserInfo();
  };

  // Tombol Close
  document.getElementById("btn-close-user").onclick = () => {
    modal.remove();
  };
}

// ======================================================
// 💾 Simpan data user ke IndexedDB dan localStorage
// ======================================================
async function saveUserInfo() {
  const nama = document.getElementById("user-nama").value.trim();
  const nip = document.getElementById("user-nip").value.trim();
  const dept = document.getElementById("user-dept").value.trim();
  const link = document.getElementById("user-link").value.trim();

  if (!nama || !dept) {
    showAlert("error", "Nama dan Departemen wajib diisi!");
    return;
  }

  const user = {
    id: `USR_${Date.now()}`,
    nama,
    nip,
    departemen: dept,
    linkAdmin: link,
    timestamp: new Date().toLocaleString("id-ID", { hour12: false })
  };

  try {
    showLoading("Menyimpan data user...");
    if (!db) await initDB();

    // Simpan ke IndexedDB
    const tx = db.transaction("dataUser", "readwrite");
    const store = tx.objectStore("dataUser");
    store.clear(); // hanya simpan 1 user aktif
    store.put(user);

    // Simpan ke localStorage
    localStorage.setItem("userInfo", JSON.stringify(user));

    hideLoading();
    showAlert("success", "Data user berhasil disimpan!");
    const modal = document.getElementById("user-info-modal");
    if (modal) modal.remove();
  } catch (err) {
    hideLoading();
    console.error(err);
    showAlert("error", "Gagal menyimpan data user!");
  }
}

// ======================================================
// 🧠 Isi form User Info jika sudah ada data
// ======================================================
function isiUserInfoForm(user) {
  if (!user) return;
  document.getElementById("user-nama").value = user.nama || "";
  document.getElementById("user-nip").value = user.nip || "";
  document.getElementById("user-dept").value = user.departemen || "";
  document.getElementById("user-link").value = user.linkAdmin || "";
}

// ======================================================
// ⚙️ 2. Loading Overlay (Universal)
// ======================================================
function showLoading(text = "Memproses...") {
  let overlay = document.getElementById("loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.innerHTML = `
      <div class="loader-box">
        <div class="spinner"></div>
        <p id="loading-text">${text}</p>
      </div>`;
    document.body.appendChild(overlay);
  } else {
    document.getElementById("loading-text").textContent = text;
  }
  updateLoadingProgress();
  overlay.style.display = "flex";
}

function hideLoading() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) overlay.style.display = "none";
}

function updateLoadingProgress(percent) {
  const bar = document.getElementById("loading-progress-bar");
  const label = document.getElementById("loading-progress-label");

  if (bar) bar.style.width = percent + "%";
  if (label) label.textContent = percent + "%";
}


// ======================================================
// ⚙️ 3. Alert Neumorphic
// ======================================================
function showAlert(type, message, duration = 2500) {
  const alertBox = document.createElement("div");
  alertBox.className = `alert-box ${type}`;
  alertBox.innerHTML = `<p>${message}</p>`;
  document.body.appendChild(alertBox);

  setTimeout(() => alertBox.classList.add("show"), 10);

  setTimeout(() => {
    alertBox.classList.remove("show");
    setTimeout(() => alertBox.remove(), 300);
  }, duration);
}

// ======================================================
// 🔍 4. Fungsi Lookup Item
// ======================================================
async function lookupItem(keyword) {
  try {
    showLoading("Mencari data...");
    if (!db) await initDB();

    keyword = keyword.trim();
    if (!keyword) {
      hideLoading();
      showAlert("info", "Input barcode / article kosong!");
      return;
    }

    // --- Cek di dataOpname dulu ---
    const opnameTx = db.transaction("dataOpname", "readonly");
    const opnameStore = opnameTx.objectStore("dataOpname");
        // 🔍 Cari di dataOpname berdasarkan UPC atau Article
    const opnameData = await new Promise((resolve) => {
      const result = null;
      opnameStore.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const val = cursor.value;
          if (val.upc === keyword || val.article === keyword) {
            resolve(val);
            return; // stop loop
          }
          cursor.continue();
        } else {
          resolve(null);
        }
      };
    });

    if (opnameData) {
      hideLoading();
      showAlert("info", "Data ditemukan di Opname (Mode Edit)");
      tampilkanDataForm(opnameData, "edit");
      window.lastOpnameId = opnameData.id;
      return;
    }

    // --- Jika tidak ada, cek di dataMaster ---
    const masterTx = db.transaction("dataMaster", "readonly");
    const masterStore = masterTx.objectStore("dataMaster");
    const result = [];

    masterStore.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        const item = cursor.value;
        if (item.upc === keyword || item.article === keyword) {
          result.push(item);
        }
        cursor.continue();
      } else {
        hideLoading();
        if (result.length > 0) {
          const merged = mergeSloc(result);
          showAlert("success", "Data ditemukan di Master (Mode New)");
          tampilkanDataForm(merged, "new");
        } else {
          resetFormOpname();
          showAlert("error", "Data tidak ditemukan di Master!");
        }
      }
    };
  } catch (err) {
    hideLoading();
    console.error(err);
    showAlert("error", "Terjadi kesalahan saat lookup!");
  }
}

// ======================================================
// 🔧 Helper untuk Penyimpanan dataMaster
// ======================================================
async function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("DB belum siap");
      return;
    }
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e);
  });
}

function normalizeRows(rows) {
  return rows.map((r) => {
    const low = {};
    for (const k of Object.keys(r)) {
      low[k.trim().toLowerCase()] = r[k];
    }
    return {
      upc: String(low.upc || low.kode || low.barcode || ""),
      article: String(low.article || low.artikel || ""),
      desc: String(low.desc || low.deskripsi || low.nama || ""),
      sloc: String(low.sloc || low.loc || ""),
      qty: Number(low.qty || low.quantity || low.qtysistem || 0),
      harga: Number(low.harga || low.price || 0),
    };
  }).filter(i => i.upc && i.article);
}

function saveMasterBulk(list) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject("DB belum siap");
      return;
    }
    const tx = db.transaction("dataMaster", "readwrite");
    const store = tx.objectStore("dataMaster");

    let count = 0;
    for (const item of list) {
      const rec = { ...item };
      rec.id = `${rec.upc}_${rec.sloc}_${Date.now()}_${Math.floor(Math.random()*1000)}`;
      store.put(rec);
      count++;
    }
    tx.oncomplete = () => resolve(count);
    tx.onerror = (e) => reject(e);
  });
}

// ======================================================
// ⚙️ Fungsi Update Master (Upload, Server, GDrive, Hapus)
// ======================================================

const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-LegEz9ZhksC-zX-kdajSGodcjPj4bvNj3x2Ak6nAjyZgJs6IeMw3NVJzpd9f_vV_ww/exec";
const DRIVE_UPLOAD_URL = "https://script.google.com/macros/s/YYY/exec";

// Upload XLS/XLSX
async function updateMasterFromExcelFile(file) {
  try {
    showLoading("Memproses file Excel...");
    await initDB();
    const data = await new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'binary' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          res(json);
        } catch (err) { rej(err); }
      };
      reader.readAsBinaryString(file);
    });

    const normalized = normalizeRows(data);
    await clearStore("dataMaster");
    const cnt = await saveMasterBulk(normalized);

    hideLoading();
    showAlert("success", `Master Excel disimpan (${cnt} item).`);
    const modal = document.getElementById("update-master-modal");
    if (modal) modal.remove();
  } catch (e) {
    hideLoading();
    showAlert("error", "Gagal proses file Excel.");
  }
}

// Upload CSV
async function updateMasterFromCSVFile(file) {
  try {
    showLoading("Memproses file CSV...");
    await initDB();
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const obj = {};
      line.split(',').forEach((v, i) => obj[headers[i]] = v);
      return obj;
    });
    const normalized = normalizeRows(rows);
    await clearStore("dataMaster");
    const cnt = await saveMasterBulk(normalized);
    hideLoading();
    showAlert("success", `Master CSV disimpan (${cnt} item).`);
    const modal = document.getElementById("update-master-modal");
    if (modal) modal.remove();
  } catch (e) {
    hideLoading();
    showAlert("error", "Gagal proses file CSV.");
  }
}

// Ambil dari Server (AppScript)
async function updateMasterFromServer() {
  try {
    showLoading("Mengambil master dari server...");
    await initDB();
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const linkAdmin = userInfo.linkAdmin;
    if (!linkAdmin) throw new Error("linkAdmin tidak ditemukan di userInfo");
    if (!linkAdmin) throw new Error("linkAdmin tidak ditemukan");

    const url = `${APP_SCRIPT_URL}?linkAdmin=${encodeURIComponent(linkAdmin)}`;
    
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    const data = await res.json();
    const normalized = normalizeRows(Array.isArray(data) ? data : data.data || []);
    await clearStore("dataMaster");
    const cnt = await saveMasterBulk(normalized);

    hideLoading();
    showAlert("success", `Master dari server tersimpan (${cnt} item).`);
    const modal = document.getElementById("update-master-modal");
    if (modal) modal.remove();
  } catch (e) {
    hideLoading();
    showAlert("error", "Gagal ambil master dari server: " + e.message);
  }
}

// Upload ke GDrive (generate master.json)
async function generateAndUploadMasterJson(rows) {
  try {
    showLoading("Mengunggah master.json ke GDrive...");
    const blob = new Blob([JSON.stringify(rows)], { type: "application/json" });
    const form = new FormData();
    form.append("file", blob, "master.json");
    const res = await fetch(DRIVE_UPLOAD_URL, { method: "POST", body: form });
    hideLoading();
    showAlert("success", "master.json berhasil diupload ke Drive.");
    const modal = document.getElementById("update-master-modal");
    if (modal) modal.remove();
  } catch (e) {
    hideLoading();
    showAlert("error", "Upload ke Drive gagal.");
  }
}

// Hapus Master
async function clearDataMaster() {
  try {
    showLoading("Menghapus data master...");
    await initDB();
    await clearStore("dataMaster");
    hideLoading();
    showAlert("info", "Data master dihapus.");
    const modal = document.getElementById("update-master-modal");
    if (modal) modal.remove();
  } catch (e) {
    hideLoading();
    showAlert("error", "Gagal hapus data master.");
  }
}

// ======================================================
// 🔧 5. Gabung Qty dari Banyak SLOC
// ======================================================
function mergeSloc(list) {
  const totalQty = list.reduce((sum, i) => sum + Number(i.qty || 0), 0);
  const hint = list.map(i => `SLOC ${i.sloc}: ${i.qty}`).join(" | ");
  
  return {
    upc: list[0].upc,
    article: list[0].article,
    desc: list[0].desc,
    qtySistem: totalQty,
    hintSloc: hint,
    harga: list[0].harga,
    slocList: list.map(i => ({ sloc: i.sloc, qty: i.qty })) // ⬅ penting
  };
}

// ======================================================
// 🧾 6. Tampilkan Data ke Form Input
// ======================================================
function tampilkanDataForm(data, mode) {
  document.getElementById("input-upc").value = data.upc || "";
  document.getElementById("article").value = data.article || "";
  document.getElementById("desc").value = data.desc || "";
  document.getElementById("qty-sistem").value = data.qtySistem || "";
  document.getElementById("harga").value = data.harga || 0;
  document.getElementById("sloc").textContent = data.hintSloc || "";
  document.getElementById("qty-fisik").value = data.qtyFisik || "";
  document.getElementById("keterangan").value = data.keterangan || "";

  // Simpan mode aktif
  document.body.dataset.mode = mode;
  window.activeSlocList = data.slocList || [];
}

// ======================================================
// 💾 SIMPAN / UPDATE DATA OPNAME (mode new / edit)
// ======================================================
async function simpanDataOpname() {
  const btn = document.getElementById("btn-save");
  try {
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = "0.6";
      btn.textContent = "Menyimpan...";
    }
    showLoading("Menyimpan data opname...");
    if (!db) await initDB();

    // --- Ambil semua input dari form ---
    const upc = document.getElementById("input-upc").value.trim();
    const article = document.getElementById("article").value.trim();
    const desc = document.getElementById("desc").value.trim();
    // Data slocList dibawa dari lookup → tampilkanDataForm()
const slocList = window.activeSlocList || [];
    const qtySistem = Number(document.getElementById("qty-sistem").value || 0);
    const qtyFisik = Number(document.getElementById("qty-fisik").value || 0);
    const harga = Number(document.getElementById("harga")?.value || 0);
    const keterangan = document.getElementById("keterangan").value.trim() || "-";

    // Ambil userInfo dari localStorage (user disimpan sebagai { nama, nip, departemen, ... })
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const petugasFromUser = userInfo.nama || userInfo.petugas || "Anonim";
    const departemenFromUser = userInfo.departemen || userInfo.dept || "-";

    // --- Validasi dasar ---
    if (!upc) {
      hideLoading();
      showAlert("error", "UPC wajib diisi!");
      return;
    }

    // --- Hitung selisih & value ---
    const selisih = qtyFisik - qtySistem;
    const valueSelisih = selisih * harga;

    // --- Timestamp ---
    const now = new Date();
    const timestamp = now.toLocaleString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });

    // --- Ambil mode aktif (new / edit) ---
    const mode = document.body.dataset.mode || "new";

    // --- ID record ---
    let recordId;
    if (mode === "edit" && window.lastOpnameId) {
      recordId = window.lastOpnameId; // gunakan ID lama
    } else {
      recordId = `${upc}_${Date.now()}`; // buat ID baru
    }

    // --- Buat data record ---
    // --- Buat data record (sertakan petugas & departemen dari userInfo) ---
    const record = {
      id: recordId,
      upc,
      article,
      desc,
      qtySistem,
      qtyFisik,
      selisih,
      harga,
      valueSelisih,
      petugas: petugasFromUser,
      departemen: departemenFromUser,
      keterangan,
      timestamp,
      slocList: slocList
    };

    // ======================================================
    // 🗂️ Simpan / Update ke dataOpname
    // ======================================================
    const tx1 = db.transaction("dataOpname", "readwrite");
    const store1 = tx1.objectStore("dataOpname");
    store1.put(record);

    // ======================================================
    // 🕒 Simpan ke dataHistoriOpname (selalu log baru)
    // ======================================================
    const tx2 = db.transaction("dataHistoriOpname", "readwrite");
    const store2 = tx2.objectStore("dataHistoriOpname");

    // buat salinan dengan id history unik
    const histRec = { ...record, id: `${record.id}_hist_${Date.now()}` };
    store2.put(histRec);

    await Promise.all([
      new Promise(res => tx1.oncomplete = res),
      new Promise(res => tx2.oncomplete = res)
    ]);

    hideLoading();
    showAlert("success", mode === "edit" ? "Data opname berhasil diperbarui!" : "Data opname baru berhasil disimpan!");

    // --- Reset form setelah simpan ---
    resetFormOpname();
    // ===== Fokus balik ke input UPC =====
    setTimeout(() => {
        const inputUPC = document.getElementById("input-upc");
        inputUPC.focus();
        inputUPC.select(); // optional: biar langsung siap scan
    }, 50);

  } catch (err) {
    console.error(err);
    hideLoading();
    showAlert("error", "Gagal menyimpan data opname!");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.textContent = "💾 Simpan"
    }
  }
}

// ======================================================
// 🧹 RESET FORM SETELAH SIMPAN
// ======================================================
function resetFormOpname() {
  const fields = ["input-upc", "article", "desc", "qty-sistem", "qty-fisik", "harga", "keterangan"];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const slocEl = document.getElementById("sloc");
  if (slocEl) slocEl.textContent = "";
  document.body.dataset.mode = "new";
  window.lastOpnameId = null;
}

// ======================================================
// 🎯 EVENT: Klik Tombol SIMPAN
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const btnSimpan = document.getElementById("btn-save");

  // Jika tombol sudah ada di DOM saat halaman dimuat
  if (btnSimpan) {
    btnSimpan.addEventListener("click", (e) => {
      e.preventDefault();
      simpanDataOpname();
    });
  } else {
    // Jika tombol muncul dinamis (misal setelah load template)
    const observer = new MutationObserver(() => {
      const dynamicBtn = document.getElementById("btn-simpan");
      if (dynamicBtn) {
        dynamicBtn.addEventListener("click", (e) => {
          e.preventDefault();
          simpanDataOpname();
        });
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
});


function updateUserHeaderInfo() {
  const el = document.getElementById("user-info-header");
  if (!el) return;

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("userInfo")) || {};
  } catch (e) {
    console.warn("UserInfo tidak valid");
  }

  const nama = user.nama || user.petugas || "-";
  const dept = user.departemen || "-";

  const today = new Date();
  const tanggal = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  el.innerHTML = `
      <strong>${nama}</strong><br/>
      ${dept}<br/>
      <small>${tanggal}</small>
  `;
}

// ======================================================
// 🚀 7. Init Saat Halaman Dibuka
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  showLoading("Memuat aplikasi...");
  await initDB();
  hideLoading();
  openUserInfoModal();
  showAlert("info", "Silahkan isi data terlebih dahulu");
  updateUserHeaderInfo();
});

// ======================================================
// 📲 8. Event Lookup (Enter / Scan)
// ======================================================
const inputUPC = document.getElementById("input-upc");
if (inputUPC) {
  inputUPC.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      lookupItem(inputUPC.value);
    }
  });
}

// ======================================================
// 🧩 Modal Update Master — Inline Style Neumorphic
// ======================================================
function openUpdateMasterModal() {
  if (document.getElementById("update-master-modal")) {
    document.getElementById("update-master-modal").style.display = "flex";
    return;
  }

  const modal = document.createElement("div");
  modal.id = "update-master-modal";
  modal.style.position = "fixed";
  modal.style.inset = "0";
  modal.style.background = "rgba(0,0,0,0.35)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.backdropFilter = "blur(4px)";
  modal.style.zIndex = "9999";

  modal.innerHTML = `
    <div 
      style="
        width:90%;
        max-width:600px;
        background:#eef3f9;
        border-radius:18px;
        padding:20px;
        box-shadow:9px 9px 18px rgba(0,0,0,0.08), -9px -9px 18px rgba(255,255,255,0.9);
        animation:popIn 0.25s ease;
        font-family:Segoe UI, sans-serif;
      "
    >
      <h3 
        style="
          font-size:1.3rem;
          font-weight:700;
          text-align:center;
          color:#333;
          margin-bottom:16px;
          text-shadow:1px 1px 1px rgba(255,255,255,0.7);
        "
      >
        🔄 Update Master
      </h3>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <label style="font-weight:600;">📂 Upload File Excel (.xls/.xlsx)</label>
        <input 
          type="file" 
          id="input-xlsx" 
          accept=".xls,.xlsx"
          style="
            background:#eef3f9;
            border:none;
            border-radius:10px;
            padding:10px;
            box-shadow:inset 3px 3px 6px #cbd3db, inset -3px -3px 6px #ffffff;
            cursor:pointer;
          "
        >
        <button 
          id="btn-upload-xlsx"
          style="
            border:none;
            border-radius:10px;
            padding:10px;
            background:#f0f4f8;
            font-weight:600;
            cursor:pointer;
            box-shadow:3px 3px 8px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.8);
          "
        >
          Upload XLSX
        </button>

        <label style="font-weight:600;">📁 Upload File CSV</label>
        <input 
          type="file" 
          id="input-csv" 
          accept=".csv"
          style="
            background:#eef3f9;
            border:none;
            border-radius:10px;
            padding:10px;
            box-shadow:inset 3px 3px 6px #cbd3db, inset -3px -3px 6px #ffffff;
            cursor:pointer;
          "
        >
        <button 
          id="btn-upload-csv"
          style="
            border:none;
            border-radius:10px;
            padding:10px;
            background:#f0f4f8;
            font-weight:600;
            cursor:pointer;
            box-shadow:3px 3px 8px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.8);
          "
        >
          Upload CSV
        </button>

        <button 
          id="btn-fetch-server"
          style="
            border:none;
            border-radius:10px;
            padding:10px;
            background:#d8efff;
            font-weight:600;
            cursor:pointer;
            color:#004466;
            box-shadow:3px 3px 8px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.8);
          "
        >
          🌐 Ambil dari Server
        </button>

        <button 
          id="btn-upload-drive"
          style="
            display:none !important;
            border:none;
            border-radius:10px;
            padding:10px;
            background:#e8fce8;
            font-weight:600;
            cursor:pointer;
            color:#007a00;
            box-shadow:3px 3px 8px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.8);
          "
        >
          ☁️ Update Master (Upload ke Drive)
        </button>

        <button 
          id="btn-clear-master"
          style="
            border:none;
            border-radius:10px;
            padding:10px;
            background:#ffecec;
            font-weight:600;
            color:#b30000;
            cursor:pointer;
            box-shadow:3px 3px 8px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.8);
          "
        >
          🗑️ Hapus Master
        </button>

        <button 
          id="btn-close"
          style="
            border:none;
            border-radius:10px;
            padding:10px;
            background:#ff6b00;
            color:#fff;
            font-weight:700;
            cursor:pointer;
            margin-top:10px;
            box-shadow:3px 3px 8px rgba(0,0,0,0.1), -3px -3px 8px rgba(255,255,255,0.8);
          "
        >
          ❌ Tutup
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 🔘 Event actions
  document.getElementById("btn-close").onclick = () => modal.remove();
  document.getElementById("btn-upload-xlsx").onclick = async () => {
    const f = document.getElementById("input-xlsx").files[0];
    if (!f) return showAlert("info", "Pilih file XLSX dulu");
    await updateMasterFromExcelFile(f);
  };
  document.getElementById("btn-upload-csv").onclick = async () => {
    const f = document.getElementById("input-csv").files[0];
    if (!f) return showAlert("info", "Pilih file CSV dulu");
    await updateMasterFromCSVFile(f);
  };
  document.getElementById("btn-fetch-server").onclick = async () => await updateMasterFromServer();
  // Upload ke Drive
document.getElementById("btn-upload-drive").onclick = async () => {
  const fX = document.getElementById("input-xlsx").files[0];
  const fC = document.getElementById("input-csv").files[0];
  if (!fX && !fC) {
    return showAlert("info", "Pilih file XLSX atau CSV terlebih dahulu untuk diupload ke Drive");
  }

  try {
    showLoading("Membaca file sebelum upload...");
    let rows = [];

    if (fX) {
      const data = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const wb = XLSX.read(e.target.result, { type: 'binary' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            res(json);
          } catch (err) { rej(err); }
        };
        reader.readAsBinaryString(fX);
      });
      rows = data;
    } else if (fC) {
      const text = await fC.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      rows = lines.slice(1).map(line => {
        const cols = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h] = cols[i] || "");
        return obj;
      });
    }

    hideLoading();
    await generateAndUploadMasterJson(rows); // 🔁 panggil fungsi upload yang sudah kamu buat
  } catch (err) {
    hideLoading();
    console.error(err);
    showAlert("error", "Gagal membaca atau mengunggah file ke Drive");
  }
};
  document.getElementById("btn-clear-master").onclick = async () => {
    if (confirm("Yakin hapus data master?")) await clearDataMaster();
  };
}

// ======================================================
// 👀 LIHAT DATA OPNAME (MODAL + TABEL + EDIT/HAPUS)
// ======================================================
async function lihatDataOpname() {
  try {
    showLoading("Memuat data opname...");
    if (!db) await initDB();
    
    // 🔹 Ambil petugas & departemen dari localStorage.userInfo
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const petugasLS = userInfo.nama || "Unknown";
    const departemenLS = userInfo.departemen || "Unknown";

    // Ambil departemen dari dataUser (jika ada)
    let departemen = "-";
    const userTx = db.transaction("dataUser", "readonly");
    const userStore = userTx.objectStore("dataUser");
    const userReq = userStore.get("user");
    await new Promise((res) => {
      userReq.onsuccess = () => {
        if (userReq.result) departemen = userReq.result.departemen || "-";
        res();
      };
      userReq.onerror = () => res();
    });

    // Ambil data dari dataOpname
    const tx = db.transaction("dataOpname", "readonly");
    const store = tx.objectStore("dataOpname");

    const data = await new Promise((resolve) => {
      const result = [];
      store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        } else resolve(result);
      };
    });

    hideLoading();

    // Jika data kosong
    if (!data.length) {
      showAlert("info", "Belum ada data opname.");
      return;
    }

    // ===== Modal Fullscreen =====
    const modal = document.createElement("div");
    modal.id = "modal-lihat-data";
    modal.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.35);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    // ===== Card Modal =====
    const card = document.createElement("div");
    card.style.cssText = `
      width: 95%;
      max-width: 1100px;
      max-height: 90vh;
      overflow: hidden;
      background: #f2f3f5;
      border-radius: 18px;
      padding: 18px;
      box-shadow: 6px 6px 12px #c9c9c9,
                  -6px -6px 12px #ffffff;
      display: flex;
      flex-direction: column;
    `;

    // Judul
    const title = document.createElement("h3");
    title.innerText = "📋 Data Opname";
    title.style.cssText = `text-align:center; margin-bottom: 12px;`;

    // ===== Table Wrapper (scrollable) =====
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      overflow-x: auto;
      overflow-y: auto;
      max-height: 70vh;
      border-radius: 12px;
      border: 1px solid #ddd;
    `;

    // ===== Tabel =====
    let tableHTML = `
      <table style="width:1700px; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background:#e6e7eb;">
            <th style="padding:6px; border-bottom:1px solid #ccc;">UPC</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Article</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Deskripsi</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">SLOC</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Qty Sistem</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Qty Fisik</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Selisih</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Harga</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Keterangan</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Petugas</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Departemen</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Timestamp</th>
            <th style="padding:6px; border-bottom:1px solid #ccc;">Aksi</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((d) => {
      tableHTML += `
        <tr>
          <td style="padding:4px; border-bottom:1px solid #eee;">${d.upc}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">${d.article}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">${d.desc}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">${(d.slocList || []).map(s => `SLOC ${s.sloc}: ${s.qty}`).join(" | ")}</td>
          <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">${d.qtySistem}</td>
          <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">${d.qtyFisik}</td>
          <td style="padding:4px; border-bottom:1px solid #eee; text-align:right; color:${
            d.selisih < 0 ? 'red' : d.selisih > 0 ? 'green' : '#333'
          }">${d.selisih}</td>
          <td style="padding:4px; border-bottom:1px solid #eee; text-align:right;">${d.harga}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">${d.keterangan}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">${petugasLS}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">${departemenLS}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">${d.timestamp}</td>
          <td style="padding:4px; border-bottom:1px solid #eee;">
            <button onclick="editDataOpname('${d.id}')" style="margin-right:5px;">✏️</button>
            <button onclick="hapusDataOpname('${d.id}')">🗑️</button>
          </td>
        </tr>
      `;
    });

    tableHTML += "</tbody></table>";
    wrapper.innerHTML = tableHTML;

    // ===== Tombol bawah =====
    const footer = document.createElement("div");
    footer.style.cssText = `margin-top:14px; text-align:center;`;

    footer.innerHTML = `
      <button id="btn-hapus-semua" style="
        margin-right:10px; padding:8px 16px; border-radius:10px;
        background:#f5d2d2; border:none;
      ">🗑️ Hapus Semua</button>

      <button id="btn-tutup-lihat" style="
        padding:8px 16px; border-radius:10px;
        background:#f0f0f3; border:none;
        box-shadow: 4px 4px 10px #ccc, -4px -4px 10px #fff;
      ">Tutup</button>
    `;

    // Susun modal
    card.appendChild(title);
    card.appendChild(wrapper);
    card.appendChild(footer);
    modal.appendChild(card);
    document.body.appendChild(modal);

    // Event Tutup
    document.getElementById("btn-tutup-lihat").onclick = () => modal.remove();

    // Event Hapus Semua
    document.getElementById("btn-hapus-semua").onclick = () => {
      if (confirm("Yakin hapus semua data opname?")) {
        hapusSemuaDataOpname();
        modal.remove();
      }
    };

  } catch (err) {
    console.error(err);
    hideLoading();
    showAlert("error", "Gagal membuka data!");
  }
}

async function editDataOpname(id) {
  try {
    showLoading("Memuat data untuk edit...");
    if (!db) await initDB();

    const tx = db.transaction("dataOpname", "readonly");
    const store = tx.objectStore("dataOpname");
    const req = store.get(id);

    req.onsuccess = () => {
      const data = req.result;
      hideLoading();

      if (!data) {
        showAlert("error", "Data tidak ditemukan!");
        return;
      }

      // Set data ke form utama
      tampilkanDataForm(data, "edit");
      window.lastOpnameId = id;
      showAlert("info", "Mode Edit aktif");

      // 🔥 Tutup semua modal lihat data
      const modal = document.getElementById("modal-view");
      if (modal) modal.remove();

      // 🔥 Jika ada modal lain dengan class 'modal', tutup juga
      document.querySelectorAll("[id^='modal']").forEach(m => m.remove());
    };
  } catch (err) {
    hideLoading();
    showAlert("error", "Gagal membuka data untuk edit!");
  }
}

async function hapusDataOpname(id) {
  if (!confirm("Hapus data ini?")) return;

  try {
    showLoading("Menghapus data...");
    if (!db) await initDB();

    const tx = db.transaction("dataOpname", "readwrite");
    tx.objectStore("dataOpname").delete(id);

    await new Promise(res => tx.oncomplete = res);

    hideLoading();
    showAlert("success", "Data berhasil dihapus!");
    const modal = document.getElementById("modal-lihat-data");
      if (modal) modal.remove();

    lihatDataOpname(); // refresh
  } catch (err) {
    hideLoading();
    showAlert("error", "Gagal menghapus data!");
  }
}

async function hapusSemuaDataOpname() {
  try {
    showLoading("Menghapus semua data...");
    if (!db) await initDB();

    const tx = db.transaction("dataOpname", "readwrite");
    tx.objectStore("dataOpname").clear();

    await new Promise(res => tx.oncomplete = res);

    hideLoading();
    showAlert("success", "Semua data opname terhapus!");
  } catch (err) {
    hideLoading();
    showAlert("error", "Gagal menghapus semua data!");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btnLihat = document.getElementById("btn-view");
  if (btnLihat) {
    btnLihat.addEventListener("click", () => lihatDataOpname());
  }
});

// ======================================================
// 📜 MODAL HISTORY
// ======================================================
async function openHistoryModal() {
  try {
    showLoading("Memuat history...");
    if (!db) await initDB();

    // ===== Ambil userInfo dari localStorage =====
   const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const departemenLS = userInfo.departemen || userInfo.dept || "Unknown";
    const petugasLS = userInfo.nama || userInfo.petugas || "Unknown";

    // ===== Ambil seluruh data histori =====
    const tx = db.transaction("dataHistoriOpname", "readonly");
    const store = tx.objectStore("dataHistoriOpname");

    const historyData = await new Promise((resolve) => {
      const result = [];
      store.openCursor().onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          result.push(cursor.value);
          cursor.continue();
        } else resolve(result);
      };
    });

    hideLoading();

    // ===== Modal container =====
    const modal = document.createElement("div");
    modal.id = "modal-history";
    modal.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.40);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
    `;

    // ===== Card =====
    const card = document.createElement("div");
    card.style.cssText = `
      width: 100%;
      max-width: 1200px;
      max-height: 90vh;
      overflow: hidden;
      background: #f2f3f5;
      border-radius: 18px;
      padding: 18px;
      box-shadow: 6px 6px 12px #c9c9c9,
                  -6px -6px 12px #ffffff;
      display: flex;
      flex-direction: column;
    `;

    // ===== Header =====
    const headerHTML = `
  <h3 style="text-align:center; margin-bottom:10px;">📜 HISTORY STOCK OPNAME</h3>

  <!-- BARIS 1 — FILTER INPUT -->
  <div style="display:flex; gap:10px; margin-bottom:10px;">
    <input id="filter-tanggal" type="date" style="padding:6px; border-radius:6px;">
    
    <select id="filter-departemen" style="padding:6px; border-radius:6px;">
      <option value="">Semua Departemen</option>
      <option value="${departemenLS}">${departemenLS}</option>
    </select>
  </div>

  <!-- BARIS 2 — BUTTON ACTION -->
  <div style="display:flex; gap:10px; margin-bottom:15px;">
    <button id="btn-filter-history" style="
      padding:6px 12px; border-radius:8px; border:none;
    ">🔍 Filter</button>

    <button id="btn-export-xls" style="
      padding:6px 12px; border-radius:8px; border:none;
      background:#d4ffd4;
    ">📤 Export XLS</button>
        
    <button id="btn-clear-history" style="
      padding:6px 12px; border-radius:8px; border:none;
      background:#ffd4d4;
    ">🗑 Hapus History</button>
  </div>
`;

    // ===== Tabel =====
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `
      overflow-x: auto;
      overflow-y: auto;
      max-height: 65vh;
      border: 1px solid #ddd;
      border-radius: 12px;
    `;

    wrapper.innerHTML = `
      <table id="table-history" style="width:2000px; border-collapse:collapse;">
        <thead>
          <tr style="background:#e6e7eb;">
            <th>Timestamp</th>
            <th>UPC</th>
            <th>Article</th>
            <th>Deskripsi</th>
            <th>SLOC</th>
            <th>Qty Sistem</th>
            <th>Qty Fisik</th>
            <th>Selisih</th>
            <th>Harga</th>
            <th>Value Selisih</th>
            <th>Petugas</th>
            <th>Departemen</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody id="body-history"></tbody>
      </table>
    `;

    // ===== Footer =====
    const footer = document.createElement("div");
    footer.style.cssText = `margin-top:14px; text-align:center;`;
    footer.innerHTML = `
      <button id="btn-history-close" style="
        padding:8px 16px; border-radius:10px; border:none;
        background:#f0f0f3;
      ">Tutup</button>
    `;

    // ===== Susun Modal =====
    card.innerHTML = headerHTML;
    card.appendChild(wrapper);
    card.appendChild(footer);
    modal.appendChild(card);
    document.body.appendChild(modal);

    // ==== Isi tabel pertama kali ====
    renderHistoryTable(historyData, departemenLS);

    // ==== Event filter ====
    document.getElementById("btn-filter-history").onclick = () => {
      renderHistoryTable(historyData, departemenLS);
    };

    // ==== Event ekspor XLS ====
    document.getElementById("btn-export-xls").onclick = () => {
      exportHistoryToXLS();
    };

    // ==== Event close ====
        document.getElementById("btn-history-close").onclick = () => modal.remove();
        
        // ==== Event Hapus History (pasang setelah modal ada) ====
    const btnClearHistory = document.getElementById("btn-clear-history");
    if (btnClearHistory) {
      btnClearHistory.onclick = async () => {
        const ok = confirm("Yakin ingin menghapus seluruh history opname? Proses ini tidak bisa dibatalkan.");
        if (!ok) return;
        await confirmClearHistory();
        // refresh table
        renderHistoryTable([], departemenLS);
        // optionally close modal: modal.remove();
      };
    }

  } catch (err) {
    hideLoading();
    showAlert("error", "Gagal membuka history!");
  }
}

//render history
function renderHistoryTable(allData, departemenLS) {
  const tanggal = document.getElementById("filter-tanggal").value;
  const departemenFilter = document.getElementById("filter-departemen").value;

  const tbody = document.getElementById("body-history");

  let filtered = allData;

  // === Filter tanggal ===
  if (tanggal) {
    const tglFormat = tanggal.split("-").reverse().join("/"); // yyyy-mm-dd → dd/mm/yyyy
    filtered = filtered.filter(d => d.timestamp.startsWith(tglFormat));
  }

  // === Filter departemen ===
  if (departemenFilter) {
    filtered = filtered.filter(d => d.departemen === departemenFilter);
  }

  tbody.innerHTML = filtered.map(d => `
    <tr>
      <td>${d.timestamp}</td>
      <td>${d.upc}</td>
      <td>${d.article}</td>
      <td>${d.desc}</td>
      <td>${(d.slocList || []).map(s => `SLOC ${s.sloc}: ${s.qty}`).join(" | ")}</td>
      <td>${d.qtySistem}</td>
      <td>${d.qtyFisik}</td>
      <td style="color:${d.selisih < 0 ? 'red' : 'green'}">${d.selisih}</td>
      <td>${d.harga}</td>
      <td>${d.valueSelisih}</td>
      <td>${d.petugas}</td>
      <td>${d.departemen}</td>
      <td>${d.keterangan}</td>
    </tr>
  `).join("");
}
//export xls History
function exportHistoryToXLS() {
  const table = document.getElementById("table-history").outerHTML;

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  const departemen = userInfo.departemen || "Dept";
  const tanggal = document.getElementById("filter-tanggal").value || "ALL";

  const tglName = tanggal ? tanggal.replace(/-/g, "") : "ALL";

  const filename = `SO_${departemen}_${tglName}.xls`;

  const blob = new Blob([table], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

document.addEventListener("DOMContentLoaded", () => {
  const btnHistory = document.getElementById("btn-history");
  if (btnHistory) {
    btnHistory.addEventListener("click", () => openHistoryModal());
   }
  });
  
  function confirmClearHistory() {
  if (!confirm("Hapus semua data history?")) return;

  showLoading("Menghapus history...");

  const tx = db.transaction("dataHistoriOpname", "readwrite");
  const store = tx.objectStore("dataHistoriOpname");
  const clearReq = store.clear();

  clearReq.onsuccess = () => {
    hideLoading();
    showAlert("success", "History berhasil dibersihkan!");
    
    // Refresh tabel kosong
    const tbody = document.getElementById("body-history");
    if (tbody) tbody.innerHTML = "";
  };

  clearReq.onerror = () => {
    hideLoading();
    showAlert("error", "Gagal menghapus history!");
  };
}


// ==========================
// 📸 Scan Barcode (Auto Enter)
// ==========================
const btnScan = document.getElementById("btn-scan");
const btnCloseScan = document.getElementById("btn-close-scan");
const scannerBox = document.getElementById("scanner-box");
let html5QrCode;

btnScan.addEventListener("click", () => {
  scannerBox.style.display = "block";
  html5QrCode = new Html5Qrcode("scanner");
  const config = { fps: 10, qrbox: 250, facingMode: "environment" }; // Kamera belakang
  html5QrCode.start(
    { facingMode: "environment" },
    config,
    (decodedText) => {
      playBeep();
      inputUPC.value = decodedText;
      html5QrCode.stop();
      scannerBox.style.display = "none";

      // 🚀 Langsung auto lookup
      lookupItem(decodedText.trim());
    }
  );
});

btnCloseScan.addEventListener("click", () => {
  if (html5QrCode) html5QrCode.stop();
  scannerBox.style.display = "none";
});

// Jalankan kamera belakang jika tersedia
function startScanner() {
  Html5Qrcode.getCameras()
    .then(devices => {
      if (devices && devices.length) {
        // cari kamera belakang
        const backCam = devices.find(cam => cam.label.toLowerCase().includes("back")) || devices[0];

        html5QrCode.start(
          backCam.id,
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            inputUpc.value = decodedText;
            stopScanner();
            console.log("Scan berhasil:", decodedText);
            
            // 🔸 nanti bisa tambahkan auto-lookup di sini
          },
          (errorMessage) => {
            // console.log("Scanning...", errorMessage);
          }
        );
      } else {
        alert("Tidak ada kamera yang ditemukan.");
      }
    })
    .catch(err => {
      alert("Gagal mengakses kamera: " + err);
    });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => {
      scannerBox.style.display = "none";
    }).catch(err => {
      console.log("Gagal menghentikan scanner:", err);
    });
  } else {
    scannerBox.style.display = "none";
  }
}

let beepLocked = false;

function playBeep() {
  if (beepLocked) return;
  beepLocked = true;

  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";            // sine lebih halus daripada square
  osc.frequency.value = 1000;   // 1000 Hz = suara "tiiip" ala kasir
  gain.gain.value = 0.3;        // sedikit lebih keras

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();

  setTimeout(() => {
    osc.stop();
    ctx.close();
    beepLocked = false;
  }, 250); // durasi beep 250 ms (lebih panjang & jelas)
}
  
  
  // ======================================================
// 📤 UPLOAD DATA OPNAME -> Apps Script (POST JSON)
// ======================================================
const APP_SCRIPT_UPLOAD_URL = "https://script.google.com/macros/s/AKfycbwGu2q_nU2I1DsiZbErMH7B5IRYrQrjYTDnIY6pbxVkb8XookDnfSUeKQWIJYUHmw-t/exec"; // <- ganti

async function readAllDataOpname() {
  if (!db) await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("dataOpname", "readonly");
    const store = tx.objectStore("dataOpname");
    const rows = [];
    store.openCursor().onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        rows.push(cursor.value);
        cursor.continue();
      } else resolve(rows);
    };
    tx.onerror = (e) => reject(e);
  });
}

function formatDate_dd_mm_yyyy(date = new Date()) {
  const d = ("0" + date.getDate()).slice(-2);
  const m = ("0" + (date.getMonth() + 1)).slice(-2);
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

async function uploadOpnameToServer() {
  try {
    // Konfirmasi
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const departemen = userInfo.departemen || userInfo.dept || "UNKNOWN";
    const tanggalName = formatDate_dd_mm_yyyy(new Date());
    const ok = confirm(`Data SO ${tanggalName} ${departemen} siap dikirim. Klik YA untuk melanjutkan.`);
    if (!ok) return;

    showLoading("Mengumpulkan data opname...");
    // baca semua dataOpname
    const all = await readAllDataOpname();
    if (!all.length) {
      hideLoading();
      showAlert("info", "Belum ada data opname untuk dikirim.");
      return;
    }

    // ambil linkAdmin dari userinfo
    const linkAdmin = userInfo.linkAdmin || localStorage.getItem("linkAdmin") || "";
    if (!linkAdmin) {
      hideLoading();
      showAlert("error", "linkAdmin tidak ditemukan di userInfo.");
      return;
    }

    // bangun payload: sertakan userInfo untuk departemen & petugas
    const payload = {
      action: "uploadOpname",
      linkAdmin: linkAdmin,
      departemen: departemen,
      sheetNameDate: `SO_${tanggalName}_${departemen}`,
      timestampGenerated: new Date().toISOString(),
      rows: all.map(r => ({
        upc: r.upc || "",
        article: r.article || "",
        desc: r.desc || "",
        slocList: r.slocList || [],     // array { sloc, qty }
        qtySistem: Number(r.qtySistem || 0),
        qtyFisik: Number(r.qtyFisik || 0),
        selisih: Number(r.selisih || (Number(r.qtyFisik || 0) - Number(r.qtySistem || 0))),
        harga: Number(r.harga || 0),
        valueSelisih: Number(r.valueSelisih || 0),
        petugas: r.petugas || userInfo.nama || userInfo.petugas || "",
        departemen: r.departemen || userInfo.departemen || userInfo.dept || departemen,
        keterangan: r.keterangan || "",
        timestamp: r.timestamp || ""
      }))
    };

    showLoading("Mengirim data ke server...");
      const res = await fetch(APP_SCRIPT_UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "data=" + encodeURIComponent(JSON.stringify(payload)),
    });

    const data = await res.json();
    hideLoading();

    if (!res.ok || data.status !== "success") {
      console.error("Upload error:", data);
      showAlert("error", data.message || "Gagal upload ke server");
      return;
    }

    // sukses
    showAlert("success", `Upload selesai. Rows created: ${data.created || 0}, updated: ${data.updated || 0}`);
  } catch (err) {
    console.error(err);
    hideLoading();
    showAlert("error", "Terjadi kesalahan saat upload. Cek console.");
  }
}

// Pasang event ke tombol upload (id btn-upload)
document.addEventListener("DOMContentLoaded", () => {
  const btnUpload = document.getElementById("btn-upload");
  if (btnUpload) {
    btnUpload.addEventListener("click", (e) => {
      e.preventDefault();
      uploadOpnameToServer();
    });
  }
});


// ====================================
// 🔘 EVENT UNTUK TOMBOL UPLOAD DATA OPNAME
// ====================================
document.addEventListener("DOMContentLoaded", () => {
  const btnUpload = document.getElementById("btn-upload-spreadsheet");
  if (btnUpload) {
    btnUpload.addEventListener("click", (e) => {
      e.preventDefault();
      uploadOpnameToServer(); // ← memanggil fungsi upload yang tadi kita buat
    });
  }
});

//progres pengembangan Validasi
document.addEventListener("DOMContentLoaded", () => {
  const btnValidasi = document.getElementById("btn-validasi");
  if (btnValidasi) {
    btnValidasi.addEventListener("click", () => {
      showAlert("info", "Fitur Validasi masih dalam pengembangan ☕🚬");
    });
  }
});