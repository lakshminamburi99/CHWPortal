from app.db.session import engine
from app.models import Base

def init_db():
    print("Creating database tables dynamically via ORM metadata...")
    Base.metadata.create_all(bind=engine)
    print("All PostgreSQL tables created successfully!")

if __name__ == "__main__":
    init_db()
