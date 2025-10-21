# python-vision-service/app.py
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import face_recognition
import numpy as np
import base64
import io
import requests
import os
from datetime import datetime
import threading
import time
from PIL import Image
import logging

app = Flask(__name__)
CORS(app)

# Configuration
NODE_API_BASE = "http://localhost:5000/api"
CONFIDENCE_THRESHOLD = 0.6
MAX_FACE_DISTANCE = 0.4

class FaceRecognitionService:
    def __init__(self):
        self.known_face_encodings = []
        self.known_face_names = []
        self.known_face_student_ids = []
        self.last_update = None
        self.update_interval = 300  # 5 minutes
        
        # Load initial face data
        self.load_student_faces()
        
        # Start background thread for periodic updates
        threading.Thread(target=self.periodic_update, daemon=True).start()
    
    def load_student_faces(self):
        """Load all student face encodings from the database"""
        try:
            # Get all active students from your Node.js API
            response = requests.get(f"{NODE_API_BASE}/users", 
                                 params={"role": "student", "isActive": True})
            
            if response.status_code != 200:
                logging.error("Failed to fetch students from API")
                return
            
            students = response.json().get('users', [])
            
            encodings = []
            names = []
            student_ids = []
            
            for student in students:
                if student.get('profilePicture') and student['profilePicture'].get('url'):
                    try:
                        # Download profile picture
                        img_response = requests.get(student['profilePicture']['url'])
                        if img_response.status_code == 200:
                            # Convert to face encoding
                            image = face_recognition.load_image_file(
                                io.BytesIO(img_response.content)
                            )
                            face_encodings = face_recognition.face_encodings(image)
                            
                            if face_encodings:
                                encodings.append(face_encodings[0])
                                names.append(student['name'])
                                student_ids.append(student['studentId'])
                                
                    except Exception as e:
                        logging.error(f"Error processing {student['name']}: {str(e)}")
            
            self.known_face_encodings = encodings
            self.known_face_names = names
            self.known_face_student_ids = student_ids
            self.last_update = datetime.now()
            
            logging.info(f"Loaded {len(encodings)} student faces")
            
        except Exception as e:
            logging.error(f"Error loading student faces: {str(e)}")
    
    def periodic_update(self):
        """Periodically update face encodings"""
        while True:
            time.sleep(self.update_interval)
            self.load_student_faces()
    
    def recognize_face(self, frame):
        """Recognize faces in the given frame"""
        # Resize frame for faster processing
        small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)
        rgb_small_frame = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)
        
        # Find faces in current frame
        face_locations = face_recognition.face_locations(rgb_small_frame)
        face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)
        
        recognized_students = []
        
        for face_encoding, face_location in zip(face_encodings, face_locations):
            # Compare with known faces
            matches = face_recognition.compare_faces(
                self.known_face_encodings, face_encoding, tolerance=MAX_FACE_DISTANCE
            )
            face_distances = face_recognition.face_distance(
                self.known_face_encodings, face_encoding
            )
            
            if len(face_distances) > 0:
                best_match_index = np.argmin(face_distances)
                
                if matches[best_match_index] and face_distances[best_match_index] < MAX_FACE_DISTANCE:
                    confidence = 1 - face_distances[best_match_index]
                    
                    if confidence >= CONFIDENCE_THRESHOLD:
                        # Scale face location back up
                        top, right, bottom, left = face_location
                        top *= 4
                        right *= 4
                        bottom *= 4
                        left *= 4
                        
                        recognized_students.append({
                            'name': self.known_face_names[best_match_index],
                            'studentId': self.known_face_student_ids[best_match_index],
                            'confidence': float(confidence),
                            'boundingBox': {
                                'top': top,
                                'right': right,
                                'bottom': bottom,
                                'left': left
                            }
                        })
        
        return recognized_students

# Initialize face recognition service
face_service = FaceRecognitionService()

@app.route('/api/vision/recognize', methods=['POST'])
def recognize_faces():
    try:
        data = request.get_json()
        
        if 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Recognize faces
        recognized_students = face_service.recognize_face(frame)
        
        return jsonify({
            'success': True,
            'students': recognized_students,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vision/process-attendance', methods=['POST'])
def process_attendance():
    try:
        data = request.get_json()
        
        required_fields = ['image', 'gateId', 'wardenId']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing {field}'}), 400
        
        # Decode and process image
        image_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Recognize faces
        recognized_students = face_service.recognize_face(frame)
        
        if not recognized_students:
            return jsonify({
                'success': False,
                'message': 'No students recognized in the image'
            })
        
        # Process attendance for each recognized student
        processed_students = []
        
        for student in recognized_students:
            try:
                # Call your existing Node.js API to record entry/exit
                attendance_data = {
                    'studentId': student['studentId'],
                    'gateId': data['gateId'],
                    'recognitionConfidence': student['confidence'],
                    'attendanceMethod': 'face_recognition',
                    'wardenId': data['wardenId']
                }
                
                # Make API call to record attendance
                response = requests.post(
                    f"{NODE_API_BASE}/gates/record-attendance",
                    json=attendance_data,
                    headers={'Content-Type': 'application/json'}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    processed_students.append({
                        'student': student,
                        'action': result.get('action'),
                        'success': True
                    })
                else:
                    processed_students.append({
                        'student': student,
                        'success': False,
                        'error': 'Failed to record attendance'
                    })
                    
            except Exception as e:
                processed_students.append({
                    'student': student,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'processedStudents': processed_students,
            'totalRecognized': len(recognized_students)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vision/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'knownFaces': len(face_service.known_face_encodings),
        'lastUpdate': face_service.last_update.isoformat() if face_service.last_update else None
    })

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    app.run(debug=True, host='0.0.0.0', port=5001)