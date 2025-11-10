# db.py
import mysql.connector

def conectar():
    conexao = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # XAMPP geralmente não tem senha
        database="regulacao_db",
        port=3306     # padrão do XAMPP
    )
    return conexao
