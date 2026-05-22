# A-Construct Website

Professional construction contractor website for **Adrian Gichane / A-Construct** with AI-powered inquiry responses, email automation, and calendar booking.

---

## 📁 File Structure

```
A-Construct/
├── index.html        ← The entire website (all pages/sections)
├── style.css         ← All styling and animations
├── app.js            ← All logic: AI replies, email, calendar
└── README.md         ← This setup guide
```

---

## 🚀 PART 1 — Push to GitHub

### Step 1: Install Git (if you haven't)
Download from https://git-scm.com and install it.

### Step 2: Create a GitHub account
Go to https://github.com and sign up (free).

### Step 3: Create a new repository
1. Click the **+** button (top right) → **New repository**
2. Name it: `a-construct-website`
3. Set it to **Public**
4. Do NOT check "Add a README" (you already have one)
5. Click **Create repository**

### Step 4: Push your files
Open a terminal in VS Code (`Terminal → New Terminal`) and run these commands one by one:

```bash
git init
git add .
git commit -m "Initial commit — A-Construct website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/a-construct-website.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

Your files are now on GitHub. ✅

---

## 🌐 PART 2 — Deploy on Netlify (Free)

### Step 1: Create a Netlify account
Go to https://netlify.com → Sign up with your GitHub account.

### Step 2: Deploy the site
1. From the Netlify dashboard click **Add new site → Import an existing project**
2. Choose **GitHub**
3. Select your `a-construct-website` repository
4. Leave all build settings blank (it's a plain HTML site)
5. Click **Deploy site**

Your site will be live in about 30 seconds at a URL like:
`https://a-construct-xyz.netlify.app`

### Step 3: Set a custom domain (optional)
In Netlify → **Domain settings → Add custom domain** → type your domain (e.g. `aconstruct.ca`).
If you don't have a domain yet, Namecheap and Google Domains both sell them for ~$12/year.

---

## 🤖 PART 3 — Activate the AI Auto-Reply

The contact form uses Claude AI to generate a personalized reply to every inquiry.

### Step 1: Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click **API Keys → Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Step 2: Add a Netlify serverless function (REQUIRED for security)
Never paste your API key directly in `app.js` on a public site — anyone can see it.
Instead, create a serverless function on Netlify that holds the key safely.

**Create this file** in your project:

```
A-Construct/
├── netlify/
│   └── functions/
│       └── inquiry.js    ← Create this file
```

**Paste this into `netlify/functions/inquiry.js`:**

```js
const fetch = require("node-fetch");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { prompt } = JSON.parse(event.body);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  return {
    statusCode: 200,
    body: JSON.stringify({ reply: data.content[0].text })
  };
};
```

**Create `netlify/functions/package.json`:**
```json
{
  "dependencies": {
    "node-fetch": "^2.6.7"
  }
}
```

### Step 3: Add your API key to Netlify (never in code)
1. In Netlify → go to your site → **Site configuration → Environment variables**
2. Click **Add a variable**
3. Key: `ANTHROPIC_API_KEY`
4. Value: paste your `sk-ant-...` key
5. Click **Save**

### Step 4: Update app.js to call your function
Open `app.js` and find the `generateAIResponse` function.
Change the fetch URL from:
```js
"https://api.anthropic.com/v1/messages"
```
To:
```js
"/.netlify/functions/inquiry"
```
And simplify the headers to just:
```js
headers: { "Content-Type": "application/json" }
```
And the body to just:
```js
body: JSON.stringify({ prompt: prompt })
```

### Step 5: Push the update
```bash
git add .
git commit -m "Add Netlify function for AI replies"
git push
```

Netlify auto-deploys on every push. AI replies now work securely. ✅

---

## 📧 PART 4 — Activate Email Sending

When someone submits the form, this sends them an automatic confirmation email.

### Step 1: Create a free EmailJS account
Go to https://emailjs.com → Sign up (free tier = 200 emails/month).

### Step 2: Connect your email
1. In EmailJS → **Email Services → Add New Service**
2. Choose **Gmail** (or any provider)
3. Connect your email account (e.g. `info@aconstruct.com` or your Gmail)
4. Copy your **Service ID** (looks like `service_abc123`)

### Step 3: Create an email template
1. Go to **Email Templates → Create New Template**
2. Set the Subject to: `Thanks for reaching out, {{to_name}}!`
3. Paste this as the body:

```
Hi {{to_name}},

{{ai_reply}}

— Adrian Gichane
A-Construct
```

4. Set **To Email** field to: `{{to_email}}`
5. Save the template and copy the **Template ID** (looks like `template_xyz789`)

### Step 4: Get your Public Key
In EmailJS → **Account → General** → copy your **Public Key**

### Step 5: Add keys to app.js
Open `app.js` and fill in these lines at the top:
```js
EMAILJS_SERVICE_ID:  "service_abc123",    // your Service ID
EMAILJS_TEMPLATE_ID: "template_xyz789",   // your Template ID
EMAILJS_PUBLIC_KEY:  "your_public_key",   // your Public Key
```

### Step 6: Add the EmailJS script to index.html
Just before `</body>` in `index.html`, add:
```html
<script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
```

### Step 7: Push
```bash
git add .
git commit -m "Activate EmailJS email sending"
git push
```

Emails now send automatically on every inquiry. ✅

---

## 📅 PART 5 — Connect Google Calendar

When a client books a time slot, this creates a real event in your Google Calendar and sends them an invite.

### Step 1: Set up Google Cloud
1. Go to https://console.cloud.google.com
2. Create a new project (name it `a-construct`)
3. Go to **APIs & Services → Enable APIs**
4. Search and enable **Google Calendar API**

### Step 2: Create OAuth credentials
1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Add to Authorized JavaScript origins: `https://your-site.netlify.app`
4. Copy your **Client ID**

### Step 3: Add the Google API script to index.html
Just before `</body>`, add:
```html
<script src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
<script src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>
```

### Step 4: Update the bookAppointment() function in app.js

Replace the `bookAppointment()` function with:

```js
let gapiReady = false;
let gisReady = false;
let tokenClient;

function gapiLoaded() {
  gapi.load("client", async () => {
    await gapi.client.init({ discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"] });
    gapiReady = true;
  });
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: "YOUR_GOOGLE_CLIENT_ID",
    scope: "https://www.googleapis.com/auth/calendar.events",
    callback: ""
  });
  gisReady = true;
}

async function bookAppointment(time) {
  tokenClient.callback = async (resp) => {
    if (resp.error) return;

    const dateStr = selectedDate.toISOString().split("T")[0];
    const hour = parseInt(time.split(":")[0]) + (time.includes("PM") && !time.startsWith("12") ? 12 : 0);
    const startTime = `${dateStr}T${String(hour).padStart(2,"0")}:00:00`;
    const endTime   = `${dateStr}T${String(hour+1).padStart(2,"0")}:00:00`;

    await gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: {
        summary: `Quote Visit — ${formData.name}`,
        description: `Services: ${formData.services.join(", ")}\n\n${formData.message}\n\nContact: ${formData.email}`,
        start: { dateTime: startTime, timeZone: "America/Toronto" },
        end:   { dateTime: endTime,   timeZone: "America/Toronto" },
        attendees: [{ email: formData.email }],
        reminders: { useDefault: false, overrides: [{ method: "email", minutes: 60 }, { method: "popup", minutes: 30 }] }
      }
    });

    // Show confirmation
    const label = selectedDate.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
    document.getElementById("calGrid").style.display = "none";
    document.getElementById("timeSlots").style.display = "none";
    document.getElementById("bookingConfirm").style.display = "block";
    document.getElementById("confirmDetails").textContent = `${label} at ${time}`;
  };

  tokenClient.requestAccessToken({ prompt: "" });
}
```

Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID.

### Step 5: Push
```bash
git add .
git commit -m "Connect Google Calendar booking"
git push
```

Bookings now appear in your Google Calendar with email invites sent to clients. ✅

---

## ✅ Final Checklist

| Feature | What to do |
|---|---|
| Site live on Netlify | Deploy from GitHub — done automatically |
| AI auto-reply | Add Anthropic key to Netlify env variables |
| Email confirmation | Set up EmailJS and add 3 keys to app.js |
| Google Calendar booking | Enable Calendar API and add Client ID to app.js |
| Custom domain | Add in Netlify → Domain settings |

---

## 🔄 How to Update the Site After Launch

Every time you make changes in VS Code, just run:
```bash
git add .
git commit -m "describe what you changed"
git push
```

Netlify automatically rebuilds and redeploys in about 30 seconds. No manual upload needed.

---

Built for A-Construct — Adrian Gichane. Questions? Email info@aconstruct.com
