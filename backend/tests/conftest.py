import pytest
from fastapi.testclient import TestClient
from app.main import app  # Adjust this to where your FastAPI 'app' is defined

@pytest.fixture
def client():
    """
    Creates a TestClient for every test case.
    This resolves the 'fixture client not found' error.
    """
    with TestClient(app) as c:
        yield c