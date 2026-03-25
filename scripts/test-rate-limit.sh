# Use curl to hit the session API 12 times in a row.
# The limit is set to 10 per minute.
# We expect the 11th and 12th requests to fail with a 429.

URL="http://localhost:3000/api/auth/session"
PAYLOAD='{"idToken": "test-token-invalid"}'

echo "Starting Rate Limit Test..."
for i in {1..12}
do
   echo -n "Request $i: "
   curl -s -X POST -H "Content-Type: application/json" -d "$PAYLOAD" "$URL" | grep -o "too_many_requests" || echo "OK (or invalid token error)"
done
echo "Test Complete."
