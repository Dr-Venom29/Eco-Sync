from flask import Blueprint, request, jsonify
from app.utils.supabase_client import get_supabase_client

bp = Blueprint('users', __name__)
supabase = get_supabase_client()

@bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user profile"""
    try:
        result = supabase.table('users').select('*').eq('id', user_id).execute()
        
        if not result.data:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': result.data[0]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user profile"""
    try:
        data = request.get_json()
        
        update_data = {}
        allowed_fields = ['full_name', 'phone', 'address', 'zone_id']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        result = supabase.table('users').update(update_data).eq('id', user_id).execute()
        
        return jsonify({
            'success': True,
            'data': result.data[0] if result.data else None,
            'message': 'Profile updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/staff', methods=['GET'])
def get_staff():
    """Get all staff members"""
    try:
        result = supabase.table('users').select('*').eq('role', 'staff').execute()
        
        return jsonify({
            'success': True,
            'data': result.data,
            'count': len(result.data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
