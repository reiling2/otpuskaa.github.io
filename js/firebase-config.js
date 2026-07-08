(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyA2f92mOr9zgA4BzrSfoY9yQrqbAnPsyMU",
    authDomain: "otpusk-7aaeb.firebaseapp.com",
    projectId: "otpusk-7aaeb",
    storageBucket: "otpusk-7aaeb.firebasestorage.app",
    messagingSenderId: "74869125645",
    appId: "1:74869125645:web:9157c067dee26ddc3f1b44",
    measurementId: "G-VNB9GGYEB0"
  };

  const stateDocPath = "apps/vacation-plan/state/main";
  const hasRealConfig = Object.values(firebaseConfig).every(value => value && !String(value).includes("PASTE_"));
  let firebaseApp = null;
  let firebaseAuth = null;
  let firestoreDb = null;
  let stateDocRef = null;

  if (window.firebase && hasRealConfig && typeof firebase.auth === "function" && typeof firebase.firestore === "function") {
    firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
    firestoreDb = firebase.firestore();
    stateDocRef = firestoreDb.collection("apps").doc("vacation-plan").collection("state").doc("main");
  }

  window.vacationFirebase = {
    firebaseConfig,
    firebaseApp,
    firebaseAuth,
    firestoreDb,
    stateDocRef,
    stateDocPath,
    isConfigured: Boolean(stateDocRef && firebaseAuth)
  };
})();
