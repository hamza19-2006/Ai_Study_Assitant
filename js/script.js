// ===================================================
// AI STUDY ASSISTANT - Main Application Script
// ===================================================

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBnE7ZDKMlBi4WmbRS4U1HyQ9A8YEsmbKQ",
  authDomain: "data-base-of-study-assitant.firebaseapp.com",
  projectId: "data-base-of-study-assitant",
  storageBucket: "data-base-of-study-assitant.appspot.com",
  messagingSenderId: "614569134909",
  appId: "1:614569134909:web:553a92a01a37724edd9354",
  measurementId: "G-WVJSQWC6BG"
};

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  sendPasswordResetEmail, 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Enable Offline Persistence ---
enableIndexedDbPersistence(db)
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          console.warn("Firestore persistence failed, likely due to multiple tabs open.");
      } else if (err.code == 'unimplemented') {
          console.warn("Firestore persistence is not available in this browser.");
      }
  });

// --- Global State ---
let currentUserId = null;
let currentSessionId = null;
let currentSessionMode = 'normal';
let loadingSessionId = null; 
let unsubscribeMessages = null; 
let unsubscribeSessions = null;
let sessionToDelete = null;
let messageToDeleteId = null;
let selectedFilesForUpload = []; 
let fetchController;
let toastTimer;
let currentSelectedRating = null;
let currentSessionMessages = [];

// Feedback state from localStorage
let feedback = JSON.parse(localStorage.getItem("feedback") || "{}");


// --- Icon SVGs ---
const iconCopy = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
const iconBin = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`;
const iconMenu = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0m0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/></svg>`;
const iconSpeak = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-1.414 1.414A6.47 6.47 0 0 1 12.025 8a6.47 6.47 0 0 1-1.903 4.596zM10.12 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.903-4.596L8.708 4.83A4.48 4.48 0 0 1 10.025 8a4.48 4.48 0 0 1-1.317 3.17zM7.875 11.18a3 3 0 0 0 0-6.36L6.46 6.23A4.5 4.5 0 0 1 8.025 8a4.5 4.5 0 0 1-1.565 3.394zM6.025 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/></svg>`;
const iconLike = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`;
const iconDislike = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>`;
const iconEdit = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
const iconShare = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>`;

// Eye icons
const iconEyeOpen = `<svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/></svg>`;
const iconEyeClosed = `<svg class="eye-closed" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="display: none;"><path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.94 5.94 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.707z"/><path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/><path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.88 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.707z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>`;


// --- Element Selectors ---
const mainContainer = document.querySelector('.main-container');
const authModal = document.getElementById('auth-modal');
const showLoginBtn = document.getElementById('showLoginBtn');
const showSignupBtn = document.getElementById('showSignupBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userGreeting = document.getElementById('userGreeting'); 
const mainGreeting = document.getElementById('mainGreeting');
const mainSubtitle = document.getElementById('mainSubtitle');
const formContainer = document.getElementById('formContainer');
const showSignupLink = document.getElementById('showSignup');
const showLoginLink = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginError = document.getElementById('loginError');
const signupError = document.getElementById('signupError');
const userInput = document.getElementById("userInput");
const chatBox = document.getElementById("chatBox");
const chatBoxInner = document.querySelector(".chat-box-inner");
const emptyChatState = document.querySelector(".empty-chat-state");
const fileUpload = document.getElementById("fileUpload");
const voiceBtn = document.getElementById('voiceBtn');
const sendBtn = document.getElementById('sendBtn');
const stopGeneratingBtn = document.getElementById('stopGeneratingBtn');
const sessionPanel = document.getElementById('session-panel');
const sessionList = document.getElementById('session-list');
const newChatBtn = document.getElementById('newChatBtn');
const historyBtn = document.getElementById('historyBtn');
const openHistoryBtn = document.querySelector('#openHistoryBtn');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const deleteConfirmModal = document.getElementById('delete-confirm-modal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const deleteMessageModal = document.getElementById('delete-message-modal');
const confirmDeleteMessageBtn = document.getElementById('confirmDeleteMessageBtn');
const cancelDeleteMessageBtn = document.getElementById('cancelDeleteMessageBtn');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.querySelector('.theme-label');
const mobileBackdrop = document.getElementById('mobile-backdrop'); 
const sessionSearch = document.getElementById('sessionSearch');
const typingIndicator = document.getElementById('typingIndicator');
const modeSelector = document.getElementById('modeSelector'); 
const passwordToggleIcons = document.querySelectorAll('.password-toggle-icon'); 

const forgotPasswordLink = document.getElementById('forgotPasswordLink');

const profileModal = document.getElementById('profile-modal');
const closeProfileModalBtn = document.getElementById('closeProfileModal');
const profileEmail = document.getElementById('profileEmail');
const profileUsernameDisplay = document.getElementById('profileUsernameDisplay');
const profileUsernameInput = document.getElementById('profileUsernameInput');
const editUsernameBtn = document.getElementById('editUsernameBtn');
const saveUsernameBtn = document.getElementById('saveUsernameBtn');
const cancelEditUsernameBtn = document.getElementById('cancelEditUsernameBtn');
const usernameError = document.getElementById('usernameError');
const usernameSuccess = document.getElementById('usernameSuccess');
const changePasswordForm = document.getElementById('changePasswordForm');
const changePassError = document.getElementById('changePassError');
const changePassSuccess = document.getElementById('changePassSuccess');

// --- Feedback Modal Selectors ---
const headerFeedbackBtn = document.getElementById('headerFeedbackBtn');
const profileFeedbackBtn = document.getElementById('profileFeedbackBtn');
const feedbackModal = document.getElementById('feedback-modal');
const closeFeedbackModalBtn = document.getElementById('closeFeedbackModal');
const feedbackForm = document.getElementById('feedbackForm');
const feedbackName = document.getElementById('feedbackName');
const feedbackEmail = document.getElementById('feedbackEmail');
const feedbackText = document.getElementById('feedbackText');
const feedbackRatingGroup = document.getElementById('feedbackRatingGroup');
const feedbackError = document.getElementById('feedbackError');
const feedbackSuccess = document.getElementById('feedbackSuccess');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');

// --- Contact Manager Selectors ---
const contactManagerModal = document.getElementById('contact-manager-modal');
const contactManagerBtn = document.getElementById('contactManagerBtn');
const closeContactManagerModalBtn = document.getElementById('closeContactManagerModal');

// --- Share Modal Selectors ---
const shareChatModal = document.getElementById('share-chat-modal');
const closeShareModalBtn = document.getElementById('closeShareModal');
const shareModalTitle = document.getElementById('shareModalTitle');
const shareLinkInput = document.getElementById('shareLinkInput');
const copyShareLinkBtn = document.getElementById('copyShareLinkBtn');
const unshareBtn = document.getElementById('unshareBtn');


// --- Animation ---
function startIntroAnimation() {
  const greeting = document.getElementById('mainGreeting');
  const sub1 = document.querySelector('.subtitle-line-1');
  const sub2 = document.querySelector('.subtitle-line-2');
  const chatInput = document.querySelector('.chat-input');
  
  greeting.classList.remove('visible');
  sub1.classList.remove('visible');
  sub2.classList.remove('visible');
  chatInput.classList.remove('visible');
  sessionPanel.classList.remove('visible-anim');

  setTimeout(() => greeting.classList.add('visible'), 100);
  setTimeout(() => sub1.classList.add('visible'), 700);
  setTimeout(() => sub2.classList.add('visible'), 1300);
  setTimeout(() => {
      chatInput.classList.add('visible');
      sessionPanel.classList.add('visible-anim');
  }, 1900);
}


// --- UI Update Functions ---
async function updateUiForAuthState(user, username = null) {
  const isMobile = window.innerWidth <= 768;

  if (user) {
    currentUserId = user.uid;
    let displayName = username;
    if (!displayName) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', user.uid));
          if (userDocSnap.exists()) {
              displayName = userDocSnap.data().username;
          } else if (user.displayName) {
              displayName = user.displayName;
          } else if (user.email) {
              displayName = user.email.split('@')[0];
          }
        } catch (error) {
          console.error("Could not fetch user profile.", error);
          displayName = user.email ? user.email.split('@')[0] : "there";
        }
    }

    userGreeting.textContent = ` ${displayName}`;
    mainGreeting.textContent = `Hi, ${displayName}`;
    document.querySelector('.subtitle-line-1').textContent = `I'm Your AI Study Assistant`;
    document.querySelector('.subtitle-line-2').textContent = `How can I help you today?`;
    
    userGreeting.style.display = 'inline';
    
    userGreeting.onclick = () => {
        openProfileModal(user, displayName);
    };
    
    showLoginBtn.style.display = 'none';
    showSignupBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
    headerFeedbackBtn.style.display = 'block';
    authModal.classList.remove('visible');
    userInput.placeholder = "Type your question here...";
    userInput.classList.remove('logged-out-placeholder');
    sendBtn.disabled = false;
    
    if (!isMobile) {
        mainContainer.classList.add('sidebar-collapsed');
    } else {
        mainContainer.classList.remove('sidebar-collapsed');
        sessionPanel.classList.remove('visible');
        mobileBackdrop.classList.remove('visible');
    }
    
    loadSessions(currentUserId);
    startNewChat(); 

  } else {
    currentUserId = null;
    userGreeting.style.display = 'none';
    userGreeting.onclick = null; 
    mainGreeting.textContent = `Hi, Dear`; 
    document.querySelector('.subtitle-line-1').textContent = `I'm Your AI Study Assistant`;
    document.querySelector('.subtitle-line-2').textContent = `How can I help you today?`;
    
    showLoginBtn.style.display = 'block';
    showSignupBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
    headerFeedbackBtn.style.display = 'none';
    
    chatBoxInner.innerHTML = ''; 
    chatBoxInner.appendChild(typingIndicator); 
    chatBoxInner.appendChild(emptyChatState);
    emptyChatState.style.display = 'flex';
    
    userInput.placeholder = "Please log in to chat...";
    userInput.classList.add('logged-out-placeholder');
    sendBtn.disabled = true;
    sendBtn.classList.remove('is-loading');
    sendBtn.innerHTML = 'Send';
    
    if (!isMobile) {
        mainContainer.classList.add('sidebar-collapsed');
    }
    
    if (unsubscribeMessages) unsubscribeMessages();
    if (unsubscribeSessions) unsubscribeSessions();
    sessionList.innerHTML = '';

    currentSessionMode = 'normal';
    modeSelector.value = 'normal';
    localStorage.setItem('lastActiveMode', 'normal');
    
    loginError.textContent = '';
    signupError.textContent = '';
    forgotPasswordLink.style.display = 'none';
    loginForm.reset();
    signupForm.reset();
    
    formContainer.classList.remove('flipped');
  }
  adjustChatContainerPadding();
  startIntroAnimation();
}

// --- Firebase Auth State Listener ---
onAuthStateChanged(auth, (user) => {
  updateUiForAuthState(user);
});

// --- Authentication Modal Logic ---
showLoginBtn.addEventListener('click', () => {
  formContainer.classList.remove('flipped'); 
  authModal.classList.add('visible');
});
showSignupBtn.addEventListener('click', () => {
  formContainer.classList.add('flipped');
  authModal.classList.add('visible');
});
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("User successfully signed out.");
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
});
authModal.addEventListener('click', (e) => { 
    if (e.target.id === 'auth-modal') {
        authModal.classList.remove('visible');
    } 
});
showSignupLink.addEventListener('click', (e) => { e.preventDefault(); formContainer.classList.add('flipped'); });
showLoginLink.addEventListener('click', (e) => { e.preventDefault(); formContainer.classList.remove('flipped'); });

// --- Auth Form Submissions (Email/Password) ---
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Signing Up...'; btn.disabled = true;
  signupError.textContent = '';
  const { username, email, password } = e.target.elements;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.value, password.value);
    await setDoc(doc(db, "users", cred.user.uid), { 
        username: username.value,
        email: email.value,
        joinedAt: serverTimestamp()
    });
    updateUiForAuthState(cred.user, username.value);
  } catch (error) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        signupError.textContent = "This email is already in use. Please log in.";
        break;
      case 'auth/weak-password':
        signupError.textContent = "Password should be at least 6 characters long.";
        break;
      case 'auth/invalid-email':
        signupError.textContent = "Please enter a valid email address.";
        break;
      default:
        signupError.textContent = error.message.replace("Firebase: ", "");
    }
  } finally {
    btn.textContent = 'Sign Up with Email'; btn.disabled = false;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = 'Logging In...'; btn.disabled = true;
  loginError.textContent = '';
  forgotPasswordLink.style.display = 'none'; 
  const { email, password } = e.target.elements;
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
  } catch (error) {
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
      loginError.textContent = 'Invalid email or password. Please try again.';
      forgotPasswordLink.style.display = 'block';
    } else {
      loginError.textContent = error.message.replace("Firebase: ", "");
      forgotPasswordLink.style.display = 'none';
    }
  } finally {
    btn.textContent = 'Login with Email'; btn.disabled = false;
  }
});

// --- "Forgot Password?" Link Logic ---
forgotPasswordLink.addEventListener('click', (e) => {
  e.preventDefault();
  const email = loginForm.elements.email.value;
  if (!email) {
    loginError.textContent = "Please enter your email to reset password.";
    return;
  }
  
  const btn = loginForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  loginError.textContent = "Sending reset email...";
  
  sendPasswordResetEmail(auth, email)
    .then(() => {
      loginError.textContent = "Password reset email sent! Check your inbox.";
    })
    .catch((error) => {
      loginError.textContent = `Error: ${error.message.replace("Firebase: ", "")}`;
    })
    .finally(() => {
      btn.disabled = false;
    });
});


// --- Password Toggle Logic ---
passwordToggleIcons.forEach(icon => {
    icon.addEventListener('click', () => {
        const input = icon.previousElementSibling;
        const eyeOpen = icon.querySelector('.eye-open');
        const eyeClosed = icon.querySelector('.eye-closed');
        
        if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            input.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    });
});

// --- Profile Modal Logic ---

function openProfileModal(user, username) {
  if (!user) return;
  
  profileEmail.value = user.email || 'No email associated';
  profileUsernameDisplay.textContent = username;
  profileUsernameInput.value = username;
  
  profileUsernameDisplay.style.display = 'block';
  profileUsernameInput.style.display = 'none';
  editUsernameBtn.style.display = 'inline-block';
  saveUsernameBtn.style.display = 'none';
  cancelEditUsernameBtn.style.display = 'none';
  usernameError.textContent = '';
  usernameSuccess.textContent = '';
  
  changePasswordForm.reset();
  changePassError.textContent = '';
  changePassSuccess.textContent = '';
  
  profileModal.querySelectorAll('.password-toggle-icon').forEach(icon => {
      icon.previousElementSibling.type = 'password';
      icon.querySelector('.eye-open').style.display = 'block';
      icon.querySelector('.eye-closed').style.display = 'none';
  });
  
  profileModal.classList.add('visible');
}

closeProfileModalBtn.addEventListener('click', () => {
  profileModal.classList.remove('visible');
});
profileModal.addEventListener('click', (e) => {
  if (e.target.id === 'profile-modal') {
    profileModal.classList.remove('visible');
  }
});

editUsernameBtn.addEventListener('click', () => {
  profileUsernameDisplay.style.display = 'none';
  profileUsernameInput.style.display = 'block';
  editUsernameBtn.style.display = 'none';
  saveUsernameBtn.style.display = 'inline-block';
  cancelEditUsernameBtn.style.display = 'inline-block';
  profileUsernameInput.focus();
});

cancelEditUsernameBtn.addEventListener('click', () => {
  profileUsernameDisplay.style.display = 'block';
  profileUsernameInput.style.display = 'none';
  editUsernameBtn.style.display = 'inline-block';
  saveUsernameBtn.style.display = 'none';
  cancelEditUsernameBtn.style.display = 'none';
  usernameError.textContent = '';
  usernameSuccess.textContent = '';
  profileUsernameInput.value = profileUsernameDisplay.textContent;
});

saveUsernameBtn.addEventListener('click', async () => {
  const newUsername = profileUsernameInput.value.trim();
  usernameError.textContent = '';
  usernameSuccess.textContent = '';

  if (!newUsername || newUsername === profileUsernameDisplay.textContent) {
    cancelEditUsernameBtn.click();
    return;
  }
  
  saveUsernameBtn.disabled = true;
  saveUsernameBtn.textContent = 'Saving...';
  
  try {
    const userDocRef = doc(db, 'users', currentUserId);
    await updateDoc(userDocRef, { username: newUsername });
    
    profileUsernameDisplay.textContent = newUsername;
    userGreeting.textContent = `Hi, ${newUsername}`; 
    usernameSuccess.textContent = "Username updated successfully!";
    
    setTimeout(() => {
        cancelEditUsernameBtn.click();
        usernameSuccess.textContent = '';
    }, 2000);
    
  } catch (error) {
    console.error("Error updating username:", error);
    console.error("Firestore Error Code:", error.code, error.message);
    usernameError.textContent = "Failed to update. Check console/rules.";
  } finally {
    saveUsernameBtn.disabled = false;
    saveUsernameBtn.textContent = 'Save';
  }
});

// Change Password Form
changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  changePassError.textContent = '';
  changePassSuccess.textContent = '';
  
  const { currentPassword, newPassword, confirmPassword } = e.target.elements;
  
  if (newPassword.value !== confirmPassword.value) {
    changePassError.textContent = "New passwords do not match.";
    return;
  }
  
  if (newPassword.value.length < 6) {
    changePassError.textContent = "Password must be at least 6 characters long.";
    return;
  }
  
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Updating...';
  
  try {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, currentPassword.value);
    
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword.value);
    
    changePassSuccess.textContent = "Password updated successfully!";
    changePasswordForm.reset();
    
  } catch (error) {
    console.error("Password update error:", error);
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-password') {
      changePassError.textContent = "Incorrect current password. Please try again.";
    } else if (error.code === 'auth/too-many-requests') {
      changePassError.textContent = "Too many failed attempts. Please try again later.";
    } else if (error.code === 'auth/weak-password') {
      changePassError.textContent = "New password must be at least 6 characters long.";
    } else if (error.code === 'auth/requires-recent-login') {
      changePassError.textContent = "Please log out and log in again before changing your password.";
    } else {
      const cleanMsg = (error.message || '').replace(/^Firebase:\s*/i, "").replace(/\s*\(auth\/[^)]+\)\.?/i, "").trim();
      changePassError.textContent = cleanMsg || "Failed to update password. Please verify your current password.";
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Update Password';
  }
});


// --- Feedback Modal Logic ---

async function openFeedbackModal() {
  const user = auth.currentUser;
  if (!user) {
    showToast("Please log in to give feedback.");
    return;
  }
  
  feedbackForm.reset();
  feedbackError.textContent = '';
  feedbackSuccess.textContent = '';
  submitFeedbackBtn.disabled = false;
  submitFeedbackBtn.textContent = 'Submit Feedback';
  currentSelectedRating = null;
  
  document.querySelectorAll('.rating-option').forEach(opt => {
      opt.classList.remove('selected');
      opt.querySelector('.rating-box').textContent = '';
  });
  
  feedbackEmail.value = user.email || '';
  try {
      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      if (userDocSnap.exists()) {
          feedbackName.value = userDocSnap.data().username || '';
      } else {
          feedbackName.value = user.displayName || '';
      }
  } catch (err) {
      console.error("Error fetching username for feedback:", err);
      feedbackName.value = user.displayName || '';
  }
  
  feedbackModal.classList.add('visible');
}

function closeFeedbackModal() {
  feedbackModal.classList.remove('visible');
}

async function handleFeedbackSubmit(e) {
  e.preventDefault();
  feedbackError.textContent = '';
  feedbackSuccess.textContent = '';
  
  const name = feedbackName.value.trim();
  const email = feedbackEmail.value.trim();
  const feedbackVal = feedbackText.value.trim();
  
  if (!name || !email || !feedbackVal) {
    feedbackError.textContent = 'Please fill out all fields.';
    return;
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    feedbackError.textContent = 'Please enter a valid email address.';
    return;
  }
  
  if (!currentSelectedRating) {
    feedbackError.textContent = 'Please select a rating.';
    return;
  }
  
  submitFeedbackBtn.disabled = true;
  submitFeedbackBtn.textContent = 'Sending...';

  const payload = {
    name: name,
    email: email,
    feedback: feedbackVal,
    rating: currentSelectedRating
  };

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Server error: ${response.statusText}`);
    }
    
    feedbackSuccess.textContent = '✅ Thank you! Your feedback has been sent.';
    showToast('✅ Feedback sent successfully!');
    
    setTimeout(() => {
      closeFeedbackModal();
    }, 2000);
    
  } catch (error) {
    console.error('Feedback submission error:', error);
    feedbackError.textContent = 'Failed to send feedback. Please try again.';
    submitFeedbackBtn.disabled = false;
    submitFeedbackBtn.textContent = 'Submit Feedback';
  }
}

// Event Listeners for Feedback Modal
headerFeedbackBtn.addEventListener('click', openFeedbackModal);
profileFeedbackBtn.addEventListener('click', openFeedbackModal);
closeFeedbackModalBtn.addEventListener('click', closeFeedbackModal);
feedbackModal.addEventListener('click', (e) => {
  if (e.target.id === 'feedback-modal') {
    closeFeedbackModal();
  }
});
feedbackForm.addEventListener('submit', handleFeedbackSubmit);

// Ctrl+Enter to submit feedback
feedbackText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleFeedbackSubmit(new Event('submit', { cancelable: true }));
    }
});

// Rating selection logic
feedbackRatingGroup.addEventListener('click', (e) => {
    const clickedOption = e.target.closest('.rating-option');
    if (!clickedOption) return;
    
    document.querySelectorAll('.rating-option').forEach(opt => {
        opt.classList.remove('selected');
        opt.querySelector('.rating-box').textContent = '';
    });
    
    clickedOption.classList.add('selected');
    clickedOption.querySelector('.rating-box').textContent = '✅';
    currentSelectedRating = clickedOption.dataset.value;
    feedbackError.textContent = '';
});


// --- Helpers ---
function adjustChatContainerPadding() {
  const header = document.querySelector('.site-header');
  const chatContainer = document.querySelector('.chat-container');
  if (window.innerWidth <= 768 && header && chatContainer) {
      setTimeout(() => {
          const headerHeight = header.offsetHeight;
          chatContainer.style.paddingTop = `${headerHeight + 5}px`;
      }, 100);
  } else if (chatContainer) {
      chatContainer.style.paddingTop = ''; 
  }
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== 'function') return '';
  const d = timestamp.toDate();
  const day = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const date = d.getDate();
  const month = d.toLocaleDateString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  return `${day} ${date} ${month}, ${year}`;
}

function showToast(message) {
  const toast = document.getElementById('toast-notification');
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add('show');
  
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function updateFeedbackUI(likeBtn, dislikeBtn, state) {
  likeBtn.classList.toggle("active", state === "like");
  dislikeBtn.classList.toggle("active", state === "dislike");
}

// --- Session and Chat Logic ---

function filterSessions(searchTerm) {
  const term = searchTerm.toLowerCase();
  const listItems = sessionList.querySelectorAll('li');
  listItems.forEach(li => {
      const title = li.querySelector('.session-title').textContent.toLowerCase();
      if (title.includes(term)) {
          li.style.display = 'flex';
      } else {
          li.style.display = 'none';
      }
  });
}

sessionSearch.addEventListener('input', (e) => {
    filterSessions(e.target.value);
});

function loadSessions(uid) {
  if (unsubscribeSessions) unsubscribeSessions();
  const sessionsRef = collection(db, 'chats', uid, 'sessions');
  const q = query(sessionsRef, orderBy('timestamp', 'desc'));

  unsubscribeSessions = onSnapshot(q, (snapshot) => {
    sessionList.innerHTML = '';
    snapshot.forEach((docSnap) => {
      const session = docSnap.data();
      const li = document.createElement('li');
      li.title = session.title;
      
      const infoDiv = document.createElement('div');
      infoDiv.className = 'session-info';

      const titleSpan = document.createElement('span');
      titleSpan.className = 'session-title';
      titleSpan.textContent = session.title;

      const dateSpan = document.createElement('span');
      dateSpan.className = 'session-date';
      dateSpan.textContent = formatDate(session.timestamp);

      infoDiv.append(titleSpan, dateSpan);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'session-actions';
      
      const menuBtn = document.createElement('button');
      menuBtn.className = 'actions-menu-btn';
      menuBtn.innerHTML = '&#x22EE;'; 
      
      const popover = document.createElement('div');
      popover.className = 'actions-popover';
      
      const renameBtn = document.createElement('button');
      renameBtn.innerHTML = iconEdit + 'Rename';
      renameBtn.title = 'Rename Chat';
      renameBtn.onclick = (e) => {
          e.stopPropagation();
          startRename(li, docSnap.id);
      };

      const shareBtn = document.createElement('button');
      shareBtn.innerHTML = iconShare + 'Share';
      shareBtn.title = 'Share Chat';
      shareBtn.onclick = (e) => {
          e.stopPropagation();
          openShareModal(docSnap.id, session.title);
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = iconBin + 'Delete';
      deleteBtn.title = 'Delete Chat';
      deleteBtn.className = 'delete-action';
      deleteBtn.onclick = (e) => {
          e.stopPropagation();
          sessionToDelete = docSnap.id;
          deleteConfirmModal.classList.add('visible');
      };

      popover.append(renameBtn, shareBtn, deleteBtn);
      actionsDiv.appendChild(menuBtn);
      actionsDiv.appendChild(popover);
      li.append(infoDiv, actionsDiv);

      menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('.actions-popover.visible').forEach(p => {
              if (p !== popover) p.classList.remove('visible');
          });
          
          const rect = menuBtn.getBoundingClientRect();
          if (window.innerHeight - rect.bottom < 120) {
              popover.classList.add('up');
          } else {
              popover.classList.remove('up');
          }
          
          popover.classList.toggle('visible');
      });

      li.dataset.sessionId = docSnap.id;
      if (docSnap.id === currentSessionId) {
        li.classList.add('active');
      }

      li.addEventListener('click', () => {
        if (li.querySelector('.rename-input')) return;
        currentSessionId = docSnap.id;
        loadMessages(uid, docSnap.id);
        updateActiveSessionUI();
        if (window.innerWidth <= 768) {
           sessionPanel.classList.remove('visible');
           mobileBackdrop.classList.remove('visible');
        }
      });
      sessionList.appendChild(li);
    });
    filterSessions(sessionSearch.value);
  });
}

function updateTypingIndicatorVisibility() {
    if (loadingSessionId && loadingSessionId === currentSessionId) {
        typingIndicator.style.display = 'flex';
        chatBox.scrollTop = chatBox.scrollHeight;
    } else {
        typingIndicator.style.display = 'none';
    }
}

async function loadMessages(uid, sessionId) {
  try {
    const sessionDocRef = doc(db, 'chats', currentUserId, 'sessions', sessionId);
    const sessionSnap = await getDoc(sessionDocRef);
    if (sessionSnap.exists() && sessionSnap.data().mode) {
      currentSessionMode = sessionSnap.data().mode;
    } else {
      currentSessionMode = 'normal';
    }
    modeSelector.value = currentSessionMode;
    localStorage.setItem('lastActiveMode', currentSessionMode);
  } catch (error) {
    console.error("Error loading session mode:", error);
    currentSessionMode = 'normal';
    modeSelector.value = 'normal';
  }

  if (unsubscribeMessages) unsubscribeMessages();
  const messagesRef = collection(db, 'chats', uid, 'sessions', sessionId, 'messages');
  const q = query(messagesRef, orderBy('timestamp'));

  unsubscribeMessages = onSnapshot(q, (snapshot) => {
      currentSessionMessages = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      const fragment = document.createDocumentFragment();
      snapshot.docs.forEach((docSnap, index) => {
          const msg = docSnap.data();
          const isLastMessage = index === snapshot.docs.length - 1;
          appendMessage(fragment, { id: docSnap.id, ...msg }, isLastMessage);
      });

      const elementsToRemove = [];
      for (let i = chatBoxInner.children.length - 1; i >= 0; i--) {
          const child = chatBoxInner.children[i];
          if (child.id !== 'typingIndicator' && child !== emptyChatState) {
              elementsToRemove.push(child);
          }
      }
      elementsToRemove.forEach(child => child.remove());


      if (snapshot.empty) {
          emptyChatState.style.display = 'flex';
      } else {
          emptyChatState.style.display = 'none';
          chatBoxInner.insertBefore(fragment, typingIndicator);
      }
      
      updateTypingIndicatorVisibility();
      
      setTimeout(() => {
          chatBox.scrollTop = chatBox.scrollHeight;
      }, 0);
  });
}

function generateSessionTitle(message) {
  if (!message) return "New Conversation";
  let title = message.trim().replace(/^['"]|['"]$/g, '');
  title = title.replace(/\s+/g, ' ');
  
  const words = title.split(' ');
  let finalTitle = words.slice(0, 5).join(' ');

  if (words.length > 5 || finalTitle.length >= 40) {
      finalTitle = finalTitle.substring(0, 40);
      if (words.length > 5 || finalTitle.length === 40) {
          finalTitle += '...';
      }
  }
  
  if (finalTitle.length > 0) {
      finalTitle = finalTitle.charAt(0).toUpperCase() + finalTitle.slice(1);
  }

  const genericPhrases = ["Hi", "Hello", "Hey", "I need help", "Can you explain"];
  const isGeneric = genericPhrases.some(phrase => finalTitle.toLowerCase().startsWith(phrase.toLowerCase()));
  
  return isGeneric ? "New Conversation" : finalTitle;
}

function startNewChat() {
    currentSessionId = null;
    currentSessionMessages = [];
    if(unsubscribeMessages) unsubscribeMessages();
    
    const elementsToRemove = [];
    for (let i = chatBoxInner.children.length - 1; i >= 0; i--) {
        const child = chatBoxInner.children[i];
        if (child.id !== 'typingIndicator' && child !== emptyChatState) {
            elementsToRemove.push(child);
        }
    }
    elementsToRemove.forEach(child => child.remove());
    
    emptyChatState.style.display = 'flex';

    currentSessionMode = 'normal';
    modeSelector.value = 'normal';
    localStorage.setItem('lastActiveMode', 'normal'); 

    updateActiveSessionUI();
    updateTypingIndicatorVisibility();
}

function updateActiveSessionUI() {
    const allItems = sessionList.querySelectorAll('li');
    allItems.forEach(item => {
        item.classList.toggle('active', item.dataset.sessionId === currentSessionId);
    });
}

async function updateSessionMode(newMode) {
  currentSessionMode = newMode;
  modeSelector.value = newMode; 
  localStorage.setItem('lastActiveMode', newMode);

  if (currentSessionId && currentUserId) {
    try {
      const sessionDocRef = doc(db, 'chats', currentUserId, 'sessions', currentSessionId);
      await updateDoc(sessionDocRef, { mode: newMode });
    } catch (error) {
      console.error("Error updating session mode:", error);
    }
  }
}

newChatBtn.addEventListener('click', startNewChat);

window.sendMessage = async function() {
  if (!currentUserId) return;
  
  const messageText = userInput.value.trim();
  if (messageText === "" && selectedFilesForUpload.length === 0) return;

  sendBtn.disabled = true;
  sendBtn.classList.add('is-loading');
  sendBtn.innerHTML = `
      <svg class="spinner-icon" viewBox="0 0 50 50">
          <path d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"/>
      </svg>
      Sending...
  `;
  userInput.disabled = true;
  
  userInput.value = "";
  const filesToUpload = [...selectedFilesForUpload];
  removeFilePreview(); 

  
  let activeSessionId = currentSessionId;

  if (!activeSessionId) {
    const sessionsRef = collection(db, 'chats', currentUserId, 'sessions');
    const newSessionDoc = await addDoc(sessionsRef, {
      title: "New Conversation",
      timestamp: serverTimestamp(),
      mode: currentSessionMode 
    });
    activeSessionId = newSessionDoc.id;
    currentSessionId = activeSessionId;
    loadMessages(currentUserId, activeSessionId);
  }
  
  loadingSessionId = activeSessionId;
  updateTypingIndicatorVisibility();
  
  const messageData = {
      sender: 'user',
      timestamp: serverTimestamp()
  };
  
  if (messageText) messageData.text = messageText;

  if (filesToUpload.length > 0) {
      const filePromises = filesToUpload.map(file => {
          return fileToDataUrl(file).then(dataURL => ({ name: file.name, type: file.type, size: file.size, dataURL }));
      });
      messageData.files = await Promise.all(filePromises);
  } 

  const messagesRef = collection(db, 'chats', currentUserId, 'sessions', activeSessionId, 'messages');
  await addDoc(messagesRef, messageData);
  
  const titleSource = messageText || filesToUpload[0]?.name || '';
  const sessionDocRef = doc(db, 'chats', currentUserId, 'sessions', activeSessionId);
  const docSnap = await getDoc(sessionDocRef);
  if (docSnap.exists() && docSnap.data().title === "New Conversation" && titleSource) {
      const newTitle = generateSessionTitle(titleSource);
      if (newTitle !== "New Conversation") {
          await updateDoc(sessionDocRef, { title: newTitle });
      }
  }

  fetchController = new AbortController();
  sendBtn.style.display = 'none';
  stopGeneratingBtn.style.display = 'block';

  // Build conversational memory buffer (last 15 messages)
  const recentHistory = currentSessionMessages
      .slice(-15)
      .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          text: msg.text || ''
      }))
      .filter(m => m.text && m.text.trim());

  try {
     const apiEndpoint = '/api/chat';

     let res = await fetch(apiEndpoint, { 
         method: "POST", 
         headers: {
             "Content-Type": "application/json"
         },
         body: JSON.stringify({
             text: messageText,
             userId: currentUserId,
             mode: currentSessionMode,
             files: messageData.files || [],
             history: recentHistory
         }), 
         signal: fetchController.signal 
     });

     if (!res.ok) {
         const errData = await res.json().catch(() => ({}));
         throw new Error(errData.error || `Server returned error status: ${res.status}`);
     }
     
     const data = await res.json();
     let botMessageData = { sender: 'bot', timestamp: serverTimestamp() };

     if (data && data.answer) {
         botMessageData.text = data.answer;
     } else if (typeof data === 'string') {
         botMessageData.text = data;
     } else {
         botMessageData.text = JSON.stringify(data, null, 2);
     }
     
     await addDoc(messagesRef, botMessageData);

  } catch (err) { 
    if (err.name !== 'AbortError') {
      console.error("AI chat error:", err);
      await addDoc(messagesRef, { 
          text: err.message ? `Error: ${err.message}` : "Error: Could not connect to the AI assistant.", 
          sender: 'bot', 
          timestamp: serverTimestamp() 
      });
    }
  } finally {
    sendBtn.style.display = 'block';
    sendBtn.disabled = false;
    sendBtn.classList.remove('is-loading');
    sendBtn.innerHTML = 'Send';
    stopGeneratingBtn.style.display = 'none';
    userInput.disabled = false;
    fetchController = null;
    
    loadingSessionId = null;
    updateTypingIndicatorVisibility();
  }
}

function appendMessage(fragment, msg, isLastMessage) {
  const wrapper = document.createElement('div');
  wrapper.className = `message-wrapper ${msg.sender}-message-wrapper`;

  const messageElement = document.createElement("div");
  messageElement.className = `message ${msg.sender}-message`;

  // File/Image/Audio/Text Appending Logic
  if (msg.files && Array.isArray(msg.files)) {
      msg.files.forEach(file => {
          if (file.type?.startsWith('image/')) {
              const img = document.createElement('img');
              img.src = file.dataURL;
              messageElement.appendChild(img);
          } else {
              const fileDiv = document.createElement('div');
              fileDiv.className = 'file-attachment';
              const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5A2.5 2.5 0 0 0 1.5 4v8A2.5 2.5 0 0 0 4 14.5h8a2.5 2.5 0 0 0 2.5-2.5V4A2.5 2.5 0 0 0 12 1.5H4zM4 3h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M6.5 7a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3z"/></svg>`;
              const name = `<span>${file.name}</span>`;
              if (file.isDownloadable && file.downloadURL) {
                  const link = document.createElement('a');
                  link.href = file.downloadURL;
                  link.download = file.name;
                  link.innerHTML = icon + name;
                  fileDiv.appendChild(link);
              } else {
                  fileDiv.innerHTML = icon + name;
              }
              messageElement.appendChild(fileDiv);
          }
      });
  }
  if (msg.file && !msg.files) {
       if (msg.file.type?.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = msg.file.dataURL;
          messageElement.appendChild(img);
      } else {
          const fileDiv = document.createElement('div');
          fileDiv.className = 'file-attachment';
          const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5A2.5 2.5 0 0 0 1.5 4v8A2.5 2.5 0 0 0 4 14.5h8a2.5 2.5 0 0 0 2.5-2.5V4A2.5 2.5 0 0 0 12 1.5H4zM4 3h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M6.5 7a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3z"/></svg>`;
          const name = `<span>${msg.file.name}</span>`;
          if (msg.file.isDownloadable && msg.file.downloadURL) {
              const link = document.createElement('a');
              link.href = msg.file.downloadURL;
              link.download = msg.file.name;
              link.innerHTML = icon + name;
              fileDiv.appendChild(link);
          } else {
              fileDiv.innerHTML = icon + name;
          }
          messageElement.appendChild(fileDiv);
      }
  }
  if(msg.audioURL) {
    const audioPlayer = document.createElement('audio');
    audioPlayer.src = msg.audioURL;
    audioPlayer.controls = true;
    messageElement.appendChild(audioPlayer);
  }
  if (msg.text) {
      const textDiv = document.createElement('div');
      textDiv.textContent = msg.text;
      messageElement.appendChild(textDiv);
  }
  
  wrapper.appendChild(messageElement);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'message-actions';
  const msgId = msg.id;
  const msgText = msg.text || "This message contains no text.";

  const menuContainer = document.createElement('div');
  menuContainer.className = 'actions-container';

  const menuBtnEl = document.createElement('button');
  menuBtnEl.className = 'message-menu-btn action-btn';
  menuBtnEl.innerHTML = iconMenu;
  menuBtnEl.setAttribute('data-tooltip', 'More');

  const popoverEl = document.createElement('div');
  popoverEl.className = 'message-actions-popover';

  const popoverSpeakBtn = document.createElement('button');
  popoverSpeakBtn.innerHTML = iconSpeak + 'Speak';

  const popoverDeleteBtn = document.createElement('button');
  popoverDeleteBtn.innerHTML = iconBin + 'Delete';

  popoverEl.append(popoverSpeakBtn, popoverDeleteBtn);
  menuContainer.append(menuBtnEl, popoverEl);

  menuBtnEl.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.message-actions-popover.visible').forEach(p => {
          if (p !== popoverEl) p.classList.remove('visible');
      });
      popoverEl.classList.toggle('visible');
  });

  popoverSpeakBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!window.speechSynthesis) return;

      if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
          popoverSpeakBtn.innerHTML = iconSpeak + 'Speak';
      } else {
          const utter = new SpeechSynthesisUtterance(msgText);
          utter.lang = "en-US";
          utter.onend = () => { popoverSpeakBtn.innerHTML = iconSpeak + 'Speak'; };
          utter.onerror = () => { popoverSpeakBtn.innerHTML = iconSpeak + 'Speak'; };
          speechSynthesis.speak(utter);
          popoverSpeakBtn.innerHTML = iconSpeak + 'Stop'; 
      }
      popoverEl.classList.remove('visible');
  });

  popoverDeleteBtn.onclick = (e) => {
      e.stopPropagation();
      messageToDeleteId = msgId;
      deleteMessageModal.classList.add('visible');
      popoverEl.classList.remove('visible');
  };

  if (msg.sender === 'bot') {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-btn';
      copyBtn.innerHTML = iconCopy;
      copyBtn.setAttribute('data-tooltip', 'Copy');
      copyBtn.onclick = () => {
          navigator.clipboard.writeText(msgText).then(() => showToast('Message Copied!'));
      };

      const likeBtn = document.createElement('button');
      likeBtn.className = 'action-btn like-btn';
      likeBtn.innerHTML = iconLike;
      likeBtn.setAttribute('data-tooltip', 'Good Response');
      if (feedback[msgId] === 'like') likeBtn.classList.add('active');
      likeBtn.addEventListener("click", () => {
        feedback[msgId] = feedback[msgId] === "like" ? null : "like";
        localStorage.setItem("feedback", JSON.stringify(feedback));
        updateFeedbackUI(likeBtn, dislikeBtn, feedback[msgId]);
      });
      
      const dislikeBtn = document.createElement('button');
      dislikeBtn.className = 'action-btn dislike-btn';
      dislikeBtn.innerHTML = iconDislike;
      dislikeBtn.setAttribute('data-tooltip', 'Bad Response');
      if (feedback[msgId] === 'dislike') dislikeBtn.classList.add('active');
      dislikeBtn.addEventListener("click", () => {
        feedback[msgId] = feedback[msgId] === "dislike" ? null : "dislike";
        localStorage.setItem("feedback", JSON.stringify(feedback));
        updateFeedbackUI(likeBtn, dislikeBtn, feedback[msgId]);
      });
      
      actionsDiv.append(copyBtn, likeBtn, dislikeBtn, menuContainer);
      wrapper.appendChild(actionsDiv);

  } else if (msg.sender === 'user') {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'action-btn';
      copyBtn.innerHTML = iconCopy;
      copyBtn.setAttribute('data-tooltip', 'Copy');
      copyBtn.onclick = () => {
          navigator.clipboard.writeText(msgText).then(() => showToast('Message Copied!'));
      };

      const editBtn = document.createElement('button');
      editBtn.className = 'action-btn edit-btn';
      editBtn.innerHTML = iconEdit;
      editBtn.setAttribute('data-tooltip', 'Edit Message');
      editBtn.onclick = () => {
          userInput.value = msgText;
          userInput.focus();
      };

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'action-btn user-delete-btn'; 
      deleteBtn.innerHTML = iconBin;
      deleteBtn.setAttribute("data-tooltip", "Delete Message");
      deleteBtn.onclick = () => {
          messageToDeleteId = msgId;
          deleteMessageModal.classList.add('visible');
      };
      
      actionsDiv.append(copyBtn, editBtn, deleteBtn);
      wrapper.appendChild(actionsDiv);
  }
  
  fragment.appendChild(wrapper);
}

// --- Voice Input (Speech Recognition) Logic ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    userInput.value = event.results[0][0].transcript;
  };
  recognition.onstart = () => {
      voiceBtn.classList.add('is-listening');
  };
  recognition.onend = () => {
      voiceBtn.classList.remove('is-listening');
  };
  recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      voiceBtn.classList.remove('is-listening');
  };

  voiceBtn.addEventListener('click', () => {
      if(voiceBtn.classList.contains('is-listening')) {
          recognition.stop();
      } else {
          try {
              recognition.start();
          } catch(e) {
              console.error("Speech recognition start error: ", e);
          }
      }
  });
} else {
  voiceBtn.style.display = 'none';
}

// --- File Upload Logic ---
fileUpload.addEventListener("change", (event) => {
  selectedFilesForUpload = Array.from(event.target.files);
  displayFilePreview(selectedFilesForUpload);
});

function displayFilePreview(files) {
    filePreviewContainer.style.display = files.length > 0 ? 'flex' : 'none';
    filePreviewContainer.innerHTML = '';

    files.forEach((file, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'file-preview';
        previewDiv.dataset.fileIndex = index;

        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.className = 'file-preview-thumbnail';
        
        if (file.type.startsWith('image/')) {
            const thumbnailImg = document.createElement('img');
            fileToDataUrl(file).then(url => thumbnailImg.src = url);
            thumbnailDiv.appendChild(thumbnailImg);
        } else {
            thumbnailDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1.5A2.5 2.5 0 0 0 1.5 4v8A2.5 2.5 0 0 0 4 14.5h8a2.5 2.5 0 0 0 2.5-2.5V4A2.5 2.5 0 0 0 12 1.5H4zM4 3h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M6.5 7a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1h-3z"/></svg>`;
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'file-preview-info';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'file-preview-name';
        nameSpan.textContent = file.name;
        const sizeSpan = document.createElement('span');
        sizeSpan.className = 'file-preview-size';
        sizeSpan.textContent = `${(file.size / 1024).toFixed(1)} KB`;
        infoDiv.append(nameSpan, sizeSpan);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'removeFileBtn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove file';
        removeBtn.onclick = (e) => removeSingleFile(e, index);

        previewDiv.append(thumbnailDiv, infoDiv, removeBtn);
        filePreviewContainer.appendChild(previewDiv);
    });
}

function removeSingleFile(e, indexToRemove) {
    e.stopPropagation();
    selectedFilesForUpload = selectedFilesForUpload.filter((_, index) => index !== indexToRemove);
    displayFilePreview(selectedFilesForUpload);
    if (selectedFilesForUpload.length === 0) {
        fileUpload.value = '';
    }
}

function removeFilePreview() {
    selectedFilesForUpload = [];
    fileUpload.value = ''; 
    filePreviewContainer.innerHTML = '';
    filePreviewContainer.style.display = 'none';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e.target.error);
      reader.readAsDataURL(file);
  });
}


// --- Delete & Rename Logic ---
  cancelDeleteBtn.addEventListener('click', () => {
      deleteConfirmModal.classList.remove('visible');
      sessionToDelete = null;
  });

  confirmDeleteBtn.addEventListener('click', async () => {
      if (sessionToDelete && currentUserId) {
          await deleteSession(currentUserId, sessionToDelete);
          sessionToDelete = null;
      }
      deleteConfirmModal.classList.remove('visible');
  });

  confirmDeleteMessageBtn.addEventListener('click', async () => {
    if (messageToDeleteId && currentUserId && currentSessionId) {
      try {
        const msgRef = doc(db, 'chats', currentUserId, 'sessions', currentSessionId, 'messages', messageToDeleteId);
        await deleteDoc(msgRef);
      } catch (error) {
        console.error("Error deleting message:", error);
        showToast('Error: Could not delete message.');
      }
    }
    deleteMessageModal.classList.remove('visible');
    messageToDeleteId = null;
  });

  cancelDeleteMessageBtn.addEventListener('click', () => {
    deleteMessageModal.classList.remove('visible');
    messageToDeleteId = null;
  });

  deleteMessageModal.addEventListener('click', (e) => {
    if (e.target.id === 'delete-message-modal') {
      deleteMessageModal.classList.remove('visible');
      messageToDeleteId = null;
    }
  });

  async function deleteSession(uid, sessionId) {
      const sessionDocRef = doc(db, 'chats', uid, 'sessions', sessionId);
      const messagesRef = collection(db, 'chats', uid, 'sessions', sessionId, 'messages');
      
      const messagesSnapshot = await getDocs(messagesRef);
      const deletePromises = [];
      messagesSnapshot.forEach((messageDoc) => {
          deletePromises.push(deleteDoc(messageDoc.ref));
      });
      await Promise.all(deletePromises);

      await deleteDoc(sessionDocRef);

      if (currentSessionId === sessionId) {
          startNewChat();
      }
  }

  function startRename(liElement, sessionId) {
      const infoDiv = liElement.querySelector('.session-info');
      const titleSpan = liElement.querySelector('.session-title');
      if (!infoDiv || !titleSpan) return;

      const originalTitle = titleSpan.textContent;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'rename-input';
      input.value = originalTitle;
      
      const popover = liElement.querySelector('.actions-popover');
      if (popover) popover.classList.remove('visible');

      infoDiv.replaceChild(input, titleSpan);
      input.focus();
      input.select();

      const finishRename = async () => {
          if (!infoDiv.contains(input)) return;

          const newTitle = input.value.trim();
          
          infoDiv.replaceChild(titleSpan, input);

          if (newTitle && newTitle !== originalTitle) {
              titleSpan.textContent = newTitle; 
              const sessionDocRef = doc(db, 'chats', currentUserId, 'sessions', sessionId);
              try {
                  await updateDoc(sessionDocRef, { title: newTitle });
              } catch (error) {
                  console.error("Error renaming session:", error);
                  titleSpan.textContent = originalTitle; 
              }
          } else {
              titleSpan.textContent = originalTitle; 
          }
      };

      const blurHandler = () => {
          finishRename();
          input.removeEventListener('blur', blurHandler);
          input.removeEventListener('keydown', keydownHandler);
      };

      const keydownHandler = (e) => {
          if (e.key === 'Enter') {
              e.preventDefault();
              blurHandler();
          } else if (e.key === 'Escape') {
              input.value = originalTitle;
              blurHandler();
          }
      };
      
      input.addEventListener('blur', blurHandler);
      input.addEventListener('keydown', keydownHandler);
  }

// --- Share Chat Logic ---
function generateSimpleUID() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

async function openShareModal(sessionId, sessionTitle) {
  if (!currentUserId) return;
  
  shareModalTitle.textContent = `Share "${sessionTitle}"`;
  shareLinkInput.value = 'Checking status...';
  copyShareLinkBtn.textContent = 'Copy';
  copyShareLinkBtn.disabled = true;
  unshareBtn.style.display = 'none';
  
  copyShareLinkBtn.onclick = () => copyShareLink();
  unshareBtn.onclick = () => unshareChat(sessionId);
  
  shareChatModal.classList.add('visible');
  
  try {
      const sessionDocRef = doc(db, 'chats', currentUserId, 'sessions', sessionId);
      const docSnap = await getDoc(sessionDocRef);
      
      if (docSnap.exists()) {
          const sessionData = docSnap.data();
          if (sessionData.isShared && sessionData.shareId) {
              const shareUrl = `${window.location.origin}${window.location.pathname}?share=${sessionData.shareId}`;
              shareLinkInput.value = shareUrl;
              copyShareLinkBtn.disabled = false;
              unshareBtn.style.display = 'block';
          } else {
              const shareId = generateSimpleUID();
              await updateDoc(sessionDocRef, {
                  isShared: true,
                  shareId: shareId
              });
              const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}`;
              shareLinkInput.value = shareUrl;
              copyShareLinkBtn.disabled = false;
              unshareBtn.style.display = 'block';
          }
      } else {
          shareLinkInput.value = 'Error: Chat not found.';
      }
  } catch (error) {
      console.error("Error handling share functionality:", error);
      shareLinkInput.value = 'Error: Could not process request.';
  }
}

function copyShareLink() {
  navigator.clipboard.writeText(shareLinkInput.value).then(() => {
      copyShareLinkBtn.textContent = 'Copied!';
      showToast('Share link copied!');
      setTimeout(() => {
          copyShareLinkBtn.textContent = 'Copy';
      }, 2000);
  }).catch(err => {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy link.');
  });
}

async function unshareChat(sessionId) {
    if (!currentUserId) return;
    
    unshareBtn.disabled = true;
    unshareBtn.textContent = 'Disabling...';
    
    try {
        const sessionDocRef = doc(db, 'chats', currentUserId, 'sessions', sessionId);
        await updateDoc(sessionDocRef, {
            isShared: false
        });
        showToast('Chat is no longer shared.');
        shareChatModal.classList.remove('visible');
    } catch (error) {
        console.error("Error unsharing chat:", error);
        showToast('Error: Could not unshare.');
    } finally {
        unshareBtn.disabled = false;
        unshareBtn.textContent = 'Unshare and disable link';
    }
}

closeShareModalBtn.addEventListener('click', () => shareChatModal.classList.remove('visible'));
shareChatModal.addEventListener('click', (e) => {
  if (e.target.id === 'share-chat-modal') {
    shareChatModal.classList.remove('visible');
  }
});

// --- Theme Switcher ---
function applyTheme(theme) {
  if (theme === 'light') {
      document.body.classList.add('light-theme');
      themeToggle.checked = true;
      if (themeLabel) themeLabel.textContent = 'Dark Mode';
  } else {
      document.body.classList.remove('light-theme');
      themeToggle.checked = false;
      if (themeLabel) themeLabel.textContent = 'Light Mode';
  }
}

themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'light' : 'dark';
    localStorage.setItem('theme', theme);
    applyTheme(theme);
});

// --- General Event Listeners ---
userInput.addEventListener("keypress", (e) => { if (e.key === "Enter" && !(e.ctrlKey || e.metaKey)) { e.preventDefault(); sendMessage(); } });

// Stop button event listener
stopGeneratingBtn.addEventListener('click', () => {
  if (fetchController) {
    fetchController.abort();
    console.log("Fetch aborted by user.");
    
    sendBtn.style.display = 'block';
    sendBtn.disabled = false;
    sendBtn.classList.remove('is-loading');
    sendBtn.innerHTML = 'Send';
    stopGeneratingBtn.style.display = 'none';
    userInput.disabled = false;
    fetchController = null;
    
    loadingSessionId = null;
    updateTypingIndicatorVisibility();
    
    if (currentSessionId && currentUserId) {
        const messagesRef = collection(db, 'chats', currentUserId, 'sessions', currentSessionId, 'messages');
        addDoc(messagesRef, { 
            text: "Message generation stopped by user.", 
            sender: 'bot',
            timestamp: serverTimestamp() 
        }).catch(err => console.error("Error adding stop message:", err));
    }
  }
});

// Sidebar hamburger button
openHistoryBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if(window.innerWidth <= 768) {
      sessionPanel.classList.add('visible');
      mobileBackdrop.classList.add('visible');
    } else {
      mainContainer.classList.remove('sidebar-collapsed');
    }
});

// Text "History" button
historyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sessionPanel.classList.add('visible');
    mobileBackdrop.classList.add('visible');
});

// Close '<<' button
closeHistoryBtn.addEventListener('click', () => {
    mainContainer.classList.add('sidebar-collapsed');
});

mobileBackdrop.addEventListener('click', () => {
    sessionPanel.classList.remove('visible');
    mobileBackdrop.classList.remove('visible');
});

modeSelector.addEventListener('change', (e) => {
  updateSessionMode(e.target.value);
});

document.addEventListener('click', (e) => {
    // Close mobile sidebar if clicking outside
    if (sessionPanel.classList.contains('visible') && window.innerWidth <= 768 && !sessionPanel.contains(e.target) && e.target !== historyBtn && e.target !== openHistoryBtn && !openHistoryBtn.contains(e.target)) {
        sessionPanel.classList.remove('visible');
        mobileBackdrop.classList.remove('visible');
    }
    
    // Close session action popovers
    const openSessionPopover = document.querySelector('.actions-popover.visible');
    if(openSessionPopover && !openSessionPopover.parentElement.contains(e.target)) {
        openSessionPopover.classList.remove('visible');
    }

    // Close message action popovers
    const openMessagePopover = document.querySelector('.message-actions-popover.visible');
    if(openMessagePopover && !openMessagePopover.parentElement.contains(e.target)) {
        openMessagePopover.classList.remove('visible');
    }
});

// --- Contact Manager Modal Logic ---
contactManagerBtn.addEventListener('click', () => {
  contactManagerModal.classList.add('visible');
  profileModal.classList.remove('visible'); 
});

closeContactManagerModalBtn.addEventListener('click', () => {
  contactManagerModal.classList.remove('visible');
});

contactManagerModal.addEventListener('click', (e) => {
  if (e.target.id === 'contact-manager-modal') {
    contactManagerModal.classList.remove('visible');
  }
});

// Adjust padding on load and resize
window.addEventListener('resize', adjustChatContainerPadding);
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);
  adjustChatContainerPadding();
});
