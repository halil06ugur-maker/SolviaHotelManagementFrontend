const apiUrl = "https://localhost:7223/api/EmployeeHotelRole";
const employeeApi = "https://localhost:7223/api/Employee";
const hotelApi = "https://localhost:7223/api/Hotel";
const roleApi = "https://localhost:7223/api/Role";

const tableBody = document.querySelector("#assignmentTableBody");
const filterHotel = document.getElementById("filterHotel");
const filterRole = document.getElementById("filterRole");

const assignmentModal = new bootstrap.Modal(document.getElementById("assignmentModal"));
const detailsModal = new bootstrap.Modal(document.getElementById("detailsModal"));
const assignmentForm = document.getElementById("assignmentForm");

const idInput = document.getElementById("id");
const employeeSelect = document.getElementById("employeeId");
const hotelSelect = document.getElementById("hotelId");
const roleSelect = document.getElementById("roleId");
const modalTitle = document.getElementById("assignmentModalLabel");

let allAssignments = [];
let allEmployees = [];
let allHotels = [];
let allRoles = [];

// --- Fetch Assignments ---
async function fetchAssignments() {
    const res = await fetch(apiUrl);
    const json = await res.json();

    if (json.success) {
        allAssignments = json.data;
        renderAssignments(allAssignments);
        await loadFilters();
        await fetchEmployees(); // employee cache
    }
}

// --- Render Table ---
function renderAssignments(data) {
    tableBody.innerHTML = "";
    let counter = 1;

    // hotel listesini alfabetik sırala
    const sortedHotels = data.slice().sort((a, b) => a.hotelName.localeCompare(b.hotelName));

    sortedHotels.forEach(hotel => {
        // her hotel içindeki rolleri de istersen sırala
        const sortedRoles = hotel.roles.slice().sort((a, b) => a.roleName.localeCompare(b.roleName));

        sortedRoles.forEach(role => {
            role.employees.forEach(emp => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${counter++}</td>
                    <td>${emp.employeeName} ${emp.employeeSurname}</td>
                    <td>${hotel.hotelName}</td>
                    <td>${role.roleName}</td>
                    <td>${emp.employeeIsActive ? "Active" : "Inactive"}</td>
                    <td>
                        <button class="btn btn-sm btn-info" 
                            onclick="openDetailsModal('${emp.employeeName}','${emp.employeeSurname}','${emp.employeeEmail}','${emp.employeePhone}','${hotel.hotelName}','${role.roleName}')">
                            <i class="fas fa-circle-info"></i> Details
                        </button>
                        <button class="btn btn-sm btn-edit" 
                            onclick="openEditModal(${emp.employeeHotelRoleId}, ${emp.employeeId}, ${hotel.hotelId}, ${role.roleId})">
                            <i class="fas fa-pen"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-delete" onclick="deleteAssignment(${emp.employeeHotelRoleId})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        });
    });
}

// --- Load Filters ---
async function loadFilters() {
    const resHotel = await fetch(hotelApi);
    const jsonHotel = await resHotel.json();
    if (jsonHotel.success) {
        allHotels = jsonHotel.data.sort((a, b) => a.name.localeCompare(b.name));
        filterHotel.innerHTML = "<option value=''>-- Filter by Hotel --</option>";
        allHotels.forEach(h => {
            filterHotel.innerHTML += `<option value="${h.id}">${h.name}</option>`;
        });
    }

    const resRole = await fetch(roleApi);
    const jsonRole = await resRole.json();
    if (jsonRole.success) {
        allRoles = jsonRole.data;
        filterRole.innerHTML = "<option value=''>-- Filter by Role --</option>";
        allRoles.forEach(r => {
            filterRole.innerHTML += `<option value="${r.id}">${r.name}</option>`;
        });
    }
}

// --- Apply Filters ---
function applyFilters() {
    const selectedHotel = filterHotel.value;
    const selectedRole = filterRole.value;

    let filtered = [];

    allAssignments.forEach(hotel => {
        if (selectedHotel && hotel.hotelId != selectedHotel) return;

        const filteredRoles = hotel.roles.map(role => {
            if (selectedRole && role.roleId != selectedRole) {
                return { ...role, employees: [] };
            }
            return role;
        });

        filtered.push({ ...hotel, roles: filteredRoles });
    });

    renderAssignments(filtered);
}

function resetFilters() {
    filterHotel.value = "";
    filterRole.value = "";
    renderAssignments(allAssignments);
}

filterHotel.addEventListener("change", applyFilters);
filterRole.addEventListener("change", applyFilters);

// --- Employees ---
async function fetchEmployees() {
    const res = await fetch(employeeApi);
    const json = await res.json();
    if (json.success) {
        allEmployees = json.data;
    }
}

function loadEmployeesDropdown(editingEmployeeId = null) {
    employeeSelect.innerHTML = "<option value=''>-- Select Employee --</option>";

    const assignedIds = new Set();
    allAssignments.forEach(h =>
        h.roles.forEach(r =>
            r.employees.forEach(e => assignedIds.add(e.employeeId))
        )
    );

    allEmployees
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(emp => {
            if (editingEmployeeId === emp.id || !assignedIds.has(emp.id)) {
                employeeSelect.innerHTML += `<option value="${emp.id}" ${editingEmployeeId === emp.id ? "selected" : ""}>${emp.name} ${emp.surname}</option>`;
            }
        });
}

// --- Hotels ---
function loadHotelsDropdown(selectedId = null) {
    hotelSelect.innerHTML = "<option value=''>-- Select Hotel --</option>";
    allHotels.forEach(h => {
        hotelSelect.innerHTML += `<option value="${h.id}" ${selectedId === h.id ? "selected" : ""}>${h.name}</option>`;
    });
}

// --- Roles ---
async function loadRolesDropdown(hotelId, selectedRoleId = null) {
    roleSelect.innerHTML = "<option value=''>-- Select Role --</option>";
    if (!hotelId) return;

    const res = await fetch(`${roleApi}?hotelId=${hotelId}`);
    const json = await res.json();
    if (json.success) {
        json.data.forEach(r => {
            roleSelect.innerHTML += `<option value="${r.id}" ${selectedRoleId === r.id ? "selected" : ""}>${r.name}</option>`;
        });
    }
}

// --- MODALS ---
async function openAddModal() {
    modalTitle.textContent = "Add Assignment";
    idInput.value = 0;
    loadEmployeesDropdown();
    loadHotelsDropdown();
    roleSelect.innerHTML = "<option value=''>-- Select Role --</option>";
    assignmentModal.show();
}

async function openEditModal(id, employeeId, hotelId, roleId) {
    modalTitle.textContent = "Edit Assignment";
    idInput.value = id;
    loadEmployeesDropdown(employeeId);
    loadHotelsDropdown(hotelId);
    await loadRolesDropdown(hotelId, roleId);
    assignmentModal.show();
}

function openDetailsModal(name, surname, email, phone, hotel, role) {
    document.getElementById("detailsBody").innerHTML = `
      <p><strong>Name:</strong> ${name} ${surname}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Hotel:</strong> ${hotel}</p>
      <p><strong>Role:</strong> ${role}</p>
    `;
    detailsModal.show();
}

// --- SAVE ---
assignmentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = parseInt(idInput.value || "0");
    const isEditing = id > 0;
    const method = isEditing ? "PUT" : "POST";
    const endpoint = isEditing ? `${apiUrl}/${id}` : apiUrl;

    const payload = {
        id,
        employeeId: employeeSelect.value,
        hotelId: hotelSelect.value,
        roleId: roleSelect.value,
        createdDate: new Date().toISOString()
    };

    const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (res.ok) {
        alert(isEditing ? "Updated." : "Added.");
        assignmentModal.hide();
        fetchAssignments();
    } else {
        alert("Error while saving.");
    }
});

// --- DELETE ---
async function deleteAssignment(id) {
    if (!confirm("Delete this assignment?")) return;
    const res = await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
    if (res.ok) {
        alert("Deleted.");
        fetchAssignments();
    }
}

// --- INIT ---
document.addEventListener("DOMContentLoaded", fetchAssignments);
