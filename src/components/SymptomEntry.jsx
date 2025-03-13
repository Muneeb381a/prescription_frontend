import { useState, useEffect } from "react";
import axios from "axios";
import {
  FaTimes,
  FaNotesMedical,
  FaCalendarAlt,
  FaStethoscope,
} from "react-icons/fa";
import { MdOutlineFilterList } from "react-icons/md";

const PatientHistory = ({ patientId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [filterDate, setFilterDate] = useState("");

  const fetchHistory = async () => {
    if (!patientId) {
      setError("Patient ID is required");
      return;
    }

    setFilterDate(""); 
    setLoading(true);
    setError("");

    try {
      console.log(`Fetching history for patient ID: ${patientId}`);
      const response = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/patient-history/${patientId}`,
        { timeout: 10000 }
      );
      console.log("API Response:", response.data);

      if (!Array.isArray(response.data)) {
        setHistory([response.data]); 
      } else {
        setHistory(response.data);
      }
      setShowModal(true);
    } catch (err) {
      console.error("Error fetching patient history:", err);
      setError(`Failed to fetch patient history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Updated history:", history);
  }, [history]);

  return (
    <div className=" shadow-xl rounded-xl max-w-4xl">
      <button
        onClick={fetchHistory}
        className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-teal-700 transition-all duration-300 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading ? "Getting Details..." : "View Details"}
      </button>
      {loading && (
        <div className="flex justify-center items-center mt-4">
          <div className="flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-lg shadow-md animate-pulse">
            <svg
              className="w-5 h-5 animate-spin text-teal-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3.5-3.5L12 0V4a8 8 0 018 8h-4l3.5 3.5L20 12h-4a8 8 0 01-8 8v-4l-3.5 3.5L4 20v-4a8 8 0 01-8-8h4z"
              ></path>
            </svg>
          </div>
        </div>
      )}

      {error && (
        <p className="text-center text-red-600 mt-4 font-medium">{error}</p>
      )}

      {showModal && (
        <div className="fixed inset-0 flex justify-center items-start pt-20  bg-opacity-50 backdrop-blur-sm z-[1000] transition-opacity duration-300">
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Patient History
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-red-600 text-2xl font-bold transition-colors duration-200"
              >
                <FaTimes />
              </button>
            </div>
            <div className="mb-4 flex items-center gap-4">
              <MdOutlineFilterList className="text-xl text-gray-700" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border p-2 rounded-md shadow-sm"
              />
            </div>
            {history.length === 0 ? (
              <p className="text-gray-500 text-center italic py-4">
                No history found for this patient.
              </p>
            ) : (
              <div className="space-y-6">
                {history
                  .filter(
                    (record) =>
                      !filterDate || record.visit_date.startsWith(filterDate)
                  )
                  .map((record, index) => (
                    <div
                      key={index}
                      className="border-b border-gray-200 pb-6 last:border-b-0"
                    >
                      <h3 className="text-lg font-semibold text-teal-700 flex items-center gap-2">
                        <FaCalendarAlt /> Visit Date:{" "}
                        {new Date(record.visit_date).toLocaleDateString()}
                      </h3>
                      <p className="text-gray-700 mt-2">
                        <FaNotesMedical className="inline-block text-gray-600 mr-2" />
                        <strong className="font-medium">Diagnosis:</strong>{" "}
                        {record.diagnosis || "N/A"}
                      </p>
                      <p className="text-gray-700">
                        <strong className="font-medium">Symptoms:</strong>{" "}
                        {record.symptoms?.filter(Boolean).length > 0
                          ? record.symptoms.join(", ")
                          : "No symptoms recorded"}
                      </p>
                      {record.prescriptions.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-md font-semibold text-gray-800">
                            Prescriptions:
                          </h4>
                          <ul className="list-disc ml-6 text-gray-600 space-y-2">
                            {record.prescriptions.map((prescription, idx) => (
                              <li key={idx} className="leading-relaxed">
                                <span className="font-medium text-gray-800">
                                  {prescription.brand_name}
                                </span>{" "}
                                - {prescription.dosage_en} |{" "}
                                {prescription.frequency_en} |{" "}
                                {prescription.duration_en}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {record.tests.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-md font-semibold text-gray-800">
                            Tests:
                          </h4>
                          <ul className="list-disc ml-6 text-gray-600 space-y-2">
                            {record.tests.map((test, idx) => (
                              <li key={idx} className="leading-relaxed">
                                {test.test_name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {(record.cranial_nerves ||
  record.motor_function ||
  record.muscle_strength ||
  record.muscle_tone ||
  record.coordination ||
  record.sensory_examination ||
  record.pain_sensation ||
  record.proprioception ||
  record.vibration_sense ||
  record.romberg_test ||
  record.gait_assessment ||
  record.tremors ||
  record.speech_assessment) && (
  <div className="mt-6 pt-4 border-t border-gray-100">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2.5 bg-blue-100 rounded-lg">
        <FaStethoscope className="text-xl text-blue-600" />
      </div>
      <h4 className="text-lg font-semibold text-gray-900">
        Neurological Examination Findings
      </h4>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Cranial Nerve Assessment */}
      {(record.cranial_nerves || record.speech_assessment) && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">Cranial Nerve Assessment</h5>
          <div className="space-y-2">
            {record.cranial_nerves && (
              <div className="flex justify-between">
                <span className="text-gray-600">Cranial Nerves:</span>
                <span className="font-medium text-gray-800">{record.cranial_nerves}</span>
              </div>
            )}
            {record.speech_assessment && (
              <div className="flex justify-between">
                <span className="text-gray-600">Speech Assessment:</span>
                <span className="font-medium text-gray-800">{record.speech_assessment}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Motor Function */}
      {(record.motor_function || record.muscle_strength || record.muscle_tone) && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h5 className="font-medium text-green-800 mb-2">Motor Function</h5>
          <div className="space-y-2">
            {record.motor_function && (
              <div className="flex justify-between">
                <span className="text-gray-600">Motor Function:</span>
                <span className="font-medium text-gray-800">{record.motor_function}</span>
              </div>
            )}
            {record.muscle_strength && (
              <div className="flex justify-between">
                <span className="text-gray-600">Muscle Strength:</span>
                <span className="font-medium text-gray-800">{record.muscle_strength}</span>
              </div>
            )}
            {record.muscle_tone && (
              <div className="flex justify-between">
                <span className="text-gray-600">Muscle Tone:</span>
                <span className="font-medium text-gray-800">{record.muscle_tone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sensory Examination */}
      {(record.sensory_examination || record.pain_sensation || 
        record.proprioception || record.vibration_sense) && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h5 className="font-medium text-purple-800 mb-2">Sensory Examination</h5>
          <div className="space-y-2">
            {record.sensory_examination && (
              <div className="flex justify-between">
                <span className="text-gray-600">Sensory Exam:</span>
                <span className="font-medium text-gray-800">{record.sensory_examination}</span>
              </div>
            )}
            {record.pain_sensation && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pain Sensation:</span>
                <span className={`badge ${record.pain_sensation ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {record.pain_sensation ? "Present" : "Absent"}
                </span>
              </div>
            )}
            {record.proprioception && (
              <div className="flex justify-between">
                <span className="text-gray-600">Proprioception:</span>
                <span className={`badge ${record.proprioception ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {record.proprioception ? "Intact" : "Impaired"}
                </span>
              </div>
            )}
            {record.vibration_sense && (
              <div className="flex justify-between">
                <span className="text-gray-600">Vibration Sense:</span>
                <span className={`badge ${record.vibration_sense ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {record.vibration_sense ? "Present" : "Absent"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coordination & Gait */}
      {(record.coordination || record.romberg_test || 
        record.gait_assessment || record.tremors) && (
        <div className="bg-amber-50 p-4 rounded-lg">
          <h5 className="font-medium text-amber-800 mb-2">Coordination & Gait</h5>
          <div className="space-y-2">
            {record.coordination && (
              <div className="flex justify-between">
                <span className="text-gray-600">Coordination:</span>
                <span className="font-medium text-gray-800">{record.coordination}</span>
              </div>
            )}
            {record.romberg_test && (
              <div className="flex justify-between">
                <span className="text-gray-600">Romberg Test:</span>
                <span className="font-medium text-gray-800">{record.romberg_test}</span>
              </div>
            )}
            {record.gait_assessment && (
              <div className="flex justify-between">
                <span className="text-gray-600">Gait Assessment:</span>
                <span className="font-medium text-gray-800">{record.gait_assessment}</span>
              </div>
            )}
            {record.tremors && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tremors:</span>
                <span className={`badge ${record.tremors ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {record.tremors ? "Present" : "Absent"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
)}

                      {record.follow_up_date && (
                        <p className="text-gray-700 mt-3">
                          <strong className="font-medium">
                            Next Follow-up:
                          </strong>{" "}
                          {new Date(record.follow_up_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all duration-300 shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
