from flask import Flask, render_template, request, session, jsonify, redirect, url_for
from config.database import *
from PIL import Image
from datetime import datetime
import os, uuid, base64, face_recognition, io, mysql.connector, pytz
import numpy as np

app = Flask(__name__)
app.secret_key = 'your_secret_key'

def database_connection():
    connection = mysql.connector.connect(**db_config)
    
    return connection

@app.route('/')
def index():
    if "user_id" in session:
        return redirect(url_for('take_attendance'))
    else:
        return render_template('auth/login.html')

@app.route('/take_attendance')
def take_attendance():
    if "user_id" not in session:
        session["notification"] = {
            "type": "alert-danger",
            "message": "You need to login first",
        }

        return redirect(url_for('index'))
    else:
        page_data = {
            "current_page": "take_attendance",
            "title": "Take Attendance",
        }

        conn = database_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM `users` WHERE `id` = %s", (session["user_id"],))
        admin_data = cursor.fetchone()

        attendance_data = []

        if "student_attendance_result" in session:
            cursor.execute("""
                SELECT attendance.*, students.student_number FROM attendance JOIN students ON attendance.student_id = students.id WHERE attendance.student_id = %s ORDER BY `id` DESC
            """, (session["student_attendance_result"]["student_id"],))
            attendance_data = cursor.fetchall()

        conn.close()

        return render_template('main/take_attendance.html', page_data=page_data, admin_data=admin_data, attendance_data=attendance_data, datetime=datetime)

@app.route('/students_record')
def students_record():
    if "user_id" not in session:
        session["notification"] = {
            "type": "alert-danger",
            "message": "You need to login first",
        }

        return redirect(url_for('index'))
    else:
        page_data = {
            "current_page": "students_record",
            "title": "Students Record",
        }

        conn = database_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM `users` WHERE `id` = %s", (session["user_id"],))
        admin_data = cursor.fetchone()

        conn = database_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM `students` ORDER BY `id` DESC")
        students_data = cursor.fetchall()

        return render_template('main/students_record.html', page_data=page_data, admin_data=admin_data, students_data=students_data)

@app.route('/attendance_record')
def attendance_record():
    if "user_id" not in session:
        session["notification"] = {
            "type": "alert-danger",
            "message": "You need to login first",
        }

        return redirect(url_for('index'))
    else:
        page_data = {
            "current_page": "attendance_record",
            "title": "Attendance Record",
        }

        conn = database_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM `users` WHERE `id` = %s", (session["user_id"],))
        admin_data = cursor.fetchone()
        
        cursor.execute("SELECT attendance.*, students.student_number FROM attendance JOIN students ON attendance.student_id = students.id ORDER BY `id` DESC")
        attendance_data = cursor.fetchall()

        conn.close()

        return render_template('main/attendance_record.html', page_data=page_data, admin_data=admin_data, attendance_data=attendance_data, datetime=datetime)

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    remember_me = request.form['remember_me']

    conn = database_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM `users` WHERE `username` = %s", (username,))
    admin_data = cursor.fetchone()

    response = False

    if admin_data and bcrypt.checkpw(password.encode('utf-8'), admin_data['password'].encode('utf-8')):
        if remember_me == "true":
            session["username"] = username
            session["password"] = password
        else:
            session.pop("username", None)
            session.pop("password", None)

        session["user_id"] = admin_data["id"]

        session["notification"] = "Success!|Welcome, " + admin_data['name'] + "!|success"

        response = True
    
    cursor.close()
    conn.close()

    return jsonify(response)

@app.route('/change_mode', methods=['POST'])
def change_mode():
    mode = request.form['mode']

    session["mode"] = mode

    return jsonify(True)

@app.route('/get_admin_data', methods=['POST'])
def get_admin_data():
    user_id = request.form['user_id']

    conn = database_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM `users` WHERE `id` = %s", (user_id,))
    admin_data = cursor.fetchone()

    return jsonify(admin_data)

@app.route('/get_student_data', methods=['POST'])
def get_student_data():
    student_id = request.form['student_id']

    conn = database_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM `students` WHERE `id` = %s", (student_id,))
    student_data = cursor.fetchone()

    return jsonify(student_data)

@app.route('/update_admin', methods=['POST'])
def update_admin():
    current_datetime = datetime.now(pytz.timezone('Asia/Manila')).strftime('%Y-%m-%d %H:%M:%S')

    user_id = request.form['user_id']
    name = request.form['name']
    username = request.form['username']
    password = request.form['password']
    is_new_password = request.form['is_new_password']
    image = request.form['image']

    if 'image_file' in request.files:
        file = request.files['image_file']

        if file:
            image = str(uuid.uuid4().hex) + os.path.splitext(file.filename)[1]
            file_path = os.path.join("static/dist/img/uploads/admin", image)

            file.save(file_path)

    if is_new_password == "true":
        password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    conn = database_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE `users`
        SET `name` = %s, `username` = %s, `password` = %s, `image` = %s, `updated_at` = %s
        WHERE `id` = %s
        """, (name, username, password, image, current_datetime, user_id))
    conn.commit()
    cursor.close()
    conn.close()

    
    session["notification"] = "Success!|Your info has been updated.|success"

    return jsonify(True)

@app.route('/save_student', methods=['POST'])
def save_student():
    current_datetime = datetime.now(pytz.timezone('Asia/Manila')).strftime('%Y-%m-%d %H:%M:%S')

    student_number = request.form['student_number']
    course = request.form['course']
    year = request.form['year']
    section = request.form['section']
    first_name = request.form['first_name']
    middle_name = request.form['middle_name']
    last_name = request.form['last_name']
    date_of_birth = request.form['date_of_birth']
    gender = request.form['gender']
    nationality = request.form['nationality']
    mobile_number = request.form['mobile_number']
    email_address = request.form['email_address']
    address = request.form['address']
    image_input = request.form['image']

    conn = database_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM `students` WHERE `student_number` = %s", (student_number,))
    student_data = cursor.fetchone()

    response = False

    if not student_data:
        conn = database_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO `students` (`uuid`, `student_number`, `course`, `year`, `section`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `gender`, `nationality`, `mobile_number`, `email_address`, `address`, `created_at`, `updated_at`)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (str(uuid.uuid4()), student_number, course, year, section, first_name, middle_name, last_name, date_of_birth, gender, nationality, mobile_number, email_address, address, current_datetime, current_datetime))
        
        student_id = cursor.lastrowid
        
        image_input = image_input.split(',')[1]
        image_input = base64.b64decode(image_input)
        image = f"{student_id}_{uuid.uuid4().hex}.jpg" 
        
        with open(os.path.join("static/dist/img/uploads/users", image), 'wb') as file:
            file.write(image_input)

        cursor.execute("""
            UPDATE `students` SET `image` = %s WHERE `id` = %s
            """, (image, student_id))
        conn.commit()
        cursor.close()
        conn.close()

        session["notification"] = "Success!|Student information has been saved.|success"

        response = True

    return jsonify(response)

@app.route('/update_student', methods=['POST'])
def update_student():
    current_datetime = datetime.now(pytz.timezone('Asia/Manila')).strftime('%Y-%m-%d %H:%M:%S')

    student_number = request.form['student_number']
    course = request.form['course']
    year = request.form['year']
    section = request.form['section']
    first_name = request.form['first_name']
    middle_name = request.form['middle_name']
    last_name = request.form['last_name']
    date_of_birth = request.form['date_of_birth']
    gender = request.form['gender']
    nationality = request.form['nationality']
    mobile_number = request.form['mobile_number']
    email_address = request.form['email_address']
    address = request.form['address']
    image_input = request.form['image']
    old_student_number = request.form['old_student_number']
    old_image = request.form['old_image']
    id = request.form['id']

    errors = 0
    response = False

    if student_number != old_student_number:
        conn = database_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM `students` WHERE `student_number` = %s", (student_number,))
        student_data = cursor.fetchone()

        if student_data:
            errors += 1

    if errors == 0:
        if image_input != old_image:
            image_input = image_input.split(',')[1]
            image_input = base64.b64decode(image_input)
            image = f"{id}_{uuid.uuid4().hex}.jpg"
            
            with open(os.path.join("static/dist/img/uploads/users", image), 'wb') as file:
                file.write(image_input)
        else:
            image = old_image

        conn = database_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE `students` SET `student_number` = %s, `course` = %s, `year` = %s, `section` = %s, `first_name` = %s, `middle_name` = %s, `last_name` = %s, `date_of_birth` = %s, `gender` = %s, `nationality` = %s, `mobile_number` = %s, `email_address` = %s, `address` = %s, `image` = %s, `updated_at` = %s WHERE `id` = %s
            """, (student_number, course, year, section, first_name, middle_name, last_name, date_of_birth, gender, nationality, mobile_number, email_address, address, image, current_datetime, id))
        conn.commit()
        cursor.close()
        conn.close()

        session["notification"] = "Success!|Student information has been updated.|success"

        response = True

    return jsonify(response)

@app.route('/delete_student', methods=['POST'])
def delete_student():
    id = request.form['id']

    conn = database_connection()
    cursor = conn.cursor()
    cursor.execute("""
        DELETE FROM `students` WHERE `id` = %s
        """, (id,))
    conn.commit()
    cursor.close()
    conn.close()

    session["notification"] = "Success!|Student has been deleted.|success"

    return jsonify(True)

@app.route('/match_face', methods=['POST'])
def match_face():
    data = request.form['image']
    image_data = data.split(",")[1]
    image_bytes = base64.b64decode(image_data)
    
    input_image = Image.open(io.BytesIO(image_bytes))
    input_image_np = np.array(input_image)
    
    input_encoding = face_recognition.face_encodings(input_image_np)
    
    if not input_encoding:
        return jsonify(False)
    
    input_encoding = input_encoding[0]

    best_match = None
    best_match_distance = float('inf')
    
    IMAGE_DIR = 'static/dist/img/uploads/users'

    for filename in os.listdir(IMAGE_DIR):
        if filename.endswith(('.jpg', '.jpeg', '.png')):
            server_image_path = os.path.join(IMAGE_DIR, filename)
            server_image = face_recognition.load_image_file(server_image_path)
            server_encodings = face_recognition.face_encodings(server_image)
            
            if not server_encodings:
                continue
            
            server_encoding = server_encodings[0]
            
            results = face_recognition.compare_faces([server_encoding], input_encoding)
            face_distances = face_recognition.face_distance([server_encoding], input_encoding)
            
            if results[0] and face_distances[0] < best_match_distance:
                best_match = filename
                best_match_distance = face_distances[0]
    
    if best_match:
        return jsonify(best_match)
    else:
        return jsonify(False)

@app.route('/new_attendance', methods=['POST'])
def new_attendance():
    current_datetime = datetime.now(pytz.timezone('Asia/Manila')).strftime('%Y-%m-%d %H:%M:%S')
    current_date = datetime.now(pytz.timezone('Asia/Manila')).strftime('%Y-%m-%d')
    current_time = datetime.now(pytz.timezone('Asia/Manila')).strftime('%I:%M %p')

    student_number = request.form['student_number']
    student_name = request.form['student_name']
    course_year_section = request.form['course_year_section']
    image = request.form['image']

    conn = database_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM `students` WHERE `student_number` = %s", (student_number,))
    student_data = cursor.fetchone()
    
    conn = database_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM `attendance` WHERE `student_id` = %s AND `date` = %s", (student_data["id"], current_date))
    attendance_data = cursor.fetchone()

    is_attendance_ok = False

    if not attendance_data:
        conn = database_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO `attendance` (`uuid`, `student_id`, `date`, `time_in`, `created_at`, `updated_at`)
            VALUES (%s, %s, %s, %s, %s, %s)
            """, (str(uuid.uuid4()), student_data["id"], current_date, current_time, current_datetime, current_datetime))
        
        conn.commit()

        is_attendance_ok = True

        session["notification"] = "Success!|You have successfully TIME IN.|success"
    else:
        if not attendance_data["time_out"]:
            conn = database_connection()
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE `attendance` SET `time_out` = %s, `updated_at` = %s WHERE `student_id` = %s AND `date` = %s
                """, (current_time, current_datetime, student_data["id"], current_date))
            
            conn.commit()

            is_attendance_ok = True

            session["notification"] = "Success!|You have successfully TIME OUT.|success"
        else:
            session["notification"] = "Oops...|You have already taken attendace today.|error"

    if is_attendance_ok:
        session["student_attendance_result"] = {
            "student_id" : student_data["id"],
            "student_number" : student_number,
            "student_name" : student_name,
            "course_year_section" : course_year_section,
            "image" : image,
        }

    return jsonify(True)

@app.route('/logout', methods=['POST'])
def logout():
    session.pop("user_id", None)

    session["notification"] = {
        "type": "alert-success",
        "message": "You had been logged out",
    }

    return jsonify(True)

if __name__ == '__main__':
    initialize_database()

    app.run(debug=True)