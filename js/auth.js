import { auth, provider } from "./firebase-config.js";
import { signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userName = document.getElementById("user-name");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");

// Xác thực bằng Google
loginBtn.addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("User signed in:", result.user);
    } catch (error) {
        console.error("Sign in error:", error);
    }
});

// Đăng xuất
logoutBtn.addEventListener("click", async () => {
    try {
        await signOut(auth);
        console.log("User signed out");
    } catch (error) {
        console.error("Sign out error:", error);
    }
});

// Kiểm tra trạng thái đăng nhập
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginBtn.style.display = "none";
        logoutBtn.style.display = "block";
        userName.textContent = `Chào, ${user.displayName}`;
        chatBox.style.display = "block";
        messageInput.style.display = "block";
        sendBtn.style.display = "block";
    } else {
        loginBtn.style.display = "block";
        logoutBtn.style.display = "none";
        userName.textContent = "";
        chatBox.style.display = "none";
        messageInput.style.display = "none";
        sendBtn.style.display = "none";
    }
});
