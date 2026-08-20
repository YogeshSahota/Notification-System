import requests
import uuid

BASE_URL = "http://localhost:3000/api"
TEST_RUN_ID = uuid.uuid4().hex[:8]

def test_recipients():
    print("\n=== RECIPIENT TESTS ===\n")

    print("1. Create recipient")
    res = requests.post(f"{BASE_URL}/recipients", json={
        "email": f"test-{TEST_RUN_ID}@example.com",
        "phone": "+919999999999",
        "name": "Test User"
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    recipient_id = res.json().get("data", {}).get("id")
    assert res.status_code == 201, "Create recipient failed"

    print("\n2. Create duplicate recipient (should fail)")
    res = requests.post(f"{BASE_URL}/recipients", json={
        "email": f"test-{TEST_RUN_ID}@example.com",
        "name": "Duplicate"
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 400, "Duplicate check failed"

    print("\n3. Get all recipients")
    res = requests.get(f"{BASE_URL}/recipients")
    print(f"   Status: {res.status_code}")
    print(f"   Count: {len(res.json().get('data', []))}")
    assert res.status_code == 200, "Get all recipients failed"

    print("\n4. Get recipient by ID")
    res = requests.get(f"{BASE_URL}/recipients/{recipient_id}")
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 200, "Get recipient by ID failed"

    print("\n5. Update recipient")
    res = requests.put(f"{BASE_URL}/recipients/{recipient_id}", json={
        "name": "Updated User"
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 200, "Update recipient failed"

    print("\n6. Get non-existent recipient (should fail)")
    res = requests.get(f"{BASE_URL}/recipients/non-existent-id")
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 404, "Not found check failed"

    return recipient_id


def test_templates(recipient_id):
    print("\n=== TEMPLATE TESTS ===\n")

    print("1. Create email template")
    res = requests.post(f"{BASE_URL}/templates", json={
        "name": f"order-confirm-{TEST_RUN_ID}",
        "channel": "email",
        "subject": "Order confirmed for {{name}}!",
        "body": "Hi {{name}}, your order #{{order_id}} has been confirmed."
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    template_id = res.json().get("data", {}).get("id")
    assert res.status_code == 201, "Create email template failed"

    print("\n2. Create SMS template")
    res = requests.post(f"{BASE_URL}/templates", json={
        "name": f"order-sms-{TEST_RUN_ID}",
        "channel": "sms",
        "body": "Hi {{name}}, order #{{order_id}} confirmed."
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 201, "Create SMS template failed"

    print("\n3. Create SMS template with subject (should fail)")
    res = requests.post(f"{BASE_URL}/templates", json={
        "name": f"bad-sms-{TEST_RUN_ID}",
        "channel": "sms",
        "subject": "Should not work",
        "body": "test"
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 400, "SMS subject check failed"

    print("\n4. Create duplicate template name (should fail)")
    res = requests.post(f"{BASE_URL}/templates", json={
        "name": f"order-confirm-{TEST_RUN_ID}",
        "channel": "email",
        "subject": "Dup",
        "body": "test"
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 400, "Duplicate template check failed"

    print("\n5. Get all templates")
    res = requests.get(f"{BASE_URL}/templates")
    print(f"   Status: {res.status_code}")
    print(f"   Count: {len(res.json().get('data', []))}")
    assert res.status_code == 200, "Get all templates failed"

    print("\n6. Get template by ID")
    res = requests.get(f"{BASE_URL}/templates/{template_id}")
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 200, "Get template by ID failed"

    print("\n7. Update template")
    res = requests.put(f"{BASE_URL}/templates/{template_id}", json={
        "body": "Hello {{name}}, order #{{order_id}} is confirmed. Total: ${{amount}}"
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 200, "Update template failed"

    print("\n8. Test template rendering via service (manual check)")
    from_template = res.json().get("data", {})
    body = from_template.get("body", "")
    rendered = body.replace("{{name}}", "Yogesh").replace("{{order_id}}", "12345").replace("{{amount}}", "99.99")
    print(f"   Rendered body: {rendered}")

    print("\n9. Delete template")
    res = requests.delete(f"{BASE_URL}/templates/{template_id}")
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 200, "Delete template failed"

    print("\n10. Get deleted template (should fail)")
    res = requests.get(f"{BASE_URL}/templates/{template_id}")
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 404, "Deleted template check failed"

    return template_id


def test_preferences(recipient_id):
    print("\n=== PREFERENCE TESTS ===\n")

    print("1. Create preference (email, opted in)")
    res = requests.post(f"{BASE_URL}/preferences", json={
        "userId": recipient_id,
        "channel": "email",
        "optedIn": True
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 201, "Create email preference failed"

    print("\n2. Create preference (sms, opted out)")
    res = requests.post(f"{BASE_URL}/preferences", json={
        "userId": recipient_id,
        "channel": "sms",
        "optedIn": False
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 201, "Create sms preference failed"

    print("\n3. Create default opted_in preference (no optedIn field)")
    temp_res = requests.post(f"{BASE_URL}/recipients", json={
        "email": f"default-pref-{TEST_RUN_ID}@example.com",
        "name": "Default Pref User"
    })
    temp_id = temp_res.json().get("data", {}).get("id")
    res = requests.post(f"{BASE_URL}/preferences", json={
        "userId": temp_id,
        "channel": "email"
    })
    print(f"   Status: {res.status_code}")
    opted_in = res.json().get("data", {}).get("optedIn")
    print(f"   optedIn (should be True): {opted_in}")
    assert res.status_code == 201, "Create default preference failed"
    assert opted_in is True, "Default optedIn should be True"
    requests.delete(f"{BASE_URL}/recipients/{temp_id}")

    print("\n4. Create duplicate preference (should fail)")
    res = requests.post(f"{BASE_URL}/preferences", json={
        "userId": recipient_id,
        "channel": "email",
        "optedIn": True
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 400, "Duplicate preference check failed"

    print("\n5. Create preference for non-existent recipient (should fail)")
    res = requests.post(f"{BASE_URL}/preferences", json={
        "userId": "non-existent-id",
        "channel": "email"
    })
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 404, "Non-existent recipient check failed"

    print("\n6. Get all preferences")
    res = requests.get(f"{BASE_URL}/preferences")
    print(f"   Status: {res.status_code}")
    print(f"   Count: {len(res.json().get('data', []))}")
    assert res.status_code == 200, "Get all preferences failed"

    print("\n7. Get preferences by userId")
    res = requests.get(f"{BASE_URL}/preferences/{recipient_id}")
    print(f"   Status: {res.status_code}")
    print(f"   Count: {len(res.json().get('data', []))}")
    assert res.status_code == 200, "Get preferences by userId failed"

    print("\n8. Get specific preference (userId + channel)")
    res = requests.get(f"{BASE_URL}/preferences/{recipient_id}/email")
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 200, "Get specific preference failed"

    print("\n9. Get non-existent preference (should fail)")
    res = requests.get(f"{BASE_URL}/preferences/non-existent-id/email")
    print(f"   Status: {res.status_code}")
    print(f"   Body: {res.json()}")
    assert res.status_code == 404, "Not found preference check failed"

    print("\n10. Update preference (opt out email)")
    res = requests.put(f"{BASE_URL}/preferences/{recipient_id}/email", json={
        "optedIn": False
    })
    print(f"   Status: {res.status_code}")
    opted_in = res.json().get("data", {}).get("optedIn")
    print(f"   optedIn (should be False): {opted_in}")
    assert res.status_code == 200, "Update preference failed"
    assert opted_in is False, "optedIn should be False after update"

    print("\n11. Opt back in")
    res = requests.put(f"{BASE_URL}/preferences/{recipient_id}/email", json={
        "optedIn": True
    })
    print(f"   Status: {res.status_code}")
    assert res.status_code == 200, "Opt back in failed"

    print("\n12. Delete sms preference")
    res = requests.delete(f"{BASE_URL}/preferences/{recipient_id}/sms")
    print(f"   Status: {res.status_code}")
    assert res.status_code == 200, "Delete preference failed"

    print("\n13. Get deleted preference (should fail)")
    res = requests.get(f"{BASE_URL}/preferences/{recipient_id}/sms")
    print(f"   Status: {res.status_code}")
    assert res.status_code == 404, "Deleted preference check failed"


def test_cleanup(recipient_id):
    print("\n=== CLEANUP ===\n")
    requests.delete(f"{BASE_URL}/preferences/{recipient_id}/email")
    res = requests.delete(f"{BASE_URL}/recipients/{recipient_id}")
    print(f"   Deleted test recipient: {res.status_code}")


if __name__ == "__main__":
    print("Starting API tests...")
    print("Make sure the server is running on http://localhost:3000")

    try:
        health = requests.get("http://localhost:3000/health")
        assert health.status_code == 200, "Server not running"
    except Exception:
        print("ERROR: Server is not running. Start with: cd backend && npm run dev")
        exit(1)

    recipient_id = test_recipients()
    test_templates(recipient_id)
    test_preferences(recipient_id)
    test_cleanup(recipient_id)

    print("\n\n=== ALL TESTS PASSED ===")
