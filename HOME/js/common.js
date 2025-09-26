document.addEventListener("DOMContentLoaded", () => {
    const userData = localStorage.getItem("loggedInCustomer");
    const welcomeEl = document.getElementById("welcomeText");
    const logoutBtn = document.getElementById("logoutBtn");

    if (userData && welcomeEl && logoutBtn) {
        const customer = JSON.parse(userData);

        // Ad Soyadı yazdır
        welcomeEl.textContent = `Hoş geldin, ${customer.name} ${customer.surname}`;
        logoutBtn.classList.remove("d-none");

        // Çıkış işlemi
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            localStorage.removeItem("loggedInCustomer");
            welcomeEl.textContent = "";
            logoutBtn.classList.add("d-none");
        });
    }
});