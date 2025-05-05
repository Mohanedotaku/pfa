import { useState } from "react";
import "./App.css";
import issatLogo from "./assets/issat.png";
import FileUploader from "./components/FileUploader";
import TeacherListViewer from "./components/TeacherListViewer";
import TimetablePreview from "./components/TimetablePreview";
import ScheduleResults from "./components/ScheduleResults";
import React from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import axios from "axios";

function App() {
  const [currentPage, setCurrentPage] = useState("teachers");
  const [teachersUploaded, setTeachersUploaded] = useState(false);
  const [examsUploaded, setExamsUploaded] = useState(false);
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [sessionsDayDate, setSessionsDayDate] = useState(null);
  const [scheduleData, setScheduleData] = useState([]);
  const [scheduleError, setScheduleError] = useState(null);

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
    setTeachersUploaded(true);
  };

  const handleExamUploadSuccess = async (data) => {
    console.log("Exam file uploaded successfully:", data);
    setExamsUploaded(true);
    try {
      const response = await axios.get("http://localhost:5271/sessionsDayDate");
      setSessionsDayDate(response.data);
    } catch (error) {
      console.error("Error fetching sessionsDayDate:", error);
    }
  };

  const handleUploadError = (error) => {
    console.error("Upload error:", error);
  };

  const handleGenerateSchedule = async () => {
    console.log("Generating schedule...");
    setGeneratingSchedule(true);
    setScheduleError(null);
    setScheduleData([]);
    try {
      const response = await axios.get("http://localhost:5271/schedule");
      console.log("Schedule data received:", response.data); // Add this
      const data = Array.isArray(response.data) ? response.data : [];
      if (data.length === 0) {
        throw new Error("No teacher schedules returned.");
      }
      setScheduleData(data);
      setScheduleGenerated(true);
      setGeneratingSchedule(false);
    } catch (error) {
      setScheduleError(error.response?.data?.message || "Failed to generate schedule. Please try again.");
      setGeneratingSchedule(false);
      console.error("Schedule generation error:", error);
    }
  };

  const handleExportSchedule = () => {
    console.log("Exporting schedule...");
    alert("Schedule export functionality would be implemented here");
  };

  const handleRegenerateSchedule = () => {
    console.log("Regenerating schedule...");
    setScheduleGenerated(false);
    setScheduleError(null);
    setScheduleData([]);
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
              <p>Below is the processed teacher data from your uploaded file.</p>
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
          uploadEndpoint="http://localhost:5271/upload-excelSessions"
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
              className={`status-indicator ${teachersUploaded ? "status-complete" : "status-pending"}`}
            >
              {teachersUploaded ? "✅" : "⏳"}
            </div>
            <div className="status-text">
              <h3>Teacher List</h3>
              <p>{teachersUploaded ? "Uploaded successfully" : "Not uploaded yet"}</p>
            </div>
          </div>

          <div className="upload-status-card">
            <div
              className={`status-indicator ${examsUploaded ? "status-complete" : "status-pending"}`}
            >
              {examsUploaded ? "✅" : "⏳"}
            </div>
            <div className="status-text">
              <h3>Exam Schedule</h3>
              <p>{examsUploaded ? "Uploaded successfully" : "Not uploaded yet"}</p>
            </div>
          </div>
        </div>

        {sessionsDayDate && <TimetablePreview sessionsDayDate={sessionsDayDate} />}

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
                disabled={!teachersUploaded || !examsUploaded || generatingSchedule}
                onClick={handleGenerateSchedule}
              >
                Generate Schedule
              </button>
            )}
          </div>
        ) : (
          <ScheduleResults
            scheduleData={scheduleData}
            onExportSchedule={handleExportSchedule}
            onRegenerateSchedule={handleRegenerateSchedule}
            generationError={scheduleError}
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <img src={issatLogo} alt="ISSAT Logo" className="logo" />
          </div>
          <h1>ExamSchedule</h1>
        </div>
        <nav className="sidebar-menu">
          <button
            className={`menu-item ${currentPage === "teachers" ? "active" : ""}`}
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
            className={`menu-item ${currentPage === "timetable" ? "active" : ""}`}
            onClick={() => switchPage("timetable")}
          >
            <span className="menu-icon">📅</span>
            <span className="menu-text">Timetables</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          <p>ExamSchedule</p>
        </div>
      </div>

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
