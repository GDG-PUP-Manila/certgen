import React, { useState } from "react";

type Step =
  | "CONSENT"
  | "STATUS"
  | "PERSONAL_INFO_PUPIAN"
  | "PERSONAL_INFO_NON_PUPIAN"
  | "EVALUATION"
  | "GCP_CREDITS"
  | "VERIFICATION"
  | "SUCCESS";

export default function SurveyForm({
  eventId,
  surveyData,
}: {
  eventId: string;
  surveyData?: any;
}) {
  const [step, setStep] = useState<Step>("CONSENT");
  const [loading, setLoading] = useState(false);
  const [attendanceCode, setAttendanceCode] = useState("");

  const schema = surveyData?.questions_schema?.steps || [];
  const getStepSchema = (id: string) => schema.find((s: any) => s.id === id);

  const [formData, setFormData] = useState({
    gdg_id: "",
    email: "",
    isPUPian: null as boolean | null,
    personalInfo: {} as Record<string, any>,
    evaluation: {
      ratings: {} as Record<string, number>,
      overallSatisfaction: 5,
    } as Record<string, any>,
  });

  const nextStep = () => {
    if (step === "CONSENT") setStep("STATUS");
    else if (step === "STATUS") {
      setStep(
        formData.isPUPian ? "PERSONAL_INFO_PUPIAN" : "PERSONAL_INFO_NON_PUPIAN",
      );
    } else if (
      step === "PERSONAL_INFO_PUPIAN" ||
      step === "PERSONAL_INFO_NON_PUPIAN"
    )
      setStep("EVALUATION");
    else if (step === "EVALUATION") setStep("GCP_CREDITS");
    else if (step === "GCP_CREDITS") setStep("VERIFICATION");
  };

  const prevStep = () => {
    if (step === "STATUS") setStep("CONSENT");
    else if (
      step === "PERSONAL_INFO_PUPIAN" ||
      step === "PERSONAL_INFO_NON_PUPIAN"
    )
      setStep("STATUS");
    else if (step === "EVALUATION") {
      setStep(
        formData.isPUPian ? "PERSONAL_INFO_PUPIAN" : "PERSONAL_INFO_NON_PUPIAN",
      );
    } else if (step === "GCP_CREDITS") setStep("EVALUATION");
    else if (step === "VERIFICATION") setStep("GCP_CREDITS");
  };

  const [certUrl, setCertUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      attendanceCode.trim().toUpperCase() !==
      surveyData?.attendance_code?.toUpperCase()
    ) {
      window.dispatchEvent(
        new CustomEvent("show-toast", {
          detail: "Invalid Attendance Code. Please check with the organizers.",
        }),
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/generate-cert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gdg_id: formData.gdg_id,
          email: formData.email,
          event_id: eventId,
          attendanceCode: attendanceCode,
          survey_data: {
            isPUPian: formData.isPUPian,
            personalInfo: formData.personalInfo,
            evaluation: formData.evaluation,
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate certificate");
      }

      const urlFromHeader = response.headers.get("X-Certificate-URL");
      if (urlFromHeader) setCertUrl(urlFromHeader);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const downloadName =
        formData.gdg_id ||
        formData.personalInfo.name?.replace(/[^a-zA-Z0-9]/g, "_") ||
        "guest";
      a.download = `GDG-Certificate-${downloadName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStep("SUCCESS");
    } catch (err: any) {
      window.dispatchEvent(
        new CustomEvent("show-toast", { detail: err.message }),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "CONSENT": {
        const stepSchema = getStepSchema("CONSENT");
        return (
          <div className="space-y-6">
            <div className="space-y-3 pb-6 border-b border-gray-100">
              <p className="text-xl md:text-2xl font-bold text-center tracking-widest leading-none">
                🔵🔴🟡🟢
              </p>
              <h2 className="text-xl md:text-2xl font-black text-[#202124] text-center">
                {stepSchema?.title || "Evaluation Form"}
              </h2>
              <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
                <p>{stepSchema?.content}</p>
              </div>
            </div>

            <h2 className="text-lg font-black text-[#202124]">
              Data Privacy Policy
            </h2>
            <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl text-sm leading-relaxed overflow-y-auto max-h-64 text-gray-700 whitespace-pre-wrap">
              {stepSchema?.policy}
            </div>

            <div className="bg-[#4285f4]/5 border border-[#4285f4]/20 p-4 rounded-xl">
              <p className="text-sm text-center text-[#4285f4] font-medium">
                By continuing, I acknowledge that I have read, and do hereby
                accept the Data Privacy Policy contained in this form.
              </p>
            </div>
            <button
              onClick={nextStep}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-[#4285f4] px-5 py-4 text-base font-bold text-white no-underline shadow-[0_10px_24px_rgba(66,133,244,0.28)] transition-transform duration-200 hover:scale-[1.02] hover:-translate-y-0.5"
            >
              I Accept & Continue
            </button>
          </div>
        );
      }

      case "STATUS": {
        const stepSchema = getStepSchema("STATUS");
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-[#202124]">
              {stepSchema?.title || "Are you currently a student?"}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {stepSchema?.options?.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    const isPUPianSelected = idx === 0;
                    setFormData({ ...formData, isPUPian: isPUPianSelected });
                    setStep(
                      isPUPianSelected
                        ? "PERSONAL_INFO_PUPIAN"
                        : "PERSONAL_INFO_NON_PUPIAN",
                    );
                  }}
                  className="group p-6 rounded-2xl border border-gray-200 hover:border-[#4285f4] text-left bg-white transition-all hover:shadow-[0_8px_20px_rgba(66,133,244,0.12)]"
                >
                  <div className="font-bold text-lg text-[#202124] group-hover:text-[#4285f4]">
                    {opt}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={prevStep}
              className="w-full text-center text-sm font-semibold text-gray-500 hover:text-[#202124] transition-colors mt-4"
            >
              &larr; Go Back
            </button>
          </div>
        );
      }

      case "PERSONAL_INFO_PUPIAN":
      case "PERSONAL_INFO_NON_PUPIAN": {
        const stepSchema = getStepSchema(step);
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              nextStep();
            }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-black text-[#202124]">
              {stepSchema?.title || "Personal Information"}
            </h2>
            <h3 className="text-lg font-bold text-gray-600">
              PERSONAL INFORMATION
            </h3>
            {stepSchema?.description && (
              <p className="text-sm text-gray-500">{stepSchema.description}</p>
            )}

            <div className="space-y-5">
              {stepSchema?.fields?.map((field: any, idx: number) => {
                // Conditional Logic Check based on isPUPian boolean
                if (field.conditional === "PUPian" && !formData.isPUPian)
                  return null;
                if (field.conditional === "Non-PUPian" && formData.isPUPian)
                  return null;

                // Special handling for the email field if they decide to add it back, but let's strictly use UI state mapping
                const isEmail =
                  field.type === "email" ||
                  field.label.toLowerCase().includes("email");
                const isGdgId = field.name === "gdg_id";

                if (field.type === "select") {
                  return (
                    <div key={idx}>
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-600">
                        {field.label} {field.required && "*"}
                      </label>
                      <select
                        required={field.required !== false} // Default to required in this setup unless specified false
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-[#4285f4]/50 focus:bg-white transition-all text-[#202124]"
                        value={formData.personalInfo[field.name] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personalInfo: {
                              ...formData.personalInfo,
                              [field.name]: e.target.value,
                            },
                          })
                        }
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                // Default text input
                return (
                  <div key={idx}>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-600 flex justify-between items-center">
                      <span>
                        {field.label} {field.required && "*"}
                      </span>
                      {field.name === "gdg_id" && (
                        <a
                          href="https://id.gdgpup.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#4285f4] hover:underline normal-case font-medium"
                        >
                          Find your ID &rarr;
                        </a>
                      )}
                    </label>
                    <input
                      type={isEmail ? "email" : field.type || "text"}
                      required={field.required}
                      className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-[#4285f4]/50 focus:bg-white transition-all text-[#202124]"
                      value={
                        isEmail
                          ? formData.email
                          : isGdgId
                            ? formData.gdg_id
                            : formData.personalInfo[field.name] || ""
                      }
                      onChange={(e) => {
                        if (isEmail) {
                          setFormData({ ...formData, email: e.target.value });
                        } else if (isGdgId) {
                          setFormData({ ...formData, gdg_id: e.target.value });
                        } else {
                          setFormData({
                            ...formData,
                            personalInfo: {
                              ...formData.personalInfo,
                              [field.name]: e.target.value,
                            },
                          });
                        }
                      }}
                      placeholder={field.placeholder || ""}
                    />
                  </div>
                );
              })}

              {/* Force an email capture if the schema doesn't provide it, as the backend requires it for the core unique ID tracking */}
              {!stepSchema?.fields?.some(
                (f: any) =>
                  f.type === "email" || f.label.toLowerCase().includes("email"),
              ) && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-600">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-[#4285f4]/50 focus:bg-white transition-all text-[#202124]"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="name@example.com"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-4 rounded-2xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center rounded-2xl bg-[#4285f4] px-5 py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(66,133,244,0.28)] transition-transform hover:scale-[1.02] hover:-translate-y-0.5"
              >
                Next Step
              </button>
            </div>
          </form>
        );
      }

      case "EVALUATION": {
        const stepSchema = getStepSchema("EVALUATION");
        return (
          <form
            onSubmit={(e) => {
              e.preventDefault();

              let missingRating = false;
              stepSchema?.fields?.forEach((field: any) => {
                if (field.type === "rating_grid") {
                  field.rows?.forEach((row: string) => {
                    const rowKey = row.replace(/\s+/g, "");
                    if (!formData.evaluation.ratings[rowKey]) {
                      missingRating = true;
                    }
                  });
                }
              });

              if (missingRating) {
                window.dispatchEvent(
                  new CustomEvent("show-toast", {
                    detail:
                      "Please complete all 1-5 rating questions before proceeding.",
                  }),
                );
                return;
              }

              nextStep();
            }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-black text-[#202124]">
              {stepSchema?.title || "Post-Event Evaluation"}
            </h2>
            {stepSchema?.description && (
              <p className="text-sm text-gray-500">{stepSchema.description}</p>
            )}

            <div className="space-y-6">
              {stepSchema?.fields?.map((field: any, idx: number) => {
                if (field.type === "rating_grid") {
                  return (
                    <div key={idx} className="space-y-4">
                      <label className="block text-[11px] md:text-xs font-bold uppercase tracking-[0.1em] text-gray-500 mb-6 font-sans">
                        {field.label}
                      </label>
                      <div className="space-y-4">
                        {field.rows?.map((row: string) => {
                          const rowKey = row.replace(/\s+/g, ""); // strip spaces for object key
                          return (
                            <div
                              key={row}
                              className="flex flex-col gap-3 bg-white p-5 rounded-3xl border border-gray-100 shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-all"
                            >
                              <span className="capitalize text-[#202124] font-bold text-base sm:text-lg">
                                {row}
                              </span>
                              <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                                {[1, 2, 3, 4, 5].map((n) => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        evaluation: {
                                          ...formData.evaluation,
                                          ratings: {
                                            ...formData.evaluation.ratings,
                                            [rowKey]: n,
                                          },
                                        },
                                      })
                                    }
                                    title={field.columns?.[n - 1] || String(n)}
                                    className={`aspect-square sm:w-14 sm:h-14 sm:aspect-auto flex items-center justify-center rounded-[14px] sm:rounded-[16px] text-lg sm:text-xl font-black transition-all duration-200 shadow-sm ${
                                      formData.evaluation.ratings[rowKey] === n
                                        ? "bg-[#4285f4] text-white shadow-[0_4px_16px_rgba(66,133,244,0.35)] scale-[1.05]"
                                        : "bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#4285f4] hover:border-[#4285f4]/30 hover:bg-white"
                                    }`}
                                  >
                                    {n}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (field.type === "slider") {
                  return (
                    <div
                      key={idx}
                      className="space-y-4 pt-4 border-t border-gray-100"
                    >
                      <div>
                        <label className="block text-sm sm:text-base font-bold uppercase tracking-wider mb-4 text-[#202124]">
                          {field.label}
                        </label>
                        <div className="grid grid-cols-5 sm:flex sm:flex-wrap gap-2.5">
                          {Array.from(
                            { length: field.max - field.min + 1 },
                            (_, i) => i + field.min,
                          ).map((n) => (
                            <button
                              key={`slider-${n}`}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  evaluation: {
                                    ...formData.evaluation,
                                    [field.name]: n,
                                  },
                                })
                              }
                              className={`aspect-square sm:w-14 sm:h-14 sm:aspect-auto flex items-center justify-center rounded-[16px] text-lg sm:text-xl font-black transition-all duration-200 shadow-sm ${
                                formData.evaluation[field.name] === n
                                  ? "bg-[#34a853] text-white shadow-[0_4px_16px_rgba(52,168,83,0.35)] scale-[1.05]"
                                  : "bg-gray-50 border border-gray-200 text-gray-500 hover:text-[#34a853] hover:border-[#34a853]/30 hover:bg-white"
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between mt-3 text-xs sm:text-sm text-gray-500 font-bold px-1 uppercase tracking-wide">
                          <span>{field.minLabel}</span>
                          <span>{field.maxLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (field.type === "textarea") {
                  return (
                    <div key={idx} className="pt-4 border-t border-gray-100">
                      <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-600">
                        {field.label} {field.required && "*"}
                      </label>
                      <textarea
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-[#4285f4]/50 focus:bg-white transition-all text-[#202124] resize-none"
                        value={formData.evaluation[field.name] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            evaluation: {
                              ...formData.evaluation,
                              [field.name]: e.target.value,
                            },
                          })
                        }
                        rows={3}
                        required={field.required}
                      />
                    </div>
                  );
                }

                return null;
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-4 rounded-2xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center rounded-2xl bg-[#4285f4] px-5 py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(66,133,244,0.28)] transition-transform hover:scale-[1.02] hover:-translate-y-0.5"
              >
                Proceed to Verification
              </button>
            </div>
          </form>
        );
      }

      case "GCP_CREDITS": {
        const stepSchema = getStepSchema("GCP_CREDITS");
        return (
          <div className="space-y-6 animate-[fade-in_300ms_both]">
            <h2 className="text-2xl font-black text-[#202124]">
              {stepSchema?.title || "Did you claim Google Cloud credits?"}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {stepSchema?.options?.map((opt: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => {
                    setFormData({
                      ...formData,
                      personalInfo: {
                        ...formData.personalInfo,
                        gcp_credits: opt,
                      },
                    });
                    nextStep();
                  }}
                  className="group p-6 rounded-2xl border border-gray-200 hover:border-[#4285f4] text-left bg-white transition-all hover:shadow-[0_8px_20px_rgba(66,133,244,0.12)]"
                >
                  <div className="font-bold text-lg text-[#202124] group-hover:text-[#4285f4]">
                    {opt}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={prevStep}
              className="w-full text-center text-sm font-semibold text-gray-500 hover:text-[#202124] transition-colors mt-4"
            >
              &larr; Go Back
            </button>
          </div>
        );
      }

      case "VERIFICATION":
        return (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-2xl font-black text-[#202124]">
                Almost there!
              </h2>
              <p className="text-gray-600">
                Please enter the Attendance Code provided during the event to
                claim your certificate.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  className="w-full text-center text-xl tracking-widest px-5 py-4 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-300 outline-none focus:border-[#4285f4] focus:bg-white transition-all text-[#202124]"
                  value={attendanceCode}
                  onChange={(e) => setAttendanceCode(e.target.value)}
                  placeholder="ENTER CODE"
                  maxLength={50}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-4 rounded-2xl border border-gray-300 font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || attendanceCode.length < 3}
                className="flex-1 inline-flex items-center justify-center rounded-2xl bg-[#34a853] px-5 py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(52,168,83,0.28)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
              >
                {loading ? "Processing..." : "Verify & Generate Certificate"}
              </button>
            </div>
          </form>
        );

      case "SUCCESS":
        return (
          <div className="text-center py-10 space-y-6 animate-[fade-in_500ms_cubic-bezier(0.2,0.8,0.2,1)_both]">
            <div className="w-20 h-20 bg-[#34a853] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_8px_20px_rgba(52,168,83,0.32)]">
              <svg
                className="w-10 h-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
            </div>
            <h2 className="text-3xl font-black text-[#202124]">Success!</h2>
            <p className="text-gray-600">
              Your evaluation has been recorded and your certificate has been
              generated and downloaded. Thank you for attending{" "}
              <strong>{surveyData?.slug?.toUpperCase() || "this event"}</strong>
              !
            </p>

            {certUrl && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href={certUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-[#4285f4] text-[#4285f4] px-6 py-3 font-bold hover:bg-[#4285f4]/5 transition-colors w-full sm:w-auto"
                >
                  View Public Certificate
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      gdg_id: "",
                      email: "",
                      isPUPian: null,
                      personalInfo: {},
                      evaluation: { ratings: {}, overallSatisfaction: 5 },
                    });
                    setAttendanceCode("");
                    setCertUrl(null);
                    setStep("CONSENT");
                  }}
                  className="inline-flex items-center justify-center rounded-2xl bg-gray-100 text-[#202124] px-6 py-3 font-bold hover:bg-gray-200 transition-colors w-full sm:w-auto"
                >
                  Submit Another Response
                </button>
              </div>
            )}
            {!certUrl && (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      gdg_id: "",
                      email: "",
                      isPUPian: null,
                      personalInfo: {},
                      evaluation: { ratings: {}, overallSatisfaction: 5 },
                    });
                    setAttendanceCode("");
                    setStep("CONSENT");
                  }}
                  className="inline-flex items-center justify-center rounded-2xl bg-gray-100 text-[#202124] px-6 py-3 font-bold hover:bg-gray-200 transition-colors"
                >
                  Submit Another Response
                </button>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto rounded-[32px] bg-white p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] ring-1 ring-gray-100 md:p-10 transition-all">
      <div className="mb-10 w-full flex gap-2 h-2">
        {[
          { id: "CONSENT", color: "bg-[#4285f4]", idx: 0 },
          { id: "STATUS", color: "bg-[#ea4335]", idx: 1 },
          { id: "PERSONAL_INFO", color: "bg-[#fbbc04]", idx: 2 },
          { id: "EVALUATION", color: "bg-[#34a853]", idx: 3 },
          { id: "GCP_CREDITS", color: "bg-[#fbbc04]", idx: 4 },
          { id: "VERIFICATION", color: "bg-[#4285f4]", idx: 5 },
        ].map((segment) => {
          const currentIdx =
            step === "CONSENT"
              ? 0
              : step === "STATUS"
                ? 1
                : step === "PERSONAL_INFO_PUPIAN" ||
                    step === "PERSONAL_INFO_NON_PUPIAN"
                  ? 2
                  : step === "EVALUATION"
                    ? 3
                    : step === "GCP_CREDITS"
                      ? 4
                      : step === "VERIFICATION"
                        ? 5
                        : 6;
          return (
            <div
              key={segment.idx}
              className="flex-1 bg-gray-100 rounded-full overflow-hidden"
            >
              <div
                className={`h-full ${segment.color} transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]`}
                style={{ width: currentIdx >= segment.idx ? "100%" : "0%" }}
              />
            </div>
          );
        })}
      </div>
      {renderStep()}
    </div>
  );
}
