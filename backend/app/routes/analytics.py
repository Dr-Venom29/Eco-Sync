from flask import Blueprint, request, jsonify
from app.utils.supabase_client import get_supabase_client
from datetime import datetime, timedelta

bp = Blueprint('analytics', __name__)
supabase = get_supabase_client()

@bp.route('/overview', methods=['GET'])
def get_overview():
    """Get overall analytics"""
    try:
        # Get complaints stats
        complaints = supabase.table('complaints').select('*').execute()
        
        # Get user stats
        users = supabase.table('users').select('id, role').execute()
        
        stats = {
            'total_complaints': len(complaints.data),
            'pending_complaints': len([c for c in complaints.data if c['status'] == 'pending']),
            'resolved_complaints': len([c for c in complaints.data if c['status'] == 'resolved']),
            'total_users': len([u for u in users.data if u['role'] == 'citizen']),
            'total_staff': len([u for u in users.data if u['role'] == 'staff']),
            'resolution_rate': round((len([c for c in complaints.data if c['status'] == 'resolved']) / len(complaints.data) * 100), 2) if complaints.data else 0
        }
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/trends', methods=['GET'])
def get_trends():
    """Get complaint trends over time"""
    try:
        days = int(request.args.get('days', 30))
        
        # This is a simplified version - you'd want to use proper date filtering
        result = supabase.table('complaints').select('created_at, status').execute()
        
        return jsonify({
            'success': True,
            'data': result.data,
            'message': 'Trends data (simplified version)'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/performance', methods=['GET'])
def get_performance():
    """Get staff performance metrics"""
    try:
        # Get resolved complaints by staff
        result = supabase.table('complaints').select('assigned_to, status, resolved_at, created_at').eq('status', 'resolved').execute()
        
        return jsonify({
            'success': True,
            'data': result.data,
            'message': 'Performance data'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
