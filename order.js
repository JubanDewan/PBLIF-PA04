const formOrder = document.getElementById("formTambahOrder");
const tabelOrder = document.getElementById("orderTableBody");

// Harga layanan per kilogram
const daftarHarga = {
    "Cuci Kering": 5000,
    "Cuci Setrika": 7000,
    "Setrika": 4000
};

formOrder.addEventListener("submit", function(event) {
    event.preventDefault();

    const nama = document.getElementById("namaPelanggan").value;
    const layanan = document.getElementById("jenisLayanan").value;
    const berat = Number(document.getElementById("beratCucian").value);
    const status = document.getElementById("statusCucian").value;

    // Menghitung total pembayaran otomatis
    const total = berat * daftarHarga[layanan];

    // Membuat nomor order
    const nomorOrder = "ORD" + Date.now().toString().slice(-6);

    // Membuat baris tabel
    const baris = document.createElement("tr");

    const dataOrder = [
        nomorOrder,
        nama,
        layanan,
        berat + " Kg",
        "Rp" + total.toLocaleString("id-ID")
    ];

    dataOrder.forEach(function(data) {
        const kolom = document.createElement("td");
        kolom.textContent = data;
        kolom.classList.add("text-center");
        baris.appendChild(kolom);
    });

    // Menampilkan status
    const kolomStatus = document.createElement("td");
    kolomStatus.classList.add("text-center");

    const badge = document.createElement("span");
    badge.classList.add("badge");

    if (status === "Menunggu") {
        badge.classList.add("bg-warning", "text-dark");
    } else if (status === "Diproses") {
        badge.classList.add("bg-primary");
    } else if (status === "Selesai") {
        badge.classList.add("bg-success");
    } else {
        badge.classList.add("bg-secondary");
    }

    badge.textContent = status;
    kolomStatus.appendChild(badge);
    baris.appendChild(kolomStatus);

    // Tombol hapus
    const kolomAksi = document.createElement("td");
    kolomAksi.classList.add("text-center");

    const tombolHapus = document.createElement("button");
    tombolHapus.type = "button";
    tombolHapus.className = "btn btn-sm btn-cancel font-cancel";
    tombolHapus.textContent = "Hapus";

    tombolHapus.addEventListener("click", function() {
        baris.remove();
    });

    kolomAksi.appendChild(tombolHapus);
    baris.appendChild(kolomAksi);

    // Memasukkan order ke tabel
    tabelOrder.appendChild(baris);

    // Mengosongkan form
    formOrder.reset();

    // Menutup modal
    const modalElement = document.getElementById("modalTambahOrder");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    modal.hide();
});
// Fitur pencarian orderan
const searchOrder = document.getElementById("searchOrder");

searchOrder.addEventListener("input", function () {
    const kataKunci = searchOrder.value.toLowerCase();

    const semuaBaris = tabelOrder.querySelectorAll("tr");

    semuaBaris.forEach(function (baris) {
        const namaPelanggan = baris.cells[1].textContent.toLowerCase();

        if (namaPelanggan.includes(kataKunci)) {
            baris.style.display = "";
        } else {
            baris.style.display = "none";
        }
    });
});