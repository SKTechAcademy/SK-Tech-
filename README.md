# SK Tech Academy Website

Complete website for SK Tech Academy with a public landing page, interview dashboard, candidate dashboard, and admin dashboard.

## What was developed

### 1. Public Landing Page (`index.html`)
- Modern dark theme with animated gradient background and floating particles
- Glassmorphism header, cards, and sections
- Animated hero text, pulsing CTA button, and icon tags
- Counter stats that animate on scroll
- Staggered scroll-reveal animations on all grids (courses, technologies, companies, testimonials, bottom cards)
- Testimonials grid with avatars and hover lift effects
- Animated achievement trophy with sparkles and glow
- Animated footer and WhatsApp button
- Responsive layout for desktop, tablet, and mobile

### 2. Interview Dashboard (`interviews.html` + `dashboard.css` + `dashboard.js`)
- Tab-based filtering: **All Upcoming**, **Today**, **Tomorrow**, **Available Slots**
- Technology column hidden from public view
- Color-coded rows: today (blue), tomorrow (orange), future (purple), conflict/booked (red), available today (green), available future (blue)
- Dynamic available slot generation based on operating hours (7 AM – 12 AM midnight) and existing bookings
- 5-day available slots calendar showing booked slots in red and free slots in green/blue
- Animated background, particles, header, cards, and table rows
- **Interview Scheduling** button linked to Google Form
- Loading, error, and empty states

### 3. Candidate Dashboard (`candidate.html` + `candidate.js`)
- Role-based access (candidate only)
- Shows only the logged-in candidate's booked slots
- Personalized welcome message
- Available slots and booked slots tables
- Loading/error/empty states
- Firebase authentication + logout

### 4. Admin Dashboard (`admin.html` + `admin.js`)
- Role-based access (admin only)
- All upcoming interviews table
- Conflict detection highlighted in red
- Today's count and total count cards
- Loading/error/empty states
- Firebase authentication + logout

### 5. Shared Utilities (`shared-utils.js`)
- Date/time formatting and parsing
- Conflict detection
- API URL constant
- Sorting by date/time
- Loading/error/empty DOM helpers
- Escape HTML helper

### 6. Authentication Guard (`auth-guard.js`)
- Client-side role-based page protection
- Redirects unauthorized users to login
- Normalizes role values to lowercase

### 7. Authentication (`auth.js` + `login.html`)
- Firebase login with email/password
- Role-based redirection after login
- Already-logged-in users are redirected from login page
- Logout clears all relevant localStorage keys

### 8. Local Preview Server (`sktech-server.ps1`)
- PowerShell static file server
- Handles URL decoding for special characters and spaces
- Runs at `http://127.0.0.1:8080`

---

## Files and their purpose

| File | Purpose |
|------|---------|
| `index.html` | Public landing page |
| `interviews.html` | Public interview dashboard with slots |
| `candidate.html` | Candidate dashboard |
| `admin.html` | Admin dashboard |
| `login.html` | Login page |
| `dashboard.css` | Styles for interview dashboard |
| `dashboard.js` | Logic for interview dashboard tabs and available slots |
| `candidate.js` | Candidate dashboard logic |
| `admin.js` | Admin dashboard logic |
| `auth.js` | Firebase login/logout logic |
| `auth-guard.js` | Role-based page protection |
| `shared-utils.js` | Common date/time, API, conflict helpers |
| `firebase-config.js` | Firebase project configuration |
| `sktech-server.ps1` | Local preview server script |
| `README.md` | This guide |

---

## How to run the website locally

1. Open **PowerShell**.
2. Run the local server script:
   ```powershell
   C:\Users\siva9\AppData\Local\Temp\sktech-server.ps1
   ```
3. Open the browser at:
   ```
   http://127.0.0.1:8080
   ```

> Note: The server must stay running. If you close PowerShell, the site stops.

---

## How to add a new student testimonial

1. Open `index.html`.
2. Find the `<div class="testimonials-grid stagger">` section.
3. Copy an existing testimonial card and paste it inside the grid.
4. Update the quote, avatar initials, name, and role.

Example:
```html
<div class="testimonial">
  <div class="quote-icon">❝</div>
  <p>"Your testimonial quote here."</p>
  <div class="testimonial-author">
    <div class="author-avatar">AB</div>
    <div>
      <b>Full Name</b>
      <p>Job Title at Company</p>
    </div>
  </div>
</div>
```

- The grid is responsive: 4 columns on desktop, 2 on tablet, 1 on mobile.
- Delete a card to remove it.

---

## How to change interview operating hours

The available slots are generated from the operating hours set in `dashboard.js`:

```javascript
const OPEN_MINUTES = 7 * 60;   // 7:00 AM
const CLOSE_MINUTES = 24 * 60; // 12:00 AM midnight
```

To change the hours, edit these two values. For example, for 9 AM to 6 PM:
```javascript
const OPEN_MINUTES = 9 * 60;   // 9:00 AM
const CLOSE_MINUTES = 18 * 60; // 6:00 PM
```

---

## How to change the number of available slot days

In `dashboard.js`, find this line inside `loadData()`:
```javascript
const filteredRows = filterByTab(allRows, activeTab, upcoming, 5);
```

Change `5` to the number of days you want to show.

---

## How to update the Interview Scheduling button link

In `interviews.html`, find the `schedule-btn` link and change the `href`:
```html
<a href="YOUR_GOOGLE_FORM_LINK" target="_blank" class="schedule-btn">Interview Scheduling</a>
```

---

## How to change the API URL

The API URL is defined in `shared-utils.js`:
```javascript
const API_URL = "https://script.google.com/macros/s/.../exec";
```

Update this value if your Google Apps Script URL changes. The same constant is used across all dashboards.

---

## How role-based access works

- Every protected page has `data-required-role` on the `<body>` tag.
- `auth-guard.js` reads `userRole` from `localStorage`.
- If the user is not logged in or has the wrong role, they are redirected to `login.html`.
- `auth.js` stores the role in lowercase for consistency.

---

## Common colors and how to change them

Colors are defined in CSS variables at the top of `index.html`:
```css
:root{
  --navy:#061a3b;
  --blue:#0866ff;
  --orange:#ff8500;
  --green:#18b34b;
  --text:#d1d7e6;
}
```

For the interview dashboard, colors are directly in `dashboard.css` (search for `tr.today-row`, `tr.booked-row`, etc.).

---

## Tips for maintaining the project

- Keep image URLs valid (Unsplash URLs used in landing page).
- Do not delete `shared-utils.js` or `auth-guard.js`; they are required by multiple pages.
- Test changes locally before sharing the live link.
- If the local server fails, restart `sktech-server.ps1`.

---

## Support

For technical changes, update the relevant file above and refresh the local preview.
