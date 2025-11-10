from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_from_directory
from flask_socketio import SocketIO, emit
from datetime import datetime
from db import conectar
import os
from werkzeug.utils import secure_filename
from uuid import uuid4

# Pasta de uploads (garantir que existe)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'exames')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'segredo123'
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('mensagem')
def handle_message(data):
    usuario = data.get('usuario', 'Anônimo')
    mensagem = data.get('mensagem', '')

    conexao = conectar()  # sua função de conexão MySQL
    cursor = conexao.cursor()
    cursor.execute(
        "INSERT INTO mensagens (usuario, mensagem) VALUES (%s, %s)",
        (usuario, mensagem)
    )
    conexao.commit()
    cursor.close()
    conexao.close()

    emit('message', {'usuario': usuario, 'mensagem': mensagem}, broadcast=True)

@app.route('/exames_agendados')
def exames_agendados():
    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)

    # Buscar pedidos para lista
    cursor.execute("""
        SELECT 
            p.id,
            p.nome_paciente,
            e.nome AS exame_nome,
            p.prioridade,
            p.status_agendamento,
            p.tentativas_contato,
            p.data_registro
        FROM pedidos_regulacao p
        JOIN exames e ON p.exame_id = e.id
        WHERE p.status = 'Enviado para agendamento'
        ORDER BY 
            CASE p.prioridade 
                WHEN 'P1' THEN 1 
                WHEN 'P2' THEN 2 
                ELSE 3 
            END,
            p.data_registro
    """)
    pedidos = cursor.fetchall()

    # Buscar resumo mensal
    cursor.execute("""
        SELECT 
            e.nome AS exame_nome,
            MONTH(p.data_registro) AS mes,
            YEAR(p.data_registro) AS ano,
            p.prioridade,
            COUNT(*) AS total
        FROM pedidos_regulacao p
        JOIN exames e ON p.exame_id = e.id
        WHERE p.status = 'Enviado para agendamento'
        GROUP BY e.nome, ano, mes, p.prioridade
        ORDER BY ano DESC, mes DESC, e.nome;
    """)
    resultados = cursor.fetchall()
    cursor.close()
    conexao.close()

    # Organiza em um dicionário de exames → meses → prioridade
    from calendar import month_abbr
    dados = {}

    for r in resultados:
        exame = r["exame_nome"]
        mes_label = f"{month_abbr[r['mes']]} {r['ano']}"  # Ex: "Jan 2025"
        prioridade = r["prioridade"]

        if exame not in dados:
            dados[exame] = {}

        if mes_label not in dados[exame]:
            dados[exame][mes_label] = {"P1": 0, "P2": 0}

        dados[exame][mes_label][prioridade] = r["total"]

    return render_template("exames_agendados.html", dados=dados)


@app.route('/pedidos', methods=['GET', 'POST'])
def listar_pedidos():
    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)

    # -------------------------------------
    # 🔹 Atualizações via AJAX (POST)
    # -------------------------------------
    if request.method == 'POST':
        pedido_id = request.form.get('pedido_id')
        acao = request.form.get('acao')

        if not pedido_id or not acao:
            cursor.close()
            conexao.close()
            return jsonify({"sucesso": False, "erro": "Dados incompletos"}), 400

        try:
            if acao == 'atualizar_separacao':
                nova_separacao = request.form.get('separacao')
                cursor.execute("""
                    UPDATE pedidos_regulacao 
                    SET separacao = %s 
                    WHERE id = %s
                """, (nova_separacao, pedido_id))
                conexao.commit()
                resposta = {"sucesso": True, "tipo": "separacao"}

            elif acao == 'enviar_regulacao':
                cursor.execute("""
                    UPDATE pedidos_regulacao
                    SET status = 'Encaminhado ao médico regulador'
                    WHERE id = %s
                """, (pedido_id,))
                conexao.commit()
                resposta = {"sucesso": True, "tipo": "envio", "id": pedido_id}

            else:
                resposta = {"sucesso": False, "erro": "Ação inválida"}
                return jsonify(resposta), 400

            cursor.close()
            conexao.close()
            return jsonify(resposta)

        except Exception as e:
            cursor.close()
            conexao.close()
            return jsonify({"sucesso": False, "erro": str(e)}), 500

    # -------------------------------------
    # 🔹 Exibição normal (GET)
    # -------------------------------------
    cursor.execute("""
        SELECT 
            p.id, p.protocolo, p.nome_paciente, p.prioridade, 
            p.altura, p.peso, p.observacoes, p.data_registro,
            p.anexo,
            u.nome AS unidade_nome,
            e.nome AS exame_nome,
            p.separacao,
            p.status
        FROM pedidos_regulacao p
        JOIN unidades_saude u ON p.unidade_id = u.id
        JOIN exames e ON p.exame_id = e.id
        WHERE p.status = 'Enviado ao malote'
        ORDER BY p.data_registro DESC
    """)
    pedidos = cursor.fetchall()

    cursor.close()
    conexao.close()
    return render_template('pedidos.html', pedidos=pedidos)



@app.route('/reprovados')
def pedidos_reprovados():
    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)

    cursor.execute("""
        SELECT 
            p.id, p.protocolo, p.nome_paciente, p.data_registro,
            p.anexo,
            u.nome AS unidade_nome,
            e.nome AS exame_nome,
            p.prioridade,
            p.observacoes
        FROM pedidos_regulacao p
        JOIN unidades_saude u ON p.unidade_id = u.id
        JOIN exames e ON p.exame_id = e.id
        WHERE p.status = 'Reprovado'
        ORDER BY p.data_registro DESC
    """)
    reprovados = cursor.fetchall()

    cursor.close()
    conexao.close()

    return render_template('reprovados.html', reprovados=reprovados)


@app.route('/regulacao')
def regulacao():
    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)

    # Buscar pedidos do tipo Cross/Estadual
    cursor.execute("""
        SELECT 
            p.id, p.protocolo, p.nome_paciente, p.prioridade,
            p.altura, p.peso, p.observacoes, p.data_registro,
            p.anexo,
            u.nome AS unidade_nome,
            e.nome AS exame_nome,
            p.separacao,
            p.status
        FROM pedidos_regulacao p
        JOIN unidades_saude u ON p.unidade_id = u.id
        JOIN exames e ON p.exame_id = e.id
        WHERE p.status = 'Encaminhado ao médico regulador'
        AND p.separacao = 'Cross/Estadual'
        ORDER BY p.data_registro DESC
    """)
    cross = cursor.fetchall()

    # Buscar pedidos do tipo Município
    cursor.execute("""
        SELECT 
            p.id, p.protocolo, p.nome_paciente, p.prioridade,
            p.altura, p.peso, p.observacoes, p.data_registro,
            p.anexo,
            u.nome AS unidade_nome,
            e.nome AS exame_nome,
            p.separacao,
            p.status
        FROM pedidos_regulacao p
        JOIN unidades_saude u ON p.unidade_id = u.id
        JOIN exames e ON p.exame_id = e.id
        WHERE p.status = 'Encaminhado ao médico regulador'
        AND p.separacao = 'Município'
        ORDER BY p.data_registro DESC
    """)
    municipio = cursor.fetchall()

    cursor.close()
    conexao.close()

    return render_template('regulacao.html', cross=cross, municipio=municipio)

@app.route("/regulacao/acao", methods=["POST"])
def acao_regulacao():
    pedido_id = request.form.get("pedido_id")
    acao = request.form.get("acao")
    motivo = request.form.get("motivo")

    print("📥 Recebido:", pedido_id, acao, motivo)

    if not pedido_id or not acao:
        return jsonify({"sucesso": False, "mensagem": "Campos obrigatórios ausentes"}), 400

    conexao = conectar()
    cursor = conexao.cursor()

    if acao == "aprovar":
        cursor.execute("""
            UPDATE pedidos_regulacao
            SET status = 'Enviado para agendamento'
            WHERE id = %s
        """, (pedido_id,))
    elif acao == "reprovar":
        cursor.execute("""
            UPDATE pedidos_regulacao
            SET status = 'Reprovado', observacoes = %s
            WHERE id = %s
        """, (motivo, pedido_id))
    else:
        cursor.close()
        conexao.close()
        return jsonify({"sucesso": False, "mensagem": "Ação inválida"}), 400

    conexao.commit()
    cursor.close()
    conexao.close()

    return jsonify({"sucesso": True, "acao": acao})


@app.route('/pesquisa_paciente', methods=['GET', 'POST'])
def pesquisa_paciente():
    resultados = []
    termo = ""

    if request.method == 'POST':
        termo = request.form.get('termo', '').strip()

        if termo:
            conexao = conectar()
            cursor = conexao.cursor(dictionary=True)

            cursor.execute("""
                SELECT 
                    p.protocolo,
                    p.nome_paciente,
                    p.prioridade,
                    p.status,
                    p.altura,
                    p.peso,
                    p.observacoes,
                    DATE_FORMAT(p.data_registro, '%d/%m/%Y') AS data_registro,
                    e.nome AS exame_nome,
                    u.nome AS unidade_nome
                FROM pedidos_regulacao p
                JOIN exames e ON p.exame_id = e.id
                JOIN unidades_saude u ON p.unidade_id = u.id
                WHERE p.nome_paciente LIKE %s OR p.protocolo LIKE %s
                ORDER BY p.data_registro DESC
            """, (f"%{termo}%", f"%{termo}%"))

            resultados = cursor.fetchall()
            cursor.close()
            conexao.close()

    return render_template('pesquisa_paciente.html', resultados=resultados, termo=termo)

@app.route('/api/sugestoes_pacientes')
def sugestoes_pacientes():
    termo = request.args.get('q', '').strip()

    if not termo:
        return jsonify([])

    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("""
        SELECT DISTINCT nome_paciente
        FROM pedidos_regulacao
        WHERE nome_paciente LIKE %s
        ORDER BY nome_paciente
        LIMIT 10
    """, (f"%{termo}%",))
    nomes = [row['nome_paciente'] for row in cursor.fetchall()]
    cursor.close()
    conexao.close()

    return jsonify(nomes)


@app.route('/recepcao_unidade', methods=['GET', 'POST'])
def recepcao_unidade():
    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)

    # Buscar unidades e exames cadastrados para preencher selects
    cursor.execute("SELECT id, nome FROM unidades_saude WHERE ativo = TRUE")
    unidades = cursor.fetchall()

    cursor.execute("SELECT id, nome, exige_altura, exige_peso FROM exames WHERE ativo = TRUE")
    exames = cursor.fetchall()

    # Se for um envio (POST)
    if request.method == 'POST':
        unidade_id = request.form.get('unidade')
        nome_paciente = request.form.get('nome_paciente')
        exame_id = request.form.get('exame')
        prioridade = request.form.get('prioridade')
        altura = request.form.get('altura') or None
        peso = request.form.get('peso') or None
        observacoes = request.form.get('observacoes')
        anexo_url = None

        # Trata arquivo enviado (opcional)
        arquivo = request.files.get('anexo')
        if arquivo and arquivo.filename:
            filename = arquivo.filename.lower()
            # Aceita somente PDF
            if not filename.endswith('.pdf'):
                cursor.close()
                conexao.close()
                return jsonify({"sucesso": False, "erro": "Apenas arquivos .pdf são permitidos."}), 400

            # Gera nome único e salva
            safe_name = secure_filename(arquivo.filename)
            unique_name = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid4().hex}_{safe_name}"
            save_path = os.path.join(UPLOAD_FOLDER, unique_name)
            arquivo.save(save_path)

            # URL pública para acessar o anexo (rota definida abaixo)
            anexo_url = url_for('uploaded_exame', filename=unique_name)

    # Gerar protocolo automaticamente
        cursor.execute("SELECT COUNT(*) AS total FROM pedidos_regulacao")
        total = cursor.fetchone()['total'] + 1
        protocolo = f"R-{datetime.now().year}-{total:06d}"

        # Tenta adicionar coluna 'anexo' caso não exista (MySQL 8+ suporta IF NOT EXISTS; se falhar, ignora)
        try:
            cursor.execute("ALTER TABLE pedidos_regulacao ADD COLUMN IF NOT EXISTS anexo VARCHAR(255) NULL")
        except Exception:
            # tentativa alternativa sem IF NOT EXISTS (MySQL antigas podem falhar)
            try:
                cursor.execute("ALTER TABLE pedidos_regulacao ADD COLUMN anexo VARCHAR(255) NULL")
            except Exception:
                pass

        # Inserir no banco (tenta incluir anexo; se coluna não existir ou falhar, insere sem anexo)
        try:
            cursor.execute("""
                INSERT INTO pedidos_regulacao 
                    (protocolo, unidade_id, nome_paciente, exame_id, prioridade, altura, peso, observacoes, anexo, status, data_registro)
                VALUES 
                    (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'Enviado ao malote', NOW())
            """, (protocolo, unidade_id, nome_paciente, exame_id, prioridade, altura, peso, observacoes, anexo_url))
            conexao.commit()
        except Exception:
            # Tenta inserir sem a coluna anexo (compatibilidade com esquemas antigos)
            conexao.rollback()
            cursor.execute("""
                INSERT INTO pedidos_regulacao 
                    (protocolo, unidade_id, nome_paciente, exame_id, prioridade, altura, peso, observacoes, status, data_registro)
                VALUES 
                    (%s, %s, %s, %s, %s, %s, %s, %s, 'Enviado ao malote', NOW())
            """, (protocolo, unidade_id, nome_paciente, exame_id, prioridade, altura, peso, observacoes))
            conexao.commit()

        cursor.close()
        conexao.close()

        # ✅ Retorna JSON (para o JavaScript exibir o modal)
        resp = {
            "sucesso": True,
            "protocolo": protocolo,
            "paciente": nome_paciente or "Não informado"
        }
        if anexo_url:
            resp['anexo_url'] = anexo_url
        return jsonify(resp)

    # Se for GET → exibe o formulário
    cursor.close()
    conexao.close()
    return render_template('recepcao_unidade.html', unidades=unidades, exames=exames)


@app.route("/chat")
def chat():
    if "usuario" not in session:
        return redirect(url_for("login"))

    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT usuario, mensagem FROM mensagens ORDER BY id ASC")
    mensagens = cursor.fetchall()
    cursor.close()
    conexao.close()

    # Passa o usuário logado para o template
    return render_template("chat.html", usuario=session["usuario"], mensagens=mensagens)



@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        usuario = request.form.get("usuario")
        senha = request.form.get("senha")

        conexao = conectar()
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE nome=%s AND senha=%s", (usuario, senha))
        usuario_encontrado = cursor.fetchone()
        cursor.close()
        conexao.close()

        if usuario_encontrado:
            session["usuario"] = usuario_encontrado["nome"]  # guarda o nome do usuário logado
            return redirect(url_for("chat"))
        else:
            return render_template("login.html", erro="Usuário ou senha incorretos!")

    return render_template("login.html")

@app.route('/logout')
def logout():
    session.pop('usuario', None)
    return redirect(url_for('login'))

@app.route('/sobre')
def sobre():
    """Página sobre"""
    return render_template('sobre.html')




@app.template_filter('formatar_data')
def formatar_data(data_str):
    """Formata data para exibição"""
    try:
        data = datetime.strptime(str(data_str), '%Y-%m-%d')
        return data.strftime('%d/%m/%Y')
    except:
        return data_str

@app.route('/api/exames_detalhes')
def exames_detalhes():
    exame = request.args.get('exame')
    mes = request.args.get('mes')  # Formato: "Nov 2025"
    prioridade = request.args.get('prioridade')
    
    if not all([exame, mes, prioridade]):
        return jsonify({"erro": "Parâmetros incompletos"}), 400
        
    try:
        # Converter "Nov 2025" para mês/ano numérico
        from calendar import month_abbr
        mes_num = list(month_abbr).index(mes.split()[0])
        ano = int(mes.split()[1])
        
        conexao = conectar()
        cursor = conexao.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT 
                p.id,
                p.protocolo,
                p.nome_paciente,
                u.nome AS unidade_nome,
                DATE_FORMAT(p.data_registro, '%d/%m/%Y') AS data_registro,
                p.status
            FROM pedidos_regulacao p
            JOIN exames e ON p.exame_id = e.id
            JOIN unidades_saude u ON p.unidade_id = u.id
            WHERE e.nome = %s
            AND MONTH(p.data_registro) = %s
            AND YEAR(p.data_registro) = %s
            AND p.prioridade = %s
            AND p.status = 'Enviado para agendamento'
            ORDER BY p.data_registro DESC
        """, (exame, mes_num, ano, prioridade))
        
        detalhes = cursor.fetchall()
        cursor.close()
        conexao.close()
        
        return jsonify(detalhes)
        
    except Exception as e:
        print("Erro ao buscar detalhes:", str(e))  # Log do erro no servidor
        return jsonify({"erro": str(e)}), 500


@app.route('/uploads/exames/<path:filename>')
def uploaded_exame(filename):
    # Serve arquivos da pasta de uploads de exames somente a partir do diretório definido
    return send_from_directory(UPLOAD_FOLDER, filename)

from flask import render_template, request, jsonify, redirect, url_for
from datetime import datetime

@app.route('/agendar/<int:pedido_id>', methods=['GET', 'POST'])
def agendar_pedido(pedido_id):
    conexao = conectar()
    cursor = conexao.cursor(dictionary=True)

    try:
        # ------------------------------------------
        # 🧩 Se for POST → registrar tentativa
        # ------------------------------------------
        if request.method == 'POST':
            resultado = request.form.get('resultado')
            observacao = request.form.get('observacao', '')
            data_hora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

            if not resultado:
                return jsonify({'erro': 'Resultado é obrigatório'}), 400

            # Buscar estado atual do pedido
            cursor.execute("""
                SELECT tentativas_contato, status_agendamento 
                FROM pedidos_regulacao 
                WHERE id = %s
            """, (pedido_id,))
            pedido = cursor.fetchone()

            if not pedido:
                return jsonify({'erro': 'Pedido não encontrado'}), 404

            if pedido['tentativas_contato'] >= 3 or pedido['status_agendamento'] in ['Agendado', 'Cancelado por não contato']:
                return jsonify({'erro': 'Pedido já finalizado ou limite de tentativas atingido'}), 400

            # Registrar tentativa
            cursor.execute("""
                INSERT INTO tentativas_contato (pedido_id, data_hora, resultado, observacao)
                VALUES (%s, %s, %s, %s)
            """, (pedido_id, data_hora, resultado, observacao))

            # Atualizar contagem e status
            novas_tentativas = pedido['tentativas_contato'] + 1

            if resultado == 'Atendeu':
                novo_status = 'Agendado'
            elif novas_tentativas >= 3 and resultado != 'Atendeu':
                novo_status = 'Cancelado por não contato'
            else:
                novo_status = 'Em tentativa de contato'

            cursor.execute("""
                UPDATE pedidos_regulacao 
                SET tentativas_contato = %s,
                    status_agendamento = %s,
                    data_agendamento = CASE 
                        WHEN %s = 'Agendado' THEN %s
                        ELSE NULL
                    END,
                    status = CASE
                        WHEN %s = 'Agendado' THEN 'Agendado'
                        WHEN %s = 'Cancelado por não contato' THEN 'Cancelado'
                        ELSE status
                    END
                WHERE id = %s
            """, (
                novas_tentativas,
                novo_status,
                novo_status,
                data_hora if novo_status == 'Agendado' else None,
                novo_status,
                novo_status,
                pedido_id
            ))

            conexao.commit()
            cursor.close()
            conexao.close()

            return redirect(url_for('agendar_pedido', pedido_id=pedido_id))

        # ------------------------------------------
        # 🧾 Se for GET → mostrar dados do pedido
        # ------------------------------------------
        cursor.execute("""
            SELECT 
                p.id,
                p.nome_paciente,
                p.telefone,
                p.protocolo,
                p.status,
                p.status_agendamento,
                p.tentativas_contato,
                p.prioridade,
                p.data_registro,
                p.observacoes,
                e.nome AS exame_nome,
                u.nome AS unidade_nome
            FROM pedidos_regulacao p
            JOIN exames e ON p.exame_id = e.id
            JOIN unidades_saude u ON p.unidade_id = u.id
            WHERE p.id = %s
        """, (pedido_id,))
        
        pedido = cursor.fetchone()

        if not pedido:
            return render_template('erro.html', mensagem="Pedido não encontrado")

        # Buscar histórico de contatos
        cursor.execute("""
            SELECT data_hora, resultado, observacao
            FROM tentativas_contato
            WHERE pedido_id = %s
            ORDER BY data_hora DESC
        """, (pedido_id,))
        historico = cursor.fetchall()

        return render_template('agendar.html', pedido=pedido, historico=historico)

    except Exception as e:
        print("Erro ao processar agendamento:", str(e))
        conexao.rollback()
        return render_template('erro.html', mensagem=f"Erro: {str(e)}")

    finally:
        cursor.close()
        conexao.close()


if __name__ == '__main__':
    socketio.run(app, debug=True,host='0.0.0.0', port=5010)
