-- Seed Data: Insert a mock survey for the MVP Cosmos 2026 Event
-- Note: Replace the 'event_id' UUID with the actual UUID of the Cosmos 2026 event in your `event` table.

-- For this example, we assume the COSMOS 2026 event ID is '31f7a018-b3ca-4272-99f7-96fee480e41e'
-- as seen in data.json.

INSERT INTO public.survey (
    id, 
    event_id, 
    slug,
    is_active, 
    attendance_code, 
    close_time,
    questions_schema
) VALUES (
    '88888888-4444-4444-4444-123456789012', 
    '31f7a018-b3ca-4272-99f7-96fee480e41e', 
    'cosmos-2026',
    true, 
    'SparkAtCosmos', 
    '2026-04-01 00:00:00+00', -- Setting a future date for when the survey expires
    '{
      "version": "1.0",
      "steps": [
        {
          "id": "CONSENT",
          "title": "Evaluation Form: GDG Cosmos 2026",
          "type": "informational",
          "content": "Hey Googlers! Thank you for participating in the GDG Cosmos 2026!\nYou''ve experienced the content first-hand, and now your honest feedback is critical. By sharing your perspective, you become a key contributor to our continuous improvement. You help us sharpen our entire process and ensure that every future attendee experiences a truly seamless, highly informative, and engaging event.\nThis survey should take 3-5 minutes to complete. All responses are confidential and will be used solely for internal quality improvement purposes.\nWe look forward to hearing your perspective and powering our progress!",
          "policy": "DATA PRIVACY POLICY\nGoogle Developer Groups Polytechnic University of the Philippines values the confidentiality of personal data. This data privacy policy details how the organization uses and protects personal data for the purpose of obtaining the consent of data subjects, in accordance with the Data Privacy Act of 2012 (DPA), its Implementing Rules and Regulations (IRR), other issuances of the National Privacy Commission (NPC) and other relevant laws of the Philippines.\n\nWith whom may the Organization share personal data?\nAs a general rule, the organization does not share personal data with third parties but with concerned partners, as necessary for the proper execution of processes related to a declared purpose, or the use or disclosure is reasonably necessary, required, or authorized by or under law.\n\nHow long do we keep your information?\nYour personal information shall be retained for as long as it is necessary to the fulfillment of the purpose for which it was collected or as needed to meet legal or regulatory requirements, among others.\n\nKnow your Rights.\nBased on the provisions provided under Rule VIII, Section 34 of the Implementing Rules and Regulations (IRR) of RA 10173, otherwise known as the DATA PRIVACY ACT (DPA) of 2012, we are committed to upholding the following rights seen in https://www.privacy.gov.ph/know-your-rights/.\n\nHow to contact us.\nFor any issues, complaints, and any other privacy concerns, you may contact us at gdg.pupmnl@gmail.com."
        },
        {
          "id": "STATUS",
          "title": "Are you currently a student or alumnus of PUP?",
          "type": "selection",
          "options": ["Yes, I am a PUPian", "No, I am a Non-PUPian"]
        },
        {
          "id": "PERSONAL_INFO",
          "title": "PERSONAL INFORMATION",
          "description": "Please read the instructions and/or formatting guide at the sub-descriptions of specific questions.",
          "type": "formGroup",
          "fields": [
            { "name": "name", "label": "Name", "placeholder": "FirstName MI. LastName (e.g., Sparky G. Lorenzo)", "type": "text", "required": true },
            { "name": "college", "label": "College/Campus", "type": "select", "options": ["College of Accountancy and Finance (CAF)", "College of Architecture, Design and the Built Environment (CADBE)", "College of Arts and Letters (CAL)", "College of Business Administration (CBA)", "College of Communication (COC)", "College of Computer and Information Sciences (CCIS)", "College of Education (COED)", "College of Engineering (CE)", "College of Law (COL)", "College of Political Science and Public Administration (CPSPA)", "College of Social Sciences and Development (CSSD)", "College of Science (CS)", "College of Tourism, Hospitality and Transportation Management (CTHTM)", "Institute of Technology (ITECH)", "Open University System (OU)", "Laboratory High School", "Senior High School", "Alfonso", "Bansud", "Bataan", "Biñan", "Cabiao", "Calauan", "General Luna", "Leyte", "Lopez", "Maragondon", "Mulanay", "Parañaque", "Pulilan", "Quezon City", "Ragay", "Sablayan", "San Juan", "San Pedro", "Sta. Maria", "Sta. Rosa", "Sto. Tomas", "Taguig", "Unisan"], "conditional": "PUPian" },
            { "name": "program", "label": "Program (Do Not Abbreviate)", "placeholder": "e.g., Bachelor of Science in Information Technology", "type": "text", "conditional": "PUPian" },
            { "name": "yearLevel", "label": "Year Level", "type": "select", "options": ["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"], "conditional": "PUPian" },
            { "name": "organization", "label": "School/Organization", "type": "text", "conditional": "Non-PUPian" }
          ]
        },
        {
          "id": "EVALUATION",
          "title": "POST-EVENT EVALUATION FORM",
          "description": "This form will help us know your evaluation of the event so that we could improve the next time around. Rate the event based on the following conditions. We would like to have your honest feedback about the event so that the organization can improve its events.",
          "type": "feedbackGrid",
          "fields": [
            { "name": "ratings", "label": "Please rate the event that honestly reflects your opinion.", "type": "rating_grid", "rows": ["Schedule", "Duration", "Subject", "Speakers", "Program Flow"], "columns": ["Poor", "Fair", "Good", "Very Good", "Excellent"] },
            { "name": "overallSatisfaction", "label": "Overall, how satisfied were you with the event?", "type": "slider", "minLabel": "Very Dissatisfied", "maxLabel": "Very Satisfied", "min": 1, "max": 10 },
            { "name": "valuableAspects", "label": "What specific topics or aspects of event did you find most valuable or informative?", "type": "textarea", "required": true },
            { "name": "missingContent", "label": "Was there any content or topic you expected but was not covered?", "type": "textarea" },
            { "name": "suggestions", "label": "Do you have any other suggestions for improving the event?", "type": "textarea" },
            { "name": "questionsForSpeakers", "label": "Do you have questions for the speakers?", "type": "textarea" },
            { "name": "commentsForSpeakers", "label": "Do you have comments for the speakers? You may post here your appreciation message to them!", "type": "textarea" }
          ]
        }
      ]
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- Seed Data: Insert a mock response to demonstrate structure
INSERT INTO public.survey_response (
    survey_id,
    event_id,
    email,
    gdg_id,
    survey_data,
    certificate_url
) VALUES (
    '88888888-4444-4444-4444-123456789012',
    '31f7a018-b3ca-4272-99f7-96fee480e41e',
    'sparky.test@example.com',
    NULL,
    '{
        "isPUPian": true,
        "personalInfo": {
            "name": "Sparky G. Lorenzo",
            "college": "College of Computer and Information Sciences (CCIS)",
            "program": "Bachelor of Science in Information Technology",
            "yearLevel": "",
            "organization": ""
        },
        "evaluation": {
            "ratings": {
                "subject": 5,
                "duration": 5,
                "schedule": 5,
                "speakers": 5,
                "programFlow": 5
            },
            "suggestions": "Loved the event!",
            "missingContent": "None",
            "valuableAspects": "The tech talks",
            "overallSatisfaction": 5,
            "commentsForSpeakers": "Great job!",
            "questionsForSpeakers": ""
        }
    }'::jsonb,
    'https://example.com/certificates/31f7a018-b3ca-4272-99f7-96fee480e41e/GDG-10293.pdf'
) ON CONFLICT DO NOTHING;
