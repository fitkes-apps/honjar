<?php
// =========================================================================
// FILE: app/views/partials/honjar/list.php
// AKTIFKAN PENAMPIL EROR KHUSUS VIEW
// =========================================================================
error_reporting(E_ALL);
ini_set('display_errors', 1);

// KONEKSI DATABASE
if (!isset($pdo)) {
    $db_host = "localhost";
    $db_user = "root";       
    $db_pass = "";           
    $db_name = "db_akademik"; 
    try {
        $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8", $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
    } catch (PDOException $e) {
        die("Koneksi database gagal: " . $e->getMessage());
    }
}

// 1. PROSES SIMPAN DATA BARU (AJAX POST)
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['action']) && $_POST['action'] == 'simpan_honjar') {
    $nama_dosen  = trim($_POST['nama_dosen']);
    $bulan       = $_POST['bulan'];
    $tanggal     = $_POST['tanggal'];
    $jam_mulai   = $_POST['jam_mulai'];
    $jam_selesai = $_POST['jam_selesai'];
    $jumlah_jam  = (int)$_POST['jumlah_jam'];
    $mata_kuliah = trim($_POST['mata_kuliah']);
    $sks         = trim($_POST['sks']);
    $metode      = trim($_POST['metode']);
    $tingkat     = trim($_POST['tingkat']);

    if (!empty($nama_dosen) && !empty($bulan) && !empty($mata_kuliah)) {
        try {
            $sql = "INSERT INTO honjar (nama_dosen, bulan, tanggal, jam_mulai, jam_selesai, jumlah_jam, mata_kuliah, sks, metode, tingkat) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nama_dosen, $bulan, $tanggal, $jam_mulai, $jam_selesai, $jumlah_jam, $mata_kuliah, $sks, $metode, $tingkat]);
            
            echo json_encode(['success' => true, 'message' => 'Data berhasil ditambahkan!']);
            exit();
        } catch (PDOException $e) {
            echo json_encode(['success' => false, 'message' => 'Gagal menyimpan ke database: ' . $e->getMessage()]);
            exit();
        }
    }
    echo json_encode(['success' => false, 'message' => 'Nama Dosen, Bulan, dan Mata Kuliah wajib diisi!']);
    exit();
}

// 2. API AMBIL DATA REKAP (AJAX GET)
if (isset($_GET['action']) && $_GET['action'] == 'fetch_rekap') {
    $bulan_id = $_GET['bulan_id'];
    if ($bulan_id === 'master') {
        $stmt = $pdo->query("SELECT id, username as nama_dosen, email, '' as tanggal, '' as jam_mulai, '' as jam_selesai, 0 as jumlah_jam, 'Data Master' as mata_kuliah, '' as sks, '' as metode, '' as tingkat FROM login");
    } else {
        $stmt = $pdo->prepare("SELECT * FROM honjar WHERE bulan = ? ORDER BY tanggal ASC");
        $stmt->execute([$bulan_id]);
    }
    echo json_encode($stmt->fetchAll());
    exit();
}
?>

<style>
    .wrapper-honjar { display: flex; flex-direction: column; width: 100%; margin-top: 15px; }
    .top-bar-honjar { background-color: #004d40; color: white; padding: 12px 20px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.15); border-radius: 8px; }
    .top-bar-honjar h1 { margin: 0; font-size: 14px; font-weight: bold; text-align: center; color: #fff; }
    .controls-honjar { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; width: 100%; }
    .select-bulan { background-color: #ffffff; color: #004d40; border: 2px solid #b2dfdb; padding: 8px 10px; border-radius: 5px; font-size: 12px; font-weight: bold; cursor: pointer; }
    .btn-nav { background-color: #2e7d32; color: white; border: none; padding: 8px 12px; border-radius: 5px; font-size: 11px; font-weight: bold; cursor: pointer; white-space: nowrap; }
    .btn-akses-edit { background-color: #0288d1; }
    .btn-excel { background-color: #1f7246; }
    .btn-pdf { background-color: #b30b0b; }
    .table-responsive-honjar { width: 100%; overflow-x: auto; margin-top: 15px; background: white; border-radius: 8px; border: 1px solid #e0e0e0; }
    table.table-honjar { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 900px; }
    table.table-honjar th, table.table-honjar td { border: 1px solid #e0e0e0; padding: 10px 12px; }
    table.table-honjar th { background-color: #004d40; color: white; font-weight: 600; text-align: center; }
    table.table-honjar tr:nth-child(even) { background-color: #f9fbfb; }
    .text-center { text-align: center; }

    /* STYLING MODAL FORM POPUP */
    .modal-honjar { display: none; position: fixed; z-index: 10000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
    .modal-content-honjar { background-color: white; padding: 20px; border-radius: 8px; width: 100%; max-width: 500px; box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-height: 85vh; overflow-y: auto; }
    .modal-header { font-size: 16px; font-weight: bold; color: #004d40; margin-bottom: 15px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; }
    .form-group-honjar { margin-bottom: 12px; display: flex; flex-direction: column; text-align: left; }
    .form-group-honjar label { font-size: 12px; font-weight: bold; color: #333; margin-bottom: 4px; }
    .form-group-honjar input, .form-group-honjar select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 13px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 15px; border-top: 1px solid #e0e0e0; padding-top: 10px; }
    .btn-submit { background-color: #004d40; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .btn-close { background-color: #757575; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; font-weight: bold; }
</style>

<div class="wrapper-honjar" id="portal-content">
    <div class="top-bar-honjar">
        <h1>PORTAL LIVE REKAP HONJAR DOSEN</h1>
        <div class="controls-honjar">
            <select id="pilihBulan" class="select-bulan" onchange="gantiBulanRekap()">
                <option value="1">🗓️ Rekap Januari</option>
                <option value="2">🗓️ Rekap Februari</option>
                <option value="3">🗓️ Rekap Maret</option>
                <option value="4">🗓️ Rekap April</option>
                <option value="5">🗓️ Rekap Mei</option>
                <option value="6">🗓️ Rekap Juni</option>
                <option value="7">🗓️ Rekap Juli</option>
                <option value="8">🗓️ Rekap Agustus</option>
                <option value="9">🗓️ Rekap September</option>
                <option value="10">🗓️ Rekap Oktober</option>
                <option value="11">🗓️ Rekap November</option>
                <option value="12">🗓️ Rekap Desember</option>
                <option value="master">⚙️ Data Master (Admin)</option>
            </select>
            <button class="btn-nav" onclick="gantiBulanRekap()">📊 REKAP</button>
            <button class="btn-nav btn-akses-edit" onclick="tambahJadwalBaruForm()">✏️ TAMBAH DATA</button>
            <button class="btn-nav btn-excel" onclick="bukaModalDownload('excel')">🟢 EXCEL</button>
            <button class="btn-nav btn-pdf" onclick="bukaModalDownload('pdf')">🔴 PDF</button>
        </div>
    </div>

    <div class="table-responsive-honjar">
        <table class="table-honjar">
            <thead>
                <tr>
                    <th width="40">NO</th>
                    <th>NAMA DOSEN</th>
                    <th width="100">TANGGAL</th>
                    <th width="70">MULAI</th>
                    <th width="70">SELESAI</th>
                    <th width="70">JML JAM</th>
                    <th>MATA KULIAH</th>
                    <th width="50">SKS</th>
                    <th width="110">METODE</th>
                    <th width="100">TINGKAT</th>
                </tr>
            </thead>
            <tbody id="rekapTableBody">
                <tr>
                    <td colspan="10" class="text-center" style="color: #666; font-style: italic; padding: 20px;">Silakan pilih bulan rekapitulasi data...</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>

<div id="modalTambahData" class="modal-honjar">
    <div class="modal-content-honjar">
        <div class="modal-header">Tambah Data Rekap Honjar</div>
        <form id="formTambahHonjar">
            <div class="form-group-honjar">
                <label>Nama Dosen</label>
                <input type="text" name="nama_dosen" required placeholder="Contoh: Dr. Heni, M.Si">
            </div>
            <div class="form-group-honjar">
                <label>Bulan Rekap</label>
                <select name="bulan" required>
                    <option value="1">Januari</option>
                    <option value="2">Februari</option>
                    <option value="3">Maret</option>
                    <option value="4">April</option>
                    <option value="5">Mei</option>
                    <option value="6">Juni</option>
                    <option value="7">Juli</option>
                    <option value="8">Agustus</option>
                    <option value="9">September</option>
                    <option value="10">Oktober</option>
                    <option value="11">November</option>
                    <option value="12">Desember</option>
                </select>
            </div>
            <div class="form-group-honjar">
                <label>Tanggal</label>
                <input type="date" name="tanggal">
            </div>
            <div class="form-group-honjar">
                <label>Jam Mulai</label>
                <input type="time" name="jam_mulai">
            </div>
            <div class="form-group-honjar">
                <label>Jam Selesai</label>
                <input type="time" name="jam_selesai">
            </div>
            <div class="form-group-honjar">
                <label>Jumlah Jam (JP)</label>
                <input type="number" name="jumlah_jam" value="2" min="0">
            </div>
            <div class="form-group-honjar">
                <label>Mata Kuliah</label>
                <input type="text" name="mata_kuliah" required placeholder="Nama Mata Kuliah...">
            </div>
            <div class="form-group-honjar">
                <label>SKS</label>
                <input type="text" name="sks" placeholder="Contoh: 2 SKS">
            </div>
            <div class="form-group-honjar">
                <label>Metode</label>
                <input type="text" name="metode" placeholder="Teori / Praktikum / Online">
            </div>
            <div class="form-group-honjar">
                <label>Tingkat / Kelas</label>
                <input type="text" name="tingkat" placeholder="Contoh: Tingkat I / Regular">
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-close" onclick="tutupModalForm()">Batal</button>
                <button type="submit" class="btn-submit">Simpan Data</button>
            </div>
        </form>
    </div>
</div>

<script src="assets/js/script-honjar.js"></script>

<script>
    // FUNGSI UNTUK MENAMPILKAN & MENYEMBUNYIKAN MODAL INPUT DATA
    function tambahJadwalBaruForm() {
        document.getElementById('modalTambahData').style.display = 'flex';
    }
    function tutupModalForm() {
        document.getElementById('modalTambahData').style.display = 'none';
        document.getElementById('formTambahHonjar').reset();
    }

    // INTERSEPT FORM INPUT UNTUK KIRIM VIA AJAX
    document.getElementById('formTambahHonjar').addEventListener('submit', function(e) {
        e.preventDefault();
        
        let formData = new FormData(this);
        formData.append('action', 'simpan_honjar');

        fetch(window.location.href, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert(result.message);
                tutupModalForm();
                // Refresh data tabel rekap sesuai bulan yang aktif saat ini
                if(typeof gantiBulanRekap === 'function') { gantiBulanRekap(); }
            } else {
                alert(result.message);
            }
        })
        .catch(() => {
            alert("Terjadi kesalahan sistem saat menyimpan data.");
        });
    });
</script>