import sys
import os

# Add the 'final' directory to sys.path dynamically
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from app.routes import schedule_router

# Initialize FastAPI app
app = FastAPI()

# Include routes
app.include_router(schedule_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
