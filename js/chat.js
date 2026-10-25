import { db, auth } from "./firebase-config.js";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("message");
const chatBox = document.getElementById("chat-box");

// Biến để track tin nhắn cuối cùng đã hiển thị
let lastMessageId = null;

// Gửi tin nhắn
async function sendMessage() {
    const user = auth.currentUser;
    if (!user) {
        showError("Bạn cần đăng nhập để gửi tin nhắn!");
        return;
    }

    const message = messageInput.value.trim();
    if (!message) {
        showError("Tin nhắn không được để trống!");
        return;
    }

    if (message.length > 500) {
        showError("Tin nhắn quá dài! Tối đa 500 ký tự.");
        return;
    }

    try {
        sendBtn.disabled = true;
        sendBtn.textContent = "Đang gửi...";

        await addDoc(collection(db, "messages"), {
            text: message,
            sender: user.displayName,
            senderId: user.uid,
            avatar: user.photoURL || "https://via.placeholder.com/30?text=U",
            timestamp: serverTimestamp()
        });

        messageInput.value = "";
        sendBtn.textContent = "Gửi";
        sendBtn.disabled = false;
    } catch (error) {
        console.error("Lỗi gửi tin nhắn:", error);
        showError("Lỗi gửi tin nhắn. Vui lòng thử lại!");
        sendBtn.textContent = "Gửi";
        sendBtn.disabled = false;
    }
}

sendBtn.addEventListener("click", sendMessage);

// Thêm event listener cho Enter key
messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Hàm hiển thị lỗi
function showError(message) {
    // Tạo element thông báo lỗi tạm thời
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Nhận tin nhắn realtime từ Firestore
const q = query(collection(db, "messages"), orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
            const msg = change.doc.data();
            const user = auth.currentUser;
            const isCurrentUser = user && msg.senderId === user.uid;

            const messageElement = document.createElement("div");
            messageElement.classList.add("message", isCurrentUser ? "sent" : "received");

            const timestamp = msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit'
            }) : '';

            messageElement.innerHTML = `
                <img src="${msg.avatar}" class="avatar" alt="${msg.sender}">
                <div class="message-content">
                    <div class="text">${msg.text}</div>
                    <small class="timestamp">${timestamp}</small>
                </div>
            `;

            chatBox.appendChild(messageElement);
        }
    });

    // Scroll xuống cuối
    chatBox.scrollTop = chatBox.scrollHeight;
});
