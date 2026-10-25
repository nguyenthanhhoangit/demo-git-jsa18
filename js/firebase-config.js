import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCpauXb1wgTrB64DnuHxAIFsWSI3GiMtcI",
    authDomain: "myproject-d0fe8.firebaseapp.com",
    projectId: "myproject-d0fe8",
    storageBucket: "myproject-d0fe8.appspot.com", // Sửa lại nếu sai
    messagingSenderId: "207058849955",
    appId: "1:207058849955:web:7af6e084c4252808632f16",
    measurementId: "G-T53XYT2R0L",
    databaseURL: "https://myproject-d0fe8-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };
