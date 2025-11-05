# Question Management System Implementation

## Overview

Comprehensive question management system where faculty can create questions for all domains (aptitude, coding, communication, technical, dsa, dbms, os, networking) and students can take tests. The system dynamically updates the leaderboard based on student performance. This replaces all previous third-party external links.

---

## Backend Implementation

### 1. Question Model (`server/models/Question.js`)

**Purpose**: Unified schema for all domain questions

**Schema Fields**:

- `domain`: Enum (aptitude, coding, communication, technical, dsa, dbms, os, networking)
- `question`: String (required)
- `options`: Array of exactly 4 strings (validated)
- `correctAnswer`: String (must be one of the 4 options, validated)
- `explanation`: String (optional)
- `difficulty`: Enum (easy, medium, hard)
- `time`: Number (in seconds, 15-300)
- `createdBy`: String (faculty email)
- `isActive`: Boolean (default true)
- `timestamps`: createdAt, updatedAt

**Indexes**:

- Compound index on `domain` and `isActive`
- Single index on `createdBy`

---

### 2. Questions API Routes (`server/routes/questions.js`)

**Endpoints**:

#### Faculty Endpoints (Require Authentication)

1. **POST /api/questions/add**

   - Add new question
   - Validates 4 options and correct answer
   - Stores faculty email in createdBy

2. **GET /api/questions/manage/:domain**

   - Get all questions for domain with answers
   - Faculty-only access

3. **GET /api/questions/my-questions**

   - Get questions created by logged-in faculty

4. **GET /api/questions/stats/:domain**

   - Get question statistics by difficulty level

5. **PUT /api/questions/:id**

   - Update question
   - Validates options and correct answer

6. **DELETE /api/questions/:id**

   - Delete question permanently

7. **PATCH /api/questions/:id/toggle**
   - Toggle isActive status

#### Student Endpoints (Public)

1. **GET /api/questions/domain/:domain**

   - Fetch active questions (hides correctAnswer and explanation)
   - Query params: `limit` (default 10), `difficulty`

2. **POST /api/questions/verify**
   - Verify student answers
   - Returns: score, percentage, total, detailed results with correct answers
   - Used after test completion

---

## Frontend Implementation

### 1. Faculty Components

#### AddQuestion.jsx (`client/src/FacultyDashboard/pages/AddQuestion.jsx`)

**Purpose**: Modern form for faculty to add questions

**Features**:

- Dynamic domain configuration (8 domains with unique colors/icons)
- Question textarea input
- 4-option grid with visual correct answer indicator
- Dropdown for selecting correct answer
- Optional explanation field
- Difficulty selector (easy/medium/hard)
- Time input (15-300 seconds)
- Real-time form validation
- Loading state during submission
- "View All Questions" button → ManageQuestions
- Quick tips sidebar with best practices

**Styling**: `AddQuestion.css` with gradient headers, responsive grid, animations

**Route**: `/FacultyDashboard/AddQuestion/:domain`

---

#### ManageQuestions.jsx (`client/src/FacultyDashboard/pages/ManageQuestions.jsx`)

**Purpose**: Faculty question management dashboard

**Features**:

- Stats cards (total, active, easy, medium, hard counts)
- Filters for status (all/active/inactive) and difficulty
- Question cards displaying:
  - Full question text
  - All 4 options with correct answer highlighted (green)
  - Explanation box
  - Difficulty badge
  - Time badge
  - Inactive badge (if applicable)
  - Created date
- Toggle active/inactive button
- Delete button with confirmation
- Empty state with "Add First Question" CTA
- Domain-specific header with icon/color

**Styling**: `ManageQuestions.css` with stat cards, badges, responsive layout

**Route**: `/FacultyDashboard/ManageQuestions/:domain`

---

#### Updated Practicepage.jsx

**Changes**:

- Updated all domain links from old routes to `/FacultyDashboard/AddQuestion/:domain`
- Domains: aptitude, coding, communication, technical, dsa, dbms, os, networking

---

### 2. Student Components

#### DomainTest.jsx (`client/src/StudentDashboard/pages/DomainTest.jsx`)

**Purpose**: Unified test-taking interface for all domains

**Features**:

**Three-State UI**:

1. **Start Screen**:

   - Domain icon and title with gradient
   - Test info cards (question count, total time)
   - Instructions list (timer, one answer per question, auto-submit, review)
   - Start button

2. **Test In Progress**:

   - Countdown timer (MM:SS format) with auto-submit at 0
   - Progress bar showing X/Y answered
   - Question display with number
   - 4 clickable option buttons
   - Selected option shows checkmark icon
   - Previous/Next navigation buttons
   - Submit button on last question

3. **Results Screen**:
   - Circular progress SVG (percentage display)
   - Score (correct/total)
   - Retry button (retake test)
   - View Leaderboard button
   - Detailed answer review:
     - Each question with correct/wrong indicator (green/red)
     - Shows user's answer
     - Shows correct answer
     - Displays explanation if available

**API Interactions**:

- Fetches questions: `GET /api/questions/domain/:domain?limit=10`
- Verifies answers: `POST /api/questions/verify`
- Submits to leaderboard: `POST /api/leaderboard/submit`

**Styling**: `DomainTest.css` with gradient headers, circular progress, answer review cards

**Route**: `/StudentDashboard/DomainTest/:domain`

---

#### Updated Practice.jsx

**Changes**:

- Removed ALL external third-party links (indiabix.com)
- Replaced with internal routes: `/StudentDashboard/DomainTest/:domain`
- Updated click handler to navigate internally (removed window.open)
- Removed "Faculty Aptitude Test" card (now unified with Aptitude domain)
- 8 domain cards: aptitude, coding, communication, technical, dsa, dbms, os, networking

---

## Routing Updates

### App.js Changes

**New Imports**:

```javascript
import AddQuestion from "./FacultyDashboard/pages/AddQuestion.jsx";
import ManageQuestions from "./FacultyDashboard/pages/ManageQuestions.jsx";
import DomainTest from "./StudentDashboard/pages/DomainTest.jsx";
```

**New Faculty Routes**:

```javascript
<Route path="AddQuestion/:domain" element={<AddQuestion />} />
<Route path="ManageQuestions/:domain" element={<ManageQuestions />} />
```

**New Student Routes**:

```javascript
<Route path="DomainTest/:domain" element={<DomainTest />} />
```

---

## Domain Configuration

All components use consistent domain configuration:

```javascript
const domainConfig = {
  aptitude: {
    name: "Aptitude",
    icon: <FaCalculator />,
    color: "#2563eb",
    title: "Aptitude Test",
  },
  coding: {
    name: "Coding",
    icon: <FaCode />,
    color: "#16a34a",
    title: "Coding Test",
  },
  communication: {
    name: "Communication",
    icon: <FaComments />,
    color: "#9333ea",
    title: "Communication Skills Test",
  },
  technical: {
    name: "Technical",
    icon: <FaCogs />,
    color: "#ea580c",
    title: "Technical MCQs Test",
  },
  dsa: {
    name: "DSA",
    icon: <FaCode />,
    color: "#8b5cf6",
    title: "Data Structures & Algorithms Test",
  },
  dbms: {
    name: "DBMS",
    icon: <FaDatabase />,
    color: "#e11d48",
    title: "Database Management Test",
  },
  os: {
    name: "OS",
    icon: <FaServer />,
    color: "#22c55e",
    title: "Operating Systems Test",
  },
  networking: {
    name: "Networking",
    icon: <FaNetworkWired />,
    color: "#0ea5e9",
    title: "Networking Basics Test",
  },
};
```

---

## User Flow

### Faculty Flow:

1. Navigate to Practice page → See "Add Practice Questions by Category"
2. Click on any domain card → Redirects to `/FacultyDashboard/AddQuestion/:domain`
3. Fill form (question, 4 options, select correct answer, explanation, difficulty, time)
4. Click "Add Question" → Question saved to database
5. Click "View All Questions" → Redirects to `/FacultyDashboard/ManageQuestions/:domain`
6. See all questions with filters (status, difficulty)
7. Toggle active/inactive or delete questions as needed

### Student Flow:

1. Navigate to Practice page → See 8 domain cards
2. Click on any domain → Redirects to `/StudentDashboard/DomainTest/:domain`
3. See start screen with test info and instructions
4. Click "Start Test" → Timer begins
5. Answer questions (next/previous navigation)
6. Click "Submit Test" or timer expires → Auto-submit
7. Answers verified via backend
8. Score submitted to leaderboard automatically
9. See results with circular percentage display
10. Review detailed answers (correct/incorrect with explanations)
11. Retry test or view leaderboard

---

## Key Features

### Security:

- Server-side answer verification (students never see correct answers before submission)
- Faculty-only routes for add/edit/delete operations
- Active/inactive toggle for question visibility control

### Performance:

- Indexed queries on domain and isActive
- Limit parameter for fetching questions (default 10)
- Efficient aggregation for statistics

### UX:

- Consistent design system across all components
- Gradient headers with domain colors
- Responsive mobile design
- Real-time form validation
- Loading states
- Toast notifications for success/error
- Empty states with CTAs
- Countdown timer with visual feedback
- Progress tracking (X/Y answered)
- Detailed answer review with explanations

### Leaderboard Integration:

- Automatic submission after test completion
- Score calculation: (correct answers / total questions) \* 100
- Time tracking for performance metrics
- Domain-specific leaderboard entries

---

## Testing Checklist

### Backend Testing:

- [ ] Create question via POST /add
- [ ] Fetch questions via GET /domain/:domain
- [ ] Verify answers via POST /verify
- [ ] Update question via PUT /:id
- [ ] Delete question via DELETE /:id
- [ ] Toggle active status via PATCH /:id/toggle
- [ ] Get statistics via GET /stats/:domain
- [ ] Test validation (4 options, correct answer)

### Frontend Testing:

- [ ] Faculty: Navigate to AddQuestion with different domains
- [ ] Faculty: Submit valid question form
- [ ] Faculty: View questions in ManageQuestions
- [ ] Faculty: Filter by status and difficulty
- [ ] Faculty: Toggle active/inactive
- [ ] Faculty: Delete question
- [ ] Student: Navigate to DomainTest with different domains
- [ ] Student: Start test and see timer countdown
- [ ] Student: Answer questions and navigate
- [ ] Student: Submit test and see results
- [ ] Student: Review answers with explanations
- [ ] Student: Retry test
- [ ] Verify leaderboard updates after test submission
- [ ] Test responsive design on mobile

### Integration Testing:

- [ ] Faculty adds question → Student sees it in test
- [ ] Faculty deactivates question → Student doesn't see it
- [ ] Student completes test → Leaderboard updates
- [ ] All 8 domains work correctly
- [ ] External links removed from Practice page

---

## Files Created/Modified

### Created:

1. `server/models/Question.js` - Question schema
2. `server/routes/questions.js` - API routes
3. `client/src/FacultyDashboard/pages/AddQuestion.jsx` - Add question form
4. `client/src/FacultyDashboard/styles/AddQuestion.css` - Styling
5. `client/src/FacultyDashboard/pages/ManageQuestions.jsx` - Question management
6. `client/src/FacultyDashboard/styles/ManageQuestions.css` - Styling
7. `client/src/StudentDashboard/pages/DomainTest.jsx` - Test-taking interface
8. `client/src/StudentDashboard/styles/DomainTest.css` - Styling

### Modified:

1. `server/index.js` - Registered questions routes
2. `client/src/StudentDashboard/pages/Practice.jsx` - Updated domain links
3. `client/src/FacultyDashboard/pages/Practicepage.jsx` - Updated domain links
4. `client/src/App.js` - Added new routes and imports

---

## Next Steps

1. **Start the server**:

   ```bash
   cd server
   npm start
   ```

2. **Start the client**:

   ```bash
   cd client
   npm start
   ```

3. **Test the flow**:

   - Login as faculty
   - Add questions for a domain
   - Login as student
   - Take test on that domain
   - Verify leaderboard updates

4. **Optional Improvements**:
   - Add bulk question upload via CSV
   - Add question bank export
   - Add analytics for question performance
   - Add student test history
   - Add timed section-wise tests
   - Add question difficulty adaptation based on student performance

---

## Conclusion

The question management system is now fully implemented with:

- ✅ Faculty can add/edit/delete questions for all 8 domains
- ✅ Students can take tests with timer and navigation
- ✅ Server-side answer verification for security
- ✅ Automatic leaderboard updates
- ✅ All third-party links removed
- ✅ Responsive UI/UX across all components
- ✅ Complete integration with existing portal
