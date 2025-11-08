from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SUPABASE_URL'] = os.getenv('SUPABASE_URL')
    app.config['SUPABASE_KEY'] = os.getenv('SUPABASE_KEY')
    
    # Enable CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    from app.routes import complaints, users, zones, rewards, analytics
    
    app.register_blueprint(complaints.bp, url_prefix='/api/complaints')
    app.register_blueprint(users.bp, url_prefix='/api/users')
    app.register_blueprint(zones.bp, url_prefix='/api/zones')
    app.register_blueprint(rewards.bp, url_prefix='/api/rewards')
    app.register_blueprint(analytics.bp, url_prefix='/api/analytics')
    
    # Health check route
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'message': 'EcoSync API is running'}
    
    return app
