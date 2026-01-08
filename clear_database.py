"""
Clear all data from the database using direct database connection
"""
import pymongo
from urllib.parse import quote_plus

# MongoDB connection details
username = quote_plus("arufaysonic")
password = quote_plus("HydRxA1109")
host = "cluster0.fvfbwmk.mongodb.net"
database_name = "saerpk_local"

# Create connection string
connection_string = f"mongodb+srv://{username}:{password}@{host}/?retryWrites=true&w=majority"

print("=" * 80)
print("CLEARING ALL DATA FROM DATABASE")
print("=" * 80)

try:
    # Connect to MongoDB
    client = pymongo.MongoClient(connection_string)
    db = client[database_name]
    
    # Get all collection names
    collections = db.list_collection_names()
    
    print(f"\nFound {len(collections)} collections in database '{database_name}'")
    print("\nDeleting all documents from each collection...\n")
    
    total_deleted = 0
    
    for collection_name in collections:
        collection = db[collection_name]
        count = collection.count_documents({})
        
        if count > 0:
            result = collection.delete_many({})
            total_deleted += result.deleted_count
            print(f"✓ Deleted {result.deleted_count} documents from '{collection_name}'")
        else:
            print(f"  Skipped '{collection_name}' (already empty)")
    
    print("\n" + "=" * 80)
    print("DATABASE CLEARED SUCCESSFULLY!")
    print("=" * 80)
    print(f"\nTotal collections processed: {len(collections)}")
    print(f"Total documents deleted: {total_deleted}")
    print("\nAll collections are now empty.")
    print("=" * 80)
    
    client.close()
    
except Exception as e:
    print(f"\n✗ ERROR: {e}")
    print("\nFailed to clear database.")
