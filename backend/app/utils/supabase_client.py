import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase_url: str = os.getenv('SUPABASE_URL')
supabase_key: str = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    raise ValueError("Missing Supabase configuration. Please check your .env file.")

supabase: Client = create_client(supabase_url, supabase_key)

def get_supabase_client() -> Client:
    """Get the Supabase client instance"""
    return supabase
