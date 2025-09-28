document.addEventListener("DOMContentLoaded", async () => {
    const API_HOTEL = "https://localhost:7223/api/Hotel";
    const API_PROPERTIES = "https://localhost:7223/api/HotelProperty";
    const API_IMAGES = "https://localhost:7223/api/HotelImage";
    const API_ROOMS = "https://localhost:7223/api/HotelRoom";
    const API_RATES = "https://localhost:7223/api/CustomerHotelRate";
    const API_RESERVE = "https://localhost:7223/api/CustomerHotelRoom";

    const hotelNameEl = document.getElementById("hotelName");
    const heroHotelNameEl = document.getElementById("heroHotelName");
    const hotelPhoneEl = document.getElementById("hotelPhone");
    const hotelPropsEl = document.getElementById("hotelProperties");
    const hotelImagesEl = document.getElementById("hotelImages");
    const roomsEl = document.getElementById("hotelRooms");
    const ratesEl = document.getElementById("customerRates");

    const reserveModal = new bootstrap.Modal(document.getElementById("reserveModal"));
    const reserveForm = document.getElementById("reserveForm");
    const selectedRoomIdEl = document.getElementById("selectedRoomId");

    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = parseInt(urlParams.get("id"));

    if (!hotelId) { hotelNameEl.textContent = "Hotel not found!"; return; }

    try {
        // 1. Hotel
        const resHotel = await fetch(`${API_HOTEL}/${hotelId}`);
        const hotel = (await resHotel.json()).data;
        hotelNameEl.textContent = hotel?.name || "Hotel";
        heroHotelNameEl.textContent = hotel?.name || "Hotel";
        hotelPhoneEl.textContent = "Phone: " + (hotel?.phoneNumber || "---");

        // 2. Properties
        const resProps = await fetch(API_PROPERTIES);
        const props = (await resProps.json()).data.filter(p => p.hotelId === hotelId);
        if (props.length > 0) {
            const p = props[0];
            hotelPropsEl.innerHTML = `
                <strong>Capacity:</strong> ${p.capacity} <br>
                <strong>Shuttle:</strong> ${p.isShuttleTransfer ? "Yes" : "No"} <br>
                <strong>Animals Allowed:</strong> ${p.isAnimalAccept ? "Yes" : "No"} <br>
                <strong>Adult Only:</strong> ${p.isAdult ? "Yes" : "No"} <br>
                <strong>Spa:</strong> ${p.isSpa ? "Yes" : "No"} <br>
            `;
        }

        // 3. Images
        const resImgs = await fetch(API_IMAGES);
        const resImgsJson = await resImgs.json();
        const imgs = resImgsJson.data.filter(i => parseInt(i.hotelId) === hotelId);

        if (imgs.length > 0) {
            // Hero için ilk resmi ayarla
            document.querySelector(".hero").style.backgroundImage = `url('${imgs[0].imgUrl}')`;

            // Galeri için resimleri ekle
            hotelImagesEl.innerHTML = imgs.map(i => `
        <div class="col-md-4 mb-3">
            <div class="card shadow-sm">
                <img src="${i.imgUrl}" 
                     class="card-img-top hotel-img"
                     alt="Hotel image"
                     style="height:250px; object-fit:cover; cursor:pointer;"
                     data-url="${i.imgUrl}">
            </div>
        </div>
    `).join("");
        } else {
            hotelImagesEl.innerHTML = `<p class="text-muted">No images for this hotel</p>`;
        }

        // Fullscreen modal
        hotelImagesEl.addEventListener("click", e => {
            if (e.target.classList.contains("hotel-img")) {
                document.getElementById("modalImage").src = e.target.dataset.url;
                new bootstrap.Modal(document.getElementById("imageModal")).show();
            }
        });



        // 4. Reviews
        const resRates = await fetch(API_RATES);
        const ratesResult = await resRates.json();
        const hotelRate = ratesResult.data.find(r => r.hotelId === hotelId);
        ratesEl.innerHTML = hotelRate && hotelRate.customerRates?.length > 0
            ? hotelRate.customerRates.map(r => `
                <div class="border rounded p-3 mb-2 shadow-sm">
                    <strong>${r.customerName}</strong>
                    <div class="star-bar">${"★".repeat(r.rate)}${"☆".repeat(5 - r.rate)}</div>
                    <p class="mb-0">${r.description}</p>
                </div>
            `).join("")
            : `<p class="text-muted">No reviews yet.</p>`;

    } catch (err) {
        console.error("Hotel detail error:", err);
    }

    // ======================
    // Show available rooms + pagination
    // ======================
    document.getElementById("showRooms").addEventListener("click", async () => {
        const startInput = document.getElementById("checkIn").value;
        const endInput = document.getElementById("checkOut").value;

        if (!startInput || !endInput) {
            alert("Lütfen giriş ve çıkış tarihlerini seçiniz.");
            return;
        }

        const start = new Date(startInput);
        const end = new Date(endInput);
        if (start >= end) {
            alert("Bitiş tarihi başlangıçtan sonra olmalı.");
            return;
        }

        const customer = JSON.parse(localStorage.getItem("loggedInCustomer") || "{}");

        // HotelRoom listesini çek
        const resRooms = await fetch(API_ROOMS);
        const roomsResult = await resRooms.json();
        const hotelRoomsData = roomsResult.data.find(h => h.hotelId === hotelId);
        const hotelRooms = hotelRoomsData?.rooms || [];

        // CustomerHotelRoom listesini çek
        const resReservations = await fetch(API_RESERVE);
        const reservationsResult = await resReservations.json();
        const reservationRooms = reservationsResult.data.find(h => h.hotelId === hotelId)?.rooms || [];

        // Merge et (HotelRoom + rezervasyon bilgisi)
        const mergedRooms = hotelRooms.map(r => {
            const resData = reservationRooms.find(rr => rr.roomId === r.roomId);
            return {
                ...r,
                customers: resData?.customer || []
            };
        });

        // ✅ Sadece boş odaları listele (isReserved === false olacak)
        const filteredRooms = mergedRooms.filter(r => !r.isReserved);

        // Pagination ayarları
        let currentPage = 1;
        const pageSize = 18;
        const totalPages = Math.ceil(filteredRooms.length / pageSize);

        function renderPage(page) {
            const startIndex = (page - 1) * pageSize;
            const paginatedRooms = filteredRooms.slice(startIndex, startIndex + pageSize);

            roomsEl.innerHTML = paginatedRooms.length === 0
                ? `<p class="text-muted">No available rooms for selected dates.</p>`
                : paginatedRooms.map(r => `
            <div class="col-md-2">
              <div class="card room-card h-100">
                <img src="https://kurmick.com/content/upload/odalar-yeni/standart/standart-oda-4.jpg" class="card-img-top">
                <div class="card-body d-flex flex-column">
                  <h5 class="card-title">Room ${r.roomNumber} (${r.roomType || "Standard"})</h5>
                  <p class="text-success">Available</p>
                  <button class="btn btn-warning mt-auto reserveBtn" data-roomid="${r.roomId}">
                    Reserve
                  </button>
                </div>
              </div>
            </div>
          `).join("");

            // Pagination butonları
            if (totalPages > 1) {
                let paginationHTML = `<div class="col-12 d-flex justify-content-center mt-3">`;

                // En başa git
                paginationHTML += `
    <button class="btn btn-sm btn-secondary me-2" ${page === 1 ? "disabled" : ""} id="firstPage">« İlk</button>`;

                // Önceki
                paginationHTML += `
    <button class="btn btn-sm btn-secondary me-2" ${page === 1 ? "disabled" : ""} id="prevPage">Önceki</button>`;

                // Sayfa göstergesi
                paginationHTML += `<span>Sayfa ${page} / ${totalPages}</span>`;

                // Sonraki
                paginationHTML += `
    <button class="btn btn-sm btn-secondary ms-2" ${page === totalPages ? "disabled" : ""} id="nextPage">Sonraki</button>`;

                // En sona git
                paginationHTML += `
    <button class="btn btn-sm btn-secondary ms-2" ${page === totalPages ? "disabled" : ""} id="lastPage">Son »</button>`;

                paginationHTML += `</div>`;
                roomsEl.innerHTML += paginationHTML;

                // Event listeners
                document.getElementById("firstPage")?.addEventListener("click", () => {
                    if (currentPage !== 1) {
                        currentPage = 1;
                        renderPage(currentPage);
                    }
                });

                document.getElementById("prevPage")?.addEventListener("click", () => {
                    if (currentPage > 1) {
                        currentPage--;
                        renderPage(currentPage);
                    }
                });

                document.getElementById("nextPage")?.addEventListener("click", () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderPage(currentPage);
                    }
                });

                document.getElementById("lastPage")?.addEventListener("click", () => {
                    if (currentPage !== totalPages) {
                        currentPage = totalPages;
                        renderPage(currentPage);
                    }
                });
            }


            // Reserve click
            document.querySelectorAll(".reserveBtn").forEach(btn => {
                btn.addEventListener("click", () => {
                    if (!customer.id) { alert("Please login to reserve."); return; }
                    selectedRoomIdEl.value = btn.dataset.roomid;
                    document.getElementById("startDate").value = startInput;
                    document.getElementById("endDate").value = endInput;
                    reserveModal.show();
                });
            });
        }

        // İlk sayfayı render et
        renderPage(currentPage);
    });

    // ======================
    // Reserve form submit
    // ======================
    reserveForm.addEventListener("submit", async e => {
        e.preventDefault();
        const customer = JSON.parse(localStorage.getItem("loggedInCustomer") || "{}");
        if (!customer.id) { alert("Please login first."); return; }

        const payload = {
            id: 0,
            customerId: customer.id,
            hotelId,
            roomId: parseInt(selectedRoomIdEl.value),
            startDate: document.getElementById("startDate").value,
            endDate: document.getElementById("endDate").value,
            createdDate: new Date().toISOString()
        };

        try {
            await fetch(API_RESERVE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            alert("Reservation successful!");
            reserveModal.hide();
            window.location.reload();
        } catch { alert("Reservation failed."); }
    });

    // ======================
    // Review stars
    // ======================
    const stars = document.querySelectorAll("#ratingStars i");
    let selectedRate = 0;
    stars.forEach(star => {
        star.addEventListener("click", () => {
            selectedRate = parseInt(star.dataset.value);
            stars.forEach(s => s.classList.toggle("active", parseInt(s.dataset.value) <= selectedRate));
        });
    });

    // ======================
    // Review submit
    // ======================
    document.getElementById("submitReview").addEventListener("click", async () => {
        const customer = JSON.parse(localStorage.getItem("loggedInCustomer") || "{}");
        if (!customer.id) { alert("Please login to review."); return; }
        if (selectedRate === 0) { alert("Please select a star rating."); return; }

        const payload = {
            id: 0,
            customerId: customer.id,
            hotelId,
            rate: selectedRate,
            description: document.getElementById("reviewText").value,
            createdDate: new Date().toISOString()
        };

        try {
            await fetch(API_RATES, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            alert("Review submitted!");
            window.location.reload();
        } catch { alert("Review failed."); }
    });
});
