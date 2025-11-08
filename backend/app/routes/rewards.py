from flask import Blueprint, request, jsonify
from app.utils.supabase_client import get_supabase_client

bp = Blueprint('rewards', __name__)
supabase = get_supabase_client()

@bp.route('/user/<user_id>', methods=['GET'])
def get_user_rewards(user_id):
    """Get user's rewards and points"""
    try:
        result = supabase.table('rewards').select('*').eq('user_id', user_id).execute()
        
        total_points = sum([r['points'] for r in result.data]) if result.data else 0
        
        badges_result = supabase.table('user_badges').select('*').eq('user_id', user_id).execute()
        
        return jsonify({
            'success': True,
            'data': {
                'total_points': total_points,
                'badges': badges_result.data if badges_result.data else [],
                'transactions': result.data if result.data else []
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top users by points"""
    try:
        # This would typically be a more complex query with aggregation
        result = supabase.table('users').select('id, full_name, total_points').order('total_points', desc=True).limit(10).execute()
        
        return jsonify({
            'success': True,
            'data': result.data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@bp.route('/badges', methods=['GET'])
def get_available_badges():
    """Get all available badges"""
    try:
        badges = [
            {'id': 1, 'name': 'First Report', 'icon': '📝', 'description': 'Submit your first complaint', 'points_required': 0},
            {'id': 2, 'name': 'Eco Beginner', 'icon': '🌱', 'description': 'Reach 100 points', 'points_required': 100},
            {'id': 3, 'name': 'Green Guardian', 'icon': '🌿', 'description': 'Reach 500 points', 'points_required': 500},
            {'id': 4, 'name': 'Waste Warrior', 'icon': '♻️', 'description': 'Submit 20 reports', 'points_required': 0},
            {'id': 5, 'name': 'Earth Champion', 'icon': '🌍', 'description': 'Reach 1000 points', 'points_required': 1000},
            {'id': 6, 'name': 'Eco Legend', 'icon': '🏆', 'description': 'Reach 2500 points', 'points_required': 2500},
        ]
        
        return jsonify({
            'success': True,
            'data': badges
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
