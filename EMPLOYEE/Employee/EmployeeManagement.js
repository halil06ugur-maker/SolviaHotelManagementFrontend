const apiUrl = "https://localhost:7223/api/Employee";
const tableBody = document.querySelector("#employeeTableBody");
const employeeModal = new bootstrap.Modal(document.getElementById("employeeModal"));
const employeeForm = document.getElementById("employeeForm");

const idInput = document.getElementById("id");
const nameInput = document.getElementById("name");
const surnameInput = document.getElementById("surname");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const modalTitle = document.getElementById("employeeModalLabel");
const hiddenCreatedDate = document.getElementById("hiddenCreatedDate");

document.addEventListener("DOMContentLoaded", fetchEmployees);

// Listeleme
async function fetchEmployees() {
    try {
        const response = await fetch(apiUrl);
        const json = await response.json();

        if (json.success && Array.isArray(json.data)) {
            tableBody.innerHTML = "";
            json.data.forEach((emp, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${emp.name}</td>
                    <td>${emp.surname}</td>
                    <td>${emp.phoneNumber}</td>
                    <td>${emp.email}</td>
                    <td>${emp.createdDate ? emp.createdDate.split("T")[0] : ""}</td>
                    <td>
                        <button class="btn btn-sm btn-edit" onclick="openEditModal(${emp.id}, '${emp.name}', '${emp.surname}', '${emp.phoneNumber}', '${emp.email}', '${emp.createdDate}')">
                            <i class="fas fa-pen"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteEmployee(${emp.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        } else {
            alert("Employee listesi boş veya format hatalı.");
        }
    } catch (error) {
        alert("Error loading employees: " + error.message);
        console.error(error);
    }
}

// Yeni employee ekleme modalı
function openAddModal() {
    modalTitle.textContent = "Add Employee";
    idInput.value = 0;
    hiddenCreatedDate.value = ""; // Yeni kayıtta boş
    nameInput.value = "";
    surnameInput.value = "";
    phoneInput.value = "";
    emailInput.value = "";
    employeeModal.show();
}

// Düzenleme modalı
function openEditModal(id, name, surname, phone, email, createdDate) {
    modalTitle.textContent = "Edit Employee";
    idInput.value = id;
    nameInput.value = name;
    surnameInput.value = surname;
    phoneInput.value = phone;
    emailInput.value = email;
    hiddenCreatedDate.value = createdDate; // 👈 eski tarih saklanıyor
    employeeModal.show();
}

// Silme
async function deleteEmployee(id) {
    if (!confirm("Bu çalışanı silmek istediğinize emin misiniz?")) return;
    try {
        const response = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
        if (response.ok) {
            alert("Çalışan silindi.");
            fetchEmployees();
        } else {
            alert("Silme sırasında hata oluştu.");
        }
    } catch (error) {
        alert("Silme işleminde hata: " + error.message);
        console.error(error);
    }
}

// Kaydetme (Add / Edit)
employeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = parseInt(idInput.value || "0");
    const isEditing = id > 0;
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `${apiUrl}/${id}` : apiUrl;

    const employeeData = {
        id: id,
        name: nameInput.value,
        surname: surnameInput.value,
        phoneNumber: phoneInput.value,
        email: emailInput.value,
        isActive: true
    };

    if (!isEditing) {
        // Yeni kayıt: bugünün tarihi
        const now = new Date();
        const formatted =
            now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, "0") + "-" +
            String(now.getDate()).padStart(2, "0") + "T" +
            String(now.getHours()).padStart(2, "0") + ":" +
            String(now.getMinutes()).padStart(2, "0") + ":" +
            String(now.getSeconds()).padStart(2, "0");

        employeeData.createdDate = formatted;
    } else {
        // Güncelleme: eski tarih korunuyor
        employeeData.createdDate = hiddenCreatedDate.value;
    }

    try {
        const response = await fetch(endpoint, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(employeeData),
        });

        if (response.ok) {
            alert(`Çalışan başarıyla ${isEditing ? "güncellendi" : "eklendi"}.`);
            employeeModal.hide();
            fetchEmployees();
        } else {
            const errorText = await response.text();
            console.error("API Error:", errorText);
            alert("İşlem sırasında bir hata oluştu.");
        }
    } catch (error) {
        alert("İşlem sırasında hata: " + error.message);
        console.error(error);
    }
});
