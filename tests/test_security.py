from GoalDash_Lite.security import hash_password, verify_password


def test_password_hashing_and_verification():
    password = "a sample passphrase for testing"
    stored_hash = hash_password(password)

    assert stored_hash != password
    assert verify_password(password, stored_hash) is True
    assert verify_password("an incorrect password", stored_hash) is False