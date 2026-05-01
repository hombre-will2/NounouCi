"""Backend tests for new features: upload, files, /api/parents, bidirectional matching."""
import os
import io
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://nounou-hub.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TS = str(int(time.time()))[-6:]
PARENT_PHONE = f"+22505{TS}11"
PARENT2_PHONE = f"+22505{TS}22"
NANNY_PHONE = f"+22505{TS}33"
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


def _tiny_jpeg() -> bytes:
    # Minimal valid 1x1 JPEG
    return bytes.fromhex(
        "ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707"
        "0709090807"
        + "0a"*100
        + "ffd9"
    )


# ---------- Setup: register users ----------
class TestSetup:
    def test_register_parent(self):
        r = _post("/auth/register", {"phone": PARENT_PHONE, "password": PWD, "role": "parent",
                                     "first_name": "Awa", "last_name": "Bamba"})
        assert r.status_code == 200, r.text
        state["parent_token"] = r.json()["token"]
        state["parent_id"] = r.json()["user"]["id"]

    def test_register_parent2(self):
        r = _post("/auth/register", {"phone": PARENT2_PHONE, "password": PWD, "role": "parent",
                                     "first_name": "Kadi", "last_name": "Sow"})
        assert r.status_code == 200
        state["parent2_token"] = r.json()["token"]
        state["parent2_id"] = r.json()["user"]["id"]

    def test_register_nanny(self):
        r = _post("/auth/register", {"phone": NANNY_PHONE, "password": PWD, "role": "nounou",
                                     "first_name": "Fanta", "last_name": "Cisse"})
        assert r.status_code == 200
        state["nanny_token"] = r.json()["token"]
        state["nanny_id"] = r.json()["user"]["id"]

    def test_parent_profile(self):
        r = _put("/profile/parent", {"quartier": "Cocody", "city": "Abidjan", "address": "Riv 2",
                                     "children_count": 1, "needs_description": "Aide scolaire",
                                     "schedule": "Journée", "care_type": "Garde régulière",
                                     "budget_max": 80000}, token=state["parent_token"])
        assert r.status_code == 200

    def test_parent2_profile_bouake(self):
        r = _put("/profile/parent", {"quartier": "", "city": "Bouaké", "address": "Centre",
                                     "children_count": 2, "schedule": "Nuit",
                                     "care_type": "Ponctuelle", "budget_max": 50000},
                 token=state["parent2_token"])
        assert r.status_code == 200, r.text

    def test_nanny_profile(self):
        r = _put("/profile/nanny", {"age": 30, "experience_years": 6, "quartier": "Plateau",
                                    "city": "Abidjan", "availability": "Temps plein",
                                    "hourly_rate": 1200, "bio": "Pro"},
                 token=state["nanny_token"])
        assert r.status_code == 200


# ---------- Upload & Files ----------
class TestUpload:
    def test_upload_requires_auth(self):
        files = {"file": ("t.jpg", _tiny_jpeg(), "image/jpeg")}
        r = requests.post(f"{API}/upload", files=files, timeout=15)
        assert r.status_code in (401, 404), f"Expected 401 but got {r.status_code}: {r.text[:200]}"

    def test_upload_image_valid(self):
        files = {"file": ("t.jpg", _tiny_jpeg(), "image/jpeg")}
        h = {"Authorization": f"Bearer {state['nanny_token']}"}
        r = requests.post(f"{API}/upload", files=files, headers=h, timeout=30)
        if r.status_code == 404:
            pytest.fail("POST /api/upload endpoint NOT IMPLEMENTED (404)")
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d or "path" in d
        state["uploaded_url"] = d.get("url") or d.get("path")

    def test_upload_reject_non_image(self):
        h = {"Authorization": f"Bearer {state['nanny_token']}"}
        files = {"file": ("t.txt", b"hello world", "text/plain")}
        r = requests.post(f"{API}/upload", files=files, headers=h, timeout=15)
        if r.status_code == 404:
            pytest.skip("upload endpoint not implemented")
        assert r.status_code in (400, 415, 422)

    def test_upload_reject_large(self):
        h = {"Authorization": f"Bearer {state['nanny_token']}"}
        big = b"\xff" * (6 * 1024 * 1024)  # 6MB
        files = {"file": ("big.jpg", big, "image/jpeg")}
        r = requests.post(f"{API}/upload", files=files, headers=h, timeout=60)
        if r.status_code == 404:
            pytest.skip("upload endpoint not implemented")
        assert r.status_code in (400, 413, 422)

    def test_get_file(self):
        if not state.get("uploaded_url"):
            pytest.skip("no uploaded file")
        path = state["uploaded_url"].split("/api/files/")[-1]
        r = requests.get(f"{API}/files/{path}", timeout=20)
        if r.status_code == 404:
            pytest.fail("GET /api/files/{path} NOT IMPLEMENTED (404)")
        assert r.status_code == 200
        assert r.headers.get("Content-Type", "").startswith("image/")


# ---------- /api/parents ----------
class TestParents:
    def test_parents_forbidden_for_parent_role(self):
        r = _get("/parents", token=state["parent_token"])
        assert r.status_code == 403

    def test_parents_requires_auth(self):
        r = _get("/parents")
        assert r.status_code == 401

    def test_parents_list_for_nanny(self):
        r = _get("/parents", token=state["nanny_token"])
        assert r.status_code == 200, r.text
        data = r.json()
        assert "parents" in data
        ids = [p["user_id"] for p in data["parents"]]
        assert state["parent_id"] in ids
        # phone and address must be hidden in list
        for p in data["parents"]:
            assert "phone" not in p
            assert "address" not in p

    def test_parents_filter_city(self):
        r = _get("/parents", token=state["nanny_token"], params={"city": "Bouaké"})
        assert r.status_code == 200
        for p in r.json()["parents"]:
            assert p["city"] == "Bouaké"

    def test_parents_filter_quartier(self):
        r = _get("/parents", token=state["nanny_token"], params={"quartier": "Cocody"})
        assert r.status_code == 200
        for p in r.json()["parents"]:
            assert p["quartier"] == "Cocody"

    def test_parents_filter_care_type(self):
        r = _get("/parents", token=state["nanny_token"], params={"care_type": "Garde régulière"})
        assert r.status_code == 200

    def test_parents_filter_schedule(self):
        r = _get("/parents", token=state["nanny_token"], params={"schedule": "Nuit"})
        assert r.status_code == 200
        for p in r.json()["parents"]:
            assert p["schedule"] == "Nuit"

    def test_parents_filter_min_budget(self):
        r = _get("/parents", token=state["nanny_token"], params={"min_budget": 70000})
        assert r.status_code == 200
        for p in r.json()["parents"]:
            assert p["budget_max"] >= 70000

    def test_parents_search(self):
        r = _get("/parents", token=state["nanny_token"], params={"search": "Awa"})
        assert r.status_code == 200

    def test_get_single_parent_forbidden_for_other_parent(self):
        r = _get(f"/parents/{state['parent_id']}", token=state["parent2_token"])
        assert r.status_code == 403

    def test_get_single_parent_as_nanny(self):
        r = _get(f"/parents/{state['parent_id']}", token=state["nanny_token"])
        assert r.status_code == 200
        p = r.json()["parent"]
        # phone and address hidden without accepted match
        assert "phone" not in p
        assert "address" not in p or p.get("address") == ""


# ---------- Bidirectional matches ----------
class TestBidirectionalMatches:
    def test_parent_initiates_missing_nanny_id(self):
        r = _post("/matches", {"message": "hi"}, token=state["parent_token"])
        assert r.status_code == 422

    def test_nanny_initiates_missing_parent_id(self):
        r = _post("/matches", {"message": "hi"}, token=state["nanny_token"])
        assert r.status_code == 422

    def test_nanny_initiates_to_parent(self):
        r = _post("/matches", {"parent_id": state["parent_id"], "message": "Bonjour madame"},
                  token=state["nanny_token"])
        assert r.status_code == 200, r.text
        m = r.json()["match"]
        assert m["initiated_by"] == "nounou"
        assert m["status"] == "pending"
        assert m["parent_id"] == state["parent_id"]
        state["match_nounou_init"] = m["id"]

    def test_parent_receives_notification(self):
        r = _get("/notifications", token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["unread"] >= 1

    def test_nanny_cannot_accept_own_request(self):
        # The initiator (nanny) should not be able to accept - the recipient (parent) accepts
        r = _put(f"/matches/{state['match_nounou_init']}", {"status": "accepted"},
                 token=state["nanny_token"])
        assert r.status_code == 403

    def test_parent_accepts_nounou_request(self):
        r = _put(f"/matches/{state['match_nounou_init']}", {"status": "accepted"},
                 token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["match"]["status"] == "accepted"

    def test_nanny_notified_on_accept(self):
        r = _get("/notifications", token=state["nanny_token"])
        assert r.status_code == 200
        msgs = [n["message"] for n in r.json()["notifications"]]
        assert any("accept" in m.lower() for m in msgs)

    def test_phone_visible_to_parent_after_accept(self):
        # Parent should see nanny phone via /nannies/{id}
        r = _get(f"/nannies/{state['nanny_id']}", token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["nanny"].get("phone") == NANNY_PHONE

    def test_parent_phone_visible_to_nanny_after_accept(self):
        r = _get(f"/parents/{state['parent_id']}", token=state["nanny_token"])
        assert r.status_code == 200
        assert r.json()["parent"].get("phone") == PARENT_PHONE

    def test_matches_enriched_with_photos(self):
        r = _get("/matches", token=state["parent_token"])
        assert r.status_code == 200
        for m in r.json()["matches"]:
            assert "nanny_photo_url" in m
            assert "parent_photo_url" in m

    def test_parent_initiated_nanny_accepts(self):
        # create parent2 -> nanny match; nanny accepts
        r = _post("/matches", {"nanny_id": state["nanny_id"], "message": "salut"},
                  token=state["parent2_token"])
        assert r.status_code == 200
        mid = r.json()["match"]["id"]
        assert r.json()["match"]["initiated_by"] == "parent"
        # parent2 (initiator) cannot accept
        r2 = _put(f"/matches/{mid}", {"status": "accepted"}, token=state["parent2_token"])
        assert r2.status_code == 403
        # nanny (recipient) accepts
        r3 = _put(f"/matches/{mid}", {"status": "accepted"}, token=state["nanny_token"])
        assert r3.status_code == 200
