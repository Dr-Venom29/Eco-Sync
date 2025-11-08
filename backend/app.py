import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
from supabase_client import supabase

app = Flask(__name__)
# Allow CORS for development. In production, restrict origins properly.
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# Simple health check
@app.route('/api/health')
def health():
    return jsonify({'status':'ok'})

# Create a complaint
@app.route('/api/complaints', methods=['POST'])
def create_complaint():
    data = request.json or {}
    title = data.get('title')
    description = data.get('description')
    user_id = data.get('user_id')  # optional; in real use, derive from JWT

    if not title or not description:
        return jsonify({'error':'title and description are required'}), 400

    # Example: insert into Supabase table called 'complaints'
    payload = {
        'title': title,
        'description': description,
        'status': 'pending',
        'user_id': user_id
    }

    try:
        res = supabase.table('complaints').insert(payload).execute()
        return jsonify({'data': res.data}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Fetch recent complaints (simple example)
@app.route('/api/complaints', methods=['GET'])
def list_complaints():
    try:
        res = supabase.table('complaints').select('*').order('created_at', desc=True).limit(50).execute()
        return jsonify({'data': res.data})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
