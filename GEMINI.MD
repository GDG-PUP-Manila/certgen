# Technical Specification: Automated PNG Certificate Generation

## 1. Overview

A public-facing, no-auth workflow that allows event registrants to submit a feedback survey and instantly download a personalized, high-quality PNG certificate of participation. The system leverages Vercel's serverless infrastructure and Satori to dynamically render HTML/CSS designs into flat images.

---

## 2. Architecture & Tech Stack

- **Framework:** Astro (configured for Server-Side Rendering).
- **Deployment:** Vercel (using the `@astrojs/vercel/serverless` adapter).
- **Database:** Supabase (for verifying registrants and storing survey results).
- **Generation Engine:** \* `satori`: Converts JSX/HTML/Tailwind CSS into an SVG.
  - `@resvg/resvg-js`: Rasterizes the SVG into a high-fidelity PNG.
- **Assets:** Static template background (`.png`) and custom fonts (`.ttf`) stored in the `public/` directory.

---

## 3. Project Structure

```text
src/
├── components/
│   └── SurveyForm.tsx          # React component for user input
├── pages/
│   ├── index.astro             # Public landing page hosting the survey
│   └── api/
│       └── generate-cert.ts    # Vercel Serverless Function (POST endpoint)
public/
├── cert-template/
│   └── base-template.png       # The blank certificate background
└── fonts/
    └── Roboto-Bold.ttf         # Font required by Satori for rendering text
```

## 4. Detailed Technical Flow

### Step A: Survey Submission (Client-Side)

- **Input:** User fills out the survey (`SurveyForm.tsx`) and provides their Email or Registration ID.
- **Action:** Upon clicking "Submit", the frontend makes a POST request to `/api/generate-cert` with the survey payload.
- **UX:** The form displays a loading state (e.g., "Generating your certificate...") as this process takes ~1-2 seconds.

### Step B: Validation & Persistence (Server-Side API)

- **Endpoint:** Request hits `src/pages/api/generate-cert.ts`.
- **Verification:** Query the events or registrants table in Supabase to ensure the provided Email/ID is valid for this event.
- **Save:** Insert the survey responses into the surveys table (marking the user as having completed it).

### Step C: Image Generation (Satori + Resvg)

- **Load Assets:** The function reads the required `.ttf` font file from the file system into memory.
- **Render SVG:** Satori is called with a JSX object. The `base-template.png` is set as the background, and the user's verified name is injected into a `<div>` absolutely positioned over the blank name line.
- **Rasterize PNG:** The resulting SVG string is passed to `resvg-js`, which converts it into a raw PNG binary buffer.

### Step D: Delivery & Download

- **Response:** The API returns the raw PNG buffer directly to the client with the `Content-Type: image/png` header.
- **Client Download:** The frontend receives the Blob, creates a temporary object URL (`URL.createObjectURL`), and programmatically triggers an anchor tag download (`<a download="Event-Certificate.png">`).

## 5. API Contract: `/api/generate-cert`

- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Request Body:**

```json
{
  "email": "user@example.com",
  "eventId": "sparkfest-2026",
  "surveyData": {
    "rating": 5,
    "feedback": "Great event!"
  }
}
```

- **Success Response (200 OK):**
  - **Headers:** `Content-Disposition: attachment; filename="certificate.png"`
  - **Body:** Raw binary PNG data.

- **Error Response (400/404/500):**

```json
{
  "error": "Registrant not found"
}
```

## 6. Infrastructure Constraints & Security

- **Vercel Serverless Environment:** The API route must run in a standard Node.js serverless environment, not the Edge. `@resvg/resvg-js` uses WebAssembly/C-bindings that require the standard Node runtime.
- **Input Sanitization:** The registrant's name fetched from the database must be truncated to a maximum length (e.g., 40 characters) before passing to Satori to prevent the text from overflowing the certificate design.
- **Rate Limiting:** Implement basic IP-based rate limiting on the Vercel function to prevent abuse of the generation endpoint.
- **Idempotency:** If a user submits the survey twice, the database should either update the existing record or ignore the second survey, but still successfully return the generated certificate so they don't get locked out of downloading it again.

## 7. Survey Questions
SECTION 1

Evaluation Form: GDG Cosmos 2026

🔵🔴🟡🟢
Hey Googlers! Thank you for participating in the GDG Cosmos 2026!
You've experienced the content first-hand, and now your honest feedback is critical. By sharing your perspective, you become a key contributor to our continuous improvement. You help us sharpen our entire process and ensure that every future attendee experiences a truly seamless, highly informative, and engaging event.
This survey should take 3-5 minutes to complete. All responses are confidential and will be used solely for internal quality improvement purposes.
We look forward to hearing your perspective and powering our progress!

SECTION 2

DATA PRIVACY POLICY
Google Developer Groups Polytechnic University of the Philippines values the confidentiality of personal data. This data privacy policy details how the organization uses and protects personal data for the purpose of obtaining the consent of data subjects, in accordance with the Data Privacy Act of 2012 (DPA), its Implementing Rules and Regulations (IRR), other issuances of the National Privacy Commission (NPC) and other relevant laws of the Philippines.

With whom may the Organization share personal data?
As a general rule, the organization does not share personal data with third parties but with concerned partners, as necessary for the proper execution of processes related to a declared purpose, or the use or disclosure is reasonably necessary, required, or authorized by or under law.

How long do we keep your information?
Your personal information shall be retained for as long as it is necessary to the fulfillment of the purpose for which it was collected or as needed to meet legal or regulatory requirements, among others.

Know your Rights.
Based on the provisions provided under Rule VIII, Section 34 of the Implementing Rules and Regulations (IRR) of RA 10173, otherwise known as the DATA PRIVACY ACT (DPA) of 2012, we are committed to upholding the following rights seen in https://www.privacy.gov.ph/know-your-rights/.

How to contact us.
For any issues, complaints, and any other privacy concerns, you may contact us at gdg.pupmnl@gmail.com.
[Question]
I have read this form, understood its contents and consent to the processing of my personal data. I understand that my consent does not preclude the existence of other criteria for lawful processing of personal data, and does not waive any of my rights under the Data Privacy Act of 2012 and other applicable laws.
[Option]

By continuing, I acknowledge that I have read, and do hereby accept the Data Privacy Policy contained in this form.

SECTION 2

[Question 1]
Are you currently a student or alumnus of PUP?

[Option]
Yes, I am a PUPian 
No, I am a Non-PUPian


SECTION 3 - NON-PUPIAN

PERSONAL INFORMATION
Please read the instructions and/or formatting guide at the sub-descriptions of specific questions.

[Question 1]
Name
Format: FirstName MI. LastName (e.g., Sparky G. Lorenzo)

[Question 2]
School/Organization









SECTION 4 - PUPIAN

PERSONAL INFORMATION
Please read the instructions and/or formatting guide at the sub-descriptions of specific questions.

[Question 1]
Name
Format: FirstName MI. LastName (e.g., Sparky G. Lorenzo)

[Question 2]
College/Campus

[Option]
College of Accountancy and Finance (CAF)
College of Architecture, Design and the Built Environment (CADBE)
College of Arts and Letters (CAL)
College of Business Administration (CBA)
College of Communication (COC)
College of Computer and Information Sciences (CCIS)
College of Education (COED)
College of Engineering (CE)
College of Law (COL)
College of Political Science and Public Administration (CPSPA)
College of Social Sciences and Development (CSSD)
College of Science (CS)
College of Tourism, Hospitality and Transportation Management (CTHTM)
Institute of Technology (ITECH)
Open University System (OU)
Laboratory High School
Senior High School
Alfonso
Bansud
Bataan
Biñan
Cabiao
Calauan
General Luna
Leyte
Lopez
Maragondon
Mulanay
Parañaque
Pulilan
Quezon City
Ragay
Sablayan
San Juan
San Pedro
Sta. Maria
Sta. Rosa
Sto. Tomas
Taguig 
Unisan


[Question 3]
Program (Do Not Abbreviate)
e.g., Bachelor of Science in Information Technology

[Question 4]
Year Level

[Option]
First Year
Second Year
Third Year
Fourth Year
Fifth Year

SECTION 5
POST-EVENT EVALUATION FORM
This form will help us know your evaluation of the event so that we could improve the next time around. Rate the event based on the following conditions. We would like to have your honest feedback about the event so that the organization can improve its events.

[Question 1]
Please rate the event that honestly reflects your opinion.

[Option]
Rows: Schedule, Duration, Subject, Speakers, Program Flow
Column: Poor, Fair, Good, Very Good, Excellent


[Question 2]
Overall, how satisfied were you with the event?

[Option]
Very Dissatisfied - Very Satisfied


[Question 3]
What specific topics or aspects of event did you find most valuable or informative?

[Question 4]
Was there any content or topic you expected but was not covered?  

[Question 5]
Do you have any other suggestions for improving the event?

[Question 6]
Do you have questions for the speakers?

[Question 7]
Do you have comments for the speakers?
You may post here your appreciation message to them!
