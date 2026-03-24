import { getMemberById } from "../repositories/member.repository";
import { getEventById } from "../repositories/event.repository";
import { saveSurveyResponse, getActiveSurveyByEventId } from "../repositories/survey.repository";
import { uploadCertificate } from "../repositories/storage.repository";
import { convertPngToPdf } from "./pdf.service";
import { generateCertificate } from "./cert-generator";

export interface WorkflowInput {
  gdg_id?: string;
  email: string;
  event_id: string;
  attendanceCode: string;
  survey_data: any;
}

export const processCertificateWorkflow = async (data: WorkflowInput) => {
  // 1. Fetch Event Info
  const event = await getEventById(data.event_id);

  // 2. Fetch Active Survey
  const survey = await getActiveSurveyByEventId(data.event_id);

  if (!survey.is_active) {
    throw new Error("This survey is currently closed.");
  }

  if (survey.close_time && new Date() > new Date(survey.close_time)) {
    throw new Error("This survey has expired and is no longer accepting responses.");
  }

  // 3. Validate Code against Database
  if (data.attendanceCode.trim().toUpperCase() !== survey.attendance_code?.toUpperCase()) {
    throw new Error("The attendance code you entered is invalid. Please check with the organizers.");
  }

  let displayName = data.survey_data?.personalInfo?.name;

  // 4. Fetch Member Profile
  if (data.gdg_id && data.gdg_id.trim() !== "") {
    const member = await getMemberById(data.gdg_id);
    if (member.email.toLowerCase() !== data.email.toLowerCase()) {
      throw new Error("The provided GDG ID does not match the email address.");
    }
    
    // Only use database name if form name is missing
    if (!displayName || displayName.trim() === "") {
        displayName = member.display_name;
    }
  }

  if (!displayName || displayName.trim() === "") {
    throw new Error("Please provide your full name for the certificate.");
  }

  // Sanitize / Truncate text to prevent maliciously long strings from breaking Satori's visual layout bounds
  if (displayName.length > 40) {
    displayName = displayName.substring(0, 37) + "...";
  }

  // 4. Generate High-Res PNG
  const pngBuffer = await generateCertificate({
    displayName,
  });

  // 5. Convert PNG to PDF
  const pdfBuffer = await convertPngToPdf(pngBuffer);

  // 6. Upload PDF to Storage
  const safeIdentifier = (data.gdg_id && data.gdg_id.trim() !== "") 
    ? data.gdg_id 
    : data.email.replace(/[^a-zA-Z0-9]/g, "_");
    
  const fileName = `certificates/${data.event_id}/${safeIdentifier}.pdf`;
  const publicUrl = await uploadCertificate(fileName, pdfBuffer);

  // 8. Save Survey Response
  await saveSurveyResponse({
    gdg_id: (data.gdg_id && data.gdg_id.trim() !== "") ? data.gdg_id : null,
    email: data.email,
    survey_id: survey.id,
    event_id: data.event_id,
    survey_data: data.survey_data,
    certificate_url: publicUrl,
  });

  return {
    pdfBuffer,
    publicUrl,
    safeIdentifier
  };
};
