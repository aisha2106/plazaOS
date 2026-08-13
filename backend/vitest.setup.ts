// Env vars every test needs (JWT signing/verification) — never real secrets.
process.env.JWT_SECRET = 'test-secret'
process.env.JWT_EXPIRES_IN = '14d'
process.env.CORS_ORIGIN = 'http://localhost:5173'
