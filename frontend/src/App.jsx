import { useState } from "react";
import "./App.css";
import issatLogo from "./assets/issat.png";
import FileUploader from "./components/FileUploader";
import TeacherListViewer from "./components/TeacherListViewer";
import ScheduleResults from "./components/ScheduleResults";
import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

function App() {
  const [currentPage, setCurrentPage] = useState("teachers"); // "teachers", "exam", or "timetable"
  const [teachersUploaded, setTeachersUploaded] = useState(false);
  const [examsUploaded, setExamsUploaded] = useState(false);
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [showAssignments, setShowAssignments] = useState(false);

  // Adding a loading animation component
  const LoadingAnimation = () => (
    <div className="loading-animation">
      <DotLottieReact
        src="https://lottie.host/07f0d8c7-2ac0-49d6-b5a5-806df20d84cf/lPUUnMy75h.lottie"
        loop
        autoplay
        style={{ width: "150px", height: "150px" }}
      />
      <p>Generating schedule...</p>
    </div>
  );

  const handleTeacherUploadSuccess = (data) => {
    console.log("Teacher file uploaded successfully:", data);
    // Set teachersUploaded to true regardless of response format for testing
    setTeachersUploaded(true);

    // Note: For testing, we're accepting any response format
    // In production, the backend would return:
    // {
    //   message: "Excel file processed successfully."
    // }
  };

  const handleExamUploadSuccess = (data) => {
    console.log("Exam file uploaded successfully:", data);
    setExamsUploaded(true);
    // Additional handling - e.g., show notification, etc.
  };

  const handleUploadError = (error) => {
    console.error("Upload error:", error);
    // Handle upload error - e.g., show notification, etc.
  };

  const handleGenerateSchedule = () => {
    console.log("Generating schedule...");

    // Show generating state
    setGeneratingSchedule(true);

    // Simulate API call with a delay
    setTimeout(() => {
      // In a real implementation, this would make an API call to the backend
      // For now, just setting the state to show the generated schedule
      setGeneratingSchedule(false);
      setScheduleGenerated(true);
      setShowAssignments(false); // Reset assignments view
    }, 2000);
  };

  const handleViewAssignments = () => {
    console.log("Viewing assignments...");
    setShowAssignments(true);
  };

  const handleExportSchedule = () => {
    console.log("Exporting schedule...");
    // Implement export functionality (e.g., generate PDF or Excel file)
    alert("Schedule export functionality would be implemented here");
  };

  const handleRegenerateSchedule = () => {
    console.log("Regenerating schedule...");
    setScheduleGenerated(false);
    setShowAssignments(false);
  };

  const switchPage = (page) => {
    setCurrentPage(page);
  };

  const TeachersPage = () => (
    <div className="page-content">
      {!teachersUploaded ? (
        <FileUploader
          title="Teacher List"
          description="Upload your teacher list in Excel format to organize your teaching staff"
          fileType="teacher"
          acceptedFileTypes=".xlsx, .xls"
          acceptedExtensions={["xlsx", "xls"]}
          icon="👩‍🏫"
          uploadEndpoint="http://localhost:5271/upload-excelTeachers"
          onUploadSuccess={handleTeacherUploadSuccess}
          onUploadError={handleUploadError}
        />
      ) : (
        <>
          <div className="upload-success-banner">
            <div className="success-icon">✅</div>
            <div className="success-message">
              <h3>Teacher List Uploaded Successfully!</h3>
              <p>
                Below is the processed teacher data from your uploaded file.
              </p>
            </div>
            <button
              className="upload-new-button"
              onClick={() => setTeachersUploaded(false)}
            >
              Upload New File
            </button>
          </div>
          <TeacherListViewer />
        </>
      )}
    </div>
  );

  // const ExamPage = () => (
  //   <div className="page-content">
  //     {!examsUploaded ? (
  //       <FileUploader
  //         title="Exam Schedule"
  //         description="Upload your exam schedule in Excel format to organize examination dates"
  //         fileType="exam"
  //         acceptedFileTypes=".xlsx, .xls"
  //         acceptedExtensions={["xlsx", "xls"]}
  //         icon="📝"
  //         uploadEndpoint="http://localhost:5271/upload-excelExams"
  //         onUploadSuccess={handleExamUploadSuccess}
  //         onUploadError={handleUploadError}
  //       />
  //     ) : (
  //       <div className="upload-success-banner">
  //         <div className="success-icon">✅</div>
  //         <div className="success-message">
  //           <h3>Exam Schedule Uploaded Successfully!</h3>
  //           <p>Your exam schedule file has been processed.</p>
  //         </div>
  //         <button
  //           className="upload-new-button"
  //           onClick={() => setExamsUploaded(false)}
  //         >
  //           Upload New File
  //         </button>
  //       </div>
  //     )}
  //   </div>
  // );

  const ExamPage = () => (
    <div className="page-content">
      {!examsUploaded ? (
        <FileUploader
          title="Exam Schedule"
          description="Upload your exam schedule in Excel format to organize examination dates"
          fileType="exam"
          acceptedFileTypes=".xlsx, .xls"
          acceptedExtensions={["xlsx", "xls"]}
          icon="📝"
          uploadEndpoint="http://localhost:5271/upload-excelSessions" // Fixed endpoint
          onUploadSuccess={handleExamUploadSuccess}
          onUploadError={handleUploadError}
        />
      ) : (
        <div className="upload-success-banner">
          <div className="success-icon">✅</div>
          <div className="success-message">
            <h3>Exam Schedule Uploaded Successfully!</h3>
            <p>Your exam schedule file has been processed.</p>
          </div>
          <button
            className="upload-new-button"
            onClick={() => setExamsUploaded(false)}
          >
            Upload New File
          </button>
        </div>
      )}
    </div>
  );

  const TimetablePage = () => (
    <div className="page-content">
      <div className="timetable-container">
        <div className="timetable-header">
          <h2>Surveillance Timetables</h2>
          <p>Generate and view exam surveillance schedules</p>
        </div>

        <div className="upload-status-section">
          <div className="upload-status-card">
            <div
              className={`status-indicator ${
                teachersUploaded ? "status-complete" : "status-pending"
              }`}
            >
              {teachersUploaded ? "✅" : "⏳"}
            </div>
            <div className="status-text">
              <h3>Teacher List</h3>
              <p>
                {teachersUploaded
                  ? "Uploaded successfully"
                  : "Not uploaded yet"}
              </p>
            </div>
          </div>

          <div className="upload-status-card">
            <div
              className={`status-indicator ${
                examsUploaded ? "status-complete" : "status-pending"
              }`}
            >
              {examsUploaded ? "✅" : "⏳"}
            </div>
            <div className="status-text">
              <h3>Exam Schedule</h3>
              <p>
                {examsUploaded ? "Uploaded successfully" : "Not uploaded yet"}
              </p>
            </div>
          </div>
        </div>

        {!scheduleGenerated ? (
          <div className="generate-section">
            <p className="generate-info">
              {!teachersUploaded || !examsUploaded
                ? "Please upload both teacher list and exam schedule before generating the timetable."
                : "Ready to generate surveillance timetable. Click the button below to proceed."}
            </p>
            {generatingSchedule ? (
              <LoadingAnimation />
            ) : (
              <button
                className="action-button generate-button"
                disabled={
                  !teachersUploaded || !examsUploaded || generatingSchedule
                }
                onClick={handleGenerateSchedule}
              >
                Generate Schedule
              </button>
            )}
          </div>
        ) : (
          <>
            {!showAssignments ? (
              <ScheduleResults
                onViewAssignments={handleViewAssignments}
                onExportSchedule={handleExportSchedule}
                onRegenerateSchedule={handleRegenerateSchedule}
              />
            ) : (
              <div className="timetables-list">
                <div className="timetable-card">
                  <div className="timetable-card-header">
                    <h3>Surveillance Assignments</h3>
                    <span className="assignment-count">24 Assignments</span>
                  </div>

                  <div className="timetable-content">
                    <table className="assignments-table">
                      <thead>
                        <tr>
                          <th>Teacher</th>
                          <th>Exam</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Sample data - would be populated from API */}
                        <tr>
                          <td>Ahmed Ben Salem</td>
                          <td>Advanced Databases</td>
                          <td>June 15, 2023</td>
                          <td>09:00 - 11:00</td>
                          <td>Room A101</td>
                        </tr>
                        <tr>
                          <td>Leila Mansour</td>
                          <td>Software Engineering</td>
                          <td>June 15, 2023</td>
                          <td>14:00 - 16:00</td>
                          <td>Room B201</td>
                        </tr>
                        <tr>
                          <td>Mohamed Ali</td>
                          <td>Data Structures</td>
                          <td>June 16, 2023</td>
                          <td>09:00 - 11:00</td>
                          <td>Room C302</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="timetable-actions">
                    <button
                      className="action-button print-button"
                      onClick={() => window.print()}
                    >
                      Print
                    </button>
                    <button
                      className="action-button export-button"
                      onClick={handleExportSchedule}
                    >
                      Export
                    </button>
                    <button
                      className="action-button regenerate-button"
                      onClick={handleRegenerateSchedule}
                    >
                      Regenerate
                    </button>
                  </div>
                </div>

                <button
                  className="action-button generate-button"
                  onClick={() => setShowAssignments(false)}
                  style={{ marginTop: "1rem" }}
                >
                  Back to Summary
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Sidebar Menu */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src={issatLogo} alt="ISSAT Logo" className="logo" />
          </div>
          <h1>ExamSchedule</h1>
        </div>
        <nav className="sidebar-menu">
          <button
            className={`menu-item ${
              currentPage === "teachers" ? "active" : ""
            }`}
            onClick={() => switchPage("teachers")}
          >
            <span className="menu-icon">👩‍🏫</span>
            <span className="menu-text">Teacher List</span>
          </button>
          <button
            className={`menu-item ${currentPage === "exam" ? "active" : ""}`}
            onClick={() => switchPage("exam")}
          >
            <span className="menu-icon">📝</span>
            <span className="menu-text">Exam Schedule</span>
          </button>
          <button
            className={`menu-item ${
              currentPage === "timetable" ? "active" : ""
            }`}
            onClick={() => switchPage("timetable")}
          >
            <span className="menu-icon">📅</span>
            <span className="menu-text">Timetables</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <p>ExamSchedule </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-area">
        <main className="main-content-full">
          {currentPage === "teachers" ? (
            <TeachersPage />
          ) : currentPage === "exam" ? (
            <ExamPage />
          ) : (
            <TimetablePage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
