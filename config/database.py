import mysql.connector, pytz, bcrypt, uuid
from datetime import datetime

current_datetime = datetime.now(pytz.timezone('Asia/Manila')).strftime('%Y-%m-%d %H:%M:%S')
current_date = datetime.now(pytz.timezone('Asia/Manila')).strftime('%Y-%m-%d')
current_time = datetime.now(pytz.timezone('Asia/Manila')).strftime('%I:%M %p')

db_config = {
    'user': 'root',
    'password': '',
    'host': 'localhost',
    'database': 'attendance_system_using_facial_recognition'
}

def database_connection():
    connection = mysql.connector.connect(user=db_config['user'], password=db_config['password'], host=db_config['host'])

    return connection

def create_database():
    conn = database_connection()
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_config['database']}")

def create_admin_table():
    conn = database_connection()
    cursor = conn.cursor()
    cursor.execute(f"USE {db_config['database']}")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS `users` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `uuid` VARCHAR(255) UNIQUE NOT NULL,
            `name` VARCHAR(255) NOT NULL,
            `username` VARCHAR(255) UNIQUE NOT NULL,
            `password` VARCHAR(255) NOT NULL,
            `image` VARCHAR(255) NOT NULL,
            `created_at` VARCHAR(255) NOT NULL,
            `updated_at` VARCHAR(255) NOT NULL
        )
    """)

def create_students_table():
    conn = database_connection()
    cursor = conn.cursor()
    cursor.execute(f"USE {db_config['database']}")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS `students` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `uuid` VARCHAR(255) UNIQUE NOT NULL,
            `first_name` VARCHAR(255) NOT NULL,
            `middle_name` VARCHAR(255) NOT NULL,
            `last_name` VARCHAR(255) NOT NULL,
            `date_of_birth` VARCHAR(255) NOT NULL,
            `gender` VARCHAR(255) NOT NULL,
            `nationality` VARCHAR(255) NOT NULL,
            `mobile_number` VARCHAR(255) NOT NULL,
            `email_address` VARCHAR(255) NOT NULL,
            `address` TEXT NOT NULL,
            `image` VARCHAR(255) NOT NULL,
            `student_number` VARCHAR(255) UNIQUE NOT NULL,
            `course` VARCHAR(255) NOT NULL,
            `year` VARCHAR(255) NOT NULL,
            `section` VARCHAR(255) NOT NULL,
            `created_at` VARCHAR(255) NOT NULL,
            `updated_at` VARCHAR(255) NOT NULL
        )
    """)

def create_attendance_table():
    conn = database_connection()
    cursor = conn.cursor()
    cursor.execute(f"USE {db_config['database']}")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS `attendance` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `uuid` VARCHAR(255) UNIQUE NOT NULL,
            `student_id` INT NOT NULL,
            `date` VARCHAR(255) NOT NULL,
            `time_in` VARCHAR(255) NOT NULL,
            `time_out` VARCHAR(255) NOT NULL,
            `created_at` VARCHAR(255) NOT NULL,
            `updated_at` VARCHAR(255) NOT NULL
        )
    """)

def insert_admin_data():
    conn = database_connection()
    cursor = conn.cursor()
    cursor.execute(f"USE {db_config['database']}")

    cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
    result = cursor.fetchone()

    if result[0] == 0:
        hashed_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt())
        cursor.execute("""
            INSERT INTO users (`uuid`, `name`, `username`, `password`, `image`, `created_at`, `updated_at`) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(uuid.uuid4()), 'Administrator', 'admin', hashed_password, 'default-user-image.png', current_datetime, current_datetime))

        conn.commit()

    cursor.close()
    conn.close()

def initialize_database():
    create_database()
    create_admin_table()
    create_students_table()
    create_attendance_table()
    insert_admin_data()