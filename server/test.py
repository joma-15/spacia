import pymysql

connection = pymysql.connect(
    host="localhost",
    user="root",
    password="uzumaki@15",
    database="spacia_db",
    port=3306
)

print("Connected!")
connection.close()