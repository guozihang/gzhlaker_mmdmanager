from flask import Flask, request, jsonify, g
import sqlite3
from datetime import datetime
import json
from flask_cors import CORS
DATABASE = 'server_info.db'
PASSWORD = "123456"

app = Flask(__name__)
CORS(app)
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    cur = get_db().execute(query, args)
    rv = cur.fetchall()
    cur.close()
    return (rv[0] if rv else None) if one else rv

def insert_server_info(hostname, data):
    db = get_db()
    db.execute('INSERT OR REPLACE INTO server_info (hostname, data, update_time) VALUES (?, ?, ?)',
               (hostname, json.dumps(data), datetime.now()))
    db.commit()

@app.route('/')
def hello():
    return "Hello World"

@app.route('/ping')
def ping():
    return "pong"

@app.route('/update', methods=['POST'])
def update():
    server_info = request.json
    if server_info.get('password') != PASSWORD:
        return "Password wrong!", 403
    else:
        hostname = server_info.get('hostname')
        if hostname:
            insert_server_info(hostname, server_info)
            return f"Welcome {hostname}!", 200
        return "Hostname is required", 400

@app.route('/info', methods=["GET"])
def info():
    server_info = query_db('SELECT * FROM server_info')
    return jsonify([{'hostname': row[0], 'data': json.loads(row[1]), 'update_time': row[2]} for row in server_info])

if __name__ == '__main__':
    app.run(debug=False, host='10.0.24.4', port=7070)
