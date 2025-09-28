document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const identityNumber = document.getElementById("identityNumber").value.trim();
    const phoneNumber = document.getElementById("phoneNumber").value.trim();

    try {
        const res = await fetch("https://localhost:7223/api/Customer");
        const result = await res.json();

        if (result.success) {
            const customers = result.data;

            // IdentityNumber + PhoneNumber eşleşiyorsa
            const customer = customers.find(
                c => c.identityNumber === identityNumber && c.phoneNumber === phoneNumber
            );

            if (customer) {
                // ✅ common.js ile aynı key
                localStorage.setItem("loggedInCustomer", JSON.stringify(customer));

                alert(`Hoş geldin ${customer.name} ${customer.surname}`);
                window.location.href = "home.html";
            } else {
                alert("Kimlik veya telefon hatalı!");
            }
        } else {
            alert("Müşteri listesi alınamadı.");
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Sunucuya bağlanılamadı.");
    }
});
