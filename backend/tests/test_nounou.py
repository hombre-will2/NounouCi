"""Backend tests for Nounou Connect CI - auth, profiles, nannies, matches, notifications, stats."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nounou-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

# unique phones per run
TS = str(int(time.time()))[-6:]
PARENT_PHONE = f"+22507{TS}11"
NANNY_PHONE = f"+22507{TS}22"
NANNY2_PHONE = f"+22507{TS}33"
PWD = "Test1234"

state = {}


def _post(path, json=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.post(f"{API}{path}", json=json, headers=h, timeout=15)


def _get(path, token=None, params=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.get(f"{API}{path}", headers=h, params=params, timeout=15)


def _put(path, json=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.put(f"{API}{path}", json=json, headers=h, timeout=15)


def _delete(path, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.delete(f"{API}{path}", headers=h, timeout=15)


# ---------- Auth ----------
class TestAuth:
    def test_register_parent(self):
        r = _post("/auth/register", {"phone": PARENT_PHONE, "password": PWD, "role": "parent",
                                     "first_name": "Aicha", "last_name": "Koffi"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d and d["user"]["role"] == "parent"
        assert d["user"]["phone"] == PARENT_PHONE
        state["parent_token"] = d["token"]
        state["parent_id"] = d["user"]["id"]
        # cookie set
        assert "access_token" in r.cookies or any("access_token" in c for c in r.headers.get("set-cookie", ""))

    def test_register_nanny(self):
        r = _post("/auth/register", {"phone": NANNY_PHONE, "password": PWD, "role": "nounou",
                                     "first_name": "Mariam", "last_name": "Diabate"})
        assert r.status_code == 200, r.text
        d = r.json()
        state["nanny_token"] = d["token"]
        state["nanny_id"] = d["user"]["id"]

    def test_register_nanny2(self):
        r = _post("/auth/register", {"phone": NANNY2_PHONE, "password": PWD, "role": "nounou",
                                     "first_name": "Fatou", "last_name": "Toure"})
        assert r.status_code == 200
        state["nanny2_token"] = r.json()["token"]
        state["nanny2_id"] = r.json()["user"]["id"]

    def test_register_duplicate_phone(self):
        r = _post("/auth/register", {"phone": PARENT_PHONE, "password": PWD, "role": "parent",
                                     "first_name": "X", "last_name": "Y"})
        assert r.status_code == 400

    def test_register_invalid_phone(self):
        r = _post("/auth/register", {"phone": "abc", "password": PWD, "role": "parent",
                                     "first_name": "X", "last_name": "Y"})
        assert r.status_code == 422

    def test_register_short_password(self):
        r = _post("/auth/register", {"phone": "+22507999999", "password": "12", "role": "parent",
                                     "first_name": "X", "last_name": "Y"})
        assert r.status_code == 422

    def test_login_success(self):
        r = _post("/auth/login", {"phone": PARENT_PHONE, "password": PWD})
        assert r.status_code == 200
        assert r.json()["user"]["phone"] == PARENT_PHONE
        assert "token" in r.json()

    def test_login_wrong_password(self):
        r = _post("/auth/login", {"phone": PARENT_PHONE, "password": "WrongPass"})
        assert r.status_code == 401

    def test_me_with_bearer(self):
        r = _get("/auth/me", token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["user"]["id"] == state["parent_id"]

    def test_me_unauthenticated(self):
        r = _get("/auth/me")
        assert r.status_code == 401

    def test_me_with_cookie(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"phone": PARENT_PHONE, "password": PWD}, timeout=15)
        r = s.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 200

    def test_logout(self):
        s = requests.Session()
        s.post(f"{API}/auth/login", json={"phone": PARENT_PHONE, "password": PWD}, timeout=15)
        r = s.post(f"{API}/auth/logout", timeout=15)
        assert r.status_code == 200
        # After logout, cookie cleared - /me without bearer should 401
        r2 = s.get(f"{API}/auth/me", timeout=15)
        assert r2.status_code == 401


# ---------- Profiles ----------
class TestProfiles:
    def test_nanny_profile_upsert(self):
        body = {"age": 28, "experience_years": 5, "quartier": "Cocody",
                "availability": "Temps plein", "hourly_rate": 1500, "bio": "Expérimentée",
                "languages": ["Français"], "childcare_types": ["Bébé", "Enfant"]}
        r = _put("/profile/nanny", body, token=state["nanny_token"])
        assert r.status_code == 200, r.text
        assert r.json()["profile"]["quartier"] == "Cocody"

    def test_nanny_profile_get_me(self):
        r = _get("/profile/nanny/me", token=state["nanny_token"])
        assert r.status_code == 200
        assert r.json()["profile"]["experience_years"] == 5

    def test_nanny_profile_forbidden_for_parent(self):
        r = _put("/profile/nanny", {"age": 30, "experience_years": 1, "quartier": "Plateau",
                                    "availability": "Temps partiel", "hourly_rate": 1000},
                 token=state["parent_token"])
        assert r.status_code == 403

    def test_nanny2_profile_upsert(self):
        body = {"age": 35, "experience_years": 10, "quartier": "Yopougon",
                "availability": "Temps partiel", "hourly_rate": 800, "bio": "Senior",
                "childcare_types": ["Aide aux devoirs"]}
        r = _put("/profile/nanny", body, token=state["nanny2_token"])
        assert r.status_code == 200

    def test_parent_profile_upsert(self):
        body = {"quartier": "Cocody", "address": "Riviera 3", "children_count": 2,
                "needs_description": "Garde après-école", "schedule": "Journée",
                "care_type": "Garde régulière", "budget_max": 100000}
        r = _put("/profile/parent", body, token=state["parent_token"])
        assert r.status_code == 200

    def test_parent_profile_get_me(self):
        r = _get("/profile/parent/me", token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["profile"]["quartier"] == "Cocody"

    def test_parent_profile_forbidden_for_nanny(self):
        r = _put("/profile/parent", {"quartier": "X", "children_count": 1, "schedule": "Journée",
                                     "care_type": "Ponctuelle", "budget_max": 5000},
                 token=state["nanny_token"])
        assert r.status_code == 403


# ---------- Nannies search ----------
class TestNannies:
    def test_list_all(self):
        r = _get("/nannies")
        assert r.status_code == 200
        assert isinstance(r.json()["nannies"], list)

    def test_filter_quartier(self):
        r = _get("/nannies", params={"quartier": "Cocody"})
        assert r.status_code == 200
        for n in r.json()["nannies"]:
            assert n["quartier"] == "Cocody"

    def test_filter_min_experience(self):
        r = _get("/nannies", params={"min_experience": 8})
        assert r.status_code == 200
        for n in r.json()["nannies"]:
            assert n["experience_years"] >= 8

    def test_filter_max_rate(self):
        r = _get("/nannies", params={"max_rate": 1000})
        assert r.status_code == 200
        for n in r.json()["nannies"]:
            assert n["hourly_rate"] <= 1000

    def test_filter_care_type(self):
        r = _get("/nannies", params={"care_type": "Bébé"})
        assert r.status_code == 200

    def test_search_text(self):
        r = _get("/nannies", params={"search": "Mariam"})
        assert r.status_code == 200

    def test_phone_hidden_in_list(self):
        r = _get("/nannies")
        for n in r.json()["nannies"]:
            assert "phone" not in n

    def test_get_single_requires_auth(self):
        r = _get(f"/nannies/{state['nanny_id']}")
        assert r.status_code == 401

    def test_get_single_phone_hidden_no_match(self):
        r = _get(f"/nannies/{state['nanny_id']}", token=state["parent_token"])
        assert r.status_code == 200
        assert "phone" not in r.json()["nanny"]


# ---------- Matches ----------
class TestMatches:
    def test_create_match_parent(self):
        r = _post("/matches", {"nanny_id": state["nanny_id"], "message": "Bonjour"},
                  token=state["parent_token"])
        assert r.status_code == 200, r.text
        state["match_id"] = r.json()["match"]["id"]
        assert r.json()["match"]["status"] == "pending"

    def test_create_match_duplicate(self):
        r = _post("/matches", {"nanny_id": state["nanny_id"], "message": "again"},
                  token=state["parent_token"])
        assert r.status_code == 400

    def test_create_match_nanny_missing_parent_id(self):
        # Bidirectional: nounou must provide parent_id (422 now instead of 403)
        r = _post("/matches", {"nanny_id": state["nanny2_id"]}, token=state["nanny_token"])
        assert r.status_code == 422

    def test_create_match_unknown_nanny(self):
        r = _post("/matches", {"nanny_id": "nonexistent-id"}, token=state["parent_token"])
        assert r.status_code == 404

    def test_list_matches_parent(self):
        r = _get("/matches", token=state["parent_token"])
        assert r.status_code == 200
        assert any(m["id"] == state["match_id"] for m in r.json()["matches"])

    def test_list_matches_nanny(self):
        r = _get("/matches", token=state["nanny_token"])
        assert r.status_code == 200
        assert any(m["id"] == state["match_id"] for m in r.json()["matches"])

    def test_update_match_forbidden_other_nanny(self):
        r = _put(f"/matches/{state['match_id']}", {"status": "accepted"},
                 token=state["nanny2_token"])
        assert r.status_code == 403

    def test_update_match_forbidden_parent(self):
        r = _put(f"/matches/{state['match_id']}", {"status": "accepted"},
                 token=state["parent_token"])
        assert r.status_code == 403

    def test_update_match_accept(self):
        r = _put(f"/matches/{state['match_id']}", {"status": "accepted"},
                 token=state["nanny_token"])
        assert r.status_code == 200
        assert r.json()["match"]["status"] == "accepted"

    def test_phone_visible_after_accept(self):
        r = _get(f"/nannies/{state['nanny_id']}", token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["nanny"].get("phone") == NANNY_PHONE

    def test_delete_match(self):
        r = _delete(f"/matches/{state['match_id']}", token=state["parent_token"])
        assert r.status_code == 200


# ---------- Notifications ----------
class TestNotifications:
    def test_notifications_for_nanny_after_request(self):
        # parent creates new match, nanny should get notification
        r = _post("/matches", {"nanny_id": state["nanny2_id"], "message": "Hi"},
                  token=state["parent_token"])
        assert r.status_code == 200
        state["match2_id"] = r.json()["match"]["id"]
        rn = _get("/notifications", token=state["nanny2_token"])
        assert rn.status_code == 200
        d = rn.json()
        assert d["unread"] >= 1
        assert len(d["notifications"]) >= 1
        state["notif_id"] = d["notifications"][0]["id"]

    def test_mark_one_read(self):
        r = _put(f"/notifications/{state['notif_id']}/read", token=state["nanny2_token"])
        assert r.status_code == 200

    def test_mark_all_read(self):
        r = _put("/notifications/read-all", token=state["nanny2_token"])
        assert r.status_code == 200
        rn = _get("/notifications", token=state["nanny2_token"])
        assert rn.json()["unread"] == 0

    def test_status_change_creates_notif_for_parent(self):
        # nanny2 declines
        r = _put(f"/matches/{state['match2_id']}", {"status": "declined"},
                 token=state["nanny2_token"])
        assert r.status_code == 200
        rn = _get("/notifications", token=state["parent_token"])
        assert rn.status_code == 200
        assert rn.json()["unread"] >= 1


# ---------- Stats ----------
class TestStats:
    def test_stats_public(self):
        r = _get("/stats")
        assert r.status_code == 200
        d = r.json()
        assert "nannies" in d and "parents" in d and "matches" in d
        assert all(isinstance(d[k], int) for k in ("nannies", "parents", "matches"))


# ---------- Cleanup ----------
class TestCleanup:
    def test_delete_nanny_profile(self):
        r = _delete("/profile/nanny/me", token=state["nanny_token"])
        assert r.status_code == 200
