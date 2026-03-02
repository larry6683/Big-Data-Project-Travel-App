import redis
import json
from app.core.config import settings
from fastapi.encoders import jsonable_encoder  

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_cache(key: str):
    """Fetches data from Redis and converts it back to Python dict/list."""
    try:
        data = redis_client.get(key)
        if data:
            print(f"⚡ CACHE HIT for key: {key}")
            return json.loads(data)
    except Exception as e:
        print(f"⚠️ Redis GET Error: {e}")
    
    print(f"🐢 CACHE MISS for key: {key}")
    return None

def set_cache(key: str, data: any, expire_seconds: int = 1800):
    """Saves data to Redis with a 30-minute expiration by default."""
    try:
        json_compatible_data = jsonable_encoder(data)
        
        redis_client.setex(key, expire_seconds, json.dumps(json_compatible_data))
    except Exception as e:
        print(f"⚠️ Redis SET Error: {e}")

def increment_trending(set_name: str, item_name: str):
    """
    Increments a score in a Redis Sorted Set. 
    Redis automatically keeps this set sorted from highest to lowest.
    """
    try:
        # zincrby(name_of_set, amount_to_add, item_to_add)
        redis_client.zincrby(set_name, 1, item_name)
        print(f"📈 Updated leaderboard '{set_name}' for: {item_name}")
    except Exception as e:
        print(f"⚠️ Redis ZINCRBY Error: {e}")

def get_top_trending(set_name: str, limit: int = 3):
    """
    Instantly fetches the top N items from a Sorted Set.
    """
    try:
        # zrevrange gets the highest scores first. limit-1 because it's a 0-based index.
        results = redis_client.zrevrange(set_name, 0, limit - 1, withscores=True)
        # Formats the result nicely: [{"name": "jfk", "searches": 100}, ...]
        return [{"name": item[0], "searches": int(item[1])} for item in results]
    except Exception as e:
        print(f"⚠️ Redis ZREVRANGE Error: {e}")
        return []