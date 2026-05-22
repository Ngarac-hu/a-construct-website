/* ===========================
   A-CONSTRUCT — APP.JS
   AI Inquiry + Email + Calendar
   =========================== */

// ─────────────────────────────────────────────
// CONFIGURATION — Fill these in before going live
// ─────────────────────────────────────────────
const CONFIG = {
  // EmailJS — https://emailjs.com (free, 200 emails/month)
  // Instructions in README.md → PART 4
  EMAILJS_SERVICE_ID:  "service_wd4xm6o",
  EMAILJS_TEMPLATE_ID: "template_wi0j7iw",
  EMAILJS_PUBLIC_KEY:  "NUwtWjLnmhfrl1lIG",

  // Google Calendar — https://developers.google.com/calendar/api
  // Instructions in README.md → PART 5
  GOOGLE_CLIENT_ID:  "490828160373-aeoiutbls2fpv5mm82mo86t344qp5ue2.apps.googleusercontent.com",

  // Your business details
  COMPANY_NAME:  "A-Construct",
  CONTRACTOR:    "Adrian Gichane",
  COMPANY_EMAIL: "info@aconstruct.com",
};

// ── HAMBURGER MENU ──────────────────────────
document.getElementById("hamburger").addEventListener("click", () => {
  document.getElementById("mobileMenu").classList.toggle("open");
});
document.querySelectorAll(".mobile-menu a").forEach(link => {
  link.addEventListener("click", () => {
    document.getElementById("mobileMenu").classList.remove("open");
  });
});

// ── SCROLL ANIMATIONS ───────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = "1";
      entry.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".service-card, .stat, .cf-item").forEach(el => {
  el.style.opacity = "0";
  el.style.transform = "translateY(20px)";
  el.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  observer.observe(el);
});

// ── FORM SUBMISSION ─────────────────────────
let formData = {};

async function submitInquiry() {
  const name    = document.getElementById("inputName").value.trim();
  const email   = document.getElementById("inputEmail").value.trim();
  const phone   = document.getElementById("inputPhone").value.trim();
  const message = document.getElementById("inputMessage").value.trim();
  const services = Array.from(
    document.querySelectorAll(".checkbox-grid input[type='checkbox']:checked")
  ).map(cb => cb.value);

  const errorEl = document.getElementById("formError");

  if (!name || !email || !message || services.length === 0) {
    errorEl.textContent = "Please fill in your name, email, at least one service, and a project description.";
    errorEl.style.display = "block";
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorEl.textContent = "Please enter a valid email address.";
    errorEl.style.display = "block";
    return;
  }
  errorEl.style.display = "none";

  formData = { name, email, phone, services, message };

  document.getElementById("btnText").style.display   = "none";
  document.getElementById("btnLoader").style.display = "inline";
  document.getElementById("submitBtn").disabled = true;

  setTimeout(() => {
    document.getElementById("formStep").style.display = "none";
    document.getElementById("aiStep").style.display   = "block";
    generateAIResponse(name, email, services, message, phone);
  }, 700);
}

// ── AI RESPONSE ─────────────────────────────
async function generateAIResponse(name, email, services, message, phone) {
  const bubble = document.getElementById("aiBubble");
  const typing = document.getElementById("aiTyping");

  const prompt = `You are a professional assistant for ${CONFIG.COMPANY_NAME}, a construction contractor run by ${CONFIG.CONTRACTOR}.
A client has submitted an inquiry. Write a warm, professional, concise reply (2-3 short paragraphs, NO markdown, NO bullet points, plain conversational text only, under 120 words).

Client details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone || "not provided"}
- Services requested: ${services.join(", ")}
- Project description: ${message}

Thank them by first name, confirm the specific services, tell them the next step is scheduling a free quote visit with ${CONFIG.CONTRACTOR}, and that he will be in touch shortly. Sound warm and human,[...]

  let aiReply = "";

  try {
    // Calls the Netlify serverless function — keeps your API key secret
    // (See README Part 3 for setup. Function is in netlify/functions/inquiry.js)
    const response = await fetch("/.netlify/functions/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error("Function error");
    const data = await response.json();
    aiReply = data.reply;

  } catch (err) {
    // Friendly fallback if function not set up yet
    aiReply = `Hi ${name}! Thanks for reaching out to ${CONFIG.COMPANY_NAME}. ${CONFIG.CONTRACTOR} has received your inquiry for ${services.join(", ")} and is looking forward to helping with your proj[...]
  }

  typing.style.display = "none";
  bubble.textContent   = "";
  await typeText(bubble, aiReply, 16);

  await sendEmail(name, email, aiReply);

  setTimeout(() => {
    document.getElementById("aiStep").style.display      = "none";
    document.getElementById("calendarStep").style.display = "block";
    renderCalendar();
  }, 2200);
}

// Typewriter effect
function typeText(el, text, delay = 16) {
  return new Promise(resolve => {
    let i = 0;
    const iv = setInterval(() => {
      el.textContent += text[i] || "";
      i++;
      if (i >= text.length) { clearInterval(iv); resolve(); }
    }, delay);
  });
}

// ── EMAIL SENDING ───────────────────────────
async function sendEmail(name, email, aiReply) {
  // Requires EmailJS — see README Part 4
  // Also add this script to index.html before </body>:
  // <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>

  if (typeof emailjs === "undefined") {
    console.log("📧 EmailJS not loaded. To enable email: see README Part 4.");
    return;
  }

  try {
    await emailjs.send(
      CONFIG.EMAILJS_SERVICE_ID,
      CONFIG.EMAILJS_TEMPLATE_ID,
      {
        to_email:  email,
        to_name:   name,
        ai_reply:  aiReply,
        from_name: CONFIG.COMPANY_NAME,
      },
      CONFIG.EMAILJS_PUBLIC_KEY
    );
    console.log("✅ Email sent to", email);
  } catch (err) {
    console.warn("EmailJS error:", err);
  }
}

// ── CALENDAR ────────────────────────────────
let selectedDate = null;

function renderCalendar() {
  const grid  = document.getElementById("calGrid");
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();

  const monthName   = today.toLocaleString("default", { month: "long", year: "numeric" });
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days        = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  grid.innerHTML = `<div class="cal-month">${monthName}</div>`;
  days.forEach(d => grid.innerHTML += `<div class="cal-header-cell">${d}</div>`);

  for (let i = 0; i < firstDay; i++) {
    grid.innerHTML += `<div class="cal-day empty"></div>`;
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date      = new Date(year, month, day);
    const isPast    = date < new Date(year, month, today.getDate());
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const disabled  = isPast || isWeekend;
    const cls       = disabled ? "cal-day disabled" : "cal-day";
    const onclick   = disabled ? "" : `onclick="selectDate(${year}, ${month}, ${day})"`;
    grid.innerHTML += `<div class="${cls}" id="day-${day}" ${onclick}>${day}</div>`;
  }
}

function selectDate(year, month, day) {
  document.querySelectorAll(".cal-day.selected").forEach(el => el.classList.remove("selected"));
  document.getElementById(`day-${day}`).classList.add("selected");

  selectedDate = new Date(year, month, day);
  const label  = selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  document.getElementById("selectedDateLabel").textContent = `Available times for ${label}`;
  document.getElementById("timeSlots").style.display = "block";
  renderTimeSlots();
}

function renderTimeSlots() {
  const slots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM"];
  const grid  = document.getElementById("slotsGrid");
  grid.innerHTML = "";
  slots.forEach(time => {
    const btn = document.createElement("button");
    btn.className   = "slot-btn";
    btn.textContent = time;
    btn.onclick     = () => bookAppointment(time);
    grid.appendChild(btn);
  });
}

// ── CALENDAR BOOKING ────────────────────────
// To connect Google Calendar: see README Part 5
// The function below shows the confirmation UI.
// Swap the inside with the Google Calendar API call from the README when ready.

function bookAppointment(time) {
  const dateStr = selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // ── GOOGLE CALENDAR INTEGRATION ──
  // Uncomment and configure this block after following README Part 5:
  //
  // tokenClient.callback = async (resp) => {
  //   if (resp.error) return;
  //   const iso   = selectedDate.toISOString().split("T")[0];
  //   const hour  = parseInt(time.split(":")[0]) + (time.includes("PM") && !time.startsWith("12") ? 12 : 0);
  //   const start = `${iso}T${String(hour).padStart(2,"0")}:00:00`;
  //   const end   = `${iso}T${String(hour+1).padStart(2,"0")}:00:00`;
  //   await gapi.client.calendar.events.insert({
  //     calendarId: "primary",
  //     resource: {
  //       summary:     `Quote Visit — ${formData.name}`,
  //       description: `Services: ${formData.services.join(", ")}\n\n${formData.message}\n\nContact: ${formData.email}`,
  //       start: { dateTime: start, timeZone: "America/Toronto" },
  //       end:   { dateTime: end,   timeZone: "America/Toronto" },
  //       attendees: [{ email: formData.email }],
  //       reminders: { useDefault: false, overrides: [{ method: "email", minutes: 60 }] }
  //     }
  //   });
  //   showConfirm(dateStr, time);
  // };
  // tokenClient.requestAccessToken({ prompt: "" });
  // return;
  // ── END GOOGLE CALENDAR ──

  // Default: show confirmation immediately (no calendar integration)
  showConfirm(dateStr, time);

  // Send booking confirmation email
  if (typeof emailjs !== "undefined") {
    emailjs.send(CONFIG.EMAILJS_SERVICE_ID, CONFIG.EMAILJS_TEMPLATE_ID, {
      to_email:  formData.email,
      to_name:   formData.name,
      ai_reply:  `Your quote visit with ${CONFIG.CONTRACTOR} has been scheduled for ${dateStr} at ${time}. We look forward to seeing you!`,
      from_name: CONFIG.COMPANY_NAME,
    }, CONFIG.EMAILJS_PUBLIC_KEY).catch(console.warn);
  }
}

function showConfirm(dateStr, time) {
  document.getElementById("calGrid").style.display     = "none";
  document.getElementById("timeSlots").style.display   = "none";
  document.getElementById("bookingConfirm").style.display = "block";
  document.getElementById("confirmDetails").textContent  = `${dateStr} at ${time}`;
}
