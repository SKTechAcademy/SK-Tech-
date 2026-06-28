document.addEventListener("DOMContentLoaded", () => {

    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    const loginBtn = document.getElementById("loginBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", handleLogin);
    }
});

async function handleLogin(e) {

    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("errorMsg");

    errorMsg.textContent = "";

    if (!username || !password) {
        errorMsg.textContent = "Please enter Register ID / Email and Password";
        return;
    }

    try {

        let email = "";

        // User entered Email
        if (username.includes("@")) {

            email = username;

        } else {

            // User entered Register ID
            const userDoc = await db.collection("users")
                .doc(username)
                .get();

            if (!userDoc.exists) {
                throw new Error("Register ID not found");
            }

            const userData = userDoc.data();

            if (!userData.Email) {
                throw new Error("Email not configured for this Register ID");
            }

            email = userData.Email;
        }

        // Firebase Login
        const userCredential =
            await auth.signInWithEmailAndPassword(
                email,
                password
            );

        // Find user role
        const usersSnapshot = await db.collection("users").get();

        let role = "";
        let registerId = "";

        usersSnapshot.forEach(doc => {

            const data = doc.data();

            if (
                data.Email &&
                data.Email.toLowerCase() ===
                email.toLowerCase()
            ) {
                role = (data.role || "").toString().toLowerCase();
                registerId = doc.id;
            }
        });

        if (!role) {
            throw new Error("Role not found");
        }

        localStorage.setItem("userRole", role);
        localStorage.setItem("registerId", registerId);
        localStorage.setItem("email", email);

        // Redirect based on role
        if (role === "admin") {

            window.location.href = "admin.html";

        } else if (role === "candidate") {

            window.location.href = "candidate.html";

        } else {

            throw new Error("Invalid role");
        }

    } catch (error) {

        console.error(error);

        errorMsg.textContent = error.message;
    }
}