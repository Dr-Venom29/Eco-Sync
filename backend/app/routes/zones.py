from flask import Blueprint, request, jsonify
from app.utils.supabase_client import get_supabase_client

bp = Blueprint('zones', __name__)
supabase = get_supabase_client()

@bp.route('/', methods=['GET'])
def get_zones():
    """Get all zones"""
    try:
        result = supabase.table('zones').select('*').execute()
        
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
def create_zone():
    """Create a new zone"""
    try:
        data = request.get_json()
        
        zone_data = {
            'name': data.get('name'),
            'description': data.get('description'),
            'boundaries': data.get('boundaries'),
            'assigned_staff': data.get('assigned_staff', [])
        }
        
        result = supabase.table('zones').insert(zone_data).execute()
        
        return jsonify({
            'success': True,
            'data': result.data[0] if result.data else None,
            'message': 'Zone created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<zone_id>', methods=['PUT'])
def update_zone(zone_id):
    """Update a zone"""
    try:
        data = request.get_json()
        
        result = supabase.table('zones').update(data).eq('id', zone_id).execute()
        
        return jsonify({
            'success': True,
            'data': result.data[0] if result.data else None,
            'message': 'Zone updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/<zone_id>', methods=['DELETE'])
def delete_zone(zone_id):
    """Delete a zone"""
    try:
        result = supabase.table('zones').delete().eq('id', zone_id).execute()
        
        return jsonify({
            'success': True,
            'message': 'Zone deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
