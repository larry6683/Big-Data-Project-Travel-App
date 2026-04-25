from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from app.api.v1.deps import get_db
from app.services.health_service import health_service

router = APIRouter()

@router.get("/")
async def check_health(
    background_tasks: BackgroundTasks, 
    force: bool = False, 
    db: Session = Depends(get_db)
):
    """
    Returns system health.
    Pass ?force=true to manually bypass the 48-hour cache.
    """
    # Pass the db session into our service
    report = await health_service.get_full_health_report(db, background_tasks, force_refresh=force)
    return report