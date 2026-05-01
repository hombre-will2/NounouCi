"""Iteration 4: Backend tests for admin seeding + /api/ads CRUD + public /api/ads/active."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nounou-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_PHONE = "+2250100000000"
ADMIN_PWD = "Admin1234"

TS = str(int(time.time()))[-6:]
PARENT_PHONE = f"+22506{TS}11"
NANNY_PHONE = f"+22506{TS}22"
PWD = "Test1234"

state = {}


def _post(path, json=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.post(f"{API}{path}", json=json, headers=h, timeout=15)


def _get(path, token=None, params=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.get(f"{API}{path}", headers=h, params=params, timeout=30)


def _put(path, json=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.put(f"{API}{path}", json=json, headers=h, timeout=15)


def _delete(path, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.delete(f"{API}{path}", headers=h, timeout=15)


# ---------- Admin seeding & auth ----------
class TestAdminSeed:
    def test_admin_login(self):
        r = _post("/auth/login", {"phone": ADMIN_PHONE, "password": ADMIN_PWD})
        assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
        d = r.json()
        assert d["user"]["role"] == "admin", f"role mismatch: {d['user']}"
        assert d["user"]["phone"] == ADMIN_PHONE
        assert "token" in d and len(d["token"]) > 20
        state["admin_token"] = d["token"]
        state["admin_id"] = d["user"]["id"]

    def test_admin_me(self):
        r = _get("/auth/me", token=state["admin_token"])
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_register_with_role_admin_rejected(self):
        """Pydantic Literal['nounou','parent'] must reject role=admin via register."""
        r = _post("/auth/register", {
            "phone": f"+22507{TS}99", "password": "Test1234", "role": "admin",
            "first_name": "Hack", "last_name": "Er",
        })
        assert r.status_code == 422, f"Expected 422 for role=admin register, got {r.status_code}: {r.text}"


# ---------- Setup test users (parent + nounou for RBAC) ----------
class TestSetupUsers:
    def test_register_parent(self):
        r = _post("/auth/register", {"phone": PARENT_PHONE, "password": PWD, "role": "parent",
                                     "first_name": "Awa", "last_name": "Test"})
        assert r.status_code == 200, r.text
        state["parent_token"] = r.json()["token"]

    def test_register_nanny(self):
        r = _post("/auth/register", {"phone": NANNY_PHONE, "password": PWD, "role": "nounou",
                                     "first_name": "Mara", "last_name": "Test"})
        assert r.status_code == 200, r.text
        state["nanny_token"] = r.json()["token"]


# ---------- Ads CRUD ----------
class TestAdsCreate:
    def test_create_ad_unauth(self):
        r = _post("/ads", {"title": "X", "image_url": "http://x.png",
                           "placement": "home", "active": True})
        assert r.status_code == 401

    def test_create_ad_as_parent_forbidden(self):
        r = _post("/ads", {"title": "X", "image_url": "http://x.png",
                           "placement": "home"}, token=state["parent_token"])
        assert r.status_code == 403

    def test_create_ad_as_nanny_forbidden(self):
        r = _post("/ads", {"title": "X", "image_url": "http://x.png",
                           "placement": "home"}, token=state["nanny_token"])
        assert r.status_code == 403

    def test_create_ad_as_admin_home(self):
        payload = {
            "title": "TEST_AD_HOME",
            "image_url": "https://example.com/banner-home.png",
            "link_url": "https://example.com/promo",
            "placement": "home",
            "active": True,
        }
        r = _post("/ads", payload, token=state["admin_token"])
        assert r.status_code == 200, r.text
        ad = r.json()["ad"]
        assert ad["id"]
        assert ad["title"] == "TEST_AD_HOME"
        assert ad["placement"] == "home"
        assert ad["active"] is True
        assert ad["link_url"] == "https://example.com/promo"
        assert "created_at" in ad and "updated_at" in ad
        assert "_id" not in ad
        state["ad_home_id"] = ad["id"]

    def test_create_ad_as_admin_pre_contact(self):
        payload = {
            "title": "TEST_AD_PRECONTACT",
            "image_url": "https://example.com/banner-pc.png",
            "placement": "pre_contact",
            "active": True,
        }
        r = _post("/ads", payload, token=state["admin_token"])
        assert r.status_code == 200, r.text
        state["ad_pc_id"] = r.json()["ad"]["id"]

    def test_create_ad_inactive_home(self):
        payload = {
            "title": "TEST_AD_INACTIVE",
            "image_url": "https://example.com/inactive.png",
            "placement": "home",
            "active": False,
        }
        r = _post("/ads", payload, token=state["admin_token"])
        assert r.status_code == 200, r.text
        state["ad_inactive_id"] = r.json()["ad"]["id"]

    def test_create_ad_invalid_placement(self):
        r = _post("/ads", {"title": "X", "image_url": "http://x.png",
                           "placement": "sidebar"}, token=state["admin_token"])
        assert r.status_code == 422

    def test_create_ad_missing_title(self):
        r = _post("/ads", {"image_url": "http://x.png", "placement": "home"},
                  token=state["admin_token"])
        assert r.status_code == 422


class TestAdsList:
    def test_list_ads_unauth(self):
        r = _get("/ads")
        assert r.status_code == 401

    def test_list_ads_as_parent_forbidden(self):
        r = _get("/ads", token=state["parent_token"])
        assert r.status_code == 403

    def test_list_ads_as_admin(self):
        r = _get("/ads", token=state["admin_token"])
        assert r.status_code == 200
        ads = r.json()["ads"]
        ids = {a["id"] for a in ads}
        assert state["ad_home_id"] in ids
        assert state["ad_pc_id"] in ids
        assert state["ad_inactive_id"] in ids
        for a in ads:
            assert "_id" not in a


class TestAdsActivePublic:
    def test_public_active_no_auth_required(self):
        r = _get("/ads/active")
        assert r.status_code == 200, r.text
        for a in r.json()["ads"]:
            assert a["active"] is True

    def test_public_active_filter_home(self):
        r = _get("/ads/active", params={"placement": "home"})
        assert r.status_code == 200
        ads = r.json()["ads"]
        ids = {a["id"] for a in ads}
        assert state["ad_home_id"] in ids
        # Inactive home ad must NOT appear
        assert state["ad_inactive_id"] not in ids
        # pre_contact ad must NOT appear
        assert state["ad_pc_id"] not in ids
        for a in ads:
            assert a["placement"] == "home"
            assert a["active"] is True

    def test_public_active_filter_pre_contact(self):
        r = _get("/ads/active", params={"placement": "pre_contact"})
        assert r.status_code == 200
        ads = r.json()["ads"]
        ids = {a["id"] for a in ads}
        assert state["ad_pc_id"] in ids
        assert state["ad_home_id"] not in ids
        for a in ads:
            assert a["placement"] == "pre_contact"


class TestAdsUpdate:
    def test_update_ad_unauth(self):
        r = _put(f"/ads/{state['ad_home_id']}", {"title": "NEW"})
        assert r.status_code == 401

    def test_update_ad_as_parent_forbidden(self):
        r = _put(f"/ads/{state['ad_home_id']}", {"title": "NEW"}, token=state["parent_token"])
        assert r.status_code == 403

    def test_update_ad_partial(self):
        r = _put(f"/ads/{state['ad_home_id']}", {"title": "TEST_AD_HOME_UPDATED"},
                 token=state["admin_token"])
        assert r.status_code == 200, r.text
        ad = r.json()["ad"]
        assert ad["title"] == "TEST_AD_HOME_UPDATED"
        # Unchanged fields preserved
        assert ad["placement"] == "home"
        assert ad["image_url"] == "https://example.com/banner-home.png"

    def test_update_ad_toggle_active(self):
        r = _put(f"/ads/{state['ad_inactive_id']}", {"active": True},
                 token=state["admin_token"])
        assert r.status_code == 200
        assert r.json()["ad"]["active"] is True
        # Verify in public endpoint
        r2 = _get("/ads/active", params={"placement": "home"})
        assert state["ad_inactive_id"] in {a["id"] for a in r2.json()["ads"]}
        # Restore inactive
        r3 = _put(f"/ads/{state['ad_inactive_id']}", {"active": False},
                  token=state["admin_token"])
        assert r3.status_code == 200

    def test_update_ad_empty_body_400(self):
        r = _put(f"/ads/{state['ad_home_id']}", {}, token=state["admin_token"])
        assert r.status_code == 400, f"Expected 400 for empty update, got {r.status_code}: {r.text}"

    def test_update_ad_not_found(self):
        r = _put("/ads/does-not-exist-xyz", {"title": "zzz"}, token=state["admin_token"])
        assert r.status_code == 404


class TestAdsDelete:
    def test_delete_ad_unauth(self):
        r = _delete(f"/ads/{state['ad_pc_id']}")
        assert r.status_code == 401

    def test_delete_ad_as_nanny_forbidden(self):
        r = _delete(f"/ads/{state['ad_pc_id']}", token=state["nanny_token"])
        assert r.status_code == 403

    def test_delete_ad_not_found(self):
        r = _delete("/ads/nonexistent-abc-123", token=state["admin_token"])
        assert r.status_code == 404

    def test_delete_ad_ok(self):
        r = _delete(f"/ads/{state['ad_pc_id']}", token=state["admin_token"])
        assert r.status_code == 200
        assert r.json().get("ok") is True
        # Verify removed from list
        r2 = _get("/ads", token=state["admin_token"])
        ids = {a["id"] for a in r2.json()["ads"]}
        assert state["ad_pc_id"] not in ids

    def test_cleanup_remaining_ads(self):
        for key in ("ad_home_id", "ad_inactive_id"):
            if key in state:
                _delete(f"/ads/{state[key]}", token=state["admin_token"])


# ---------- Regression: quick sanity on existing endpoints ----------
class TestRegression:
    def test_stats_public(self):
        r = _get("/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("nannies", "parents", "matches"):
            assert k in d

    def test_nannies_list_public(self):
        r = _get("/nannies")
        assert r.status_code == 200
        assert "nannies" in r.json()

    def test_auth_me_parent(self):
        r = _get("/auth/me", token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "parent"

    def test_parents_forbidden_for_admin_role(self):
        # /api/parents is reserved for role=nounou; admin should get 403
        r = _get("/parents", token=state["admin_token"])
        assert r.status_code == 403

    def test_notifications_admin(self):
        r = _get("/notifications", token=state["admin_token"])
        assert r.status_code == 200
        assert "notifications" in r.json()
