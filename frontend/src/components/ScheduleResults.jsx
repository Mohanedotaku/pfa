import React, { useState } from "react";
import { toast } from "react-toastify"; // Optional: Remove if not installed

const ScheduleResults = ({
  onViewAssignments,
  onExportSchedule,
  onRegenerateSchedule,
  generationError,
}) => {
  const [generationStatus, setGenerationStatus] = useState("idle");
  const [scheduleData, setScheduleData] = useState([]);
  const [showTimetables, setShowTimetables] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isValidDate = (dateStr) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  };

  const validSessions = ["s1", "s2", "s3", "s4"];
  const isValidSession = (session) => validSessions.includes(session?.toLowerCase());

  const handleViewAssignments = async () => {
    setGenerationStatus("loading");
    setShowTimetables(true);

    try {
      const response = await onViewAssignments();
      const data = Array.isArray(response) ? response : [];

      if (data.length === 0) {
        setGenerationStatus("error");
        setErrorMessage("No supervisors found in the schedule.");
        toast.error("No supervisors found in the schedule.", {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }

      const validatedData = data.filter((teacher) => {
        if (!teacher.TeacherName) {
          console.warn("Skipping teacher with missing TeacherName:", teacher);
          return false;
        }
        if (!Array.isArray(teacher.Sessions)) {
          console.warn(`Skipping teacher ${teacher.TeacherName} with invalid Sessions:`, teacher.Sessions);
          return false;
        }
        const hasValidSessions = teacher.Sessions.every((sessionGroup) => {
          if (!isValidDate(sessionGroup.Date)) {
            console.warn(`Invalid date for ${teacher.TeacherName}:`, sessionGroup.Date);
            return false;
          }
          if (!Array.isArray(sessionGroup.Sessions)) {
            console.warn(`Invalid sessions for ${teacher.TeacherName} on ${sessionGroup.Date}:`, sessionGroup.Sessions);
            return false;
          }
          return sessionGroup.Sessions.every(isValidSession);
        });
        return hasValidSessions;
      });

      if (validatedData.length === 0) {
        setGenerationStatus("error");
        setErrorMessage("No valid supervisor schedules found. Please check the data.");
        toast.error("No valid supervisor schedules found.", {
          position: "top-right",
          autoClose: 5000,
        });
        return;
      }

      setScheduleData(validatedData);
      setGenerationStatus("success");
    } catch (error) {
      setGenerationStatus("error");
      setErrorMessage(
        error.message || "Failed to fetch schedule data. Please try again."
      );
      toast.error(
        error.message || "Failed to fetch schedule data. Please try again.",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
    }
  };

  const handleRetry = () => {
    setGenerationStatus("idle");
    setErrorMessage("");
    setShowTimetables(false);
    handleViewAssignments();
  };

  const handleBack = () => {
    setShowTimetables(false);
    setGenerationStatus("success");
  };

  const handlePrint = (teacherName) => {
    const printContent = document.querySelector(`.timetable-card[data-teacher="${teacherName}"]`);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Timetable for ${teacherName}</title>
          <style>
            ${document.querySelector("style")?.innerHTML || ""}
            .timetable-card { margin: 20px; font-family: Arial, sans-serif; }
            .timetable-card-header { background-color: #f5f5f5; padding: 1rem; }
            .timetable-meta { margin: 1rem 0; }
            .excel-table { width: 100%; border-collapse: collapse; }
            .excel-table th, .excel-table td { border: 1px solid #333; padding: 0.5rem; text-align: center; }
            .session-assigned { background-color: #3498db; color: white; }
            @media print {
              .timetable-card { page-break-inside: avoid; }
              .timetable-actions, .back-button, .print-button { display: none !important; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderTimetable = (teacher) => {
    const { TeacherName, Grade, Sessions } = teacher;

    const totalSessions = Sessions.reduce((sum, sessionGroup) => {
      return sum + (sessionGroup.Sessions?.length || 0);
    }, 0);

    const dates = [...new Set(Sessions.map((session) => session.Date))]
      .filter((date) => isValidDate(date))
      .sort();

    return (
      <div
        key={TeacherName}
        className="timetable-card"
        data-teacher={TeacherName}
      >
        <div className="timetable-card-header">
          <h3>{TeacherName}'s Timetable</h3>
          <span className="assignment-count">
            {totalSessions} Session{totalSessions !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="timetable-content">
          <div className="timetable-meta">
            <div className="meta-item">
              <span className="meta-label">Name:</span>
              <span className="meta-value">{TeacherName || "N/A"}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Grade:</span>
              <span className="meta-value">{Grade || "N/A"}</span>
            </div>
          </div>
          <table className="excel-table">
            <thead>
              <tr>
                <th colSpan="2"></th>
                <th colSpan="4">Horaire</th>
              </tr>
              <tr>
                <th>Jour</th>
                <th>Date</th>
                <th>S1</th>
                <th>S2</th>
                <th>S3</th>
                <th>S4</th>
              </tr>
            </thead>
            <tbody>
              {dates.map((date) => {
                const sessionGroup = Sessions.find((s) => s.Date === date);
                const sessions = sessionGroup?.Sessions || [];
                const day = new Date(date).toLocaleDateString("en-US", {
                  weekday: "long",
                });

                return (
                  <tr key={date}>
                    <td>{day}</td>
                    <td>{date}</td>
                    <td
                      className={sessions.includes("s1") ? "session-assigned" : ""}
                    >
                      {sessions.includes("s1") ? "Assigned" : "-"}
                    </td>
                    <td
                      className={sessions.includes("s2") ? "session-assigned" : ""}
                    >
                      {sessions.includes("s2") ? "Assigned" : "-"}
                    </td>
                    <td
                      className={sessions.includes("s3") ? "session-assigned" : ""}
                    >
                      {sessions.includes("s3") ? "Assigned" : "-"}
                    </td>
                    <td
                      className={sessions.includes("s4") ? "session-assigned" : ""}
                    >
                      {sessions.includes("s4") ? "Assigned" : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="timetable-actions">
          <button
            className="print-button"
            onClick={() => handlePrint(TeacherName)}
          >
            Print Timetable
          </button>
        </div>
      </div>
    );
  };

  // Render generation error banner (styled like success banner)
  if (generationError) {
    return (
      <div className="generation-error-banner">
        <div className="error-icon">❌</div>
        <div className="error-message">
          <h3>Schedule Generation Failed</h3>
          <p>{generationError}</p>
        </div>
        <div className="error-actions">
          <button className="retry-button" onClick={onRegenerateSchedule}>
            Try Again
          </button>
          <button
            className="back-button"
            onClick={() => onRegenerateSchedule()}
          >
            Back to Timetable
          </button>
        </div>
      </div>
    );
  }

  if (generationStatus === "loading") {
    return (
      <div className="loading-state">
        <div className="loading-animation">
          <div className="loading-spinner"></div>
          <p>Loading schedule data...</p>
        </div>
      </div>
    );
  }

  if (generationStatus === "error") {
    return (
      <div className="error-message">
        <h3>Error Fetching Schedule</h3>
        <p>{errorMessage}</p>
        <button className="retry-button" onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="schedule-result-section">
      {!showTimetables ? (
        <>
          <div className="result-header">
            <h3>Schedule Generated Successfully!</h3>
            <p>Your exam schedule has been created and is ready for review.</p>
          </div>
          <div className="schedule-actions">
            <button className="view-button" onClick={handleViewAssignments}>
              View Timetable
            </button>
            <button className="export-button" onClick={onExportSchedule}>
              Export Schedule
            </button>
            <button className="regenerate-button" onClick={onRegenerateSchedule}>
              Regenerate Schedule
            </button>
          </div>
          <div className="schedule-preview">
            <div className="preview-header">
              <h4>Schedule Preview</h4>
              <p>A high-level overview of your generated exam schedule</p>
            </div>
            <div className="placeholder-message">
              Detailed schedule information will be displayed here based on the
              backend data. This will include exam dates and teacher allocations.
            </div>
          </div>
        </>
      ) : (
        <div className="timetables-list">
          <div className="timetable-actions">
            <button className="back-button" onClick={handleBack}>
              Back to Schedule
            </button>
          </div>
          {scheduleData.length > 0 ? (
            scheduleData.map((teacher) => renderTimetable(teacher))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No Timetables Available</h3>
              <p>No valid supervisor schedules were found. Please try again.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScheduleResults;