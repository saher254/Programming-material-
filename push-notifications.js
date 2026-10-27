// push-notifications.js - نظام إشعارات كامل في ملف واحد
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDe5INvR_ifEARHmw7M0qqBQ34-G6z4p7w",
    authDomain: "mansa-educational.firebaseapp.com",
    projectId: "mansa-educational",
    storageBucket: "mansa-educational.firebasestorage.app",
    messagingSenderId: "144298769750",
    appId: "1:144298769750:web:43eb0c63e5d2acb37baaf7"
};

// ✅ استخدام نفس التطبيق لو موجود
let app;
try {
    app = getApps().find(a => a.name === 'notificationsApp') || initializeApp(firebaseConfig, 'notificationsApp');
} catch(e) {
    app = initializeApp(firebaseConfig, 'notificationsApp');
}
const db = getFirestore(app);

// ✅ تسجيل Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(reg => {
            console.log('✅ SW registered:', reg.scope);
            setTimeout(checkNotificationPermission, 3000);
        })
        .catch(err => console.error('❌ SW failed:', err));
}

// ✅ التحقق من إذن الإشعارات (بس لو التطبيق متثبت)
async function checkNotificationPermission() {
    // التحقق إن التطبيق متثبت (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
        || window.navigator.standalone === true;

    if (!isStandalone) {
        console.log('ℹ️ التطبيق مش متثبت — الإشعارات هتتفعل بعد التثبيت');
        return;
    }

    if (!('Notification' in window)) {
        console.log('❌ المتصفح مش بيدعم الإشعارات');
        return;
    }

    // لو المستخدم طلب قبل كده، متسألوش تاني
    if (localStorage.getItem('notif_asked') === 'true') {
        if (Notification.permission === 'granted') {
            startWatcher();
        }
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        localStorage.setItem('notif_asked', 'true');

        if (permission === 'granted') {
            console.log('✅ الإشعارات اتفعلت');
            showNotification('🎉 مبروك!', 'تم تفعيل الإشعارات — هتوصلك كل الأخبار الجديدة');
            startWatcher();
        }
    } catch(e) {
        console.error('خطأ في طلب الإذن:', e);
    }
}

// ✅ إظهار إشعار على الجهاز
async function showNotification(title, body) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, {
            body: body,
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [200, 100, 200],
            tag: 'bakaloria-notif'
        });
    } catch(e) {
        console.error('خطأ في الإشعار:', e);
    }
}

// ✅ مراقبة الإشعارات الجديدة
let lastCheck = parseInt(localStorage.getItem('last_notif_check') || Date.now().toString());
let watcherInterval = null;

function startWatcher() {
    if (watcherInterval) return;
    console.log('👀 بدء مراقبة الإشعارات');

    watcherInterval = setInterval(async () => {
        if (Notification.permission !== 'granted') return;

        try {
            const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(5));
            const snap = await getDocs(q);
            const newNotifs = [];
            snap.forEach(d => {
                const data = d.data();
                if (data.createdAt > lastCheck) {
                    newNotifs.push(data);
                }
            });

            newNotifs.reverse().forEach(n => {
                showNotification(
                    `${n.icon || '🔔'} ${n.title || 'إشعار'}`,
                    n.message || ''
                );
            });

            if (newNotifs.length > 0) {
                lastCheck = Date.now();
                localStorage.setItem('last_notif_check', lastCheck.toString());
            }
        } catch(e) {
            console.error('خطأ في check:', e);
        }
    }, 30000); // كل 30 ثانية
}

// ✅ بدء المراقبة لو الإذن موجود
if (Notification.permission === 'granted') {
    startWatcher();
}