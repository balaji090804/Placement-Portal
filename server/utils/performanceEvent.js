const Performance = require("../models/performance");

const clampScore = (value = 0, delta = 0) => {
  return Math.max(0, Math.min(100, (Number(value) || 0) + delta));
};

const normaliseEmail = (email) => (email || "").toString().trim().toLowerCase();

async function recordPerformanceEvent(appOrIo, email, type, meta = {}) {
  const studentEmail = normaliseEmail(email);
  if (!studentEmail || !type) return null;

  try {
    let doc = await Performance.findOne({ studentEmail });
    if (!doc) {
      doc = new Performance({ studentEmail });
    }

    doc.mockTestScores = doc.mockTestScores || {
      aptitude: 0,
      coding: 0,
      communication: 0,
      technical: 0,
    };

    switch (type) {
      case "dailyCodeSubmitted":
        doc.codingChallengesSolved = (doc.codingChallengesSolved || 0) + 1;
        doc.mockTestScores.coding = clampScore(doc.mockTestScores.coding, 1);
        break;
      case "practiceStarted":
        doc.mockTestScores.aptitude = clampScore(
          doc.mockTestScores.aptitude,
          1
        );
        break;
      case "jobApplied":
        if (meta?.companyName && meta?.jobRole) {
          doc.pastInterviews = doc.pastInterviews || [];
          doc.pastInterviews.push({
            companyName: meta.companyName,
            interviewDate: new Date(),
            technicalScore: 0,
            hrScore: 0,
            overallPerformance: "Applied",
          });
        }
        doc.mockTestScores.technical = clampScore(
          doc.mockTestScores.technical,
          0.5
        );
        break;
      case "resumeCreated":
        doc.mockTestScores.communication = clampScore(
          doc.mockTestScores.communication,
          1
        );
        break;
      case "taskCompleted":
        doc.mockTestScores.aptitude = clampScore(
          doc.mockTestScores.aptitude,
          1
        );
        break;
      case "taskCreated":
        doc.mockTestScores.communication = clampScore(
          doc.mockTestScores.communication,
          0.5
        );
        break;
      case "driveRegistered":
      case "driveApplied":
        doc.mockTestScores.technical = clampScore(
          doc.mockTestScores.technical,
          1
        );
        break;
      case "announcementsViewed":
        doc.mockTestScores.communication = clampScore(
          doc.mockTestScores.communication,
          0.5
        );
        break;
      case "interviewRequested":
        doc.mockTestScores.technical = clampScore(
          doc.mockTestScores.technical,
          1
        );
        break;
      case "offerAccepted":
        doc.offersAccepted = (doc.offersAccepted || 0) + 1;
        doc.interviewScores = clampScore(doc.interviewScores, 5);
        break;
      case "offerReleased":
        // Received an offer; small positive nudge to interview score
        doc.interviewScores = clampScore(doc.interviewScores, 2);
        break;
      case "offerDeclined":
        doc.interviewScores = clampScore(doc.interviewScores, -2);
        break;
      default:
        break;
    }

    doc.events = doc.events || [];
    doc.events.push({ type, meta: meta || {}, date: new Date() });
    doc.lastUpdated = new Date();

    await doc.save();

    let io = null;
    if (appOrIo) {
      if (typeof appOrIo.get === "function") {
        io = appOrIo.get("io");
      } else if (typeof appOrIo.to === "function") {
        io = appOrIo;
      }
    }

    if (io && typeof io.to === "function") {
      io.to(`user:${studentEmail}`).emit("performance:event", { type, meta });
      io.to(`user:${studentEmail}`).emit("dashboard:update", {
        scope: "student",
        email: studentEmail,
      });
    }

    return doc;
  } catch (err) {
    console.warn("recordPerformanceEvent util failed", err.message || err);
    return null;
  }
}

module.exports = { recordPerformanceEvent };
