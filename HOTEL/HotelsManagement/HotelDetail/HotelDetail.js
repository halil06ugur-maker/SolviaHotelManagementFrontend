const apiHotel = "https://localhost:7223/api/Hotel";
const apiAddress = "https://localhost:7223/api/HotelAddress";
const apiProperty = "https://localhost:7223/api/HotelProperty";
const imageApiUrl = "https://localhost:7223/api/HotelImage";

let hotelId = null;
let editModeAddress = false;

// ---- Sayfa Yüklendiğinde ----
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    hotelId = params.get("id");

    if (!hotelId) {
        alert("Geçersiz otel ID");
        return;
    }

    await loadHotel();
    await loadAddresses();
    await loadProperty();
    await loadImages(hotelId);

    document.getElementById("addressForm").addEventListener("submit", saveAddress);
    document.getElementById("propertyForm").addEventListener("submit", saveProperty);
    document.getElementById("imageForm").addEventListener("submit", saveImage);
});

// ---- HOTEL ----
async function loadHotel() {
    const response = await fetch(`${apiHotel}/${hotelId}`);
    const result = await response.json();
    if (result.success) {
        document.querySelector(".hotel-title").textContent = result.data.name;
    }
}

// ---- ADDRESS ----
async function loadAddresses() {
    const response = await fetch(apiAddress);
    const result = await response.json();

    const tableBody = document.getElementById("addressTableBody");
    tableBody.innerHTML = "";

    if (result.success) {
        const filtered = result.data.filter(a => a.hotelId == hotelId);
        filtered.forEach(addr => {
            tableBody.innerHTML += `
                <tr>
                    <td>${addr.address}</td>
                    <td>${addr.postCode}</td>
                    <td>${new Date(addr.createdDate).toLocaleDateString("tr-TR")}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="openEditAddressForm(${addr.id}, '${addr.address}', '${addr.postCode}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteAddress(${addr.id})">Delete</button>
                    </td>
                </tr>`;
        });
    }
}

function openAddAddressForm() {
    editModeAddress = false;
    document.getElementById("addressModalTitle").textContent = "Address Add";
    document.getElementById("addressId").value = "";
    document.getElementById("addressText").value = "";
    document.getElementById("postCode").value = "";
    new bootstrap.Modal(document.getElementById("addressModal")).show();
}

function openEditAddressForm(id, address, postCode) {
    editModeAddress = true;
    document.getElementById("addressModalTitle").textContent = "Address Edit";
    document.getElementById("addressId").value = id;
    document.getElementById("addressText").value = address;
    document.getElementById("postCode").value = postCode;
    new bootstrap.Modal(document.getElementById("addressModal")).show();
}

async function saveAddress(e) {
    e.preventDefault();

    const id = document.getElementById("addressId").value || 0;
    const address = document.getElementById("addressText").value;
    const postCode = document.getElementById("postCode").value;

    const model = {
        id: parseInt(id),
        hotelId: parseInt(hotelId),
        address,
        postCode,
        createdDate: new Date().toISOString()
    };

    const method = editModeAddress ? "PUT" : "POST";

    const response = await fetch(apiAddress, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model)
    });

    const result = await response.json();
    if (result.success) {
        bootstrap.Modal.getInstance(document.getElementById("addressModal")).hide();
        loadAddresses();
    } else {
        alert("Hata: " + result.message);
    }
}

async function deleteAddress(id) {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    await fetch(`${apiAddress}/${id}`, { method: "DELETE" });
    loadAddresses();
}

// ---- PROPERTY ----
async function loadProperty() {
    const response = await fetch(apiProperty);
    const result = await response.json();
    if (result.success) {
        const prop = result.data.find(p => p.hotelId == hotelId);
        if (prop) {
            document.getElementById("propertyId").value = prop.id;
            document.getElementById("capacity").textContent = prop.capacity;
            document.getElementById("isShuttleTransfer").textContent = prop.isShuttleTransfer ? "Yes" : "No";
            document.getElementById("isAnimalAccept").textContent = prop.isAnimalAccept ? "Yes" : "No";
            document.getElementById("isConcept").textContent = prop.isConcept ? "Yes" : "No";
            document.getElementById("isSpa").textContent = prop.isSpa ? "Yes" : "No";
            document.getElementById("isAdult").textContent = prop.isAdult ? "Yes" : "No";
        }
    }
}

function openEditPropertyForm() {
    document.getElementById("capacityInput").value = document.getElementById("capacity").textContent || 0;
    document.getElementById("isShuttleTransferInput").checked = document.getElementById("isShuttleTransfer").textContent === "Yes";
    document.getElementById("isAnimalAcceptInput").checked = document.getElementById("isAnimalAccept").textContent === "Yes";
    document.getElementById("isConceptInput").checked = document.getElementById("isConcept").textContent === "Yes";
    document.getElementById("isSpaInput").checked = document.getElementById("isSpa").textContent === "Yes";
    document.getElementById("isAdultInput").checked = document.getElementById("isAdult").textContent === "Yes";
    new bootstrap.Modal(document.getElementById("propertyModal")).show();
}

async function saveProperty(e) {
    e.preventDefault();

    const id = document.getElementById("propertyId").value || 0;
    const model = {
        id: parseInt(id),
        hotelId: parseInt(hotelId),
        capacity: parseInt(document.getElementById("capacityInput").value),
        isShuttleTransfer: document.getElementById("isShuttleTransferInput").checked,
        isAnimalAccept: document.getElementById("isAnimalAcceptInput").checked,
        isConcept: document.getElementById("isConceptInput").checked,
        isSpa: document.getElementById("isSpaInput").checked,
        isAdult: document.getElementById("isAdultInput").checked
    };

    const method = id > 0 ? "PUT" : "POST";

    const response = await fetch(apiProperty, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model)
    });

    const result = await response.json();
    if (result.success) {
        bootstrap.Modal.getInstance(document.getElementById("propertyModal")).hide();
        loadProperty();
    } else {
        alert("Hata: " + result.message);
    }
}

// ---- IMAGES ----
async function loadImages(hotelId) {
    const response = await fetch(`${imageApiUrl}/byhotel/${hotelId}`);
    const result = await response.json();

    const tableBody = document.getElementById("imageTableBody");
    tableBody.innerHTML = "";

    if (!result.success || !result.data || result.data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No images found.</td></tr>';
        return;
    }

    result.data.forEach(img => {
        const row = `
        <tr>
            <td>
                <img src="${img.imgUrl}" 
                     style="width:100px; height:70px; object-fit:cover; border-radius:6px; cursor:pointer;" 
                     onclick="previewImage('${img.imgUrl}')">
            </td>
            <td>${img.imgUrl}</td>
            <td>${new Date(img.createdDate).toLocaleDateString('tr-TR')}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openEditImageForm(${img.id}, '${img.imgUrl}')">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="removeImage(${img.id})">Delete</button>
            </td>
        </tr>
    `;
        tableBody.innerHTML += row;
    });
}

// ---- IMAGE PREVIEW ----
function previewImage(url) {
    const img = document.getElementById("previewImage");
    img.src = url;
    new bootstrap.Modal(document.getElementById("imagePreviewModal")).show();
}


function openAddImageForm() {
    document.getElementById("imageModalTitle").textContent = "Add Image";
    document.getElementById("imageForm").reset();
    document.getElementById("imageId").value = "";
    new bootstrap.Modal(document.getElementById("imageModal")).show();
}

function openEditImageForm(id, imgUrl) {
    document.getElementById("imageModalTitle").textContent = "Edit Image";
    document.getElementById("imageId").value = id;
    document.getElementById("imgUrl").value = imgUrl;
    new bootstrap.Modal(document.getElementById("imageModal")).show();
}

async function saveImage(e) {
    e.preventDefault();

    const id = document.getElementById("imageId").value || 0;
    const imgUrl = document.getElementById("imgUrl").value;

    const model = {
        id: parseInt(id),
        hotelId: parseInt(hotelId),
        imgUrl,
        createdDate: new Date().toISOString()
    };

    const method = id > 0 ? "PUT" : "POST";

    const response = await fetch(imageApiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model)
    });

    const result = await response.json();
    if (result.success) {
        bootstrap.Modal.getInstance(document.getElementById("imageModal")).hide();
        loadImages(hotelId);
    } else {
        alert("Hata: " + result.message);
    }
}

async function removeImage(id) {
    if (!confirm("Bu resmi silmek istediğinizden emin misiniz?")) return;

    const response = await fetch(`${imageApiUrl}/${id}`, {
        method: "DELETE"
    });

    const result = await response.json();
    if (result.success) {
        loadImages(hotelId);
    } else {
        alert("Silme işlemi başarısız: " + result.message);
    }
}
