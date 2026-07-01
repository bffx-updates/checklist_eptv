export const firebaseConfig = {
  apiKey: "AIzaSyBM-dhndI1nTguXv9WFNbsrS9lFYrMLBYE",
  authDomain: "cheklist-ecb1a.firebaseapp.com",
  projectId: "cheklist-ecb1a",
  storageBucket: "cheklist-ecb1a.firebasestorage.app",
  messagingSenderId: "615335752323",
  appId: "1:615335752323:web:2d9de4fa5524e36760e1b6"
};

export const firebaseIsConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.appId
);
