// user.js - Firebase v8

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAIzv7rOF5LtQmC1AVeQqAjrGHUZnJomFY",
  authDomain: "track-study-9f2eb.firebaseapp.com",
  projectId: "track-study-9f2eb",
  storageBucket: "track-study-9f2eb.firebasestorage.app",
  messagingSenderId: "461107985386",
  appId: "1:461107985386:web:15c694a7c946da0a5d1093",
  databaseURL: "https://track-study-9f2eb-default-rtdb.firebaseio.com"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();
db.goOnline();


db.ref(".info/connected").on("value", snap => {
  console.log("db connected:", snap.val());
});


function makeUserProp(uid, key, value) {
  return db.ref(`users/${uid}/${key}`).set(value);
}

/* Read a user property */
function getUserProp(uid, key) {
  return db.ref(`users/${uid}/${key}`).once("value")
    .then(snap => snap.exists() ? snap.val() : null);
}

/* Edit an existing property */
function editUserProp(uid, key, value) {
  return db.ref(`users/${uid}`).update({ [key]: value });
}

/* Delete a property */
function deleteUserProp(uid, key) {
  return db.ref(`users/${uid}/${key}`).remove();
}

//Timespent
//online

function trackUserOnlineStatus(uid) {
  if (!uid) return;
  const userRef = db.ref(`users/${uid}`);
  const connectedRef = db.ref(".info/connected");

  console.log("Tracking online status for UID:", uid);
  console.log("Initial online status set to true.");
  console.log("Tracking online/offline status changes.");
  connectedRef.on("value", snap => {
    if (snap.val() === true) {
      userRef.update({ online: true });
      userRef.onDisconnect().update({ online: false });
    } else {
      userRef.update({ online: false });
    }
  });

  window.addEventListener("online", () => userRef.update({ online: true }));
  window.addEventListener("offline", () => userRef.update({ online: false }));
}


let timeInterval = null;

function trackUser(uid) {
  if (!uid) return;

  const userRef = db.ref(`users/${uid}`);
  const sessionStart = Date.now();

  // Mark online
  userRef.update({ online: true });

  // Clean disconnect handler
  userRef.onDisconnect().update({ online: false });

  // Start timer (only once)
  if (timeInterval) clearInterval(timeInterval);

  timeInterval = setInterval(() => {
    userRef.update({
      timeSpent: firebase.database.ServerValue.increment(10)
    }).catch(console.error);
  }, 10000);

  // Stop timer on tab close
  window.addEventListener("beforeunload", () => {
    clearInterval(timeInterval);
    userRef.update({ online: false });
  });
}


function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') { 
            c = c.substring(1, c.length);
        }
        if (c.indexOf(nameEQ) === 0) {
            return c.substring(nameEQ.length, c.length);
        }
    }
    return null; 
}



window.makeUserProp = makeUserProp;
window.getUserProp = getUserProp;
window.editUserProp = editUserProp;
window.deleteUserProp = deleteUserProp;
window.trackUserOnlineStatus = trackUserOnlineStatus;
window.trackUser = trackUser;
