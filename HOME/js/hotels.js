document.addEventListener("DOMContentLoaded", async () => {
    const API_HOTEL = "https://localhost:7223/api/Hotel";
    const API_HOTEL_IMAGE = "https://localhost:7223/api/HotelImage";
    const hotelList = document.getElementById("hotelList");
    const pagination = document.getElementById("pagination");
    const searchBox = document.getElementById("searchBox");

    let hotels = [];
    let images = [];
    let filteredHotels = [];
    let currentPage = 1;
    const itemsPerPage = 6;

    try {
        const resHotels = await fetch(API_HOTEL);
        const resultHotels = await resHotels.json();
        hotels = resultHotels.success ? resultHotels.data : [];
        filteredHotels = [...hotels];

        const resImages = await fetch(API_HOTEL_IMAGE);
        const resultImages = await resImages.json();
        images = resultImages.success ? resultImages.data : [];

        renderPage(currentPage);
        renderPagination();
    } catch (err) {
        console.error("Hotels error:", err);
        hotelList.innerHTML = `<p class="text-danger">Bir hata oluştu!</p>`;
    }

    function renderPage(page) {
        hotelList.innerHTML = "";
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const hotelsToShow = filteredHotels.slice(start, end);

        if (hotelsToShow.length === 0) {
            hotelList.innerHTML = `<p class="text-center text-muted">Sonuç bulunamadı</p>`;
            return;
        }

        hotelsToShow.forEach(hotel => {
            const hotelImage = images.find(img => img.hotelId === hotel.id);
            hotelList.innerHTML += `
        <div class="col-md-4">
          <div class="card hotel-card">
            <img src="${hotelImage ? hotelImage.imgUrl : 'https://via.placeholder.com/400x200'}" 
                 class="card-img-top" alt="${hotel.name}">
            <div class="card-body">
              <h5 class="card-title">${hotel.name}</h5>
              <p class="card-text">Tel: ${hotel.phoneNumber}</p>
              <a href="HotelDetail.html?id=${hotel.id}" 
                 class="btn btn-warning text-dark w-100">View Details</a>
            </div>
          </div>
        </div>
      `;
        });
    }

    function renderPagination() {
        const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
        pagination.innerHTML = "";

        if (totalPages <= 1) return;

        pagination.innerHTML += `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#">Önceki</a>
      </li>
    `;

        for (let i = 1; i <= totalPages; i++) {
            pagination.innerHTML += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" href="#">${i}</a>
        </li>
      `;
        }

        pagination.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#">Sonraki</a>
      </li>
    `;

        pagination.querySelectorAll(".page-link").forEach((link) => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const text = link.textContent;
                if (text === "Önceki" && currentPage > 1) currentPage--;
                else if (text === "Sonraki" && currentPage < totalPages) currentPage++;
                else if (!isNaN(text)) currentPage = parseInt(text);

                renderPage(currentPage);
                renderPagination();
            });
        });
    }

    // 🔎 Arama kutusu
    searchBox.addEventListener("input", () => {
        const query = searchBox.value.toLowerCase();
        filteredHotels = hotels.filter(h => h.name.toLowerCase().includes(query));
        currentPage = 1;
        renderPage(currentPage);
        renderPagination();
    });
});
