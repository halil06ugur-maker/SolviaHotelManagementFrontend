const API_HOTEL = "https://localhost:7223/api/Hotel";
const API_ADDRESS = "https://localhost:7223/api/HotelAddress";
const API_PROPERTY = "https://localhost:7223/api/HotelProperty";
const API_IMAGE = "https://localhost:7223/api/HotelImage";
const API_ROOM = "https://localhost:7223/api/Room";
const API_HOTELROOM = "https://localhost:7223/api/HotelRoom";

let hotelId = null;

async function parseResult(response) {
    const text = await response.text();
    const json = text ? JSON.parse(text) : {};
    const ok =
        json.success ??
        json.isSuccess ??
        json.Success ??
        (response.ok && (json.data !== undefined || json.Data !== undefined));

    return {
        ok,
        data: json.data ?? json.Data,
        message: json.message ?? json.Message ?? (response.ok ? "" : "İşlem başarısız."),
        raw: json,
        status: response.status
    };
}

/* -------------------- Sayfa Yüklenince -------------------- */
document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    hotelId = params.get("id");

    if (!hotelId) {
        alert("Geçersiz otel ID!");
        return;
    }

    // Form eventleri
    document.getElementById("addressForm")?.addEventListener("submit", onSaveAddress);
    document.getElementById("propertyForm")?.addEventListener("submit", onSaveProperty);
    document.getElementById("imageForm")?.addEventListener("submit", onSaveImage);
    document.getElementById("roomForm")?.addEventListener("submit", onSaveRoom);

    // Yüklemeler
    await loadHotelHeader();
    await loadAddresses();
    await loadProperty();
    await loadImages();
    await loadHotelRooms();
    await loadRoomDropdown();
});

/* =========================================================
   HOTEL HEADER (Kapak resmi + Otel adı)
   ========================================================= */
async function loadHotelHeader() {
    try {
        const res = await fetch(`${API_HOTEL}/${hotelId}`);
        const pr = await parseResult(res);
        if (!pr.ok || !pr.data) return;

        const name = pr.data.name ?? pr.data.Name ?? "";
        document.getElementById("hotelName").innerText = name;

        // Backend otel ile birlikte resimleri döndürüyorsa:
        const coverEl = document.getElementById("coverImage");
        if (pr.data.hotelImages && pr.data.hotelImages.length > 0) {
            coverEl.src = pr.data.hotelImages[0].imgUrl;
        } else {
            // değilse placeholder
            coverEl.src = "https://via.placeholder.com/1200x400?text=No+Image";
        }
    } catch (err) {
        console.error("loadHotelHeader error:", err);
    }
}

/* =========================================================
   ADDRESS
   ========================================================= */
function openAddAddressForm() {
    const m = document.getElementById("addressModal");
    m.dataset.editMode = "false";
    document.getElementById("addressModalTitle").textContent = "Adres Ekle";
    document.getElementById("addressId").value = "";
    document.getElementById("addressText").value = "";
    document.getElementById("postCode").value = "";
    new bootstrap.Modal(m).show();
}
function openEditAddressForm(id, address, postCode) {
    const m = document.getElementById("addressModal");
    m.dataset.editMode = "true";
    document.getElementById("addressModalTitle").textContent = "Adres Düzenle";
    document.getElementById("addressId").value = id;
    document.getElementById("addressText").value = address;
    document.getElementById("postCode").value = postCode;
    new bootstrap.Modal(m).show();
}
async function loadAddresses() {
    try {
        const res = await fetch(API_ADDRESS);
        const pr = await parseResult(res);
        const tbody = document.getElementById("addressTableBody");
        tbody.innerHTML = "";

        if (!pr.ok || !Array.isArray(pr.data)) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">Adres bulunamadı.</td></tr>`;
            return;
        }
        const rows = pr.data.filter(x => String(x.hotelId ?? x.HotelId) === String(hotelId));
        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">Adres bulunamadı.</td></tr>`;
            return;
        }
        rows.forEach(a => {
            const id = a.id ?? a.Id;
            const address = a.address ?? a.Address ?? "";
            const postCode = a.postCode ?? a.PostCode ?? "";
            const created = a.createdDate ?? a.CreatedDate;

            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>${address}</td>
        <td>${postCode}</td>
        <td>${created ? new Date(created).toLocaleDateString("tr-TR") : "-"}</td>
        <td>
          <button class="btn btn-sm btn-primary">Edit</button>
          <button class="btn btn-sm btn-danger">Delete</button>
        </td>`;
            tr.querySelector(".btn-primary").addEventListener("click", () => openEditAddressForm(id, address, postCode));
            tr.querySelector(".btn-danger").addEventListener("click", () => deleteAddress(id));
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("loadAddresses error:", err);
    }
}
async function onSaveAddress(e) {
    e.preventDefault();
    const m = document.getElementById("addressModal");
    const editMode = m.dataset.editMode === "true";
    const id = parseInt(document.getElementById("addressId").value || 0, 10);
    const address = document.getElementById("addressText").value.trim();
    const postCode = document.getElementById("postCode").value.trim();

    const payload = {
        id: editMode ? id : 0,
        hotelId: parseInt(hotelId, 10),
        address,
        postCode,
        createdDate: new Date().toISOString()
    };
    const res = await fetch(API_ADDRESS, {
        method: editMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const pr = await parseResult(res);
    if (!pr.ok) { alert("Adres kaydedilemedi: " + pr.message); return; }
    bootstrap.Modal.getInstance(m).hide();
    await loadAddresses();
}
async function deleteAddress(id) {
    if (!confirm("Bu adresi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`${API_ADDRESS}/${id}`, { method: "DELETE" });
    const pr = await parseResult(res);
    if (!pr.ok) { alert("Silme başarısız: " + pr.message); return; }
    await loadAddresses();
}

/* =========================================================
   PROPERTY
   ========================================================= */
function openEditPropertyForm() {
    const cap = (document.getElementById("capacity").textContent || "0").trim();
    document.getElementById("capacityInput").value = parseInt(cap || "0", 10);
    document.getElementById("isShuttleTransferInput").checked = (document.getElementById("isShuttleTransfer").textContent === "Yes");
    document.getElementById("isAnimalAcceptInput").checked = (document.getElementById("isAnimalAccept").textContent === "Yes");
    document.getElementById("isConceptInput").checked = (document.getElementById("isConcept").textContent === "Yes");
    document.getElementById("isSpaInput").checked = (document.getElementById("isSpa").textContent === "Yes");
    document.getElementById("isAdultInput").checked = (document.getElementById("isAdult").textContent === "Yes");
    new bootstrap.Modal(document.getElementById("propertyModal")).show();
}
async function loadProperty() {
    try {
        // Önce byhotel dene
        let res = await fetch(`${API_PROPERTY}/byhotel/${hotelId}`);
        let pr = await parseResult(res);
        if (!pr.ok) {
            // fallback: tüm liste
            res = await fetch(API_PROPERTY);
            pr = await parseResult(res);
            if (!pr.ok) return;
            pr.data = Array.isArray(pr.data) ? pr.data.find(p => String(p.hotelId ?? p.HotelId) === String(hotelId)) : null;
        }
        const prop = Array.isArray(pr.data) ? pr.data[0] : pr.data;
        if (!prop) return;

        document.getElementById("propertyId").value = prop.id ?? prop.Id ?? 0;
        document.getElementById("capacity").textContent = prop.capacity ?? prop.Capacity ?? 0;
        document.getElementById("isShuttleTransfer").textContent = (prop.isShuttleTransfer ?? prop.IsShuttleTransfer) ? "Yes" : "No";
        document.getElementById("isAnimalAccept").textContent = (prop.isAnimalAccept ?? prop.IsAnimalAccept) ? "Yes" : "No";
        document.getElementById("isConcept").textContent = (prop.isConcept ?? prop.IsConcept) ? "Yes" : "No";
        document.getElementById("isSpa").textContent = (prop.isSpa ?? prop.IsSpa) ? "Yes" : "No";
        document.getElementById("isAdult").textContent = (prop.isAdult ?? prop.IsAdult) ? "Yes" : "No";
    } catch (err) {
        console.error("loadProperty error:", err);
    }
}
async function onSaveProperty(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById("propertyId").value || 0, 10);
    const payload = {
        id,
        hotelId: parseInt(hotelId, 10),
        capacity: parseInt(document.getElementById("capacityInput").value || 0, 10),
        isShuttleTransfer: document.getElementById("isShuttleTransferInput").checked,
        isAnimalAccept: document.getElementById("isAnimalAcceptInput").checked,
        isConcept: document.getElementById("isConceptInput").checked,
        isSpa: document.getElementById("isSpaInput").checked,
        isAdult: document.getElementById("isAdultInput").checked,
        createdDate: new Date().toISOString()
    };
    const res = await fetch(API_PROPERTY, {
        method: id > 0 ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const pr = await parseResult(res);
    if (!pr.ok) { alert("Property kaydedilemedi: " + pr.message); return; }
    bootstrap.Modal.getInstance(document.getElementById("propertyModal")).hide();
    await loadProperty();
}

/* =========================================================
   IMAGES
   ========================================================= */
function openAddImageForm() {
    const m = document.getElementById("imageModal");
    m.dataset.editMode = "false";
    document.getElementById("imageModalTitle").textContent = "Add Image";
    document.getElementById("imageId").value = "";
    document.getElementById("imgUrl").value = "";
    new bootstrap.Modal(m).show();
}
function openEditImageForm(id, imgUrl) {
    const m = document.getElementById("imageModal");
    m.dataset.editMode = "true";
    document.getElementById("imageModalTitle").textContent = "Edit Image";
    document.getElementById("imageId").value = id;
    document.getElementById("imgUrl").value = imgUrl;
    new bootstrap.Modal(m).show();
}
async function loadImages() {
    try {
        let res = await fetch(`${API_IMAGE}/byhotel/${hotelId}`);
        let pr = await parseResult(res);
        if (!pr.ok) { // fallback: tüm liste
            res = await fetch(API_IMAGE);
            pr = await parseResult(res);
            if (pr.ok && Array.isArray(pr.data)) {
                pr.data = pr.data.filter(x => String(x.hotelId ?? x.HotelId) === String(hotelId));
            }
        }
        const tbody = document.getElementById("imageTableBody");
        tbody.innerHTML = "";
        const list = Array.isArray(pr.data) ? pr.data : (pr.data ? [pr.data] : []);
        if (!pr.ok || list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No images found.</td></tr>`;
            return;
        }
        list.forEach(img => {
            const id = img.id ?? img.Id;
            const url = img.imgUrl ?? img.ImgUrl ?? "";
            const created = img.createdDate ?? img.CreatedDate;
            const tr = document.createElement("tr");
            tr.innerHTML = `
        <td>
          <img src="${url}" style="width:100px; height:70px; object-fit:cover; border-radius:6px; cursor:pointer;"
               onclick="previewImage('${url}')">
        </td>
        <td>${url.length > 70 ? (url.substring(0, 70) + "...") : url}</td>
        <td>${created ? new Date(created).toLocaleDateString("tr-TR") : "-"}</td>
        <td>
          <button class="btn btn-sm btn-primary">Edit</button>
          <button class="btn btn-sm btn-danger">Delete</button>
        </td>`;
            tr.querySelector(".btn-primary").addEventListener("click", () => openEditImageForm(id, url));
            tr.querySelector(".btn-danger").addEventListener("click", () => removeImage(id));
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("loadImages error:", err);
    }
}
async function onSaveImage(e) {
    e.preventDefault();
    const m = document.getElementById("imageModal");
    const editMode = m.dataset.editMode === "true";
    const id = parseInt(document.getElementById("imageId").value || 0, 10);
    const imgUrl = document.getElementById("imgUrl").value.trim();
    const payload = {
        id: editMode ? id : 0,
        hotelId: parseInt(hotelId, 10),
        imgUrl,
        createdDate: new Date().toISOString()
    };
    const res = await fetch(API_IMAGE, {
        method: editMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    const pr = await parseResult(res);
    if (!pr.ok) { alert("Görsel kaydedilemedi: " + pr.message); return; }
    bootstrap.Modal.getInstance(m).hide();
    await loadImages();

    // Kapak resmi yoksa ilk görseli kapağa yansıt
    const cover = document.getElementById("coverImage");
    if (cover && cover.src.includes("placeholder") && imgUrl) cover.src = imgUrl;
}
async function removeImage(id) {
    if (!confirm("Bu resmi silmek istediğinize emin misiniz?")) return;
    const res = await fetch(`${API_IMAGE}/${id}`, { method: "DELETE" });
    const pr = await parseResult(res);
    if (!pr.ok) { alert("Silme başarısız: " + pr.message); return; }
    await loadImages();
}
function previewImage(url) {
    // Modal ile büyüt
    const img = document.getElementById("previewImage");
    img.src = url;
    new bootstrap.Modal(document.getElementById("imagePreviewModal")).show();
}

/* =========================================================
   ROOMS (HotelRoom + Room dropdown)
   ========================================================= */
// Dropdown’ı API_ROOM’dan doldur
async function loadRoomDropdown(selectedId = null) {
    try {
        const res = await fetch(API_ROOM);
        const pr = await parseResult(res);
        const sel = document.getElementById("roomSelect");
        sel.innerHTML = "";

        if (!pr.ok || !Array.isArray(pr.data)) return;

        pr.data.forEach(r => {
            const id = r.id ?? r.Id;
            const num = r.number ?? r.Number ?? id;
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = `${num}`;
            sel.appendChild(opt);
        });

        if (selectedId) sel.value = String(selectedId);
    } catch (err) {
        console.error("loadRoomDropdown error:", err);
    }
}

/* -------------------- HotelRooms Listeleme -------------------- */
async function loadHotelRooms() {
    const res = await fetch(`${API_HOTELROOM}?hotelId=${hotelId}`);
    const result = await parseResult(res);

    const tbody = document.getElementById("roomTableBody");
    tbody.innerHTML = "";

    if (result.ok && result.data) {
        // Eğer data array içindeyse ve rooms altına geldiyse:
        let rooms = [];
        if (Array.isArray(result.data)) {
            if (result.data[0]?.rooms) {
                rooms = result.data[0].rooms;  // odalara in
            } else {
                rooms = result.data; // direkt rooms dönüyorsa
            }
        }

        rooms.forEach(hr => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${hr.roomNumber ?? hr.RoomNumber ?? "-"}</td>
                <td>${hr.roomType ?? hr.RoomType ?? "-"}</td>
                <td>${hr.isReserved ? "Yes" : "No"}</td>
                <td>${hr.createdDate ? new Date(hr.createdDate).toLocaleDateString() : "-"}</td>
                <td>
                    <button class="btn btn-sm btn-warning" 
                        onclick="openEditRoomForm(${hr.hotelRoomId}, ${hr.roomId}, '${hr.roomType ?? hr.RoomType}', ${hr.isReserved}, '${hr.createdDate ?? ""}')">
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteRoom(${hr.hotelRoomId})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

/* -------------------- Modal Açılışları -------------------- */
function openAddRoomForm() {
    document.getElementById("roomModalTitle").innerText = "Add Room";
    document.getElementById("hotelRoomId").value = "";
    document.getElementById("roomSelect").value = "";
    document.getElementById("isReserved").checked = false;
    document.getElementById("createdDate").value = new Date().toISOString().split("T")[0];
    new bootstrap.Modal(document.getElementById("roomModal")).show();
}

function openEditRoomForm(hotelRoomId, roomId, isReserved, createdDate) {
    document.getElementById("roomModalTitle").innerText = "Edit Room";
    document.getElementById("hotelRoomId").value = hotelRoomId;
    document.getElementById("roomSelect").value = roomId;
    document.getElementById("isReserved").checked = isReserved;
    document.getElementById("createdDate").value = createdDate ? createdDate.split("T")[0] : "";
    new bootstrap.Modal(document.getElementById("roomModal")).show();
}

/* -------------------- Kaydet (POST / PUT) -------------------- */
async function onSaveRoom(e) {
    e.preventDefault();

    const hotelRoomId = document.getElementById("hotelRoomId").value;
    const roomId = document.getElementById("roomSelect").value;
    const isReserved = document.getElementById("isReserved").checked;

    const payload = {
        hotelRoomId: hotelRoomId ? parseInt(hotelRoomId) : 0,
        hotelId: parseInt(hotelId),
        roomId: parseInt(roomId),
        isReserved: isReserved
    };

    const method = hotelRoomId ? "PUT" : "POST";

    const res = await fetch(API_HOTELROOM, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const result = await parseResult(res);

    if (result.ok) {
        alert("Saved successfully!");
        bootstrap.Modal.getInstance(document.getElementById("roomModal")).hide();
        await loadHotelRooms();
    } else {
        alert("Error: " + result.message);
        console.error("Error payload:", payload, "Result:", result);
    }
}

/* -------------------- Sil -------------------- */
async function deleteRoom(hotelRoomId) {
    if (!confirm("Are you sure to delete?")) return;

    const res = await fetch(`${API_HOTELROOM}/${hotelRoomId}`, { method: "DELETE" });
    const result = await parseResult(res);

    if (result.ok) {
        alert("Deleted successfully!");
        await loadHotelRooms();
    } else {
        alert("Delete failed: " + result.message);
    }
}