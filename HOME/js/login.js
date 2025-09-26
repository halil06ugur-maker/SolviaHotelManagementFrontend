document.addEventListener("DOMContentLoaded", () => {
    const API_URL = "https://localhost:7223/api/Customer";
    const form = document.getElementById("loginForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const identityNumber = document.getElementById("identityNumber").value.trim();
        const phoneNumber = document.getElementById("phoneNumber").value.trim();

        try {
            const res = await fetch(API_URL);
            const result = await res.json();

            if (!result.success) {
                alert("Müşteri listesi alınamadı!");
                return;
            }

            const customers = result.data;
            const customer = customers.find(
                c => c.identityNumber === identityNumber && c.phoneNumber === phoneNumber
            );

            if (customer) {
                // Kullanıcıyı localStorage'a kaydet
                localStorage.setItem("loggedInCustomer", JSON.stringify(customer));

                alert(`Hoş geldin, ${customer.name} ${customer.surname}!`);
                // Ana sayfaya yönlendir
                window.location.href = "home.html";
            } else {
                alert("Kimlik veya telefon numarası hatalı!");
            }
        } catch (err) {
            console.error("Login hatası:", err);
            alert("Sunucu hatası!");
        }
    });
});
