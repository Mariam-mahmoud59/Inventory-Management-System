import os
import sys
from dotenv import load_dotenv

# Add the current directory to sys.path to allow importing from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.db.supabase import get_admin_client

def seed_database():
    supabase = get_admin_client()
    
    print("--- Starting Database Seeding ---")

    # 1. Create Admin User
    admin_email = "admin@ims-project.com"
    admin_password = "ChangeMe!2026"
    
    print(f"Creating admin user: {admin_email}...")
    try:
        auth_response = supabase.auth.admin.create_user({
            "email": admin_email,
            "password": admin_password,
            "email_confirm": True,
            "user_metadata": {"full_name": "System Administrator"},
        })
        admin_uid = auth_response.user.id
        print(f"Admin user created with ID: {admin_uid}")
    except Exception as e:
        print(f"Error creating admin user (might already exist): {e}")
        # Try to fetch existing user if creation failed
        users = supabase.auth.admin.list_users()
        admin_user = next((u for u in users if u.email == admin_email), None)
        if admin_user:
            admin_uid = admin_user.id
            print(f"Found existing admin user with ID: {admin_uid}")
        else:
            print("Could not find or create admin user. Exiting.")
            return

    # 2. Create Profile
    print("Creating admin profile...")
    try:
        supabase.table("profiles").upsert({
            "id": admin_uid,
            "full_name": "System Administrator",
            "role": "admin",
            "is_active": True,
        }).execute()
        print("Admin profile created/updated.")
    except Exception as e:
        print(f"Error creating profile: {e}")

    # 3. Seed Categories
    print("Seeding categories...")
    categories = [
        {"name": "Electronics", "description": "Electronic devices and components"},
        {"name": "Office Supplies", "description": "Stationery, paper, and office equipment"},
        {"name": "Raw Materials", "description": "Manufacturing inputs and raw materials"},
    ]
    try:
        supabase.table("categories").upsert(categories, on_conflict="name").execute()
        print("Categories seeded.")
    except Exception as e:
        print(f"Error seeding categories: {e}")

    # 4. Seed Branches
    print("Seeding branches...")
    branches = [
        {"name": "Main Warehouse", "address": "123 Industrial Ave", "phone": "+1-555-0100"},
        {"name": "Downtown Store", "address": "456 Main St", "phone": "+1-555-0200"},
    ]
    try:
        supabase.table("branches").upsert(branches, on_conflict="name").execute()
        print("Branches seeded.")
    except Exception as e:
        print(f"Error seeding branches: {e}")

    # 5. Link Admin to Branch
    print("Linking admin to Main Warehouse...")
    try:
        main_warehouse = supabase.table("branches").select("id").eq("name", "Main Warehouse").single().execute()
        if main_warehouse.data:
            supabase.table("profiles").update({"branch_id": main_warehouse.data["id"]}).eq("id", admin_uid).execute()
            print("Admin linked to Main Warehouse.")
    except Exception as e:
        print(f"Error linking admin to branch: {e}")

    print("--- Database Seeding Completed ---")

if __name__ == "__main__":
    seed_database()
