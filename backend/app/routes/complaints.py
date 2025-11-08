from flask import Blueprint, request, jsonify
from app.utils.supabase_client import get_supabase_client
from datetime import datetime

bp = Blueprint('complaints', __name__)
supabase = get_supabase_client()

@bp.route('/', methods=['GET'])
def get_complaints():
    """Get all complaints or filter by user"""
    try:
        user_id = request.args.get('user_id')
        status = request.args.get('status')
        
        query = supabase.table('complaints').select('*')
        
        if user_id:
            query = query.eq('user_id', user_id)
        
        if status:
            query = query.eq('status', status)
        
        result = query.order('created_at', desc=True).execute()
        
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

@bp.route('/', methods=['POST'])
def create_complaint():
    """Create a new complaint"""
    try:
        data = request.get_json()
        
        complaint_data = {
            'user_id': data.get('user_id'),
            'title': data.get('title'),
            'description': data.get('description'),
            'category': data.get('category'),
            'location': data.get('location'),
            'latitude': data.get('latitude'),
            'longitude': data.get('longitude'),
            'status': 'pending',
            'priority': data.get('priority', 'medium'),
            'media_url': data.get('media_url'),
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = supabase.table('complaints').insert(complaint_data).execute()
        
        # Award points to user
        if result.data:
            supabase.rpc('add_user_points', {
                'user_id': data.get('user_id'),
                'points': 10
            }).execute()
        
        return jsonify({
            'success': True,
            'data': result.data[0] if result.data else None,
            'message': 'Complaint created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<complaint_id>', methods=['GET'])
def get_complaint(complaint_id):
    """Get a specific complaint by ID"""
    try:
        result = supabase.table('complaints').select('*').eq('id', complaint_id).execute()
        
        if not result.data:
            return jsonify({
                'success': False,
                'error': 'Complaint not found'
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

@bp.route('/<complaint_id>', methods=['PUT'])
def update_complaint(complaint_id):
    """Update a complaint"""
    try:
        data = request.get_json()
        
        update_data = {}
        allowed_fields = ['status', 'priority', 'assigned_to', 'notes', 'resolved_at']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if 'status' in update_data and update_data['status'] == 'resolved':
            update_data['resolved_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table('complaints').update(update_data).eq('id', complaint_id).execute()
        
        return jsonify({
            'success': True,
            'data': result.data[0] if result.data else None,
            'message': 'Complaint updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<complaint_id>', methods=['DELETE'])
def delete_complaint(complaint_id):
    """Delete a complaint"""
    try:
        result = supabase.table('complaints').delete().eq('id', complaint_id).execute()
        
        return jsonify({
            'success': True,
            'message': 'Complaint deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/stats', methods=['GET'])
def get_stats():
    """Get complaint statistics"""
    try:
        user_id = request.args.get('user_id')
        
        query = supabase.table('complaints').select('status')
        
        if user_id:
            query = query.eq('user_id', user_id)
        
        result = query.execute()
        
        stats = {
            'total': len(result.data),
            'pending': len([c for c in result.data if c['status'] == 'pending']),
            'assigned': len([c for c in result.data if c['status'] == 'assigned']),
            'in_progress': len([c for c in result.data if c['status'] == 'in-progress']),
            'resolved': len([c for c in result.data if c['status'] == 'resolved']),
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
