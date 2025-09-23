const apiUrl = "https://localhost:7223/api/Room";
const tableBody = document.querySelector("#roomTableBody");
const roomModal = new bootstrap.Modal(document.getElementById('roomModal'));
const roomForm = document.getElementById("roomForm");
const idInput = document.getElementById("id");
const numberInput = document.getElementById("number");
const modalTitle = document.getElementById("roomModalLabel");

document.addEventListener("DOMContentLoaded", fetchRooms);

// 📌 Odaları API'den çekip tabloya ekle
async function fetchRooms() {
    try {
        const response = await fetch(apiUrl);
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
            tableBody.innerHTML = "";
            json.data.forEach((room, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${room.number}</td>
                    <td>${room.createdDate ? room.createdDate.split("T")[0] : ""}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="openEditModal(${room.id}, '${room.number}')">
                          <i class="fas fa-pen"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteRoom(${room.id})">
                          <i class="fas fa-trash"></i> Delete
                        </button>
                        <a href="RoomDetail.html?id=${room.id}" class="btn btn-sm btn-details">
                          <i class="fas fa-eye"></i> Details
                        </a>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            alert("Room listesi boş ya da format hatalı.");
        }
    } catch (error) {
        alert("Error loading rooms: " + error.message);
        console.error(error);
    }
}

// 📌 Oda sil
async function deleteRoom(id) {
    if (!confirm("Bu odayı silmek istediğinize emin misiniz?")) return;

    try {
        const response = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
        if (response.ok) {
            alert("Oda silindi.");
            fetchRooms();
        } else {
            alert("Oda silinirken hata oluştu.");
        }
    } catch (error) {
        alert("Silme işleminde hata: " + error.message);
        console.error(error);
    }
}

// 📌 Yeni oda ekleme modalını aç
function openAddModal() {
    modalTitle.textContent = "Add Room";
    idInput.value = 0;
    numberInput.value = "";
    roomModal.show();
}

// 📌 Düzenleme modalını aç
function openEditModal(id, number) {
    modalTitle.textContent = "Edit Room";
    idInput.value = id;
    numberInput.value = number;
    roomModal.show();
}

// 📌 Form submit → Ekleme veya Düzenleme
roomForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = parseInt(idInput.value || "0");
    const number = numberInput.value.trim();
    const isEditing = id > 0;

    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `${apiUrl}/${id}` : apiUrl;

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: isEditing ? id : 0,
                number: number
            }),
        });

        if (response.ok) {
            alert(`Oda başarıyla ${isEditing ? "güncellendi" : "eklendi"}.`);
            roomModal.hide();
            fetchRooms();
        } else {
            alert("İşlem sırasında bir hata oluştu.");
        }
    } catch (error) {
        alert("İşlem sırasında hata: " + error.message);
        console.error(error);
    }
});
