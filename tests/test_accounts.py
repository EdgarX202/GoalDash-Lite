import pytest
from fastapi.testclient import TestClient

from GoalDash_Lite import database
from GoalDash_Lite.main import app

OLD_PASSWORD = "original password for testing"
NEW_PASSWORD = "replacement password for testing"


@pytest.fixture(autouse=True)
def temporary_database(tmp_path, monkeypatch):
    monkeypatch.setattr(
        database,
        "DATABASE_PATH",
        tmp_path / "accounts-test.db",
    )


def register_and_login(client, email):
    client.headers.update({"Origin": "http://localhost:8000"})

    credentials = {
        "email": email,
        "password": OLD_PASSWORD,
    }

    response = client.post(
        "/auth/register",
        json={
            **credentials,
            "display_name": "Test User",
        },
    )
    assert response.status_code == 201

    response = client.post("/auth/login", json=credentials)
    assert response.status_code == 200


def test_wrong_current_password_leaves_account_unchanged():
    with TestClient(app) as client:
        email = "password-test@example.com"
        register_and_login(client, email)

        response = client.post(
            "/auth/change-password",
            json={
                "current_password": "this is the wrong password",
                "new_password": NEW_PASSWORD,
            },
        )

        assert response.status_code == 400
        assert client.get("/auth/me").status_code == 200

        # The proposed new password must not work.
        response = client.post(
            "/auth/login",
            json={"email": email, "password": NEW_PASSWORD},
        )
        assert response.status_code == 401

        # The original password must still work.
        response = client.post(
            "/auth/login",
            json={"email": email, "password": OLD_PASSWORD},
        )
        assert response.status_code == 200


def test_password_change_invalidates_existing_sessions():
    with TestClient(app) as first, TestClient(app) as second:
        email = "sessions-test@example.com"
        register_and_login(first, email)

        # Simulate signing in on a second device.
        second.headers.update({"Origin": "http://localhost:8000"})
        response = second.post(
            "/auth/login",
            json={"email": email, "password": OLD_PASSWORD},
        )
        assert response.status_code == 200

        # Keep a copy to check that the server rejects the old cookie.
        old_cookies = dict(first.cookies)

        response = first.post(
            "/auth/change-password",
            json={
                "current_password": OLD_PASSWORD,
                "new_password": NEW_PASSWORD,
            },
        )
        assert response.status_code == 204

        assert first.get("/auth/me").status_code == 401
        assert second.get("/auth/me").status_code == 401

        first.cookies.update(old_cookies)
        assert first.get("/auth/me").status_code == 401
        first.cookies.clear()

        response = first.post(
            "/auth/login",
            json={"email": email, "password": OLD_PASSWORD},
        )
        assert response.status_code == 401

        response = first.post(
            "/auth/login",
            json={"email": email, "password": NEW_PASSWORD},
        )
        assert response.status_code == 200
        assert first.get("/auth/me").status_code == 200


def test_users_cannot_access_another_users_goal():
    with TestClient(app) as owner, TestClient(app) as other:
        register_and_login(owner, "owner@example.com")
        register_and_login(other, "other@example.com")

        goal_data = {
            "name": "Emergency fund",
            "category": "Savings",
            "target_pence": 100000,
        }

        response = owner.post("/goals", json=goal_data)
        assert response.status_code == 201

        goal = response.json()
        goal_url = f"/goals/{goal['id']}"

        # Another user's goal must not appear in the list.
        response = other.get("/goals")
        assert response.status_code == 200
        assert response.json() == []

        # Knowing its ID must not grant access.
        assert other.get(goal_url).status_code == 404

        response = other.put(
            goal_url,
            json={**goal_data, "name": "Changed by another user"},
        )
        assert response.status_code == 404

        response = other.post(
            f"{goal_url}/contributions",
            json={
                "amount_pence": 1000,
                "contributed_on": "2026-10-11",
            },
        )
        assert response.status_code == 404

        assert other.delete(goal_url).status_code == 404

        # The owner's original goal must remain unchanged.
        response = owner.get(goal_url)
        assert response.status_code == 200
        assert response.json() == goal