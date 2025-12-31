import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

res = supabase.table("businesses").select("*").ilike("name", "%Small Branch Place%").execute()
print("Businesses:", res.data)

if res.data:
    biz_id = res.data[0]['id']
    res_feedback = supabase.table("feedback").select("*").eq("business_id", biz_id).execute()
    print("Feedback:", res_feedback.data)
    
    res_captures = supabase.table("review_contact_captures").select("*").eq("business_id", biz_id).execute()
    print("Captures:", res_captures.data)
