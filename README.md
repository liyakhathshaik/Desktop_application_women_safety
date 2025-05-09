# Desktop_application_women_safety
# 🙌 Gesture Recognition for Women’s Safety

## ❗ Problem Statement

Despite advances in surveillance and emergency services, women continue to face serious safety challenges:

- 🚶‍♀️ **Vulnerability in Public Spaces**  
  Harassment and assault often go unnoticed or unreported.

- 📵 **Delayed Response**  
  Victims may be unable to call for help in time.

- 🔍 **Lack of Proactive Detection**  
  Most CCTV systems only record events — they don’t understand when something is wrong.

- 🛡️ **Insufficient Integration**  
  Alerts, first responders, and nearby safe zones are often not connected in real time.

- ⏳ **Lost Minutes Matter**  
  Every second’s delay in detecting and notifying responders dramatically increases risk.

---

## 💡 Our Solution: AI-Powered SOS Gesture Recognition System

An intelligent surveillance system that detects emergency gestures using AI and instantly alerts law enforcement.

---

## 🔗 Repositories

- 👉 **Gesture Recognition Module**: [Gesture_Recognision](https://github.com/liyakhathshaik/Gesture_Recognision)  
- 👉 **Desktop Application (Police Alert System)**: [Desktop_application_women_safety](https://github.com/liyakhathshaik/Desktop_application_women_safety)

---

## 🛠️ How It Works

### 🎥 Video Capture
Fixed-location CCTV cameras continuously stream video to a central server.

### 🖼️ Frame Extraction
Each video stream is processed to extract individual frames in real-time.

### ✋ Gesture Detection
Python scripts using **OpenCV** and **MediaPipe** analyze each frame.  
If an SOS gesture is detected, it is flagged for further action.

### 📦 Event Packaging
The system packages:
- The detected frame
- Timestamp
- Camera ID  
Into a secure **event packet**.

### ☁️ Cloud Upload
Event packets are uploaded to **Firebase Cloud Storage**, tagged to the nearest police station’s bucket.

### 💻 Desktop Alert App
A desktop app (built using **Electron**) runs at police stations.  
It continuously polls Firebase and:
- Downloads new events
- Displays the live image and location
- Sounds a real-time alarm to alert officers

---

## 🧰 Technologies Used

| Component              | Tech Used              |
|------------------------|------------------------|
| Gesture Recognition    | OpenCV, MediaPipe      |
| Server Processing      | Python                 |
| Cloud Delivery         | Firebase Cloud Storage |
| Desktop Notification   | Electron.js            |

---

## 🚓 Response Flow

1. **Camera detects SOS gesture** via AI.  
2. **Server processes the event** and uploads to Firebase.  
3. **Desktop app receives alert** at the police station.  
4. **Live image and location are shown**, and an alarm sounds.  
5. **Immediate police action** is dispatched.

---

**Japanese Word of the Day**:  
**きけん (kiken)** – *Danger / Hazard*
