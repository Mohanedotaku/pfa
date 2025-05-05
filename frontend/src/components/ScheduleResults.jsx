import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const ScheduleResults = ({
  scheduleData,
  onExportSchedule,
  onRegenerateSchedule,
  generationError,
}) => {
  const [generationStatus, setGenerationStatus] = useState("idle");
  const [showDetailedTimetables, setShowDetailedTimetables] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [sortOrder, setSortOrder] = useState("name");
  const [collapsedCards, setCollapsedCards] = useState({});
  const [filterQuery, setFilterQuery] = useState("");

  const isValidDate = (dateStr) => {
    if (typeof dateStr !== "string") return false;
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  };

  const validSessions = ["s1", "s2", "s3", "s4"];
  const isValidSession = (session) => validSessions.includes(session?.toLowerCase());

  const validateData = () => {
    const data = Array.isArray(scheduleData) ? scheduleData : [];
    const errors = [];

    if (data.length === 0) {
      errors.push("No supervisors found in the schedule.");
      return { validatedData: [], errors };
    }

    const validatedData = data.map((teacher, index) => {
      const teacherName = teacher.TeacherName || teacher.teacherName || teacher.name || `Unknown_${index}`;
      const sessions = Array.isArray(teacher.Sessions) ? teacher.Sessions : teacher.sessions || [];
      const validSessions = sessions.filter((sessionGroup, sgIndex) => {
        const date = sessionGroup.Date || sessionGroup.date;
        if (!isValidDate(date)) {
          errors.push(`Invalid date for ${teacherName} at session group ${sgIndex}: ${date}`);
          return false;
        }
        const sessionArray = Array.isArray(sessionGroup.Sessions) ? sessionGroup.Sessions : sessionGroup.sessions || [];
        if (!Array.isArray(sessionArray)) {
          errors.push(`Invalid sessions for ${teacherName} on ${date}: ${JSON.stringify(sessionArray)}`);
          return false;
        }
        const validSessionArray = sessionArray.filter((session) => {
          const isValid = isValidSession(session);
          if (!isValid) {
            errors.push(`Invalid session '${session}' for ${teacherName} on ${date}`);
          }
          return isValid;
        });
        return validSessionArray.length > 0;
      });
      return { ...teacher, TeacherName: teacherName, Sessions: validSessions };
    }).filter(teacher => teacher.Sessions.length > 0);

    if (validatedData.length === 0 && errors.length > 0) {
      errors.push("No valid supervisor schedules found after validation.");
    }
    return { validatedData, errors };
  };

  const handleViewDetailedTimetables = (teacherName = null) => {
    setGenerationStatus("loading");
    setShowDetailedTimetables(true);

    try {
      const { errors } = validateData();
      if (errors.length > 0) {
        setGenerationStatus("error");
        setErrorMessage(errors.join("; "));
        toast.error("No valid supervisor schedules found. Check console for details.", {
          position: "top-right",
          autoClose: 5000,
          icon: "❌",
        });
        console.error("Validation errors:", errors);
        return;
      }
      setGenerationStatus("success");
      if (teacherName) {
        setTimeout(() => {
          const element = document.querySelector(`.timetable-card[data-teacher="${teacherName}"]`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      setGenerationStatus("error");
      setErrorMessage(error.message || "Failed to process schedule data.");
      toast.error(error.message || "Failed to process schedule data.", {
        position: "top-right",
        autoClose: 5000,
        icon: "❌",
      });
    }
  };

  const handleBack = () => {
    setShowDetailedTimetables(false);
    setGenerationStatus("idle");
    setFilterQuery("");
    toast.info("Returned to schedule preview.", {
      position: "top-right",
      autoClose: 3000,
      icon: "🔙",
    });
  };

  const handleRetry = () => {
    setGenerationStatus("idle");
    setErrorMessage("");
    setShowDetailedTimetables(false);
    setFilterQuery("");
  };

  const handleRegenerateConfirm = () => {
    if (window.confirm("Are you sure you want to regenerate the schedule? This will discard the current schedule.")) {
      onRegenerateSchedule();
      toast.info("Regenerating schedule...", {
        position: "top-right",
        autoClose: 3000,
        icon: "🔄",
      });
    }
  };

  const handleExportSchedule = () => {
    try {
      const { validatedData, errors } = validateData();
      if (errors.length > 0 || validatedData.length === 0) {
        throw new Error("No valid schedule data to export. Check console for details.");
      }

      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const filename = `schedule_${timestamp}.json`;
      const jsonStr = JSON.stringify(validatedData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Schedule exported as ${filename}.`, {
        position: "top-right",
        autoClose: 3000,
        icon: "💾",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error(`Failed to export schedule: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        icon: "❌",
      });
    }
  };

  const handlePrint = (teacherName) => {
    setIsPrinting(true);
    try {
      const printContent = document.querySelector(`.timetable-card[data-teacher="${teacherName}"]`);
      if (!printContent) throw new Error("Timetable not found for printing.");
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Timetable for ${teacherName}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
              body { font-family: 'Roboto', Arial, sans-serif; margin: 20px; }
              .timetable-card { max-width: 800px; border: 1px solid #dee2e6; border-radius: 12px; padding: 24px; }
              .timetable-card-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #dee2e6; }
              .teacher-name { margin: 0; font-size: 2em; color: #343a40; font-weight: 500; flex: 1; }
              .header-actions { display: flex; align-items: center; gap: 12px; }
              .assignment-count { font-size: 1em; color: #495057; font-weight: 500; }
              .timetable-meta { margin: 24px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
              .meta-item { font-size: 1em; color: #343a40; }
              .meta-label { font-weight: 500; }
              .meta-value { margin-left: 6px; }
              .schedule-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 24px; }
              .schedule-table th, .schedule-table td { border: 1px solid #dee2e6; padding: 12px; text-align: center; font-size: 0.9em; }
              .schedule-table th { background-color: #f8f9fa; font-weight: 500; color: #343a40; }
              .schedule-table tr:nth-child(even) { background-color: #f9f9f9; }
              .session-assigned { background-color: #007bff; color: white; }
              .session-unassigned { background-color: #e9ecef; color: #ffffff; }
              @media print {
                .timetable-actions, .action-button, .collapse-toggle { display: none !important; }
                .timetable-card { box-shadow: none; border: none; }
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
      toast.success(`Timetable for ${teacherName} sent to printer.`, {
        position: "top-right",
        autoClose: 3000,
        icon: "🖨️",
      });
    } catch (error) {
      toast.error(`Failed to print timetable: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        icon: "❌",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintAll = () => {
    setIsPrinting(true);
    try {
      const printContents = document.querySelectorAll(".timetable-card");
      if (printContents.length === 0) throw new Error("No timetables available for printing.");
      const total = printContents.length;
      let progress = 0;
      const printWindow = window.open("", "_blank");
      let content = "";
      printContents.forEach((card, index) => {
        content += card.outerHTML + "<div style='page-break-after: always;'></div>";
        progress = ((index + 1) / total) * 100;
        toast.info(`Printing progress: ${Math.round(progress)}%`, {
          toastId: "print-progress",
          autoClose: false,
          update: true,
        });
      });
      printWindow.document.write(`
        <html>
          <head>
            <title>All Timetables</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
              body { font-family: 'Roboto', Arial, sans-serif; margin: 20px; }
              .timetable-card { max-width: 800px; border: 1px solid #dee2e6; border-radius: 12px; padding: 24px; margin-bottom: 24px; }
              .timetable-card-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #dee2e6; }
              .teacher-name { margin: 0; font-size: 2em; color: #343a40; font-weight: 500; flex: 1; }
              .header-actions { display: flex; align-items: center; gap: 12px; }
              .assignment-count { font-size: 1em; color: #495057; font-weight: 500; }
              .timetable-meta { margin: 24px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
              .meta-item { font-size: 1em; color: #343a40; }
              .meta-label { font-weight: 500; }
              .meta-value { margin-left: 6px; }
              .schedule-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 24px; }
              .schedule-table th, .schedule-table td { border: 1px solid #dee2e6; padding: 12px; text-align: center; font-size: 0.9em; }
              .schedule-table th { background-color: #f8f9fa; font-weight: 500; color: #343a40; }
              .schedule-table tr:nth-child(even) { background-color: #f9f9f9; }
              .session-assigned { background-color: #007bff; color: white; }
              .session-unassigned { background-color: #e9ecef; color: #ffffff; }
              @media print {
                .timetable-actions, .action-button, .collapse-toggle { display: none !important; }
                .timetable-card { box-shadow: none; border: none; }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      toast.dismiss("print-progress");
      toast.success("All timetables sent to printer.", {
        position: "top-right",
        autoClose: 3000,
        icon: "🖨️",
      });
    } catch (error) {
      toast.dismiss("print-progress");
      toast.error(`Failed to print all timetables: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        icon: "❌",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  const handleCopyTimetable = (teacherName, sessions) => {
    try {
      const text = sessions
        .map((sessionGroup) => {
          const date = sessionGroup.Date || sessionGroup.date;
          const sessionArray = Array.isArray(sessionGroup.Sessions) ? sessionGroup.Sessions : sessionGroup.sessions || [];
          return `${date}: ${sessionArray.join(", ") || "No sessions"}`;
        })
        .join("\n");
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(`${teacherName}\n${text}`);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = `${teacherName}\n${text}`;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast.success(`Timetable for ${teacherName} copied to clipboard.`, {
        position: "top-right",
        autoClose: 3000,
        icon: "📋",
      });
    } catch (error) {
      toast.error(`Failed to copy timetable: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
        icon: "❌",
      });
    }
  };

  const toggleCardCollapse = (teacherName) => {
    setCollapsedCards((prev) => ({
      ...prev,
      [teacherName]: !prev[teacherName],
    }));
  };

  const getScheduleSummary = () => {
    const data = Array.isArray(scheduleData) ? scheduleData : [];
    const teacherCount = data.length;
    let totalSessions = 0;
    const dates = new Set();

    data.forEach((teacher) => {
      const sessions = Array.isArray(teacher.Sessions) ? teacher.Sessions : teacher.sessions || [];
      sessions.forEach((sessionGroup) => {
        const date = sessionGroup.Date || sessionGroup.date;
        if (isValidDate(date)) {
          dates.add(date);
        }
        const sessionArray = Array.isArray(sessionGroup.Sessions) ? sessionGroup.Sessions : sessionGroup.sessions || [];
        totalSessions += sessionArray.filter(isValidSession).length;
      });
    });

    const sortedDates = [...dates].sort();
    const dateRange = sortedDates.length > 0 ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}` : "N/A";

    return { teacherCount, totalSessions, dateRange };
  };

  const getSortedTeachers = () => {
    const data = Array.isArray(scheduleData) ? scheduleData : [];
    const filteredData = data.filter((teacher) => {
      const teacherName = teacher.TeacherName || teacher.teacherName || teacher.name || "";
      return teacherName.toLowerCase().includes(filterQuery.toLowerCase());
    });
    return filteredData.sort((a, b) => {
      if (sortOrder === "name") {
        const nameA = (a.TeacherName || a.teacherName || a.name || "").toLowerCase();
        const nameB = (b.TeacherName || b.teacherName || b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        const sessionsA = (Array.isArray(a.Sessions) ? a.Sessions : a.sessions || []).reduce(
          (sum, sg) => sum + ((Array.isArray(sg.Sessions) ? sg.Sessions : sg.sessions || []).length || 0),
          0
        );
        const sessionsB = (Array.isArray(b.Sessions) ? b.Sessions : b.sessions || []).reduce(
          (sum, sg) => sum + ((Array.isArray(sg.Sessions) ? sg.Sessions : sg.sessions || []).length || 0),
          0
        );
        return sessionsB - sessionsA;
      }
    });
  };

  const renderTimetablePreview = () => {
    const { teacherCount, totalSessions, dateRange } = getScheduleSummary();
    const sortedTeachers = getSortedTeachers();
    const allDates = [...new Set(sortedTeachers.flatMap((teacher) => {
      const sessions = Array.isArray(teacher.Sessions) ? teacher.Sessions : teacher.sessions || [];
      return sessions.map((s) => s.Date || s.date).filter(isValidDate);
    }))].sort();

    return (
      <div className="timetable-preview">
        <div className="preview-summary">
          <h3>Schedule Overview</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Teachers</span>
              <span className="stat-value">{teacherCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Sessions</span>
              <span className="stat-value">{totalSessions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Date Range</span>
              <span className="stat-value">{dateRange}</span>
            </div>
          </div>
        </div>
        <div className="preview-controls">
          <input
            type="text"
            className="filter-input"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filter by teacher name..."
            aria-label="Filter teachers by name"
          />
          <button
            className="action-button sort-button"
            onClick={() => setSortOrder(sortOrder === "name" ? "sessions" : "name")}
            aria-label={`Sort by ${sortOrder === "name" ? "sessions" : "name"}`}
            title={`Sort by ${sortOrder === "name" ? "total sessions" : "teacher name"}`}
          >
            Sort by {sortOrder === "name" ? "Sessions" : "Name"}
          </button>
        </div>
        <div className="preview-table-container" aria-live="polite">
          {sortedTeachers.length === 0 ? (
            <div className="empty-state">
              <p>No teachers match the filter.</p>
            </div>
          ) : (
            <>
              <table className="preview-table" aria-label="Schedule preview table">
                <thead>
                  <tr>
                    <th scope="col">Teacher</th>
                    {allDates.map((date) => (
                      <th
                        key={date}
                        scope="col"
                        className="tooltip"
                        data-tooltip={date}
                      >
                        {new Date(date).toLocaleDateString("en-US", { weekday: "long" })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTeachers.map((teacher) => {
                    const teacherName = teacher.TeacherName || teacher.teacherName || teacher.name || "Unknown";
                    const sessions = Array.isArray(teacher.Sessions) ? teacher.Sessions : teacher.sessions || [];
                    return (
                      <tr key={teacherName}>
                        <td
                          className="teacher-link"
                          onClick={() => handleViewDetailedTimetables(teacherName)}
                          tabIndex={0}
                          onKeyPress={(e) => e.key === "Enter" && handleViewDetailedTimetables(teacherName)}
                          aria-label={`View detailed timetable for ${teacherName}`}
                        >
                          {teacherName}
                        </td>
                        {allDates.map((date) => {
                          const sessionGroup = sessions.find((s) => (s.Date || s.date) === date);
                          const sessionArray = sessionGroup ? (Array.isArray(sessionGroup.Sessions) ? sessionGroup.Sessions : sessionGroup.sessions || []) : [];
                          const sessionCount = sessionArray.filter(isValidSession).length;
                          const tooltipText = sessionCount > 0 ? `Sessions: ${sessionArray.join(", ")}` : "No sessions";
                          return (
                            <td
                              key={`${teacherName}-${date}`}
                              className={sessionCount > 0 ? "session-assigned" : "session-unassigned"}
                              data-tooltip={tooltipText}
                            >
                              {sessionCount > 0 ? `${sessionCount} Sessions` : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="session-legend">
                <div className="legend-item">
                  <span className="legend-color session-assigned"></span>
                  <span>Assigned Sessions</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color session-unassigned"></span>
                  <span>Unassigned Sessions</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="preview-actions">
          <button
            className="action-button view-detailed-button"
            onClick={() => handleViewDetailedTimetables()}
            aria-label="View detailed timetables"
            title="View detailed timetables for all teachers"
          >
            📅 View Detailed Timetables
          </button>
          <button
            className="action-button export-button"
            onClick={handleExportSchedule}
            aria-label="Export schedule"
            title="Export schedule to file"
          >
            💾 Export Schedule
          </button>
          <button
            className="action-button regenerate-button"
            onClick={handleRegenerateConfirm}
            aria-label="Regenerate schedule"
            title="Generate a new schedule"
          >
            🔄 Regenerate Schedule
          </button>
        </div>
      </div>
    );
  };

  const renderMobilePreview = () => {
    const sortedTeachers = getSortedTeachers();
    return (
      <div className="mobile-preview" aria-live="polite">
        {sortedTeachers.length === 0 ? (
          <div className="empty-state">
            <p>No teachers match the filter.</p>
          </div>
        ) : (
          sortedTeachers.map((teacher) => {
            const teacherName = teacher.TeacherName || teacher.teacherName || teacher.name || "Unknown";
            const sessions = Array.isArray(teacher.Sessions) ? teacher.Sessions : teacher.sessions || [];
            const totalSessions = sessions.reduce((sum, sg) => {
              const sessionArray = Array.isArray(sg.Sessions) ? sg.Sessions : sg.sessions || [];
              return sum + sessionArray.filter(isValidSession).length;
            }, 0);
            return (
              <div
                key={teacherName}
                className="mobile-teacher-card"
                onClick={() => handleViewDetailedTimetables(teacherName)}
                tabIndex={0}
                onKeyPress={(e) => e.key === "Enter" && handleViewDetailedTimetables(teacherName)}
                aria-label={`View detailed timetable for ${teacherName}`}
              >
                <h4>{teacherName}</h4>
                <p>{totalSessions} Session{totalSessions !== 1 ? "s" : ""}</p>
                <div className="mobile-sessions">
                  {sessions.map((sg, index) => {
                    const date = sg.Date || sg.date;
                    const sessionArray = Array.isArray(sg.Sessions) ? sg.Sessions : sg.sessions || [];
                    return (
                      <span key={`${teacherName}-${date}-${index}`} className="mobile-session">
                        {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}: {sessionArray.join(", ") || "None"}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderTeacherTimetable = (teacher) => {
    const teacherName = teacher.TeacherName || teacher.teacherName || teacher.name || "Unknown";
    const grade = teacher.Grade || teacher.grade || "N/A";
    const sessions = Array.isArray(teacher.Sessions) ? teacher.Sessions : teacher.sessions || [];
    const isCollapsed = collapsedCards[teacherName];

    const totalSessions = sessions.reduce((sum, sessionGroup) => {
      const sessionArray = Array.isArray(sessionGroup.Sessions) ? sessionGroup.Sessions : sessionGroup.sessions || [];
      return sum + sessionArray.filter(isValidSession).length;
    }, 0);

    const dates = [...new Set(sessions.map((session) => session.Date || session.date))]
      .filter(isValidDate)
      .sort();

    return (
      <div
        key={teacherName}
        className="timetable-card animate-fade-in"
        data-teacher={teacherName}
      >
        <div className="timetable-card-header">
          <h3 className="teacher-name">👩‍🏫 {teacherName}</h3>
          <div className="header-actions">
            <span className="assignment-count">
              {totalSessions} Session{totalSessions !== 1 ? "s" : ""}
            </span>
            <button
              className="collapse-toggle"
              onClick={() => toggleCardCollapse(teacherName)}
              aria-label={isCollapsed ? `Expand timetable for ${teacherName}` : `Collapse timetable for ${teacherName}`}
              title={isCollapsed ? "Expand timetable" : "Collapse timetable"}
            >
              {isCollapsed ? "▲" :"▼" }
            </button>
          </div>
        </div>
        {!isCollapsed && (
          <div className="timetable-content">
            <div className="timetable-meta">
              {/* <div className="meta-item">
                <span className="meta-label">Name:</span>
                <span className="meta-value">{teacherName}</span>
              </div> */}
              <div className="meta-item">
                <span className="meta-label">Grade:</span>
                <span className="meta-value">{grade}</span>
              </div>
            </div>
            <table className="schedule-table" aria-label={`Timetable for ${teacherName}`}>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Date</th>
                  <th scope="col" className="tooltip" data-tooltip="Session 1">S1</th>
                  <th scope="col" className="tooltip" data-tooltip="Session 2">S2</th>
                  <th scope="col" className="tooltip" data-tooltip="Session 3">S3</th>
                  <th scope="col" className="tooltip" data-tooltip="Session 4">S4</th>
                </tr>
              </thead>
              <tbody>
                {dates.map((date) => {
                  const sessionGroup = sessions.find((s) => (s.Date || s.date) === date);
                  const sessionArray = sessionGroup ? (Array.isArray(sessionGroup.Sessions) ? sessionGroup.Sessions : sessionGroup.sessions || []) : [];
                  const day = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
                  return (
                    <tr key={`${teacherName}-${date}`}>
                      <td>{day}</td>
                      <td>{date}</td>
                      <td
                        className={sessionArray.includes("s1") || sessionArray.includes("S1") ? "session-assigned" : "session-unassigned"}
                        data-tooltip={sessionArray.includes("s1") || sessionArray.includes("S1") ? "Assigned" : "Not assigned"}
                      >
                        {sessionArray.includes("s1") || sessionArray.includes("S1") ? "✓" : "-"}
                      </td>
                      <td
                        className={sessionArray.includes("s2") || sessionArray.includes("S2") ? "session-assigned" : "session-unassigned"}
                        data-tooltip={sessionArray.includes("s2") || sessionArray.includes("S2") ? "Assigned" : "Not assigned"}
                      >
                        {sessionArray.includes("s2") || sessionArray.includes("S2") ? "✓" : "-"}
                      </td>
                      <td
                        className={sessionArray.includes("s3") || sessionArray.includes("S3") ? "session-assigned" : "session-unassigned"}
                        data-tooltip={sessionArray.includes("s3") || sessionArray.includes("S3") ? "Assigned" : "Not assigned"}
                      >
                        {sessionArray.includes("s3") || sessionArray.includes("S3") ? "✓" : "-"}
                      </td>
                      <td
                        className={sessionArray.includes("s4") || sessionArray.includes("S4") ? "session-assigned" : "session-unassigned"}
                        data-tooltip={sessionArray.includes("s4") || sessionArray.includes("S4") ? "Assigned" : "Not assigned"}
                      >
                        {sessionArray.includes("s4") || sessionArray.includes("S4") ? "✓" : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="timetable-actions">
              <button
                className="action-button print-button"
                onClick={() => handlePrint(teacherName)}
                disabled={isPrinting}
                aria-label={`Print timetable for ${teacherName}`}
                title="Print this teacher's timetable"
              >
                🖨️ {isPrinting ? "Printing..." : "Print Timetable"}
              </button>
              <button
                className="action-button copy-button"
                onClick={() => handleCopyTimetable(teacherName, sessions)}
                aria-label={`Copy timetable for ${teacherName}`}
                title="Copy timetable to clipboard"
              >
                📋 Copy Timetable
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (generationError) {
    return (
      <div className="error-banner">
        <div className="error-icon">❌</div>
        <div className="error-message">
          <h3>Schedule Generation Failed</h3>
          <p>{generationError}</p>
        </div>
        <div className="error-actions">
          <button
            className="action-button retry-button"
            onClick={handleRegenerateConfirm}
            aria-label="Retry generating schedule"
            title="Try generating the schedule again"
          >
            🔄 Try Again
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
      <div className="error-banner">
        <h3>Error Fetching Schedule</h3>
        <p>{errorMessage}</p>
        <button
          className="action-button retry-button"
          onClick={handleRetry}
          aria-label="Retry loading schedule"
          title="Retry loading the schedule"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="schedule-result-section">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
          .schedule-result-section {
            padding: 24px;
            max-width: 1200px;
            margin: 0 auto;
            font-family: 'Roboto', Arial, sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
          }
          .timetable-preview, .detailed-timetables {
            opacity: 0;
            animation: fadeIn 0.5s forwards;
          }
          @keyframes fadeIn {
            to { opacity: 1; }
          }
          .timetable-preview {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
            padding: 24px;
            margin-bottom: 24px;
          }
          .preview-summary h3 {
            margin: 0 0 12px;
            font-size: 2em;
            color: #343a40;
            font-weight: 500;
          }
          .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
          }
          .stat-item {
            background: #e9ecef;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            transition: transform 0.2s;
          }
          .stat-item:hover {
            transform: translateY(-2px);
          }
          .stat-label {
            font-weight: 500;
            color: #495057;
            font-size: 0.9em;
          }
          .stat-value {
            display: block;
            font-size: 1.4em;
            color: #343a40;
            margin-top: 6px;
            font-weight: 700;
          }
          .preview-controls {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
            flex-wrap: wrap;
          }
          .filter-input {
            padding: 10px;
            font-size: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            flex: 1;
            min-width: 200px;
            outline: none;
          }
          .filter-input:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 2px rgba(0,123,255,0.2);
          }
          .preview-table-container {
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 24px;
            position: relative;
          }
          .preview-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            background: #fff;
          }
          .preview-table th, .preview-table td {
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: center;
            font-size: 0.9em;
          }
          .preview-table th {
            background: #e9ecef;
            font-weight: 500;
            color: #343a40;
            position: sticky;
            top: 0;
            z-index: 2;
          }
          .preview-table td:first-child {
            font-weight: 500;
            text-align: left;
            background: #f8f9fa;
            position: sticky;
            left: 0;
            z-index: 1;
          }
          .preview-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .teacher-link {
            cursor: pointer;
            color: #007bff;
            transition: color 0.2s;
          }
          .teacher-link:hover, .teacher-link:focus {
            color: #0056b3;
            text-decoration: underline;
          }
          .teacher-link:focus {
            outline: 2px solid #007bff;
            outline-offset: 2px;
          }
          .session-assigned {
            background-color: #007bff;
            color: white;
            font-weight: 500;
          }
          .session-unassigned {
            background-color: #e9ecef;
            color: #ffffff;
          }
          .session-legend {
            display: flex;
            gap: 16px;
            margin-top: 12px;
            font-size: 0.9em;
            color: #495057;
          }
          .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 4px;
            display: inline-block;
          }
          .timetable-card {
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
            padding: 24px;
            margin-bottom: 24px;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .timetable-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          }
          .animate-fade-in {
            animation: cardFadeIn 0.5s ease-out;
          }
          @keyframes cardFadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .timetable-card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 1px solid #dee2e6;
          }
          .teacher-name {
            margin: 0;
            font-size: 2em;
            color: #343a40;
            font-weight: 500;
            flex: 1;
          }
          .header-actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .assignment-count {
            font-size: 1em;
            color:rgb(255, 255, 255);
            font-weight: 500;
          }
          .collapse-toggle {
            background: none;
            border: none;
            font-size: 1.2em;
            cursor: pointer;
            color: #007bff;
            transition: color 0.2s;
          }
          .collapse-toggle:hover, .collapse-toggle:focus {
            color: #0056b3;
          }
          .collapse-toggle:focus {
            outline: 2px solid #007bff;
            outline-offset: 2px;
          }
          .timetable-meta {
            margin: 24px 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .meta-item {
            font-size: 1em;
            color: #343a40;
          }
          .meta-label {
            font-weight: 500;
            color: #495057;
          }
          .meta-value {
            margin-left: 6px;
            font-weight: 400;
          }
          .schedule-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
          }
          .schedule-table th, .schedule-table td {
            border: 1px solid #dee2e6;
            padding: 12px;
            text-align: center;
            font-size: 0.9em;
          }
          .schedule-table th {
            background: #e9ecef;
            font-weight: 500;
            color: #343a40;
          }
          .schedule-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .action-button {
            padding: 12px 24px;
            font-size: 1rem;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            border: none;
            outline: none;
            box-shadow: 0 3px 6px rgba(0,0,0,0.1);
            color: white;
            font-weight: 500;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, #007bff, #66b0ff);
          }
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
            background: linear-gradient(135deg, #0056b3, #4d9bff);
          }
          .action-button:focus {
            outline: 2px solid #007bff;
            outline-offset: 2px;
          }
          .action-button:disabled {
            background: #adb5bd;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
          }
          .print-button, .print-all-button {
            background: linear-gradient(135deg, #28a745, #66d48e);
          }
          .print-button:hover, .print-all-button:hover {
            background: linear-gradient(135deg, #218838, #52c777);
          }
          .copy-button {
            background: linear-gradient(135deg, #17a2b8, #66c8d4);
          }
          .copy-button:hover {
            background: linear-gradient(135deg, #138496, #52b4c0);
          }
          .export-button {
            background: linear-gradient(135deg, #ffc107, #ffd966);
            color: #343a40;
          }
          .export-button:hover {
            background: linear-gradient(135deg, #e0a800, #ffcc33);
          }
          .regenerate-button, .retry-button, .sort-button {
            background: linear-gradient(135deg, #6c757d, #a0a9b1);
          }
          .regenerate-button:hover, .retry-button:hover, .sort-button:hover {
            background: linear-gradient(135deg, #5a6268, #8e979f);
          }
          .preview-actions, .timetable-actions, .error-actions {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: flex-end;
            margin-top: 24px;
          }
          .error-banner {
            background: #f8d7da;
            border-radius: 12px;
            padding: 24px;
            color: #721c24;
            text-align: center;
            box-shadow: 0 6px 12px rgba(0,0,0,0.1);
          }
          .error-icon {
            font-size: 2.5em;
            margin-bottom: 12px;
          }
          .error-message h3 {
            margin: 0 0 12px;
            font-size: 2em;
            font-weight: 500;
          }
          .loading-state {
            text-align: center;
            padding: 60px;
          }
          .loading-spinner {
            border: 6px solid #e9ecef;
            border-top: 6px solid #007bff;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
          }
          .tooltip {
            position: relative;
          }
          .tooltip::after {
            content: attr(data-tooltip);
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: #343a40;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.8em;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s, top 0.2s;
            z-index: 10;
          }
          .tooltip::before {
            content: '';
            position: absolute;
            top: -8px;
            left: 50%;
            transform: translateX(-50%);
            border: 6px solid transparent;
            border-top-color: #343a40;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s, top 0.2s;
          }
          .tooltip:hover::after, .tooltip:hover::before {
            opacity: 1;
            top: -48px;
          }
          .mobile-preview {
            display: none;
          }
          .mobile-teacher-card {
            background: #ffffff;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.2s;
          }
          .mobile-teacher-card:hover {
            transform: translateY(-2px);
          }
          .mobile-teacher-card h4 {
            margin: 0 0 8px;
            font-size: 1.2em;
            color: #343a40;
          }
          .mobile-teacher-card p {
            margin: 0 0 8px;
            color: #495057;
          }
          .mobile-sessions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            font-size: 0.9em;
            color: #6c757d;
          }
          .mobile-session {
            background: #e9ecef;
            padding: 4px 8px;
            border-radius: 4px;
          }
          .empty-state {
            text-align: center;
            padding: 24px;
            color: #6c757d;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .schedule-result-section {
              padding: 16px;
            }
            .timetable-preview, .timetable-card {
              padding: 16px;
            }
            .preview-summary h3, .error-message h3 {
              font-size: 1.6em;
            }
            .summary-stats {
              grid-template-columns: 1fr;
            }
            .preview-table-container {
              display: none;
            }
            .mobile-preview {
              display: block;
            }
            .filter-input {
              min-width: 100%;
            }
            .action-button {
              padding: 10px 16px;
              font-size: 0.9rem;
              width: 100%;
              margin: 6px 0;
            }
            .preview-actions, .timetable-actions, .error-actions {
              flex-direction: column;
              align-items: stretch;
            }
            .timetable-meta {
              grid-template-columns: 1fr;
            }
            .schedule-table th, .schedule-table td {
              padding: 8px;
              font-size: 0.8em;
            }
            .timetable-card-header {
              flex-direction: column;
              align-items: flex-start;
            }
            .header-actions {
              margin-top: 8px;
            }
            .tooltip::after {
              font-size: 0.7em;
              padding: 6px 10px;
              max-width: 80vw;
              white-space: normal;
            }
            .tooltip:hover::after {
              top: -60px;
            }
          }
        `}
      </style>
      {showDetailedTimetables ? (
        <div className="detailed-timetables">
          <div className="timetable-actions">
            <button
              className="action-button back-button"
              onClick={handleBack}
              aria-label="Return to schedule preview"
              title="Go back to schedule preview"
            >
              🔙 Return to Preview
            </button>
            <button
              className="action-button print-all-button"
              onClick={handlePrintAll}
              disabled={isPrinting || scheduleData.length === 0}
              aria-label="Print all timetables"
              title="Print all teachers' timetables"
            >
              🖨️ {isPrinting ? "Printing..." : "Print All Timetables"}
            </button>
          </div>
          {scheduleData.length > 0 ? (
            getSortedTeachers().map((teacher) => renderTeacherTimetable(teacher))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>No Timetables Available</h3>
              <p>No valid supervisor schedules were found. Please try again.</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {renderTimetablePreview()}
          {renderMobilePreview()}
        </>
      )}
    </div>
  );
};

export default ScheduleResults;