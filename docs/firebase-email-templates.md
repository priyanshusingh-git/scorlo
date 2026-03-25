# Firebase Premium Email Templates

Copy and paste these HTML templates into your **Firebase Console** under **Authentication > Templates**.

---

## 1. Email Verification Template

**Subject**: Verify your Scorlo account ✉️

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f6f2ea; margin: 0; padding: 0; }
    .wrapper { padding: 40px 20px; text-align: center; }
    .card { background-color: #ffffff; max-width: 480px; margin: 0 auto; padding: 48px; border-radius: 24px; box-shadow: 0 10px 30px rgba(17, 24, 39, 0.04); }
    .logo { font-family: "Instrument Serif", serif; font-size: 42px; font-style: italic; color: #111827; margin-bottom: 24px; text-decoration: none; display: block; }
    h1 { color: #111827; font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.02em; }
    p { color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
    .button { background-color: #111827; color: #ffffff !important; padding: 18px 32px; border-radius: 16px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block; transition: background 0.2s; }
    .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">Scorlo</div>
      <h1>Welcome to Scorlo</h1>
      <p>Follow the link below to verify your email address and start your academic journey. This link will expire shortly.</p>
      <a href="%LINK%" class="button">Verify Email Address</a>
    </div>
    <div class="footer">
      Powered by AKTU Academic Data API<br>
      © 2026 Scorlo. All rights reserved.
    </div>
  </div>
</body>
</html>
```

---

## 2. Password Reset Template

**Subject**: Reset your Scorlo password 🔑

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f6f2ea; margin: 0; padding: 0; }
    .wrapper { padding: 40px 20px; text-align: center; }
    .card { background-color: #ffffff; max-width: 480px; margin: 0 auto; padding: 48px; border-radius: 24px; box-shadow: 0 10px 30px rgba(17, 24, 39, 0.04); }
    .logo { font-family: "Instrument Serif", serif; font-size: 42px; font-style: italic; color: #111827; margin-bottom: 24px; text-decoration: none; display: block; }
    h1 { color: #111827; font-size: 24px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.02em; }
    p { color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 32px; }
    .button { background-color: #111827; color: #ffffff !important; padding: 18px 32px; border-radius: 16px; text-decoration: none; font-size: 14px; font-weight: 600; display: inline-block; transition: background 0.2s; }
    .footer { margin-top: 32px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="logo">Scorlo</div>
      <h1>Reset Password</h1>
      <p>You requested a password reset for your Scorlo account. Click the button below to choose a new password. If you didn't request this, you can safely ignore this email.</p>
      <a href="%LINK%" class="button">Reset Password</a>
    </div>
    <div class="footer">
      Regain access to your academic records.<br>
      © 2026 Scorlo. All rights reserved.
    </div>
  </div>
</body>
</html>
```
