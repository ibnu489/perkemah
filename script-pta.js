// 1. URL APPS SCRIPT
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw0ij8cwbF6-HBt0gVa8cR2ZuV1ofJkWbT0n_NIFWansFiJTPxtY3BRAzCWbBq8R70v/exec";

// KATA SANDI / KODE AKSES UNTUK MENU ADMIN
const KATA_SANDI_ADMIN = "tanyaibnu";

// Batas Aturan Maksimum Kuota
const kuotaMaksimal = {
    putra: { PERINTIS: 51, PENCOBA: 51, PENDOBRAK: 51, PENEGAS: 40, PELAKSANA: 40 },
    putri: { PERINTIS: 62, PENCOBA: 62, PENDOBRAK: 61, PENEGAS: 61, PELAKSANA: 61 }
};

// Metadata Identitas Warna Setiap Sangga (Sinkron ke Form & Tabel Admin)
const sanggaMeta = {
    PERINTIS: { warna: 'bg-orange-600', teks: 'text-orange-600', border: 'border-orange-600/20', bgRingan: 'bg-orange-50', bgBadge: 'bg-orange-100' },
    PENCOBA: { warna: 'bg-emerald-700', teks: 'text-emerald-700', border: 'border-emerald-700/20', bgRingan: 'bg-emerald-50', bgBadge: 'bg-emerald-100' },
    PENDOBRAK: { warna: 'bg-amber-800', teks: 'text-amber-800', border: 'border-amber-800/20', bgRingan: 'bg-amber-50', bgBadge: 'bg-amber-100' },
    PENEGAS: { warna: 'bg-cyan-700', teks: 'text-cyan-700', border: 'border-cyan-700/20', bgRingan: 'bg-cyan-50', bgBadge: 'bg-cyan-100' },
    PELAKSANA: { warna: 'bg-purple-700', teks: 'text-purple-700', border: 'border-purple-700/20', bgRingan: 'bg-purple-50', bgBadge: 'bg-purple-100' }
};

let listPendaftarServer = [];
let isSubmitting = false;

// Normalisasi nilai gender dari data server atau input form
function normalizeGenderValue(val) {
    if (!val && val !== 0) return '';
    const v = String(val).toLowerCase().trim();
    if (v.includes('putri') || v.includes('perempuan') || v.includes('female')) return 'putri';
    if (v.includes('putra') || v.includes('laki') || v.includes('male')) return 'putra';
    return '';
}

// Menghitung kuota terisi berdasarkan data di server Google Sheets
function hitungKuotaTerisi() {
    let terisi = {
        putra: { PERINTIS: 0, PENCOBA: 0, PENDOBRAK: 0, PENEGAS: 0, PELAKSANA: 0 },
        putri: { PERINTIS: 0, PENCOBA: 0, PENDOBRAK: 0, PENEGAS: 0, PELAKSANA: 0 }
    };

    listPendaftarServer.forEach(siswa => {
        let jk = normalizeGenderValue(siswa.jenisKelamin);
        let sg = siswa.sangga ? siswa.sangga.toUpperCase().trim() : '';
        if (terisi[jk] && terisi[jk][sg] !== undefined) {
            terisi[jk][sg]++;
        }
    });
    return terisi;
}

// Generate Dropdown Opsi Kelas dan Jurusan otomatis secara sekuensial
const jurusanList = ['TP', 'TKR', 'TSM', 'TKJ', 'DKV'];
function populateKelasSelect() {
    const selectKelas = document.getElementById('kelasJurusan');
    if (!selectKelas) return;
    // clear existing options except first placeholder
    const firstOption = selectKelas.options[0];
    selectKelas.innerHTML = '';
    if (firstOption) selectKelas.appendChild(firstOption);

    jurusanList.forEach(jurusan => {
        ['A', 'B', 'C'].forEach(paralel => {
            const opsiText = `X ${jurusan} ${paralel}`;
            const option = document.createElement('option');
            option.value = opsiText;
            option.textContent = opsiText;
            selectKelas.appendChild(option);
        });
    });
}

// Menarik data pendaftar dari Google Sheets secara real-time
function muatDataDariServer() {
    if (SCRIPT_URL === "KODE_URL_WEB_APP_ANDA_DISINI") {
        const container = document.getElementById('kuota-container');
        if (container) container.innerHTML = `<p class="text-sm text-red-500 font-bold">⚠️ SCRIPT_URL belum dikonfigurasi! Harap ikuti Langkah 1.</p>`;
        return;
    }

    fetch(SCRIPT_URL)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok: ' + response.status);
            return response.json().catch(err => { throw new Error('Invalid JSON from server: ' + err.message); });
        })
        .then(resData => {
            if (resData && resData.status === 'success') {
                listPendaftarServer = Array.isArray(resData.data) ? resData.data : [];
                renderKuotaVisual();
                updateSanggaOptions();
                renderTabelAdmin();
            } else {
                console.warn('Server returned unexpected payload:', resData);
            }
        })
        .catch(err => {
            console.error("Gagal mengambil data server:", err);
            const container = document.getElementById('kuota-container');
            if (container) container.innerHTML = `<p class="text-xs text-red-500">Gagal terhubung ke server database Google Sheets.</p>`;
        });
}

// Render Tampilan Visual Progres Sisa Kuota Keseluruhan
function renderKuotaVisual() {
    const container = document.getElementById('kuota-container');
    if (!container) return;
    container.innerHTML = '';

    const kuotaTerisi = hitungKuotaTerisi();

    Object.keys(sanggaMeta).forEach(sangga => {
        const totalTerisi = (kuotaTerisi.putra[sangga] || 0) + (kuotaTerisi.putri[sangga] || 0);
        const totalMaks = (kuotaMaksimal.putra[sangga] || 0) + (kuotaMaksimal.putri[sangga] || 0);
        let persentase = totalMaks === 0 ? 0 : (totalTerisi / totalMaks) * 100;
        if (!isFinite(persentase) || Number.isNaN(persentase)) persentase = 0;
        persentase = Math.min(Math.max(persentase, 0), 100);
        const meta = sanggaMeta[sangga];

        container.innerHTML += `
            <div class="${meta.bgRingan} p-4 rounded-2xl border ${meta.border}">
                <div class="flex justify-between items-center text-sm font-bold ${meta.teks} mb-1">
                    <span>${sangga}</span>
                    <span class="text-gray-600 font-mono">${totalTerisi} / ${totalMaks}</span>
                </div>
                <div class="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div class="${meta.warna} h-full transition-all duration-500" style="width: ${persentase}%"></div>
                </div>
            </div>
        `;
    });
}

// Mengubah Pilihan Tombol Sangga Berdasarkan Gender dan Sisa Slot Server
function updateSanggaOptions() {
    const jkTerpilihRaw = document.querySelector('input[name="jk"]:checked')?.value;
    const jkTerpilih = normalizeGenderValue(jkTerpilihRaw);
    const container = document.getElementById('sangga-options-container');
    if (!container) return;
    container.innerHTML = '';

    const hintSangga = document.getElementById('hint-sangga');
    if (!jkTerpilih) return;
    if (hintSangga) hintSangga.classList.add('hidden');

    const kuotaTerisi = hitungKuotaTerisi();

    Object.keys(sanggaMeta).forEach(sangga => {
        const terisi = kuotaTerisi[jkTerpilih] ? kuotaTerisi[jkTerpilih][sangga] || 0 : 0;
        const maksimal = kuotaMaksimal[jkTerpilih] ? kuotaMaksimal[jkTerpilih][sangga] || 0 : 0;
        const isPenuh = terisi >= maksimal;
        const meta = sanggaMeta[sangga];

        const label = document.createElement('label');
        if (isPenuh) {
            label.className = "relative flex flex-col items-center justify-center p-4 rounded-xl border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 select-none";
            label.innerHTML = `
                <span class="font-bold line-through">${sangga}</span>
                <span class="text-xs font-bold text-red-500 mt-1">PENUH (${terisi}/${maksimal})</span>
            `;
        } else {
            label.className = `relative flex flex-col items-center justify-center p-4 rounded-xl text-white font-bold ${meta.warna} cursor-pointer hover:brightness-110 active:scale-98 transition shadow-xs`;
            label.innerHTML = `
                <input type="radio" name="sangga" value="${sangga}" required class="absolute opacity-0">
                <span>${sangga}</span>
                <span class="text-xs font-light opacity-90 mt-0.5">Sisa Slot: ${maksimal - terisi}</span>
            `;
        }
        container.appendChild(label);
    });

    const radios = container.querySelectorAll('input[name="sangga"]');
    radios.forEach(radio => {
        radio.addEventListener('change', function () {
            radios.forEach(r => r.parentElement.classList.remove('ring-4', 'ring-amber-400'));
            if (this.checked) {
                this.parentElement.classList.add('ring-4', 'ring-amber-400');
            }
        });
    });
}

// Mengirim Data Form Pendaftaran Online ke Google Sheets
function handleFormSubmit(event) {
    event.preventDefault();

    const btnKirim = document.getElementById('btnKirim');
    const namaEl = document.getElementById('nama');
    const kelasEl = document.getElementById('kelasJurusan');
    const nama = namaEl ? namaEl.value : '';
    const kelas = kelasEl ? kelasEl.value : '';
    const jkRaw = document.querySelector('input[name="jk"]:checked')?.value;
    const jkNorm = normalizeGenderValue(jkRaw);
    const sangga = document.querySelector('input[name="sangga"]:checked')?.value;

    if (isSubmitting) return; // prevent re-entrancy

    if (!jkNorm) {
        alert("Silakan pilih Jenis Kelamin terlebih dahulu!");
        return;
    }
    if (!sangga) {
        alert("Silakan pilih Sangga yang masih tersedia!");
        return;
    }

    // Validasi sisa kuota server sebelum mengirim data
    const kuotaTerisi = hitungKuotaTerisi();
    if ((kuotaTerisi[jkNorm] ? (kuotaTerisi[jkNorm][sangga] || 0) : 0) >= (kuotaMaksimal[jkNorm] ? (kuotaMaksimal[jkNorm][sangga] || 0) : 0)) {
        alert(`Maaf, Sangga ${sangga} untuk kategori ${jkRaw || jkNorm} baru saja penuh. Silakan pilih sangga yang lain.`);
        muatDataDariServer();
        return;
    }

    if (btnKirim) {
        btnKirim.disabled = true;
        btnKirim.textContent = "Sedang Mengirim ke Server...";
    }

    isSubmitting = true;

    const formData = new FormData();
    formData.append('nama', nama);
    formData.append('kelasJurusan', kelas);
    formData.append('jenisKelamin', jkNorm);
    formData.append('sangga', sangga);

    fetch(SCRIPT_URL, { method: 'POST', body: formData })
        .then(response => {
            if (!response.ok) throw new Error('Server error: ' + response.status);
            return response.json();
        })
        .then(res => {
            const alertBox = document.getElementById('successAlert');
            if (alertBox) alertBox.classList.remove('hidden');

            // Reset Form Isian setelah berhasil terkirim
            if (namaEl) namaEl.value = '';
            if (kelasEl) kelasEl.selectedIndex = 0;
            document.querySelectorAll('input[name="jk"]').forEach(el => el.checked = false);
            const sanggaContainer = document.getElementById('sangga-options-container');
            if (sanggaContainer) sanggaContainer.innerHTML = '';

            const hintSangga = document.getElementById('hint-sangga');
            if (hintSangga) hintSangga.classList.remove('hidden');

            if (alertBox) alertBox.scrollIntoView({ behavior: 'smooth' });
            muatDataDariServer();
        })
        .catch(error => {
            console.error('Error!', error && error.message ? error.message : error);
            alert('Gagal mengirim pendaftaran, pastikan HP Anda terhubung ke internet.');
        })
        .finally(() => {
            isSubmitting = false;
            if (btnKirim) {
                btnKirim.disabled = false;
                btnKirim.textContent = "Kirim Pilihan Sangga";
            }
        });
}

// Render Isi Tabel Pendaftar di Menu Admin (Urutan Kronologis: Yang Pertama Daftar di Paling Atas)
function renderTabelAdmin() {
    const tbody = document.getElementById('tabel-pendaftar');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (listPendaftarServer.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Belum ada siswa yang mendaftar di Google Sheets.</td></tr>`;
        return;
    }

    // Menggunakan urutan data normal bawaan database server
    const dataNormal = [...listPendaftarServer];

    dataNormal.forEach((siswa, index) => {
        // Mengambil penyesuaian warna dinamis dari objek sanggaMeta
        const sgKey = siswa.sangga ? siswa.sangga.toUpperCase().trim() : '';
        const meta = sanggaMeta[sgKey] || { teks: 'text-amber-900', bgBadge: 'bg-amber-100' };

        // Proteksi fallback aman jika properti data server menggunakan nama alternatif huruf besar/kecil
        const waktuSiswa = siswa.waktu || siswa.Timestamp || siswa.timestamp || '-';
        const kelasSiswa = siswa.kelasJurusan || siswa.kelas_jurusan || siswa.kelas || '-';

        tbody.innerHTML += `
            <tr class="hover:bg-amber-50/40 transition">
                <td class="p-3.5 font-mono text-gray-500">${index + 1}</td>
                <td class="p-3.5 text-xs text-gray-500">${waktuSiswa}</td>
                <td class="p-3.5 font-semibold text-gray-800">${siswa.nama}</td>
                <td class="p-3.5 text-gray-600">${kelasSiswa}</td>
                <td class="p-3.5 capitalize text-gray-600">${siswa.jenisKelamin || '-'}</td>
                <td class="p-3.5">
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${meta.bgBadge} ${meta.teks}">${siswa.sangga}</span>
                </td>
            </tr>
        `;
    });
}

// Proteksi Akses Kata Sandi Panel Admin
function bukaHalamanAdminProteksi() {
    const masukanSandi = prompt("Masukkan Kata Sandi Admin:");
    if (masukanSandi === null) return;

    if (masukanSandi === KATA_SANDI_ADMIN) {
        bukaHalaman('panel-admin');
    } else {
        alert("❌ WKWKWK SALAH😂😂🤣");
    }
}

// Manajemen Navigasi Perpindahan Halaman & Kontrol Logo/Pop-up
function bukaHalaman(namaHalaman) {
    const pageForm = document.getElementById('page-form-pendaftaran');
    const pageAdmin = document.getElementById('page-panel-admin');
    const navForm = document.getElementById('nav-form');
    const navAdmin = document.getElementById('nav-admin');
    const wrapperMedsos = document.getElementById('wrapper-logo-medsos');
    const popUpMedsos = document.getElementById('popUpMedsos');

    if (namaHalaman === 'form-pendaftaran') {
        if (pageForm) pageForm.classList.replace('hidden', 'block');
        if (pageAdmin) pageAdmin.classList.replace('block', 'hidden');
        if (navForm) navForm.className = "px-5 py-2.5 rounded-xl font-bold text-sm transition bg-amber-800 text-white cursor-pointer";
        if (navAdmin) navAdmin.className = "px-5 py-2.5 rounded-xl font-bold text-sm transition bg-white text-amber-950 hover:bg-amber-100 cursor-pointer";
        if (wrapperMedsos) wrapperMedsos.classList.remove('invisible');
        if (popUpMedsos) popUpMedsos.classList.add('hidden');
    } else {
        if (pageForm) pageForm.classList.replace('block', 'hidden');
        if (pageAdmin) pageAdmin.classList.replace('hidden', 'block');
        if (navForm) navForm.className = "px-5 py-2.5 rounded-xl font-bold text-sm transition bg-white text-amber-950 hover:bg-amber-100 cursor-pointer";
        if (navAdmin) navAdmin.className = "px-5 py-2.5 rounded-xl font-bold text-sm transition bg-amber-800 text-white cursor-pointer";
        if (wrapperMedsos) wrapperMedsos.classList.add('invisible');
        if (popUpMedsos) popUpMedsos.classList.add('hidden');
    }
}

// ==========================================
// KONTROL AKTIVITAS POP-UP MEDIA SOSIAL
// ==========================================

function togglePopUpMedsos(event) {
    event.stopPropagation();
    const popUp = document.getElementById('popUpMedsos');
    if (!popUp) return;
    if (popUp.classList.contains('hidden')) {
        popUp.classList.remove('hidden');
    } else {
        popUp.classList.add('hidden');
    }
}

window.addEventListener('click', function () {
    const popUp = document.getElementById('popUpMedsos');
    if (popUp) {
        popUp.classList.add('hidden');
    }
});

// ==========================================
// OTOMATISASI DAN INISIALISASI PROGRAM (AMMAN)
// ==========================================

// Menghubungkan logika form submit secara mandiri agar tidak bergantung pada HTML onsubmit
document.addEventListener('DOMContentLoaded', function () {
    // Daftarkan event listener untuk radio button gender agar otomatis update pilihan sangga saat diklik
    const jkRadios = document.querySelectorAll('input[name="jk"]');
    jkRadios.forEach(radio => {
        radio.addEventListener('change', updateSanggaOptions);
    });

    // Amankan penangkapan event form submit
    const formPendaftaran = document.querySelector('form');
    if (formPendaftaran) {
        formPendaftaran.addEventListener('submit', handleFormSubmit);
    }

    // Populate kelas select after DOM ready
    populateKelasSelect();

    // Memulai penarikan database otomatis saat pertama kali dibuka
    muatDataDariServer();
});
