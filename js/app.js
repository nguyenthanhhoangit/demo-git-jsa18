import { auth, provider, db } from "./firebase-config.js";
import { 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    onSnapshot, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/**
 * UI Manager - Quản lý ui elements
 */
class UIManager {
    constructor() {
        // Auth Elements
        this.authSection = document.getElementById("auth-section");
        this.chatSection = document.getElementById("chat-section");
        this.loginBtn = document.getElementById("login-btn");
        this.logoutBtn = document.getElementById("logout-btn");

        // User Elements
        this.userAvatar = document.getElementById("user-avatar");
        this.userName = document.getElementById("user-name");
        this.userStatus = document.getElementById("user-status");

        // Chat Elements
        this.chatBox = document.getElementById("chat-box");
        this.messageInput = document.getElementById("message");
        this.sendBtn = document.getElementById("sendBtn");
        this.charCount = document.getElementById("char-count");
        this.emptyState = document.getElementById("empty-state");

        // Containers
        this.toastContainer = document.getElementById("toast-container");
    }

    /**
     * Thay đổi view giữa auth và chat
     */
    switchView(isLoggedIn) {
        if (isLoggedIn) {
            this.authSection.style.display = "none";
            this.chatSection.style.display = "flex";
        } else {
            this.authSection.style.display = "flex";
            this.chatSection.style.display = "none";
            this.chatBox.innerHTML = "";
        }
    }

    /**
     * Cập nhật thông tin user
     */
    updateUserInfo(user) {
        this.userName.textContent = user.displayName || "User";
        this.userAvatar.src = user.photoURL || "https://via.placeholder.com/40?text=U";
        this.userAvatar.alt = user.displayName;
    }

    /**
     * Thêm tin nhắn vào chat box
     */
    addMessage(message, isCurrentUser, sender) {
        // Remove empty state
        if (this.emptyState) {
            this.emptyState.remove();
            this.emptyState = null;
        }

        const messageEl = document.createElement("div");
        messageEl.className = `message ${isCurrentUser ? "sent" : "received"}`;

        const timestamp = message.timestamp 
            ? new Date(message.timestamp.seconds * 1000).toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit"
            })
            : "";

        messageEl.innerHTML = `
            <img src="${message.avatar}" class="avatar" alt="${sender}" onerror="this.src='https://via.placeholder.com/40?text=U'">
            <div class="message-content">
                <div class="message-sender">${sender}</div>
                <div class="text">${this.escapeHtml(message.text)}</div>
                <small class="timestamp">${timestamp}</small>
            </div>
        `;

        this.chatBox.appendChild(messageEl);
        this.scrollToBottom();
    }

    /**
     * Scroll chat box xuống cuối
     */
    scrollToBottom() {
        this.chatBox.scrollTop = this.chatBox.scrollHeight;
    }

    /**
     * Escape HTML để tránh XSS
     */
    escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Clear chat input
     */
    clearInput() {
        this.messageInput.value = "";
        this.updateCharCount();
    }

    /**
     * Update character count
     */
    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = `${count}/500`;
    }

    /**
     * Disable send button
     */
    disableSendBtn(disable = true) {
        this.sendBtn.disabled = disable;
        if (disable) {
            this.sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            this.sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }

    /**
     * Hiển thị toast notification
     */
    showToast(message, type = "error", duration = 3000) {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === "error" ? "exclamation-circle" : "check-circle"}"></i>
                <span>${message}</span>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("disappear");
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

/**
 * Auth Manager - Quản lý authentication
 */
class AuthManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.currentUser = null;

        this.setupListeners();
        this.setupAuthStateObserver();
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        this.ui.loginBtn.addEventListener("click", () => this.login());
        this.ui.logoutBtn.addEventListener("click", () => this.logout());
    }

    /**
     * Google Login
     */
    async login() {
        try {
            this.ui.loginBtn.disabled = true;
            this.ui.loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập...';

            const result = await signInWithPopup(auth, provider);
            this.currentUser = result.user;
            console.log("✓ Đăng nhập thành công:", result.user.displayName);
        } catch (error) {
            console.error("✗ Lỗi đăng nhập:", error.message);
            this.ui.showToast("Đăng nhập thất bại. Vui lòng thử lại!", "error");
            this.ui.loginBtn.disabled = false;
            this.ui.loginBtn.innerHTML = '<i class="fab fa-google"></i> <span>Đăng nhập bằng Google</span>';
        }
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            console.log("✓ Đã đăng xuất");
        } catch (error) {
            console.error("✗ Lỗi đăng xuất:", error.message);
            this.ui.showToast("Đăng xuất thất bại! Vui lòng thử lại.", "error");
        }
    }

    /**
     * Monitor auth state
     */
    setupAuthStateObserver() {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                this.currentUser = user;
                this.ui.updateUserInfo(user);
                this.ui.switchView(true);
                this.ui.loginBtn.disabled = false;
                this.ui.loginBtn.innerHTML = '<i class="fab fa-google"></i> <span>Đăng nhập bằng Google</span>';
            } else {
                this.currentUser = null;
                this.ui.switchView(false);
            }
        });
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

/**
 * Chat Manager - Quản lý chính chức năng chat
 */
class ChatManager {
    constructor(uiManager) {
        this.ui = uiManager;
        this.MAX_MESSAGE_LENGTH = 500;
        this.messageCache = new Set();

        this.setupListeners();
        this.startListeningMessages();
    }

    /**
     * Setup event listeners
     */
    setupListeners() {
        this.ui.sendBtn.addEventListener("click", () => this.sendMessage());
        
        this.ui.messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.ui.messageInput.addEventListener("input", () => {
            this.ui.updateCharCount();
        });
    }

    /**
     * Validate message
     */
    validateMessage(text) {
        if (!text || text.trim().length === 0) {
            this.ui.showToast("Tin nhắn không được để trống!", "error");
            return false;
        }

        if (text.length > this.MAX_MESSAGE_LENGTH) {
            this.ui.showToast(`Tin nhắn quá dài! Tối đa ${this.MAX_MESSAGE_LENGTH} ký tự.`, "error");
            return false;
        }

        return true;
    }

    /**
     * Send message to Firestore
     */
    async sendMessage() {
        const user = auth.currentUser;
        if (!user) {
            this.ui.showToast("Bạn cần đăng nhập!", "error");
            return;
        }

        const messageText = this.ui.messageInput.value.trim();
        if (!this.validateMessage(messageText)) {
            return;
        }

        try {
            this.ui.disableSendBtn(true);

            await addDoc(collection(db, "messages"), {
                text: messageText,
                sender: user.displayName,
                senderId: user.uid,
                avatar: user.photoURL || "https://via.placeholder.com/40?text=U",
                timestamp: serverTimestamp(),
                createdAt: new Date().toISOString()
            });

            this.ui.clearInput();
            console.log("✓ Tin nhắn đã gửi");
        } catch (error) {
            console.error("✗ Lỗi gửi tin nhắn:", error);
            this.ui.showToast("Lỗi gửi tin nhắn. Vui lòng thử lại!", "error");
        } finally {
            this.ui.disableSendBtn(false);
        }
    }

    /**
     * Listen to messages from Firestore
     */
    startListeningMessages() {
        const q = query(collection(db, "messages"), orderBy("timestamp"));
        
        onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const messageId = change.doc.id;

                    // Tránh duplicate messages
                    if (this.messageCache.has(messageId)) {
                        return;
                    }

                    this.messageCache.add(messageId);

                    const msg = change.doc.data();
                    const user = auth.currentUser;
                    const isCurrentUser = user && msg.senderId === user.uid;

                    this.ui.addMessage(msg, isCurrentUser, msg.sender);
                }
            });
        }, (error) => {
            console.error("✗ Lỗi lắng nghe tin nhắn:", error);
            this.ui.showToast("Lỗi kết nối. Vui lòng refresh trang!", "error");
        });
    }
}

/**
 * Initialize App
 */
class App {
    constructor() {
        this.ui = new UIManager();
        this.auth = new AuthManager(this.ui);
        this.chat = new ChatManager(this.ui);

        this.init();
    }

    /**
     * Initialize app
     */
    init() {
        console.log("🚀 Chat App initialized");
    }
}

// Start app when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        new App();
    });
} else {
    new App();
}
