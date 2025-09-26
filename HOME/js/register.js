document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        const customer = {
            id: 0, // backend set edecek
            identityNumber: document.getElementById("identityNumber").value,
            name: document.getElementById("name").value,
            surname: document.getElementById("surname").value,
            phoneNumber: document.getElementById("phoneNumber").value,
            age: parseInt(document.getElementById("age").value),
            gender: document.getElementById("gender").value,
            createdDate: new Date().toISOString() // şimdiki tarih
        };

        try {
            const res = await fetch("https://localhost:7223/api/Customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(customer)
            });

            if (res.ok) {
                alert("Registration successful!");
                form.reset();
                // login sayfasına yönlendir
                window.location.href = "login.html";
            } else {
                const errorText = await res.text();
                alert("Registration failed: " + errorText);
            }
        } catch (err) {
            console.error("Register error:", err);
            alert("Something went wrong!");
        }
    });
});
