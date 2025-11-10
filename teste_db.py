# test_db.py
from db import conectar

try:
    conexao = conectar()
    print("✅ Conexão bem-sucedida!")
    conexao.close()
except Exception as e:
    print("❌ Erro ao conectar:", e)
