from flask import Flask, render_template, request, jsonify, redirect, url_for
from datetime import datetime

app = Flask(__name__)

# Banco de dados simulado em memória
tarefas = [
    {"id": 1, "titulo": "Aprender Flask", "descricao": "Estudar rotas e templates", "concluida": False, "data": "2025-01-15"},
    {"id": 2, "titulo": "Criar um projeto", "descricao": "Desenvolver uma aplicação completa", "concluida": False, "data": "2025-01-20"},
]

@app.route('/login')
def login():
    """Pagina login"""
    return render_template('login.html')

@app.route('/')
def index():
    """Página inicial - lista de tarefas"""
    return render_template('index.html', tarefas=tarefas, ano_atual=datetime.now().year)

@app.route('/sobre')
def sobre():
    """Página sobre"""
    return render_template('sobre.html')

@app.route('/adicionar', methods=['GET', 'POST'])
def adicionar():
    """Adicionar nova tarefa"""
    if request.method == 'POST':
        nova_tarefa = {
            "id": len(tarefas) + 1,
            "titulo": request.form.get('titulo'),
            "descricao": request.form.get('descricao'),
            "concluida": False,
            "data": request.form.get('data')
        }
        tarefas.append(nova_tarefa)
        return redirect(url_for('index'))
    
    return render_template('adicionar.html')

@app.route('/api/tarefa/<int:tarefa_id>/concluir', methods=['POST'])
def concluir_tarefa(tarefa_id):
    """API para marcar tarefa como concluída"""
    for tarefa in tarefas:
        if tarefa['id'] == tarefa_id:
            tarefa['concluida'] = not tarefa['concluida']
            return jsonify({"sucesso": True, "concluida": tarefa['concluida']})
    
    return jsonify({"sucesso": False, "mensagem": "Tarefa não encontrada"}), 404

@app.route('/api/tarefa/<int:tarefa_id>/deletar', methods=['DELETE'])
def deletar_tarefa(tarefa_id):
    """API para deletar tarefa"""
    global tarefas
    tarefas = [t for t in tarefas if t['id'] != tarefa_id]
    return jsonify({"sucesso": True})

@app.route('/api/estatisticas')
def estatisticas():
    """API que retorna estatísticas em JSON"""
    total = len(tarefas)
    concluidas = sum(1 for t in tarefas if t['concluida'])
    pendentes = total - concluidas
    
    return jsonify({
        "total": total,
        "concluidas": concluidas,
        "pendentes": pendentes,
        "percentual_conclusao": round((concluidas / total * 100) if total > 0 else 0, 2)
    })

# Filtro customizado para templates
@app.template_filter('formatar_data')
def formatar_data(data_str):
    """Formata data para exibição"""
    try:
        data = datetime.strptime(data_str, '%Y-%m-%d')
        return data.strftime('%d/%m/%Y')
    except:
        return data_str

if __name__ == '__main__':
    # Debug=True permite recarregar automaticamente ao fazer mudanças
    app.run(debug=True, host='0.0.0.0', port=5010)
