const apiUrl = "https://localhost:7223/api/Role";
const tableBody = document.querySelector("#roleTableBody");
const roleModal = new bootstrap.Modal(document.getElementById("roleModal"));
const roleForm = document.getElementById("roleForm");
const idInput = document.getElementById("id");
const nameInput = document.getElementById("name");
const descriptionInput = document.getElementById("description");
const modalTitle = document.getElementById("roleModalLabel");

document.addEventListener("DOMContentLoaded", fetchRoles);

// Roller listesi
async function fetchRoles() {
    try {
        const response = await fetch(apiUrl);
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
            tableBody.innerHTML = "";
            json.data.forEach((role, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${role.name}</td>
                    <td>${role.description}</td>
                    <td>${role.createdDate ? role.createdDate.split("T")[0] : ""}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="openEditModal(${role.id}, '${role.name}', '${role.description}')">
                            <i class="fas fa-pen"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteRole(${role.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            alert("Role listesi boş veya format hatalı.");
        }
    } catch (error) {
        alert("Error loading roles: " + error.message);
        console.error(error);
    }
}

// Yeni rol ekleme modalı
function openAddModal() {
    modalTitle.textContent = "Add Role";
    idInput.value = 0;
    nameInput.value = "";
    descriptionInput.value = "";
    roleModal.show();
}

// Düzenleme modalı
function openEditModal(id, name, description) {
    modalTitle.textContent = "Edit Role";
    idInput.value = id;
    nameInput.value = name;
    descriptionInput.value = description;
    roleModal.show();
}

// Silme
async function deleteRole(id) {
    if (!confirm("Bu rolü silmek istediğinize emin misiniz?")) return;
    try {
        const response = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
        if (response.ok) {
            alert("Rol silindi.");
            fetchRoles();
        } else {
            alert("Silme sırasında hata oluştu.");
        }
    } catch (error) {
        alert("Silme işleminde hata: " + error.message);
        console.error(error);
    }
}

// Kaydetme (Add / Edit)
roleForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = parseInt(idInput.value || "0");
    const isEditing = id > 0;
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `${apiUrl}/${id}` : apiUrl;

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: isEditing ? id : 0,
                name: nameInput.value,
                description: descriptionInput.value
            }),
        });

        if (response.ok) {
            alert(`Rol başarıyla ${isEditing ? "güncellendi" : "eklendi"}.`);
            roleModal.hide();
            fetchRoles();
        } else {
            alert("İşlem sırasında bir hata oluştu.");
        }
    } catch (error) {
        alert("İşlem sırasında hata: " + error.message);
        console.error(error);
    }
});
