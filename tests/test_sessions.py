import pytest

from GoalDash_Lite import database, sessions
from GoalDash_Lite.auth_repository import create_user
from GoalDash_Lite.auth_schemas import UserRegister


@pytest.fixture
def account(tmp_path, monkeypatch):
    monkeypatch.setattr(
        database,
        "DATABASE_PATH",
        tmp_path / "sessions-test.db",
    )

    database.initialise_database()

    return create_user(
        UserRegister(
            display_name="Test User",
            email="session-test@example.com",
            password="a sample passphrase for testing",
        )
    )


def test_session_identifies_user_and_can_be_deleted(account):
    token = sessions.create_session(account.id)

    user = sessions.get_session_user(token)

    assert user is not None
    assert user.id == account.id

    sessions.delete_session(token)

    assert sessions.get_session_user(token) is None


def test_expired_session_is_rejected(account, monkeypatch):
    start_time = 1800000000
    monkeypatch.setattr(sessions, "time", lambda: start_time)

    token = sessions.create_session(account.id)

    monkeypatch.setattr(
        sessions,
        "time",
        lambda: start_time + sessions.SESSION_DURATION_SECONDS,
    )

    assert sessions.get_session_user(token) is None


def test_unknown_session_is_rejected(account):
    assert sessions.get_session_user("not-a-real-token") is None
    assert sessions.get_session_user(None) is None