document.addEventListener("DOMContentLoaded", () => {
    const userData = localStorage.getItem("loggedInCustomer");
    const welcomeEl = document.getElementById("welcomeText");
    const logoutBtn = document.getElementById("logoutBtn");
    const registerLink = document.querySelector('a[href="register.html"]');
    const loginLink = document.querySelector('a[href="login.html"]');

    if (userData) {
        const customer = JSON.parse(userData);

        // Navbar'da ad soyadı yazdır
        if (welcomeEl) {
            welcomeEl.textContent = `Hoş geldin, ${customer.name} ${customer.surname}`;
        }

        // Çıkış butonunu göster
        if (logoutBtn) {
            logoutBtn.classList.remove("d-none");
            logoutBtn.addEventListener("click", (e) => {
                e.preventDefault();
                localStorage.removeItem("loggedInCustomer");
                window.location.href = "home.html";
            });
        }

        // Register & Login butonlarını gizle
        if (registerLink) registerLink.classList.add("d-none");
        if (loginLink) loginLink.classList.add("d-none");

    } else {
        // Kullanıcı giriş yapmamışsa
        if (welcomeEl) welcomeEl.textContent = "";
        if (logoutBtn) logoutBtn.classList.add("d-none");
        if (registerLink) registerLink.classList.remove("d-none");
        if (loginLink) loginLink.classList.remove("d-none");
    }
});
