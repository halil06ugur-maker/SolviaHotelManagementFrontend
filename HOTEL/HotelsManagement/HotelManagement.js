const apiUrl = "https://localhost:7223/api/Hotel";
let editMode = false;

// Listele
async function loadHotels() {
    const response = await fetch(apiUrl);
    const result = await response.json();

    if (!result.success) {
        alert("Hata: " + result.message);
        return;
    }

    const hotels = result.data;
    const tableBody = document.getElementById("hotelTableBody");
    tableBody.innerHTML = "";

    if (hotels && hotels.length > 0) {
        hotels.forEach(hotel => {
            const row = `
                <tr>
                    <td>${hotel.id}</td>
                    <td>${hotel.name}</td>
                    <td>${hotel.taxNumber}</td>
                    <td>${hotel.phoneNumber}</td>
                    <td>${new Date(hotel.createdDate).toLocaleDateString('tr-TR')}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="openEditForm(${hotel.id}, '${hotel.name}', '${hotel.taxNumber}', '${hotel.phoneNumber}', '${hotel.createdDate}')"><i class="fas fa-pen"></i> Edit</button>
                        <button class="btn btn-sm btn-delete" onclick="removeHotel(${hotel.id})"><i class="fas fa-trash"></i> Delete</button>
                        <button class="btn btn-sm btn-details" onclick="goToDetail(${hotel.id})"><i class="fas fa-eye"></i> Detail</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Kayıtlı otel bulunamadı.</td></tr>';
    }
}

// Yeni ekleme formu
function openAddForm() {
    editMode = false;
    document.getElementById("hotelModalTitle").textContent = "Yeni Otel";
    document.getElementById("hotelForm").reset();
    document.getElementById("hotelId").value = "";
    new bootstrap.Modal(document.getElementById("hotelModal")).show();
}

// Düzenleme formu
function openEditForm(id, name, taxNumber, phoneNumber, createdDate) {
    editMode = true;
    document.getElementById("hotelModalTitle").textContent = "Otel Düzenle";
    document.getElementById("hotelId").value = id;
    document.getElementById("name").value = name;
    document.getElementById("taxNumber").value = taxNumber;
    document.getElementById("phoneNumber").value = phoneNumber;

    if (createdDate) {
        document.getElementById("createdDate").value = new Date(createdDate).toISOString().split("T")[0];
    }

    new bootstrap.Modal(document.getElementById("hotelModal")).show();
}

// Kaydet (Ekle/Güncelle)
async function saveHotel(hotel) {
    const method = hotel.id > 0 ? "PUT" : "POST";
    if (method === "POST" && !hotel.createdDate) {
        hotel.createdDate = new Date().toISOString();
    }

    const response = await fetch(apiUrl, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(hotel)
    });

    if (response.status === 204) return { success: true };
    return await response.json();
}

// Sil
async function removeHotel(id) {
    if (!confirm("Bu oteli silmek istediğinize emin misiniz?")) return;

    const response = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });

    if (response.status === 204) {
        alert("Otel silindi!");
        loadHotels();
        return;
    }

    if (response.headers.get("content-length") === "0") {
        alert("Sunucudan yanıt gelmedi ama işlem başarılı olabilir.");
        loadHotels();
        return;
    }

    const result = await response.json();
    if (result.success) {
        alert("Otel silindi!");
        loadHotels();
    } else {
        alert("Silme başarısız: " + result.message);
    }
}

// Detay sayfasına git
function goToDetail(id) {
    window.open("HotelDetail/HotelDetail.html?id=" + id, "_blank");
}


// Form submit
document.addEventListener("DOMContentLoaded", () => {
    const hotelForm = document.getElementById("hotelForm");
    hotelForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const id = document.getElementById("hotelId").value || 0;
        const createdDateInput = document.getElementById("createdDate").value;

        const hotel = {
            id: parseInt(id),
            name: document.getElementById("name").value,
            taxNumber: document.getElementById("taxNumber").value,
            phoneNumber: document.getElementById("phoneNumber").value,
            createdDate: createdDateInput ? new Date(createdDateInput).toISOString() : null
        };

        const result = await saveHotel(hotel);
        if (result.success) {
            alert(editMode ? "Otel güncellendi!" : "Otel eklendi!");
            bootstrap.Modal.getInstance(document.getElementById("hotelModal")).hide();
            loadHotels();
        } else {
            alert("Hata: " + result.message);
        }
    });

    loadHotels();
});
