import pytest
from fastapi.testclient import TestClient

from GoalDash_Lite import database
from GoalDash_Lite.main import app


@pytest.fixture(autouse=True)
def temporary_database(tmp_path, monkeypatch):
    monkeypatch.setattr(
        database,
        "DATABASE_PATH",
        tmp_path / "test.db",
    )


def create_test_goal(client):
    response = client.post(
        "/goals",
        json={
            "name": "Emergency fund",
            "category": "Savings",
            "target_pence": 100000,
        },
    )

    assert response.status_code == 201
    return response.json()


def test_contribution_changes_update_total():
    with TestClient(app) as client:
        goal = create_test_goal(client)
        goal_url = f"/goals/{goal['id']}"
        contributions_url = f"{goal_url}/contributions"

        response = client.post(
            contributions_url,
            json={
                "amount_pence": 2500,
                "contributed_on": "2026-10-01",
            },
        )

        assert response.status_code == 201
        contribution_id = response.json()["contributions"][0]["id"]

        response = client.post(
            contributions_url,
            json={
                "amount_pence": 1000,
                "contributed_on": "2026-10-02",
            },
        )

        assert response.status_code == 201
        assert response.json()["contributed_pence"] == 3500

        entry_url = f"{contributions_url}/{contribution_id}"

        response = client.put(
            entry_url,
            json={
                "amount_pence": 4000,
                "contributed_on": "2026-10-01",
            },
        )

        assert response.status_code == 200
        assert response.json()["contributed_pence"] == 5000
        assert len(response.json()["contributions"]) == 2

        response = client.delete(entry_url)

        assert response.status_code == 200
        assert response.json()["contributed_pence"] == 1000
        assert len(response.json()["contributions"]) == 1

        saved_goal = client.get(goal_url)
        assert saved_goal.status_code == 200
        assert saved_goal.json()["contributed_pence"] == 1000


def test_goal_and_contribution_survive_app_restart():
    with TestClient(app) as client:
        goal = create_test_goal(client)
        goal_url = f"/goals/{goal['id']}"

        response = client.post(
            f"{goal_url}/contributions",
            json={
                "amount_pence": 2500,
                "contributed_on": "2026-10-01",
            },
        )

        assert response.status_code == 201
        saved_goal = response.json()

    # Start a new app lifespan using the same temporary database.
    with TestClient(app) as restarted_client:
        response = restarted_client.get(goal_url)

        assert response.status_code == 200
        assert response.json() == saved_goal


def test_zero_target_is_rejected():
    with TestClient(app) as client:
        response = client.post(
            "/goals",
            json={
                "name": "Invalid goal",
                "category": "Savings",
                "target_pence": 0,
            },
        )

        assert response.status_code == 422
        assert client.get("/goals").json() == []