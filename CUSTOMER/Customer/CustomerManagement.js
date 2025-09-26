document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://localhost:7223/api/Customer";
    const tableBody = document.querySelector("table tbody");
    const form = document.getElementById("customerForm");
    const customerModal = new bootstrap.Modal(document.getElementById("customerModal"));
    const detailsModal = new bootstrap.Modal(document.getElementById("detailsModal"));
    let editMode = false;

    // Listeleme
    async function loadCustomers() {
        try {
            const res = await fetch(API_URL);
            const result = await res.json();

            if (!result.success) {
                alert("Müşteri listesi getirilemedi: " + result.message);
                return;
            }

            const customers = result.data;
            tableBody.innerHTML = "";

            customers.forEach((c, i) => {
                tableBody.innerHTML += `
          <tr>
            <td>${i + 1}</td>
            <td>${c.name}</td>
            <td>${c.surname}</td>
            <td>${c.phoneNumber}</td>
            <td>${c.identityNumber}</td>
            <td>
              <button class="btn btn-sm btn-edit" onclick="openEdit(${c.id})"><i class="fas fa-pen"></i> Edit</button>
              <button class="btn btn-sm btn-delete" onclick="deleteCustomer(${c.id})"><i class="fas fa-trash"></i> Delete</button>
              <button class="btn btn-sm btn-details" onclick="viewDetails(${c.id})"><i class="fas fa-eye"></i> Details</button>
            </td>
          </tr>
        `;
            });
        } catch (err) {
            console.error("Listeleme hatası:", err);
            alert("Liste yüklenirken hata oluştu.");
        }
    }

    // Ekleme & Güncelleme
    form.addEventListener("submit", async e => {
        e.preventDefault();

        const customer = {
            id: editMode ? parseInt(document.getElementById("customerId").value) : 0,
            identityNumber: document.getElementById("identityNumber").value,
            name: document.getElementById("name").value,
            surname: document.getElementById("surname").value,
            phoneNumber: document.getElementById("phoneNumber").value,
            age: parseInt(document.getElementById("age").value),
            gender: document.getElementById("gender").value,
            createdDate: new Date().toISOString()
        };

        try {
            let res;
            if (editMode) {
                res = await fetch(`${API_URL}/${customer.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(customer)
                });
            } else {
                res = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(customer)
                });
            }

            const result = await res.json();
            if (result.success) {
                alert(result.message || "İşlem başarılı!");
                customerModal.hide();
                form.reset();
                editMode = false;
                loadCustomers();
            } else {
                alert("Hata: " + result.message);
            }
        } catch (err) {
            console.error("Kaydetme hatası:", err);
            alert("İşlem sırasında hata oluştu.");
        }
    });

    // Edit
    window.openEdit = async function (id) {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            const result = await res.json();

            if (!result.success) {
                alert("Müşteri bulunamadı: " + result.message);
                return;
            }

            const c = result.data;
            document.getElementById("customerId").value = c.id;
            document.getElementById("identityNumber").value = c.identityNumber;
            document.getElementById("name").value = c.name;
            document.getElementById("surname").value = c.surname;
            document.getElementById("phoneNumber").value = c.phoneNumber;
            document.getElementById("age").value = c.age;
            document.getElementById("gender").value = c.gender;

            editMode = true;
            customerModal.show();
        } catch (err) {
            console.error("Edit hatası:", err);
            alert("Müşteri bilgisi alınamadı.");
        }
    };

    // Delete
    window.deleteCustomer = async function (id) {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;

        try {
            const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
            const result = await res.json();

            if (result.success) {
                alert(result.message || "Silme başarılı.");
                loadCustomers();
            } else {
                alert("Silme başarısız: " + result.message);
            }
        } catch (err) {
            console.error("Delete hatası:", err);
            alert("Silme sırasında hata oluştu.");
        }
    };

    // Details
    window.viewDetails = async function (id) {
        try {
            const res = await fetch(`${API_URL}/${id}`);
            const result = await res.json();

            if (!result.success) {
                alert("Detay alınamadı: " + result.message);
                return;
            }

            const c = result.data;
            document.getElementById("detailsBody").innerHTML = `
        <p><strong>Identity:</strong> ${c.identityNumber}</p>
        <p><strong>Name:</strong> ${c.name} ${c.surname}</p>
        <p><strong>Phone:</strong> ${c.phoneNumber}</p>
        <p><strong>Age:</strong> ${c.age}</p>
        <p><strong>Gender:</strong> ${c.gender}</p>
        <p><strong>Created:</strong> ${new Date(c.createdDate).toLocaleString()}</p>
      `;
            detailsModal.show();
        } catch (err) {
            console.error("Details hatası:", err);
            alert("Detay gösterilemedi.");
        }
    };

    // Add butonu
    document.querySelector(".btn-add").addEventListener("click", () => {
        form.reset();
        document.getElementById("customerId").value = "";
        editMode = false;
        customerModal.show();
    });

    // Sayfa yüklenince listeyi getir
    loadCustomers();
});
