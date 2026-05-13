"""Iteration 5 backend tests: video uploads, ad media_type, admin user mgmt, reviews."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

TS = str(int(time.time()))[-6:]
PARENT_PHONE = f"+22506{TS}11"
PARENT2_PHONE = f"+22506{TS}22"
NANNY_PHONE = f"+22506{TS}33"
NANNY2_PHONE = f"+22506{TS}44"
PWD = "Test1234"
ADMIN_PHONE = "+2250712044540"
ADMIN_PWD = "Aris20112"

state = {}


def _post(path, json=None, token=None, timeout=20):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.post(f"{API}{path}", json=json, headers=h, timeout=timeout)


def _get(path, token=None, params=None, timeout=30):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.get(f"{API}{path}", headers=h, params=params, timeout=timeout)


def _put(path, json=None, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.put(f"{API}{path}", json=json, headers=h, timeout=20)


def _delete(path, token=None):
    h = {"Authorization": f"Bearer {token}"} if token else {}
    return requests.delete(f"{API}{path}", headers=h, timeout=20)


def _tiny_jpeg() -> bytes:
    return bytes.fromhex("ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707"
                         "0709090807" + "0a"*100 + "ffd9")


def _tiny_mp4() -> bytes:
    # Minimal mp4 ftyp box
    return (b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom"
            + b"\x00" * 64)


# ---------- Setup ----------
class TestSetup:
    def test_admin_login(self):
        r = _post("/auth/login", {"phone": ADMIN_PHONE, "password": ADMIN_PWD})
        assert r.status_code == 200, r.text
        state["admin_token"] = r.json()["token"]
        state["admin_id"] = r.json()["user"]["id"]

    def test_register_parent(self):
        r = _post("/auth/register", {"phone": PARENT_PHONE, "password": PWD, "role": "parent",
                                     "first_name": "TestP1", "last_name": "Iter5"})
        assert r.status_code == 200
        state["parent_token"] = r.json()["token"]
        state["parent_id"] = r.json()["user"]["id"]

    def test_register_parent2(self):
        r = _post("/auth/register", {"phone": PARENT2_PHONE, "password": PWD, "role": "parent",
                                     "first_name": "TestP2", "last_name": "Iter5"})
        assert r.status_code == 200
        state["parent2_token"] = r.json()["token"]
        state["parent2_id"] = r.json()["user"]["id"]

    def test_register_nanny(self):
        r = _post("/auth/register", {"phone": NANNY_PHONE, "password": PWD, "role": "nounou",
                                     "first_name": "TestN1", "last_name": "Iter5"})
        assert r.status_code == 200
        state["nanny_token"] = r.json()["token"]
        state["nanny_id"] = r.json()["user"]["id"]

    def test_register_nanny2(self):
        r = _post("/auth/register", {"phone": NANNY2_PHONE, "password": PWD, "role": "nounou",
                                     "first_name": "TestN2", "last_name": "Iter5"})
        assert r.status_code == 200
        state["nanny2_token"] = r.json()["token"]
        state["nanny2_id"] = r.json()["user"]["id"]

    def test_profiles(self):
        r = _put("/profile/parent", {"quartier": "Cocody", "city": "Abidjan",
                                     "children_count": 1, "schedule": "Journée",
                                     "care_type": "Garde régulière", "budget_max": 80000},
                 token=state["parent_token"])
        assert r.status_code == 200
        r = _put("/profile/nanny", {"age": 30, "experience_years": 6, "quartier": "Plateau",
                                    "city": "Abidjan", "availability": "Temps plein",
                                    "hourly_rate": 1200, "bio": "Pro"},
                 token=state["nanny_token"])
        assert r.status_code == 200
        r = _put("/profile/nanny", {"age": 28, "experience_years": 4, "quartier": "Yopougon",
                                    "city": "Abidjan", "availability": "Temps partiel",
                                    "hourly_rate": 1000, "bio": "Bonjour"},
                 token=state["nanny2_token"])
        assert r.status_code == 200

    def test_create_accepted_match(self):
        # parent -> nanny request; nanny accepts
        r = _post("/matches", {"nanny_id": state["nanny_id"], "message": "Bonjour"},
                  token=state["parent_token"])
        assert r.status_code == 200
        mid = r.json()["match"]["id"]
        state["match_id"] = mid
        r2 = _put(f"/matches/{mid}", {"status": "accepted"}, token=state["nanny_token"])
        assert r2.status_code == 200


# ---------- Upload: video support (iteration 5) ----------
class TestUploadVideo:
    def test_upload_mp4(self):
        h = {"Authorization": f"Bearer {state['nanny_token']}"}
        files = {"file": ("clip.mp4", _tiny_mp4(), "video/mp4")}
        r = requests.post(f"{API}/upload", files=files, headers=h, timeout=60)
        assert r.status_code == 200, f"video/mp4 should be accepted (50MB max), got {r.status_code}: {r.text[:200]}"
        d = r.json()
        assert d.get("media_type") == "video", f"expected media_type=video, got {d}"

    def test_upload_webm(self):
        h = {"Authorization": f"Bearer {state['nanny_token']}"}
        files = {"file": ("clip.webm", b"\x1a\x45\xdf\xa3" + b"\x00"*200, "video/webm")}
        r = requests.post(f"{API}/upload", files=files, headers=h, timeout=60)
        assert r.status_code == 200, f"video/webm should be accepted, got {r.status_code}: {r.text[:200]}"
        assert r.json().get("media_type") == "video"

    def test_upload_image_returns_image_media_type(self):
        h = {"Authorization": f"Bearer {state['nanny_token']}"}
        files = {"file": ("t.jpg", _tiny_jpeg(), "image/jpeg")}
        r = requests.post(f"{API}/upload", files=files, headers=h, timeout=30)
        assert r.status_code == 200
        assert r.json().get("media_type") == "image", f"expected media_type=image, got {r.json()}"

    def test_upload_reject_unsupported(self):
        h = {"Authorization": f"Bearer {state['nanny_token']}"}
        files = {"file": ("a.pdf", b"%PDF-1.4...", "application/pdf")}
        r = requests.post(f"{API}/upload", files=files, headers=h, timeout=30)
        assert r.status_code in (400, 415, 422)

    def test_upload_reject_over_50mb(self):
        h = {"Authorization": f"Bearer {state['nanny_token']}"}
        big = b"\x00" * (51 * 1024 * 1024)
        files = {"file": ("big.mp4", big, "video/mp4")}
        try:
            r = requests.post(f"{API}/upload", files=files, headers=h, timeout=120)
        except requests.exceptions.RequestException as e:
            pytest.skip(f"network during 51MB upload: {e}")
        assert r.status_code in (400, 413, 422)


# ---------- Ads: media_type field (iteration 5) ----------
class TestAdsMediaType:
    def test_create_ad_video(self):
        r = _post("/ads", {"title": "TEST_ITER5_video_ad", "image_url": "/api/files/x.mp4",
                           "placement": "home", "active": True, "media_type": "video"},
                  token=state["admin_token"])
        assert r.status_code == 200, r.text
        ad = r.json()["ad"]
        assert ad["media_type"] == "video"
        state["video_ad_id"] = ad["id"]

    def test_create_ad_image_default(self):
        r = _post("/ads", {"title": "TEST_ITER5_image_ad", "image_url": "/api/files/x.jpg",
                           "placement": "home", "active": True},
                  token=state["admin_token"])
        assert r.status_code == 200
        assert r.json()["ad"]["media_type"] == "image"
        state["image_ad_id"] = r.json()["ad"]["id"]

    def test_active_ads_returns_media_type(self):
        r = _get("/ads/active", params={"placement": "home"})
        assert r.status_code == 200
        ads = r.json()["ads"]
        ids = {a["id"]: a for a in ads}
        assert state["video_ad_id"] in ids
        assert ids[state["video_ad_id"]]["media_type"] == "video"
        assert ids[state["image_ad_id"]]["media_type"] == "image"

    def test_invalid_media_type_rejected(self):
        r = _post("/ads", {"title": "bad", "image_url": "/x", "placement": "home",
                           "media_type": "audio"}, token=state["admin_token"])
        assert r.status_code == 422

    def test_cleanup_ads(self):
        for k in ("video_ad_id", "image_ad_id"):
            if state.get(k):
                _delete(f"/ads/{state[k]}", token=state["admin_token"])


# ---------- Admin: list/delete users ----------
class TestAdminUsers:
    def test_list_users_requires_admin(self):
        r = _get("/admin/users", token=state["parent_token"])
        assert r.status_code == 403
        r = _get("/admin/users", token=state["nanny_token"])
        assert r.status_code == 403
        r = _get("/admin/users")
        assert r.status_code == 401

    def test_list_users_returns_photo_url_and_all_users(self):
        r = _get("/admin/users", token=state["admin_token"])
        assert r.status_code == 200
        users = r.json()["users"]
        ids = {u["id"]: u for u in users}
        assert state["parent_id"] in ids
        assert state["nanny_id"] in ids
        for u in users:
            assert "photo_url" in u
            assert "password_hash" not in u
            assert "_id" not in u

    def test_filter_role(self):
        r = _get("/admin/users", token=state["admin_token"], params={"role": "nounou"})
        assert r.status_code == 200
        for u in r.json()["users"]:
            assert u["role"] == "nounou"

    def test_search(self):
        r = _get("/admin/users", token=state["admin_token"], params={"search": "TestN1"})
        assert r.status_code == 200
        ids = [u["id"] for u in r.json()["users"]]
        assert state["nanny_id"] in ids

    def test_delete_self_blocked(self):
        r = _delete(f"/admin/users/{state['admin_id']}", token=state["admin_token"])
        assert r.status_code == 400

    def test_delete_other_admin_blocked(self):
        # Try second seed admin if exists; otherwise skip
        r = _get("/admin/users", token=state["admin_token"], params={"role": "admin"})
        admins = [u for u in r.json()["users"] if u["id"] != state["admin_id"]]
        if not admins:
            pytest.skip("only one admin")
        r2 = _delete(f"/admin/users/{admins[0]['id']}", token=state["admin_token"])
        assert r2.status_code == 400

    def test_delete_nonexistent(self):
        r = _delete("/admin/users/no-such-id", token=state["admin_token"])
        assert r.status_code == 404

    def test_delete_non_admin_forbidden(self):
        r = _delete(f"/admin/users/{state['nanny_id']}", token=state["parent_token"])
        assert r.status_code == 403


# ---------- Reviews ----------
class TestReviewsCreate:
    def test_nanny_cannot_post_review(self):
        r = _post("/reviews", {"nanny_id": state["nanny_id"], "rating": 5, "comment": "x"},
                  token=state["nanny_token"])
        assert r.status_code == 403

    def test_parent_without_match_forbidden(self):
        # parent2 has no accepted match with nanny_id
        r = _post("/reviews", {"nanny_id": state["nanny_id"], "rating": 5, "comment": "x"},
                  token=state["parent2_token"])
        assert r.status_code == 403

    def test_review_nonexistent_nanny(self):
        r = _post("/reviews", {"nanny_id": "missing-id", "rating": 5, "comment": "x"},
                  token=state["parent_token"])
        assert r.status_code == 404

    def test_rating_out_of_bounds(self):
        r = _post("/reviews", {"nanny_id": state["nanny_id"], "rating": 6, "comment": "x"},
                  token=state["parent_token"])
        assert r.status_code == 422
        r = _post("/reviews", {"nanny_id": state["nanny_id"], "rating": 0, "comment": "x"},
                  token=state["parent_token"])
        assert r.status_code == 422

    def test_create_review_success(self):
        r = _post("/reviews", {"nanny_id": state["nanny_id"], "rating": 5,
                               "comment": "Excellente nounou"},
                  token=state["parent_token"])
        assert r.status_code == 200, r.text
        rev = r.json()["review"]
        assert rev["rating"] == 5
        assert rev["parent_id"] == state["parent_id"]
        state["review_id"] = rev["id"]

    def test_review_creates_notification_for_nanny(self):
        r = _get("/notifications", token=state["nanny_token"])
        assert r.status_code == 200
        msgs = " ".join(n["message"] for n in r.json()["notifications"])
        assert "avis" in msgs.lower() or "5/5" in msgs

    def test_duplicate_review_rejected(self):
        r = _post("/reviews", {"nanny_id": state["nanny_id"], "rating": 4, "comment": "again"},
                  token=state["parent_token"])
        assert r.status_code == 400


class TestReviewsRead:
    def test_public_list_reviews(self):
        # No auth required
        r = requests.get(f"{API}/reviews", params={"nanny_id": state["nanny_id"]}, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "reviews" in d and "avg_rating" in d and "review_count" in d
        assert d["review_count"] >= 1
        assert d["avg_rating"] >= 1

    def test_nannies_list_includes_avg_rating(self):
        r = _get("/nannies")
        assert r.status_code == 200
        nannies = r.json()["nannies"]
        target = next((n for n in nannies if n["user_id"] == state["nanny_id"]), None)
        assert target is not None
        assert "avg_rating" in target
        assert "review_count" in target
        assert target["review_count"] >= 1

    def test_nannies_detail_includes_avg_rating(self):
        r = _get(f"/nannies/{state['nanny_id']}", token=state["parent_token"])
        assert r.status_code == 200
        n = r.json()["nanny"]
        assert "avg_rating" in n and "review_count" in n
        assert n["review_count"] >= 1


class TestReviewsUpdateDelete:
    def test_update_by_other_parent_forbidden(self):
        r = _put(f"/reviews/{state['review_id']}", {"rating": 1},
                 token=state["parent2_token"])
        assert r.status_code == 403

    def test_update_partial_rating_only(self):
        r = _put(f"/reviews/{state['review_id']}", {"rating": 4},
                 token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["review"]["rating"] == 4
        # comment preserved
        assert r.json()["review"]["comment"] == "Excellente nounou"

    def test_update_partial_comment_only(self):
        r = _put(f"/reviews/{state['review_id']}", {"comment": "Mise à jour"},
                 token=state["parent_token"])
        assert r.status_code == 200
        assert r.json()["review"]["rating"] == 4
        assert r.json()["review"]["comment"] == "Mise à jour"

    def test_admin_can_update(self):
        r = _put(f"/reviews/{state['review_id']}", {"rating": 3},
                 token=state["admin_token"])
        assert r.status_code == 200
        assert r.json()["review"]["rating"] == 3

    def test_delete_by_other_parent_forbidden(self):
        r = _delete(f"/reviews/{state['review_id']}", token=state["parent2_token"])
        assert r.status_code == 403

    def test_admin_delete(self):
        r = _delete(f"/reviews/{state['review_id']}", token=state["admin_token"])
        assert r.status_code == 200
        # confirm gone
        r2 = requests.get(f"{API}/reviews", params={"nanny_id": state["nanny_id"]}, timeout=15)
        ids = [rv["id"] for rv in r2.json()["reviews"]]
        assert state["review_id"] not in ids

    def test_update_nonexistent(self):
        r = _put("/reviews/no-id", {"rating": 4}, token=state["admin_token"])
        assert r.status_code == 404


# ---------- Cascade delete on admin user delete ----------
class TestAdminCascadeDelete:
    def test_setup_data_for_cascade(self):
        # Re-create review and a notification by nanny2 chain
        # parent -> nanny2 match accepted -> review
        r = _post("/matches", {"nanny_id": state["nanny2_id"], "message": "hi"},
                  token=state["parent_token"])
        assert r.status_code == 200
        mid = r.json()["match"]["id"]
        r2 = _put(f"/matches/{mid}", {"status": "accepted"}, token=state["nanny2_token"])
        assert r2.status_code == 200
        r3 = _post("/reviews", {"nanny_id": state["nanny2_id"], "rating": 5, "comment": "ok"},
                   token=state["parent_token"])
        assert r3.status_code == 200
        state["cascade_match_id"] = mid

    def test_admin_delete_nanny_cascades(self):
        nid = state["nanny2_id"]
        r = _delete(f"/admin/users/{nid}", token=state["admin_token"])
        assert r.status_code == 200
        # user gone
        r2 = _get("/admin/users", token=state["admin_token"])
        assert nid not in [u["id"] for u in r2.json()["users"]]
        # reviews gone
        r3 = requests.get(f"{API}/reviews", params={"nanny_id": nid}, timeout=15)
        assert r3.json()["review_count"] == 0
        # matches involving nanny2 gone for parent
        r4 = _get("/matches", token=state["parent_token"])
        assert all(m["nanny_id"] != nid for m in r4.json()["matches"])


# ---------- Cleanup ----------
class TestCleanup:
    def test_cleanup_users(self):
        for uid_key in ("parent_id", "parent2_id", "nanny_id"):
            uid = state.get(uid_key)
            if uid:
                _delete(f"/admin/users/{uid}", token=state["admin_token"])
