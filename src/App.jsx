import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion } from "framer-motion";
import {
  FaArrowUp,
  FaArrowDown,
  FaBan,
  FaReply,
  FaHeartbeat,
  FaHeart,
  FaThermometerHalf,
  FaLungs,
  FaBrain,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import {
  AiOutlinePlus,
  AiOutlinePrinter,
  AiOutlineDownload,
  AiOutlineCloseCircle,
  AiOutlineHome,
  AiOutlineArrowLeft,
  AiOutlineCalendar,
  AiOutlineMan,
  AiOutlineMobile,
  AiOutlineIdcard,
  AiOutlineUser,
  AiOutlineSearch,
  AiOutlineHistory,
  AiOutlineFileText,
  AiOutlineClose,
  AiOutlineFolderOpen,
  AiOutlineMedicineBox,
  AiOutlineClockCircle,
} from "react-icons/ai";
import { FiDroplet, FiClock, FiCalendar, FiInfo } from "react-icons/fi";
import AddPatientForm from "./pages/AddPatientForm";
import { urduDate } from "./utils/dateUtils";
import PatientHistoryModal from "./components/PatientHistoryModal";
import PatientHistory from "./components/PatientHistoryModal";
import NeuroExamSelect from "./components/NeuroExamSelect";

const searchSchema = z.object({
  mobile: z.string().min(10, "Enter a valid mobile number"),
});

const PrescriptionDetail = ({ label, en, urdu }) => (
  <div className="flex justify-between items-start">
    <span className="font-medium text-gray-600">{label}:</span>
    <div className="text-right">
      <p className="text-gray-800">{en}</p>
      <p className="text-gray-500 text-sm">{urdu}</p>
    </div>
  </div>
);

const fields = [
  "motor_function",
  "muscle_tone",
  "muscle_strength",
  "straight_leg_raise_test",
  "deep_tendon_reflexes",
  "plantar_reflex",
  "pupillary_reaction",
  "speech_assessment",
  "gait_assessment",
  "coordination",
  "sensory_examination",
  "cranial_nerves",
  "mental_status",
  "cerebellar_function",
  "muscle_wasting",
  "abnormal_movements",
  "romberg_test",
  "nystagmus",
  "fundoscopy",
];

const PatientSearch = () => {
  const [patient, setPatient] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [consultationData, setConsultationData] = useState(null);
  const [tests, setTests] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [customTest, setCustomTest] = useState("");
  const [neuroExamData, setNeuroExamData] = useState([]);
  const [followUpDate, setFollowUpDate] = useState(null);
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [isFetchingSymptoms, setIsFetchingSymptoms] = useState(false);
  const [patients, setPatients] = useState([]);
  const [searchedMobile, setSearchedMobile] = useState("");
  const [fetchingMedicines, setIsFetchingMedicines] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const navigate = useNavigate();

  const [selectedMedicines, setSelectedMedicines] = useState([]);

  const [vitalSigns, setVitalSigns] = useState({
    pulseRate: "",
    bloodPressure: "",
    temperature: "",
    spo2: "",
    nihss: "",
    fall_assessment: "Done",
  });

  const handleReturnHome = () => {
    setPatient(null);
    setShowAddPatient(false);
    setSearchedMobile("");
    window.history.pushState({}, "", "/");
  };

  const handleNewPatient = (newPatient) => {
    setPatients([...patients, newPatient]); // Update patient list
  };

  // examinations field change
  const handleFieldChange = (field, value) => {
    setNeuroExamData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    axios
      .get("https://patient-management-backend-nine.vercel.app/api/tests")
      .then((res) => setTests(res.data))
      .catch((err) => console.error("Error fetching tests:", err));
  }, []);

  // Handle test selection or creation
  const handleTestChange = (selectedOptions) => {
    setSelectedTests(selectedOptions.map((option) => option.value));
  };

  const handleCreateMedicine = async (inputValue) => {
    setIsCreating(true);
    try {
      const response = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/medicines",
        {
          medicine_name: inputValue,
          generic_name: "",
          urdu_name: "",
          urdu_form: "",
          urdu_strength: "",
        }
      );

      const newMedicine = response.data;

      const formattedMedicine = {
        value: newMedicine.id,
        label: `${newMedicine.form} ${newMedicine.brand_name} (${newMedicine.strength})`,
      };

      // Add new medicine to options
      setMedicines((prev) => [...prev, formattedMedicine]);

      return newMedicine.id; // 🔹 Return new medicine ID ✅
    } catch (error) {
      console.error("Creation failed:", error);
      alert(error.response?.data?.error || "Invalid medicine format");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: "#ccc",
      boxShadow: "none",
      "&:hover": { borderColor: "#888" },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#4CAF50" : "#fff",
      color: state.isSelected ? "#fff" : "#333",
      "&:hover": {
        backgroundColor: "#f1f1f1",
      },
    }),
  };

  //

  // Fetch symptoms and medicines on load

  const handlePrint = () => {
    const printContent = document.getElementById("consultation-content");
    if (!printContent) {
      alert("No consultation data to print");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Pop-up blocked! Allow pop-ups for this site.");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Prescription - ${patient?.name || "Unknown Patient"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              margin: 20mm 15mm;
              color: #374151;
              font-size: 11px;
              line-height: 1.1;
            }
  
            .prescription-container {
              display: grid;
              grid-template-columns: 2fr 1fr;
              gap: 3mm;
              margin-top: 5mm;
            }
  
            .patient-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 3mm;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
            }
  
            .patient-table th,
            .patient-table td {
              padding: 1mm 2mm;
              border: 1px solid #e2e8f0;
              text-align: left;
            }
  
            .patient-table th {
              background: #e2e8f0;
              font-weight: 600;
              width: 25%;
            }
  
            .section-title {
              font-weight: 600;
              color: #1e40af;
              padding-bottom: 1mm;
              margin-bottom: 1mm;
              border-bottom: 2px solid #1e40af;
            }
  
            .medicine-table {
              width: 100%;
              border-collapse: collapse;
              margin: 1mm 0;
            }
  
            .medicine-table th {
              padding: 3mm 1mm;
              text-align: left;
              font-weight: 600;
              font-size: 12px;
              background: #eff6ff;
              border-bottom: 2px solid #1e40af;
            }
  
            .medicine-table td {
              padding: 2mm 1mm;
              border-bottom: 1px solid #e5e7eb;
              font-size: 10px;
              font-family: 'Noto Nastaliq Urdu', serif;
            }
  
            .clinical-section {
              margin-bottom: 0.5mm;
              padding: 1mm;
              background: #f8fafc;
            }
  
            .clinical-paragraph {
              text-align: justify;
              color: #475569;
            }
  
            .clinical-paragraph strong {
              color: #1e293b;
            }
  
            .follow-up-section {
              margin-top: 1mm;
              padding: 3mm;
              background: #f0fdfa;
            }
  
            .urdu-date {
              font-family: 'Noto Nastaliq Urdu', serif;
              direction: rtl;
              color: #4b5563;
            }
  
            @media print {
              @page {
                margin: 0 !important;
              }
              body {
                margin:69.85mm 3mm 76.2mm !important;
              }
              .section-title {
                color: #1e3a8a !important;
              }
            }
          </style>
        </head>
        <body>
          
          <table class="patient-table">
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Mobile #</th>
                <th>Age/Sex</th>
                <th>Checkup Date</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${patient?.name || "-"}</td>
                <td>${patient?.mobile || "-"}</td>
                <td>${patient?.age || "-"}/${patient?.gender || "-"}</td>
                <td>${
                  patient?.checkup_date
                    ? new Date(patient.checkup_date).toLocaleDateString("en-UK")
                    : "-"
                }</td>
              </tr>
            </tbody>
          </table>


  
          <div class="prescription-container">
            <!-- Medicines Column -->
            <div class="column" style="border-right: 2px solid #1e40af;">
              <div class="section-title">PRESCRIPTION</div>
              <table class="medicine-table">
                <thead>
                  <tr>
                    <th style="width: 25%">Medicine</th>
                    <th style="width: 25%">Frequency</th>
                    <th style="width: 15%">Dosage</th>
                    <th style="width: 20%">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  ${selectedMedicines
                    .map((med) => {
                      const medicineData = medicines.find(
                        (m) => m.value === med.medicine_id
                      );
                      return `
                        <tr>
                          <td>${medicineData?.label || "-"}</td>
                          <td>${med.frequency_urdu || "-"}</td>
                          <td>${med.dosage_urdu || "-"}</td>
                          <td>${med.duration_urdu || "-"}</td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
  
            <!-- Clinical Findings Column -->
            <div class="column">
              <div class="section-title">CLINICAL FINDINGS</div>
              <div class="clinical-section">
                <div class="clinical-paragraph">
              ${
                vitalSigns.bloodPressure ||
                vitalSigns.pulseRate ||
                vitalSigns.temperature ||
                vitalSigns.spo2 ||
                vitalSigns.nihss ||
                vitalSigns.fall_assessment
                  ? `
                    <div class="vital-signs">
                    <strong>Vital Signs:</strong>
                      ${
                        vitalSigns.bloodPressure
                          ? `
                         
                            <span class="vital-label">BP:</span>
                            <span class="vital-value">${vitalSigns.bloodPressure}</span>
                            <span style="font-size: 8px; color: #6b7280;">mmHg</span>
                          
                        `
                          : ""
                      }
                      ${
                        vitalSigns.pulseRate
                          ? `
                          
                            <span class="vital-label">Pulse:</span>
                            <span class="vital-value">${vitalSigns.pulseRate}</span>
                            <span style="font-size: 8px; color: #6b7280;">bpm</span>
                          
                        `
                          : ""
                      }
                      ${
                        vitalSigns.temperature
                          ? `
                          
                            <span class="vital-label">Temp:</span>
                            <span class="vital-value">${vitalSigns.temperature}</span>
                            <span style="font-size: 8px; color: #6b7280;">°C</span>
                          
                        `
                          : ""
                      }
                      ${
                        vitalSigns.spo2
                          ? `
                          
                            <span class="vital-label">SpO₂:</span>
                            <span class="vital-value">${vitalSigns.spo2}</span>
                            <span style="font-size: 8px; color: #6b7280;">%</span>
                         
                        `
                          : ""
                      }
                      ${
                        vitalSigns.nihss
                          ? `
                         
                            <span class="vital-label">NIHSS:</span>
                            <span class="vital-value">${vitalSigns.nihss}</span>
                            <span style="font-size: 8px; color: #6b7280;">/42</span>
                          
                        `
                          : ""
                      }
                      ${
                        vitalSigns.fall_assessment
                          ? `
                         
                            <span class="vital-label">Fall Risk:</span>
                            <span class="vital-value">${vitalSigns.fall_assessment}</span>
                            <span style="font-size: 8px; color: #6b7280;">/42</span>
                         
                        `
                          : ""
                      }
                    </div>
                  `
                  : `<div style="color: #6b7280; font-size: 9px; margin-top: 2mm;">No vital signs recorded</div>`
              }
            </div>
                  <strong>Symptoms:</strong>
                  ${
                    selectedSymptoms.length > 0
                      ? selectedSymptoms.map((s) => s.label).join(", ") + "."
                      : "No symptoms noted."
                  }
                </div>
  
                <div class="clinical-paragraph">
                  <strong>Recommended Tests:</strong>
                  ${
                    selectedTests.length > 0
                      ? selectedTests.join(", ") + "."
                      : "No tests recommended."
                  }
                </div>
  
                <div class="clinical-paragraph">
                  <strong>Examination:</strong>
                  ${
                    [
                      { label: "Motor Function", key: "motor_function" },
                      { label: "Muscle Tone", key: "muscle_tone" },
                      { label: "Muscle Strength", key: "muscle_strength" },
                      {
                        label: "Straight Leg Test",
                        key: "straight_leg_raise_test",
                      },
                      { label: "Reflexes", key: "deep_tendon_reflexes" },
                      { label: "Gait", key: "gait_assessment" },
                      { label: "Plantars", key: "plantar_reflex" },
                      { label: "Pupils", key: "pupillary_reaction" },
                      { label: "Speech", key: "speech_assessment" },
                      { label: "Coordination", key: "coordination" },
                      { label: "Sensory Exam", key: "sensory_examination" },
                      { label: "Cranial Nerves", key: "cranial_nerves" },
                      { label: "Mental Status", key: "mental_status" },
                      {
                        label: "Cerebellar Function",
                        key: "cerebellar_function",
                      },
                      { label: "Muscle Wasting", key: "muscle_wasting" },
                      {
                        label: "Abnormal Movements",
                        key: "abnormal_movements",
                      },
                      { label: "Romberg Test", key: "romberg_test" },
                      { label: "Nystagmus", key: "nystagmus" },
                      { label: "Fundoscopy", key: "fundoscopy" },
                      { label: "MMSE Score", key: "mmse_score" },
                      { label: "GCS Score", key: "gcs_score" },
                      {
                        label: "Sensation",
                        key: "pain_sensation",
                        type: "check",
                      },
                      {
                        label: "Vibration Sense",
                        key: "vibration_sense",
                        type: "check",
                      },
                      {
                        label: "Proprioception",
                        key: "proprioception",
                        type: "check",
                      },
                      {
                        label: "Temp Sensation",
                        key: "temperature_sensation",
                        type: "check",
                      },
                      {
                        label: "Brudzinski Sign",
                        key: "brudzinski_sign",
                        type: "check",
                      },
                      {
                        label: "Kernig Sign",
                        key: "kernig_sign",
                        type: "check",
                      },
                      {
                        label: "Facial Sensation",
                        key: "facial_sensation",
                        type: "check",
                      },
                      {
                        label: "Swallowing",
                        key: "swallowing_function",
                        type: "check",
                      },
                      { label: "Diagnosis", key: "diagnosis" },
                      { label: "Treatment Plan", key: "treatment_plan" },
                    ]
                      .filter(({ key }) => {
                        const value = neuroExamData[key];
                        return (
                          value !== undefined &&
                          value !== null &&
                          (typeof value !== "string" || value.trim() !== "")
                        );
                      })
                      .map(({ label, key, type }) => {
                        const value = neuroExamData[key];
                        const displayValue =
                          type === "check"
                            ? value
                              ? "Positive"
                              : "Negative"
                            : value || "-";
                        return `${label}: ${displayValue}`;
                      })
                      .join("; ") + "."
                  }
                </div>
              </div>
            </div>
          </div>
  
          ${
            followUpDate
              ? `
            <div class="follow-up-section">
              <div class="section-title">FOLLOW UP</div>
              <div style="display: flex; justify-content: space-between; gap: 5mm">
                <div><strong>Date:</strong> ${new Date(
                  followUpDate
                ).toLocaleDateString()}</div>
                <div class="urdu-date">
                  <span>
                    برائے مہربانی 
                    <span style="color: #1e40af; font-weight: 500">
                      ${urduDate(followUpDate)}
                    </span>
                    کو دوبارہ تشریف لائیں
                  </span>
                </div>
                <div><strong>Notes:</strong> ${followUpNotes || "-"}</div>
              </div>
            </div>
          `
              : ""
          }
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  useEffect(() => {
    const fetchSymptoms = async () => {
      setIsFetchingSymptoms(true);
      try {
        const res = await axios.get(
          "https://patient-management-backend-nine.vercel.app/api/symptoms"
        );
        setSymptoms(res.data.map((s) => ({ value: s.id, label: s.name })));
      } catch (error) {
        console.error("Error fetching symptoms:", error);
      } finally {
        setIsFetchingSymptoms(false);
      }
    };

    const fetchMedicines = async () => {
      setIsFetchingMedicines(true);
      try {
        const res = await axios.get(
          "https://patient-management-backend-nine.vercel.app/api/medicines"
        );
        setMedicines(
          res.data.map((m) => ({
            value: m.id,
            label: `${m.form} ${m.brand_name}${
              m.strength ? ` (${m.strength})` : ""
            }`,
          }))
        );
      } catch (error) {
        console.error("Error fetching medicines:", error);
      } finally {
        setIsFetchingMedicines(false);
      }
    };

    fetchSymptoms();
    fetchMedicines();
  }, []);

  useEffect(() => {
    if (patient?.id) {
      const fetchPrescriptions = async () => {
        try {
          const response = await axios.get(
            `https://patient-management-backend-nine.vercel.app/api/prescriptions/patient/${patient.id}`
          );
          setPrescriptions(response.data || []);
        } catch (error) {
          console.error("Error fetching prescriptions:", error);

          // ✅ If the API returns 404, set prescriptions to an empty array
          if (error.response && error.response.status === 404) {
            setPrescriptions([]);
          }
        }
      };

      fetchPrescriptions();
    }
  }, [patient?.id]); // ✅ Fetch prescriptions when patient.id changes

  // handle create symptoms
  const handleCreateSymptom = async (inputValue) => {
    setIsFetchingSymptoms(true);
    try {
      const response = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/symptoms",
        {
          name: inputValue, // Sending new symptom name
        }
      );

      const newSymptom = {
        value: response.data.id, // Assuming the API returns the new symptom's ID
        label: response.data.name,
      };

      setSymptoms((prev) => [...prev, newSymptom]); // Add to options
      setSelectedSymptoms((prev) => [...prev, newSymptom]); // Select it immediately
    } catch (error) {
      console.error("Error adding new symptom:", error);
    } finally {
      setIsFetchingSymptoms(false);
    }
  };

  // Form for searching patients
  const {
    register: registerSearch,
    handleSubmit: handleSearchSubmit,
    formState: { errors: searchErrors },
  } = useForm({ resolver: zodResolver(searchSchema) });

  // Search for patient by mobile
  const onSearch = async (data) => {
    if (!data.mobile.trim()) {
      alert("Please enter a valid mobile number.");
      return;
    }

    const mobile = data.mobile.trim();
    const startTime = Date.now();
    setIsSearching(true);

    try {
      const res = await axios.get(
        `https://patient-management-backend-nine.vercel.app/api/patients/search?mobile=${encodeURIComponent(
          mobile
        )}`
      );

      const elapsed = Date.now() - startTime;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }

      if (res.data?.exists) {
        if (!res.data.data?.id && !res.data.data?._id) {
          throw new Error("Patient ID not found in API response");
        }

        const patientId = res.data.data.id || res.data.data._id;
        setPatient(res.data.data);
        setShowAddPatient(false);

        // Update URL for existing patient
        window.history.pushState(
          { patientId },
          "",
          `/patients/${patientId}/consultation`
        );
      } else {
        setPatient(null);
        setSearchedMobile(mobile);
        setShowAddPatient(true);

        // Update URL for new patient registration
        window.history.pushState(
          { newPatient: true, mobile },
          "",
          `/patients/new?mobile=${encodeURIComponent(mobile)}`
        );
      }
    } catch (error) {
      console.error("Error fetching patient", error);
      setPatient(null);
      setShowAddPatient(false);
      alert(error.message || "Failed to fetch patient. Please try again.");
      window.history.replaceState(null, "", "/");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const loadPatientFromURL = async () => {
      const pathParts = window.location.pathname.split("/");

      // Handle existing patient consultation page
      if (pathParts[1] === "patients" && pathParts.length >= 3) {
        const patientId = pathParts[2];

        if (
          pathParts[3] === "consultation" ||
          pathParts[3] === "add-prescription"
        ) {
          try {
            const res = await axios.get(
              `https://patient-management-backend-nine.vercel.app/api/patients/${patientId}`
            );
            setPatient(res.data);
            setShowAddPatient(false);
          } catch (error) {
            console.error("Error loading patient from URL:", error);
            alert("Invalid patient ID in URL");
            window.history.replaceState(null, "", "/");
          }
        }
      }
      // Handle new patient registration page
      else if (pathParts[1] === "patients" && pathParts[2] === "new") {
        const urlParams = new URLSearchParams(window.location.search);
        const mobile = urlParams.get("mobile");
        if (mobile) {
          setSearchedMobile(mobile);
          setShowAddPatient(true);
        }
      }
    };

    loadPatientFromURL();
  }, []);

  const handleNewPatientAdded = () => {
    // Re-trigger the search with the same mobile number
    onSearch({ mobile: searchedMobile });
  };

  const handlePatientSelection = (selectedPatient) => {
    setPatient(selectedPatient); // Set the selected patient
  };

  // validations for vital signs
  const validateVitals = () => {
    const errors = [];

    if (!/^\d{2,3}\/\d{2,3}$/.test(vitalSigns.bloodPressure)) {
      errors.push("Invalid blood pressure format (use XXX/XX)");
    }

    if (
      !vitalSigns.pulseRate ||
      isNaN(vitalSigns.pulseRate) ||
      vitalSigns.pulseRate < 0
    ) {
      errors.push("Invalid pulse rate");
    }

    if (
      !vitalSigns.temperature ||
      isNaN(vitalSigns.temperature) ||
      vitalSigns.temperature < 30 ||
      vitalSigns.temperature > 45
    ) {
      errors.push("Temperature must be between 30°C and 45°C");
    }

    if (
      !vitalSigns.spo2 ||
      isNaN(vitalSigns.spo2) ||
      vitalSigns.spo2 < 0 ||
      vitalSigns.spo2 > 100
    ) {
      errors.push("SpO2 must be between 0-100%");
    }

    if (
      !vitalSigns.nihss ||
      isNaN(vitalSigns.nihss) ||
      vitalSigns.nihss < 0 ||
      vitalSigns.nihss > 42
    ) {
      errors.push("NIHSS score must be between 0-42");
    }

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (neuroExamData.mmse_score) {
      const score = parseInt(neuroExamData.mmse_score.split("/")[0]);
      if (score > 30) {
        setNeuroExamData((prev) => ({ ...prev, mmse_score: "30/30" }));
      }
    }

    if (neuroExamData.gcs_score) {
      const score = parseInt(neuroExamData.gcs_score.split("/")[0]);
      if (score < 3) {
        setNeuroExamData((prev) => ({ ...prev, gcs_score: "3/15" }));
      } else if (score > 15) {
        setNeuroExamData((prev) => ({ ...prev, gcs_score: "15/15" }));
      }
    }
  }, [neuroExamData.mmse_score, neuroExamData.gcs_score]);

  const submitConsultation = async () => {
    if (!patient) {
      alert("Please search for a patient first.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create Consultation
      const consultationRes = await axios.post(
        "https://patient-management-backend-nine.vercel.app/api/consultations",
        { patient_id: patient.id, doctor_name: "Dr. Abdul Rauf" }
      );
      const consultationId = consultationRes.data.id;

      // Step 2: Prepare Test Data and Create New Tests in Parallel
      const existingTestNames = new Set(tests.map((t) => t.test_name));
      const newTests = selectedTests.filter(
        (testName) => !existingTestNames.has(testName)
      );

      const testCreationPromises = newTests.map((testName) =>
        axios.post(
          "https://patient-management-backend-nine.vercel.app/api/tests",
          {
            test_name: testName,
            test_notes: "Optional test notes",
          }
        )
      );

      const testCreationResults = await Promise.allSettled(
        testCreationPromises
      );
      const createdTests = testCreationResults
        .filter((result) => result.status === "fulfilled")
        .map((result) => result.value.data);

      // Update local tests state with newly created tests
      if (createdTests.length > 0) {
        setTests((prevTests) => [...prevTests, ...createdTests]);
      }

      // Map all selected tests to their IDs (existing + newly created)
      const testIds = selectedTests.map((testName) => {
        const test =
          tests.find((t) => t.test_name === testName) ||
          createdTests.find((t) => t.test_name === testName);
        return test.id;
      });

      // Step 3: Prepare Test Assignment Promises
      const testAssignmentPromises = testIds.map((testId) =>
        axios.post(
          "https://patient-management-backend-nine.vercel.app/api/tests/assign",
          {
            test_id: testId,
            consultation_id: consultationId,
          }
        )
      );

      const vitalsData = {
        consultation_id: consultationId,
        patient_id: patient.id,
        pulse_rate: Number(vitalSigns.pulseRate),
        blood_pressure: vitalSigns.bloodPressure,
        temperature: Number(vitalSigns.temperature),
        spo2_level: Number(vitalSigns.spo2),
        nihss_score: Number(vitalSigns.nihss),
        fall_assessment: vitalSigns.fall_assessment,
      };

      // Step 4: Execute All API Calls in Parallel
      const apiCalls = [
        // submit vitals
        axios.post(
          "https://patient-management-backend-nine.vercel.app/api/vitals",
          vitalsData
        ),

        // Submit Symptoms
        axios.post(
          `https://patient-management-backend-nine.vercel.app/api/consultations/${consultationId}/symptoms`,
          {
            patient_id: patient.id,
            symptom_ids: selectedSymptoms.map((s) => s.value),
          }
        ),

        // Submit Medicines
        axios.post(
          "https://patient-management-backend-nine.vercel.app/api/prescriptions",
          {
            consultation_id: consultationId,
            patient_id: patient.id,
            medicines: selectedMedicines.map((med) => ({
              medicine_id: med.medicine_id,
              dosage_en: med.dosage_en,
              dosage_urdu: med.dosage_urdu,
              frequency_en: med.frequency_en,
              frequency_urdu: med.frequency_urdu,
              duration_en: med.duration_en,
              duration_urdu: med.duration_urdu,
              instructions_en: med.instructions_en,
              instructions_urdu: med.instructions_urdu,
            })),
          }
        ),

        // Add Test Assignments
        ...testAssignmentPromises,
      ];
      const payload = {
        consultation_id: consultationId,
        patient_id: patient.id,

        // Dynamically add fields that have values (avoid empty strings)
        ...fields.reduce((obj, field) => {
          if (neuroExamData[field]?.trim()) {
            obj[field] = neuroExamData[field];
          }
          return obj;
        }, {}),

        diagnosis: neuroExamData.diagnosis || "",
        treatment_plan: neuroExamData.treatment_plan || "",
        pain_sensation: !!neuroExamData.pain_sensation,
        vibration_sense: !!neuroExamData.vibration_sense,
        proprioception: !!neuroExamData.proprioception,
        temperature_sensation: !!neuroExamData.temperature_sensation,
        brudzinski_sign: !!neuroExamData.brudzinski_sign,
        kernig_sign: !!neuroExamData.kernig_sign,
        facial_sensation: !!neuroExamData.facial_sensation,
        swallowing_function: !!neuroExamData.swallowing_function,
        mmse_score: neuroExamData.mmse_score || "",
        gcs_score: neuroExamData.gcs_score || "",
      };

      // ✅ Debug your payload before sending
      console.log("🧠 Submitting neuro exam payload:", payload);

      // ✅ Push this API call into the array
      apiCalls.push(
        axios.post(
          "https://patient-management-backend-nine.vercel.app/api/examination",
          payload
        )
      );

      // Submit Follow-Up (if applicable)
      if (selectedDuration) {
        apiCalls.push(
          axios.post(
            `https://patient-management-backend-nine.vercel.app/api/followups/consultations/${consultationId}/followups`,
            {
              follow_up_date: followUpDate.toISOString().split("T")[0],
              notes: followUpNotes || "عام چیک اپ",
              duration_days: selectedDuration,
            }
          )
        );
      }

      // Step 5: Execute All API Calls in Parallel
      const results = await Promise.allSettled(apiCalls);

      // Check for failed requests
      const failedCalls = results.filter((r) => r.status === "rejected");
      if (failedCalls.length > 0) {
        console.error(
          "Some API calls failed:",
          failedCalls.map((r) => r.reason)
        );
        throw new Error("Partial submission failure");
      }

      // Step 6: Success Handling
      toast.success("Consultation added successfully! 🎉", {
        position: "top-right",
        autoClose: 2000,
      });

      // Reset state
      setVitalSigns({
        pulseRate: "",
        bloodPressure: "",
        temperature: "",
        spo2: "",
        nihss: "",
      });
      setFollowUpDate(null);
      setFollowUpNotes("");
      setSelectedDuration(null);

      // Step 7: Print and Navigate
      handlePrint();
      setTimeout(() => {
        navigate("/");
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error(
        "Error submitting consultation:",
        error.response?.data || error.message
      );
      alert("An error occurred while saving the consultation.");
    } finally {
      setLoading(false);
    }
  };
  const MEDICINE_DEFAULTS = {
    Tablet: {
      dosage_en: "1",
      dosage_urdu: "ایک گولی (1 Tablet)",
      frequency_en: "morning_evening",
      frequency_urdu: "صبح، شام (Morning & Evening)",
      duration_en: "5_days",
      duration_urdu: "5 دن (5 Days)",
      instructions_en: "after_meal",
      instructions_urdu: "کھانے کے بعد (After Meal)",
    },
  };
  return (
    <div
      className="min-h-screen p-8 relative 
overflow-hidden isolate w-[90vw] mx-auto before:absolute before:inset-0 
before:bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_transparent)] 
before:opacity-50 before:-z-10"
    >
      <div className="mx-auto max-w-6xl rounded-2xl border border-white/30 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-100/30">
        <h2 className="mb-6 border-b border-gray-200 pb-4 text-2xl font-bold text-gray-900">
          <span className="bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
            Patient Consultation Portal
          </span>
        </h2>
        {patient && (
          <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8 px-6 py-4 bg-gradient-to-r from-gray-50 to-white shadow-md rounded-2xl">
              {/* Back to Search Button */}
              <button
                onClick={handleReturnHome}
                className="group flex items-center gap-2 px-4 py-2 bg-white text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 rounded-xl font-medium text-sm shadow-sm hover:shadow-md transition-all duration-200"
              >
                <AiOutlineArrowLeft className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1" />
                Back to Search
              </button>

              {/* Right Side Actions */}
              <div className="flex items-center gap-6">
                {/* Show Previous Prescriptions Button */}
                {Array.isArray(prescriptions) && prescriptions.length > 0 && (
                  <button
                    onClick={() => setShowPopup(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all duration-300"
                  >
                    <AiOutlineHistory className="w-5 h-5" />
                    Previous Prescriptions
                  </button>
                )}

                {/* Patient History or No Patient Message */}
                {patient?.id ? (
                  <PatientHistory patientId={patient.id} />
                ) : (
                  <p className="text-gray-500 italic text-sm">
                    No patient selected
                  </p>
                )}
              </div>
            </div>
            {/* Patient Info Header */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <AiOutlineUser className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {patient.name}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>ID: {patient.id}</span>
                    <span className="text-gray-400">|</span>
                    <span>{patient.mobile}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Prescriptions Popup */}
            {showPopup && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-gray-900/70 backdrop-blur-md z-50 overflow-y-auto"
              >
                <div className="min-h-screen flex items-start justify-center p-6 pt-20 pb-10">
                  <motion.div
                    initial={{ scale: 0.95, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto border border-gray-200 overflow-hidden"
                  >
                    {/* Popup Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-teal-100 to-blue-100 dark:from-teal-900 dark:to-blue-900 border-b border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="bg-teal-200 p-3 rounded-full shadow-md">
                            <AiOutlineFileText className="w-8 h-8 text-teal-700 dark:text-teal-300" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                              Treatment History
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                              Previous Prescriptions
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowPopup(false)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-all duration-200"
                        >
                          <AiOutlineClose className="w-6 h-6 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Prescriptions List */}
                    <div className="p-8 bg-gray-50 dark:bg-gray-900">
                      <div className="space-y-10">
                        {prescriptions.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
                              No prescriptions available.
                            </p>
                          </div>
                        ) : (
                          Object.entries(
                            prescriptions.reduce((acc, prescription) => {
                              const dateKey = new Date(
                                prescription.prescribed_at
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              });
                              if (!acc[dateKey]) acc[dateKey] = [];
                              acc[dateKey].push(prescription);
                              return acc;
                            }, {})
                          ).map(([date, datePrescriptions], index) => (
                            <motion.div
                              key={date}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="group relative"
                            >
                              {/* Date Header */}
                              <div className="flex items-center gap-4 mb-6">
                                <AiOutlineCalendar className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                  {date}
                                </span>
                                <span className="text-gray-300 dark:text-gray-500">
                                  •
                                </span>
                                <AiOutlineClockCircle className="w-7 h-7 text-teal-600 dark:text-teal-400" />
                                <span className="text-base text-gray-600 dark:text-gray-300">
                                  {new Date(
                                    datePrescriptions[0].prescribed_at
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {/* Medicine List */}
                              <div className="space-y-5 pl-12 relative">
                                {datePrescriptions.map((prescription) => (
                                  <div
                                    key={prescription.id}
                                    className="group bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg hover:bg-teal-100/30 dark:hover:bg-teal-900/50 transition-all duration-300 border border-gray-200 dark:border-gray-700"
                                  >
                                    <div className="flex items-start gap-6">
                                      <div className="p-3 bg-teal-200 dark:bg-teal-800 rounded-full shadow-sm mt-1">
                                        <AiOutlineMedicineBox className="w-6 h-6 text-teal-700 dark:text-teal-300" />
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-baseline gap-4 mb-4">
                                          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                            {prescription.brand_name}
                                          </h3>
                                          <span className="text-sm text-teal-600 bg-teal-100 dark:bg-teal-900 dark:text-teal-300 px-2.5 py-1 rounded-full shadow-sm">
                                            #{prescription.id}
                                          </span>
                                        </div>

                                        {prescription.urdu_name && (
                                          <div className="mb-5">
                                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 urdu-font border-l-4 border-teal-300 pl-4">
                                              {prescription.urdu_name}
                                            </p>
                                          </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                                            <div className="p-1.5 bg-teal-100 dark:bg-teal-900 rounded-full">
                                              <FiDroplet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                Dosage
                                              </p>
                                              {prescription.dosage_en && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                  {prescription.dosage_en}
                                                </p>
                                              )}
                                              {prescription.dosage_urdu && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 urdu-font mt-1 border-l-2 border-teal-200 pl-2">
                                                  {prescription.dosage_urdu}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                                            <div className="p-1.5 bg-teal-100 dark:bg-teal-900 rounded-full">
                                              <FiClock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                Frequency
                                              </p>
                                              {prescription.frequency_en && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                  {prescription.frequency_en}
                                                </p>
                                              )}
                                              {prescription.frequency_urdu && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 urdu-font mt-1 border-l-2 border-teal-200 pl-2">
                                                  {prescription.frequency_urdu}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                                            <div className="p-1.5 bg-teal-100 dark:bg-teal-900 rounded-full">
                                              <FiCalendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                Duration
                                              </p>
                                              {prescription.duration_en && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                  {prescription.duration_en}
                                                </p>
                                              )}
                                              {prescription.duration_urdu && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 urdu-font mt-1 border-l-2 border-teal-200 pl-2">
                                                  {prescription.duration_urdu}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200">
                                            <div className="p-1.5 bg-teal-100 dark:bg-teal-900 rounded-full">
                                              <FiInfo className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                            </div>
                                            <div>
                                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                                                Instructions
                                              </p>
                                              {prescription.instructions_en && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                  {prescription.instructions_en}
                                                </p>
                                              )}
                                              {prescription.instructions_urdu && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 urdu-font mt-1 border-l-2 border-teal-200 pl-2">
                                                  {
                                                    prescription.instructions_urdu
                                                  }
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {/* Timeline Connector */}
                                <div className="absolute left-6 top-0 bottom-0 w-1 bg-teal-300 dark:bg-teal-700 group-last:hidden transition-all duration-300" />
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Enhanced Close Button */}
                    <div className="p-6 border-t border-gray-200 bg-gray-100 dark:bg-gray-800">
                      <div className="flex justify-end gap-4">
                        <button
                          onClick={() => setShowPopup(false)}
                          className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
                        >
                          <AiOutlineClose className="w-5 h-5" />
                          Close Overview
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        )}
        {/* Enhanced Search Section */}
        {!patient && (
          <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-700 p-2.5 rounded-lg text-white shadow-sm">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Patient Lookup
                </h3>
                <p className="text-sm text-gray-600">
                  Search existing patient records by mobile number
                </p>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit(onSearch)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <input
                    {...registerSearch("mobile")}
                    placeholder="0300 1234567"
                    className="w-full rounded-xl border-2 border-gray-200 bg-white p-3.5 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="self-stretch px-8 bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:bg-blue-800 transition-colors flex items-center justify-center"
                  >
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <span className="animate-spin">🌀</span> Searching...
                      </div>
                    ) : (
                      "Find Patient"
                    )}
                  </button>
                </div>
              </div>

              {searchErrors.mobile && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
                  <svg
                    className="w-5 h-5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="text-sm">{searchErrors.mobile.message}</span>
                </div>
              )}
            </form>
          </div>
        )}
        {patient ? (
          <div className="space-y-8" id="consultation-content">
            {/* vitals signs section */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-4">
                <div className="bg-blue-700 p-2.5 rounded-lg text-white shadow-sm">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Vital Signs
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enter patient's current vital measurements
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Blood Pressure */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    BP (mmHg)
                  </label>
                  <input
                    type="text"
                    value={vitalSigns.bloodPressure}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        bloodPressure: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
                    placeholder="120/80"
                    pattern="\d{2,3}/\d{2,3}"
                    required
                  />
                </div>

                {/* Pulse Rate */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Pulse (bpm)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={vitalSigns.pulseRate}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        pulseRate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
                    placeholder="72"
                    required
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="45"
                    value={vitalSigns.temperature}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        temperature: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
                    placeholder="36.6"
                    required
                  />
                </div>

                {/* SpO2 */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={vitalSigns.spo2}
                    onChange={(e) =>
                      setVitalSigns({ ...vitalSigns, spo2: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
                    placeholder="98"
                    required
                  />
                </div>

                {/* NIHSS Score */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    NIHSS
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="42"
                    value={vitalSigns.nihss}
                    onChange={(e) =>
                      setVitalSigns({ ...vitalSigns, nihss: e.target.value })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all placeholder-gray-400"
                    placeholder="0"
                    required
                  />
                </div>
                {/* Fall Assessment */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">
                    Fall Assessment
                  </label>
                  <select
                    value={vitalSigns.fall_assessment}
                    onChange={(e) =>
                      setVitalSigns({
                        ...vitalSigns,
                        fall_assessment: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-500 transition-all text-gray-700"
                    required
                  >
                    <option value="Done">Done</option>
                    <option value="Not Done">Not Done</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Symptoms Section */}
            {/* <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-4">
                <div className="bg-orange-700 p-2.5 rounded-lg text-white shadow-sm">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Symptom Analysis
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select observed symptoms or add new ones
                  </p>
                </div>
              </div>

              <CreatableSelect
                isMulti
                options={symptoms}
                value={selectedSymptoms}
                onChange={setSelectedSymptoms}
                placeholder="Select or type symptoms..."
                classNamePrefix="react-select"
                isClearable
                onCreateOption={handleCreateSymptom}
                isLoading={isFetchingSymptoms}
                formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                styles={{
                  control: (base) => ({
                    ...base,
                    border: "2px solid #e5e7eb",
                    borderRadius: "0.75rem",
                    padding: "8px 12px",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#3b82f6" },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#eff6ff",
                    borderRadius: "6px",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "#1d4ed8",
                    fontWeight: "500",
                  }),
                }}
              />
            </div> */}

            <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="bg-orange-600 p-3 rounded-xl text-white shadow-md hover:scale-105 transition-transform duration-200">
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                    Symptom Analysis
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium">
                    Select or create observed symptoms
                  </p>
                </div>
              </div>

              <CreatableSelect
                isMulti
                options={symptoms}
                value={selectedSymptoms}
                onChange={setSelectedSymptoms}
                placeholder="Search or type symptoms..."
                classNamePrefix="react-select"
                isClearable
                onCreateOption={handleCreateSymptom}
                isLoading={isFetchingSymptoms}
                formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                styles={{
                  control: (base) => ({
                    ...base,
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                    "&:hover": { borderColor: "#3b82f6" },
                    "&:focus-within": {
                      borderColor: "#3b82f6",
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.2)",
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#eff6ff",
                    borderRadius: "8px",
                    padding: "2px 8px",
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "#1d4ed8",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                  }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#1d4ed8",
                    ":hover": {
                      backgroundColor: "#bfdbfe",
                      borderRadius: "6px",
                    },
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    marginTop: "8px",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? "#f0f9ff" : "white",
                    color: state.isFocused ? "#0369a1" : "#1f2937",
                    fontWeight: state.isFocused ? "500" : "400",
                    ":active": {
                      backgroundColor: "#e0f2fe",
                    },
                  }),
                  placeholder: (base) => ({
                    ...base,
                    color: "#9ca3af",
                    fontSize: "0.875rem",
                  }),
                }}
              />
            </div>

            {/* Neurological Examination Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="mb-5 text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-purple-600 text-white p-2 rounded-lg">
                  🧠
                </span>
                Neurological Examination
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {fields.map((field) => (
                  <NeuroExamSelect
                    key={field}
                    field={field}
                    value={neuroExamData[field]}
                    onChange={handleFieldChange}
                  />
                ))}

                {/* checkboxes */}
                <div></div>
                <div className="my-3 group">
                  <label
                    htmlFor="pain_sensation"
                    className="flex items-center gap-3 cursor-pointer select-none
              px-4 py-3 rounded-lg transition-all duration-200
              hover:bg-blue-50 dark:hover:bg-blue-900/20
              border border-transparent hover:border-blue-100
              dark:hover:border-blue-900/30"
                  >
                    <input
                      id="pain_sensation"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 
                text-blue-600 focus:ring-2 focus:ring-blue-500 
                focus:ring-offset-2 cursor-pointer
                dark:border-gray-600 dark:bg-gray-800
                dark:checked:bg-blue-500 dark:checked:border-blue-500
                transition-colors duration-200"
                      checked={neuroExamData.pain_sensation || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          pain_sensation: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Pain Sensation
                      <span
                        className="block text-sm font-normal text-gray-500 
                      dark:text-gray-400 mt-1"
                      >
                        Assess response to sharp/dull stimuli
                      </span>
                    </span>

                    {/* Interactive status indicator */}
                    <span
                      className="w-3 h-3 rounded-full bg-blue-200 
                   group-hover:bg-blue-300 ml-auto
                   dark:bg-blue-900/40 
                   dark:group-hover:bg-blue-900/60
                   transition-colors duration-200"
                    ></span>
                  </label>
                </div>

                <div className="my-3 group">
                  <label
                    htmlFor="vibration_sense" // Fixed: Match input id
                    className="flex items-center gap-3 cursor-pointer select-none
              px-3 py-2 rounded-lg transition-all duration-200
              hover:bg-blue-50 dark:hover:bg-blue-900/20
              border border-transparent hover:border-blue-100
              dark:hover:border-blue-900/30"
                  >
                    <input
                      id="vibration_sense"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 
                text-blue-600 focus:ring-2 focus:ring-blue-500 
                focus:ring-offset-2 cursor-pointer
                dark:border-gray-600 dark:bg-gray-800
                dark:checked:bg-blue-500 dark:checked:border-blue-500
                transition-colors duration-200"
                      checked={neuroExamData.vibration_sense || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          vibration_sense: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Vibration Sensation
                      <span
                        className="block text-xs font-normal text-gray-500 
                      dark:text-gray-400 mt-1"
                      >
                        Test with tuning fork
                      </span>
                    </span>

                    {/* Optional status indicator */}
                    <span
                      className="w-2 h-2 rounded-full bg-blue-200 
                   group-hover:bg-blue-300 ml-2
                   dark:bg-blue-900/40 
                   dark:group-hover:bg-blue-900/60
                   transition-colors duration-200"
                    ></span>
                  </label>
                </div>
                {/* additional check boxes */}

                {/* Proprioception */}
                <div className="my-3 group">
                  <label
                    htmlFor="proprioception"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="proprioception"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.proprioception || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          proprioception: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Proprioception
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Joint position sense assessment
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Temperature Sensation */}
                <div className="my-3 group">
                  <label
                    htmlFor="temperature_sensation"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="temperature_sensation"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.temperature_sensation || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          temperature_sensation: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Temperature Sensation
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Test with warm/cold objects
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Brudzinski Sign */}
                <div className="my-3 group">
                  <label
                    htmlFor="brudzinski_sign"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="brudzinski_sign"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.brudzinski_sign || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          brudzinski_sign: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Brudzinski Sign
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Neck flexion causing hip flexion
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Kernig Sign */}
                <div className="my-3 group">
                  <label
                    htmlFor="kernig_sign"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="kernig_sign"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.kernig_sign || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          kernig_sign: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Kernig Sign
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Hip flexion with knee extension resistance
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Facial Sensation */}
                <div className="my-3 group">
                  <label
                    htmlFor="facial_sensation"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="facial_sensation"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.facial_sensation || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          facial_sensation: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Facial Sensation
                      <span className="block text-sm font-normal text-gray-500 dark:text-gray-400 mt-1">
                        Test all three trigeminal branches
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>

                {/* Swallowing Function */}
                <div className="my-3 group">
                  <label
                    htmlFor="swallowing_function"
                    className="flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30"
                  >
                    <input
                      id="swallowing_function"
                      type="checkbox"
                      className="w-6 h-6 rounded-lg border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer dark:border-gray-600 dark:bg-gray-800 dark:checked:bg-blue-500 dark:checked:border-blue-500 transition-colors duration-200"
                      checked={neuroExamData.swallowing_function || false}
                      onChange={(e) =>
                        setNeuroExamData({
                          ...neuroExamData,
                          swallowing_function: e.target.checked,
                        })
                      }
                    />
                    <span className="text-base font-semibold text-black hover:text-gray-800 transition-colors duration-200">
                      Swallowing Function
                      <span className="block text-sm font-normal text-black dark:text-gray-400 mt-1">
                        Assess cranial nerves IX and X
                      </span>
                    </span>
                    <span className="w-3 h-3 rounded-full bg-blue-200 group-hover:bg-blue-300 ml-auto dark:bg-blue-900/40 dark:group-hover:bg-blue-900/60 transition-colors duration-200"></span>
                  </label>
                </div>
                {/* Diagnosis & Treatment */}

                {/* Additional Fields */}
                <div className="flex flex-col md:flex-col gap-4 md:col-span-4 w-full">
                  <h4 className="font-semibold text-gray-800 border-l-4 border-purple-500 pl-3 py-1.5">
                    Additional Observations
                  </h4>
                  <div className="flex gap-6 md:col-span-4 w-full">
                    {/* MMSE Score */}
                    <div className="w-full space-y-2">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span>MMSE Score</span>
                        <span className="text-xs text-gray-500">
                          (Mini-Mental State Examination)
                        </span>
                      </label>
                      <div className="relative flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={neuroExamData.mmse_score?.split("/")[0] || ""}
                          onChange={(e) => {
                            const value = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 2);
                            setNeuroExamData((prev) => ({
                              ...prev,
                              mmse_score: value ? `${value}/30` : "",
                            }));
                          }}
                          className="w-full px-4 py-3 text-base font-medium border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 focus:outline-none bg-white placeholder-gray-400"
                          placeholder="e.g., 24"
                        />
                        <span className="absolute right-3 text-gray-500 font-medium">
                          /30
                        </span>
                      </div>
                      {neuroExamData.mmse_score &&
                        parseInt(neuroExamData.mmse_score.split("/")[0]) >
                          30 && (
                          <p className="text-red-600 text-sm font-medium mt-1 bg-red-50 px-2 py-1 rounded-md">
                            Score must not exceed 30
                          </p>
                        )}
                    </div>

                    {/* GCS Score */}
                    <div className="w-full space-y-2">
                      <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span>GCS Score</span>
                        <span className="text-xs text-gray-500">
                          (Glasgow Coma Scale)
                        </span>
                      </label>

                      <div className="relative flex items-center gap-2 w-full">
                        <input
                          type="number"
                          min={1}
                          max={15}
                          value={neuroExamData.gcs_score?.split("/")[0] || ""}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (value >= 1 && value <= 15) {
                              setNeuroExamData((prev) => ({
                                ...prev,
                                gcs_score: `${value}/15`,
                              }));
                            } else if (e.target.value === "") {
                              setNeuroExamData((prev) => ({
                                ...prev,
                                gcs_score: "",
                              }));
                            }
                          }}
                          className="w-full pr-10 px-4 py-3 text-base font-medium border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 focus:outline-none bg-white placeholder-gray-400"
                          placeholder="1 to 15"
                        />
                        <span className="absolute right-3 text-gray-500 font-medium">
                          /15
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 space-y-4">
                  <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                    Additional Examination
                  </h4>
                  <div className="w-full space-y-2">
                    <label className="text-sm font-semibold text-gray-800">
                      Treatment Plan
                    </label>
                    <textarea
                      value={neuroExamData.treatment_plan || ""}
                      onChange={(e) =>
                        setNeuroExamData((prev) => ({
                          ...prev,
                          treatment_plan: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-3 text-base font-medium border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-purple-300 focus:border-purple-500 focus:outline-none bg-white placeholder-gray-400"
                      placeholder="Enter treatment plan..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* test sections */}
            {/* <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-5 border-b border-gray-200 pb-4">
                <div className="bg-orange-900 p-2.5 rounded-lg text-white shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Add Tests
                  </h3>
                  <p className="text-sm text-gray-600">Prescribed Tests</p>
                </div>
              </div>

              <CreatableSelect
                isMulti
                options={tests.map((test) => ({
                  value: test.test_name,
                  label: test.test_name,
                }))}
                value={selectedTests.map((test) => ({
                  value: test,
                  label: test,
                }))}
                onChange={(newTests) =>
                  setSelectedTests(newTests.map((t) => t.value))
                }
                onCreateOption={(newTestName) => {
                  setSelectedTests([...selectedTests, newTestName]);
                }}
                placeholder="Type or select a test..."
                className="react-select-container"
                classNamePrefix="react-select"
              />
            </div> */}

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="bg-orange-600 p-3 rounded-xl text-white shadow-md hover:shadow-lg transition-shadow duration-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                    Add Diagnostic Tests
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 font-medium tracking-wide">
                    Select or create laboratory investigations
                  </p>
                </div>
              </div>

              <CreatableSelect
                isMulti
                options={tests.map((test) => ({
                  value: test.test_name,
                  label: test.test_name,
                }))}
                value={selectedTests.map((test) => ({
                  value: test,
                  label: test,
                }))}
                onChange={(newTests) =>
                  setSelectedTests(newTests.map((t) => t.value))
                }
                onCreateOption={(newTestName) => {
                  setSelectedTests([...selectedTests, newTestName]);
                }}
                placeholder="Search or create tests..."
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    padding: "8px 12px",
                    borderColor: "#e5e7eb",
                    boxShadow: "none",
                    "&:hover": {
                      borderColor: "#d1d5db",
                    },
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#fff7ed",
                    borderRadius: "8px",
                    padding: "2px 8px",
                  }),
                  multiValueLabel: (base) => ({
                    ...base,
                    color: "#ea580c",
                    fontWeight: "500",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? "#fff7ed" : "white",
                    color: state.isFocused ? "#ea580c" : "#1f2937",
                    fontWeight: state.isFocused ? "500" : "400",
                  }),
                }}
              />
            </div>

            {/* Enhanced Medicines Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-purple-600 p-2 rounded-lg text-white">
                  💊
                </div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Prescription Management
                </h3>
              </div>
              <div className="space-y-4">
                {selectedMedicines.map((med, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-5 gap-3">
                      {/* Medicine Selection */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Medicine
                        </label>
                        <CreatableSelect
                          isLoading={isCreating}
                          loadingMessage={() => "Creating medicine..."}
                          options={medicines}
                          value={
                            medicines.find(
                              (m) =>
                                m.value ===
                                selectedMedicines[index]?.medicine_id
                            ) || null
                          }
                          onCreateOption={async (inputValue) => {
                            const newId = await handleCreateMedicine(
                              inputValue
                            );
                            if (newId) {
                              setSelectedMedicines((prev) =>
                                prev.map((item, i) =>
                                  i === index
                                    ? { ...item, medicine_id: newId }
                                    : item
                                )
                              );
                            }
                          }}
                          onChange={(selectedOption) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      medicine_id: selectedOption.value,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* Frequency (Morning, Night) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Frequency
                        </label>
                        <Select
                          options={[
                            { value: "morning", label: "صبح (Morning)" },
                            { value: "afternoon", label: "دوپہر (Afternoon)" },
                            { value: "evening", label: "شام (Evening)" },
                            { value: "night", label: "رات (Night)" },
                            {
                              value: "morning_evening",
                              label: "صبح، شام (Morning & Evening)",
                            },
                            {
                              value: "morning_night",
                              label: "صبح، رات (Morning & Night)",
                            },
                            {
                              value: "afternoon_evening",
                              label: "دوپہر، شام (Afternoon & Evening)",
                            },
                            {
                              value: "afternoon_night",
                              label: "دوپہر، رات (Afternoon & Night)",
                            },
                            {
                              value: "morning_evening_night",
                              label: "صبح، شام، رات (Morning, Evening & Night)",
                            },
                            {
                              value: "morning_afternoon_evening",
                              label:
                                "صبح، دوپہر، شام (Morning, Afternoon & Evening)",
                            },
                            {
                              value: "morning_afternoon_night",
                              label:
                                "صبح، دوپہر، رات (Morning, Afternoon & Night)",
                            },
                            {
                              value: "afternoon_evening_night",
                              label:
                                "دوپہر، شام، رات (Afternoon, Evening & Night)",
                            },
                            {
                              value: "early_morning",
                              label: "صبح سویرے (Early Morning)",
                            },
                            {
                              value: "late_morning",
                              label: "دیر صبح (Late Morning)",
                            },
                            {
                              value: "late_afternoon",
                              label: "دیر دوپہر (Late Afternoon)",
                            },
                            { value: "sunset", label: "غروب آفتاب (Sunset)" },
                            { value: "midnight", label: "آدھی رات (Midnight)" },
                            {
                              value: "late_night",
                              label: "رات دیر گئے (Late Night)",
                            },
                            {
                              value: "morning_afternoon",
                              label: "صبح، دوپہر (Morning & Afternoon)",
                            },
                            {
                              value: "evening_night",
                              label: "شام، رات (Evening & Night)",
                            },
                            {
                              value: "early_morning_night",
                              label: "صبح سویرے، رات (Early Morning & Night)",
                            },
                            {
                              value: "morning_late_afternoon",
                              label:
                                "صبح، دیر دوپہر (Morning & Late Afternoon)",
                            },
                            {
                              value: "afternoon_sunset",
                              label: "دوپہر، غروب آفتاب (Afternoon & Sunset)",
                            },
                            { value: "all_day", label: "پورا دن (All Day)" },
                            {
                              value: "all_night",
                              label: "پوری رات (All Night)",
                            },
                            {
                              value: "24_hours",
                              label: "چوبیس گھنٹے (24 Hours)",
                            },
                          ]}
                          value={{
                            value: med.frequency_en,
                            label: med.frequency_urdu,
                          }}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      frequency_en: e.value,
                                      frequency_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* Dosage (1 pill, 2 pills) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Dosage
                        </label>
                        <Select
                          options={[
                            // Tablet Dosages (Fractions & Whole)
                            {
                              value: "0.25",
                              label: "ایک چوتھائی گولی (1/4 گولی)",
                            },
                            { value: "0.5", label: "آدھی گولی (1/2 گولی)" },
                            {
                              value: "0.75",
                              label: "تین چوتھائی گولی (3/4 گولی)",
                            },
                            { value: "1", label: "ایک گولی (1 گولی)" },
                            { value: "1.5", label: "ڈیڑھ گولی (1.5 گولی)" },
                            { value: "2", label: "دو گولیاں (2 گولیاں)" },
                            {
                              value: "2.5",
                              label: "ڈھائی گولیاں (2.5 گولیاں)",
                            },
                            { value: "3", label: "تین گولیاں (3 گولیاں)" },
                            {
                              value: "3.5",
                              label: "ساڑھے تین گولیاں (3.5 گولیاں)",
                            },
                            { value: "4", label: "چار گولیاں (4 گولیاں)" },
                            { value: "5", label: "پانچ گولیاں (5 گولیاں)" },
                            { value: "6", label: "چھ گولیاں (6 گولیاں)" },
                            { value: "7", label: "سات گولیاں (7 گولیاں)" },
                            { value: "8", label: "آٹھ گولیاں (8 گولیاں)" },
                            { value: "10", label: "دس گولیاں (10 گولیاں)" },

                            // Spoon Dosages
                            {
                              value: "half_spoon",
                              label: "آدھا چمچ (1/2 چمچ)",
                            },
                            { value: "one_spoon", label: "ایک چمچ (1 چمچ)" },
                            {
                              value: "one_and_half_spoon",
                              label: "ڈیڑھ چمچ (1.5 چمچ)",
                            },
                            { value: "two_spoons", label: "دو چمچ (2 چمچ)" },
                            { value: "three_spoons", label: "تین چمچ (3 چمچ)" },

                            // Liquid Dosages (Milliliters)
                            {
                              value: "2.5_ml",
                              label: "ڈھائی ملی لیٹر (2.5 ml)",
                            },
                            { value: "5_ml", label: "پانچ ملی لیٹر (5 ml)" },
                            {
                              value: "7.5_ml",
                              label: "ساڑھے سات ملی لیٹر (7.5 ml)",
                            },
                            { value: "10_ml", label: "دس ملی لیٹر (10 ml)" },
                            { value: "15_ml", label: "پندرہ ملی لیٹر (15 ml)" },
                            { value: "20_ml", label: "بیس ملی لیٹر (20 ml)" },
                            { value: "25_ml", label: "پچیس ملی لیٹر (25 ml)" },
                            { value: "30_ml", label: "تیس ملی لیٹر (30 ml)" },

                            // Droplet Dosages
                            {
                              value: "one_droplet",
                              label: "ایک قطرہ (1 قطرہ)",
                            },
                            {
                              value: "two_droplets",
                              label: "دو قطرے (2 قطرے)",
                            },
                            {
                              value: "three_droplets",
                              label: "تین قطرے (3 قطرے)",
                            },
                            {
                              value: "five_droplets",
                              label: "پانچ قطرے (5 قطرے)",
                            },
                            {
                              value: "ten_droplets",
                              label: "دس قطرے (10 قطرے)",
                            },

                            // Injection Dosages
                            {
                              value: "half_injection",
                              label: "آدھا ٹیکہ (1/2 ٹیکہ)",
                            },
                            {
                              value: "one_injection",
                              label: "ایک ٹیکہ (1 ٹیکہ)",
                            },
                            {
                              value: "two_injections",
                              label: "دو ٹیکے (2 ٹیکے)",
                            },
                            {
                              value: "three_injections",
                              label: "تین ٹیکے (3 ٹیکے)",
                            },

                            // Sachet Dosages
                            {
                              value: "half_sachet",
                              label: "آدھا ساشے (1/2 ساشے)",
                            },
                            { value: "one_sachet", label: "ایک ساشے (1 ساشے)" },
                            { value: "two_sachets", label: "دو ساشے (2 ساشے)" },
                            {
                              value: "three_sachets",
                              label: "تین ساشے (3 ساشے)",
                            },

                            // Special Cases
                            {
                              value: "as_needed",
                              label: "ضرورت کے مطابق (As Needed)",
                            },
                            {
                              value: "before_meal",
                              label: "کھانے سے پہلے (Before Meal)",
                            },
                            {
                              value: "after_meal",
                              label: "کھانے کے بعد (After Meal)",
                            },
                            {
                              value: "every_6_hours",
                              label: "ہر 6 گھنٹے بعد (Every 6 Hours)",
                            },
                            {
                              value: "every_8_hours",
                              label: "ہر 8 گھنٹے بعد (Every 8 Hours)",
                            },
                            {
                              value: "every_12_hours",
                              label: "ہر 12 گھنٹے بعد (Every 12 Hours)",
                            },
                            {
                              value: "once_a_day",
                              label: "دن میں ایک بار (Once a Day)",
                            },
                            {
                              value: "twice_a_day",
                              label: "دن میں دو بار (Twice a Day)",
                            },
                            {
                              value: "three_times_a_day",
                              label: "دن میں تین بار (Three Times a Day)",
                            },
                            {
                              value: "four_times_a_day",
                              label: "دن میں چار بار (Four Times a Day)",
                            },
                          ]}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          value={{
                            value: selectedMedicines[index]?.dosage_en || "1",
                            label:
                              selectedMedicines[index]?.dosage_urdu ||
                              "ایک گولی (1 گولی)",
                          }}
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      dosage_en: e.value,
                                      dosage_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* Duration (1 week, 2 weeks) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Duration
                        </label>
                        <Select
                          options={[
                            // Days (1-30)
                            { value: "1_day", label: "1 دن" },
                            { value: "2_days", label: "2 دن" },
                            { value: "3_days", label: "3 دن" },
                            { value: "4_days", label: "4 دن" },
                            { value: "5_days", label: "5 دن" },
                            { value: "6_days", label: "6 دن" },
                            { value: "7_days", label: "1 ہفتہ" },
                            { value: "8_days", label: "8 دن" },
                            { value: "9_days", label: "9 دن" },
                            { value: "10_days", label: "10 دن" },
                            { value: "11_days", label: "11 دن" },
                            { value: "12_days", label: "12 دن" },
                            { value: "13_days", label: "13 دن" },
                            { value: "14_days", label: "  2 ہفتے" },
                            { value: "15_days", label: "15 دن" },
                            { value: "20_days", label: "20 دن" },
                            { value: "25_days", label: "25 دن" },
                            { value: "30_days", label: " 1 مہینہ" },

                            // Weeks (1-12)
                            { value: "1_week", label: "1 ہفتہ" },
                            { value: "2_weeks", label: "2 ہفتے" },
                            { value: "3_weeks", label: "3 ہفتے" },
                            { value: "4_weeks", label: "4 ہفتے (1 مہینہ)" },
                            { value: "6_weeks", label: "6 ہفتے" },
                            { value: "8_weeks", label: "8 ہفتے (2 مہینے)" },
                            { value: "10_weeks", label: "10 ہفتے" },
                            { value: "12_weeks", label: "12 ہفتے (3 مہینے)" },

                            // Months (1-12)
                            { value: "1_month", label: "1 مہینہ" },
                            { value: "2_months", label: "2 مہینے" },
                            { value: "3_months", label: "3 مہینے" },
                            { value: "4_months", label: "4 مہینے" },
                            { value: "5_months", label: "5 مہینے" },
                            { value: "6_months", label: "6 مہینے (نصف سال)" },
                            { value: "9_months", label: "9 مہینے" },
                            { value: "12_months", label: "12 مہینے (1 سال)" },

                            // Special Cases
                            { value: "as_needed", label: "ضرورت کے مطابق" },
                            { value: "long_term", label: "طویل مدتی علاج" },
                            { value: "short_term", label: "مختصر مدتی علاج" },
                          ]}
                          value={{
                            value: med.duration_en,
                            label: med.duration_urdu,
                          }}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      duration_en: e.value,
                                      duration_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>

                      {/* Instruction (After meal, Before meal) */}
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600">
                          Instruction
                        </label>
                        <Select
                          options={[
                            // Meal-related timings
                            { value: "before_meal", label: "کھانے سے پہلے" },
                            { value: "with_meal", label: "کھانے کے ساتھ" },
                            { value: "after_meal", label: "کھانے کے بعد" },
                            { value: "empty_stomach", label: "خالی پیٹ" },
                            {
                              value: "before_breakfast",
                              label: "ناشتے سے پہلے",
                            },
                            { value: "after_breakfast", label: "ناشتے کے بعد" },
                            {
                              value: "before_lunch",
                              label: "دوپہر کے کھانے سے پہلے",
                            },
                            {
                              value: "after_lunch",
                              label: "دوپہر کے کھانے کے بعد",
                            },
                            {
                              value: "before_dinner",
                              label: "رات کے کھانے سے پہلے",
                            },
                            {
                              value: "after_dinner",
                              label: "رات کے کھانے کے بعد",
                            },
                            { value: "with_milk", label: "دودھ کے ساتھ" },
                            { value: "before_tea", label: "چائے سے پہلے" },
                            { value: "after_tea", label: "چائے کے بعد" },

                            // Special cases
                            {
                              value: "only_if_needed",
                              label: "ضرورت کے مطابق",
                            },
                            { value: "with_water", label: "پانی کے ساتھ" },
                            { value: "with_juice", label: "جوس کے ساتھ" },
                            { value: "with_yogurt", label: "دہی کے ساتھ" },
                            {
                              value: "with_fatty_foods",
                              label: "چکنائی والے کھانے کے ساتھ",
                            },
                            {
                              value: "without_dairy",
                              label: "ڈیری مصنوعات کے بغیر",
                            },
                            { value: "avoid_caffeine", label: "کیفین سے بچیں" },
                          ]}
                          value={{
                            value: med.instructions_en,
                            label: med.instructions_urdu,
                          }}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          onChange={(e) => {
                            setSelectedMedicines((prev) =>
                              prev.map((item, i) =>
                                i === index
                                  ? {
                                      ...item,
                                      instructions_en: e.value,
                                      instructions_urdu: e.label,
                                    }
                                  : item
                              )
                            );
                          }}
                          styles={customSelectStyles}
                        />
                      </div>
                    </div>

                    {/* Remove Medicine */}
                    <button
                      onClick={() => {
                        setSelectedMedicines((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-red-500 hover:text-red-700 mt-4"
                    >
                      <AiOutlineCloseCircle className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                {/* Add New Medicine */}
                <button
                  onClick={() =>
                    setSelectedMedicines((prev) => [
                      ...prev,
                      {
                        medicine_id: "",
                        form: "Tablet",
                        ...MEDICINE_DEFAULTS.Tablet,
                        dosage_en: MEDICINE_DEFAULTS.Tablet.dosage_en,
                        dosage_urdu: MEDICINE_DEFAULTS.Tablet.dosage_urdu,
                        frequency_en: MEDICINE_DEFAULTS.Tablet.frequency_en,
                        frequency_urdu: MEDICINE_DEFAULTS.Tablet.frequency_urdu,
                        duration_en: MEDICINE_DEFAULTS.Tablet.duration_en,
                        duration_urdu: MEDICINE_DEFAULTS.Tablet.duration_urdu,
                        instructions_en:
                          MEDICINE_DEFAULTS.Tablet.instructions_en,
                        instructions_urdu:
                          MEDICINE_DEFAULTS.Tablet.instructions_urdu,
                      },
                    ])
                  }
                  className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 p-4 transition-all"
                >
                  <AiOutlinePlus className="w-5 h-5" />
                  Add New Medication
                </button>
              </div>
            </div>
            <div className="md:col-span-4 space-y-4">
              <h4 className="font-medium text-gray-700 bg-gray-50 p-2 rounded-lg">
                Clinical Decisions
              </h4>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Diagnosis *
                </label>
                <textarea
                  value={neuroExamData.diagnosis || ""}
                  onChange={(e) =>
                    setNeuroExamData((prev) => ({
                      ...prev,
                      diagnosis: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border-2 border-gray-100 p-3 h-32"
                  required
                />
              </div>
            </div>
            {/* followup */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="bg-purple-600 text-white p-2 rounded-lg">
                  📅
                </span>
                Follow Up
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Please Select the Date of Followup
                  </label>
                  <select
                    value={selectedDuration}
                    onChange={(e) => {
                      const days = parseInt(e.target.value);
                      const date = new Date();
                      date.setDate(date.getDate() + days);
                      setFollowUpDate(date);
                      setSelectedDuration(days);
                    }}
                    className="w-full rounded-lg border-2 border-gray-100 p-3 urdu-font"
                    required
                  >
                    <option value="">مدت منتخب کریں</option>
                    <option value="10">10 دن بعد (10 Days)</option>
                    <option value="15">15 دن بعد (15 Days)</option>
                    <option value="30">ایک مہینہ بعد (1 Month)</option>
                    <option value="45">ڈیڑھ مہینہ بعد (1.5 Months)</option>
                    <option value="60">دو مہینے بعد (2 Months)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Instructions(Optional)
                  </label>
                  <textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-100 p-3 h-32 urdu-font"
                    placeholder="Write Instruction Here"
                  />
                </div>
              </div>

              {selectedDuration && (
                <div className="mt-4 text-right text-sm text-gray-600 urdu-font">
                  منتخب کردہ تاریخ:{" "}
                  {new Date(followUpDate).toLocaleDateString("ur-PK", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              )}
            </div>
            {/* Enhanced Final Button */}
            <button
              onClick={submitConsultation}
              className={`w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] flex items-center justify-center ${
                loading ? "opacity-75 cursor-not-allowed" : ""
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
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
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span className="inline-block mr-2">✅</span>
                  Finalize & Save Consultation
                </>
              )}
            </button>
            <div className="mt-6">
              <button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2 print:hidden"
                aria-label="Print prescription"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Print Prescription
              </button>
            </div>
          </div>
        ) : (
          showAddPatient && (
            <AddPatientForm
              searchedMobile={searchedMobile}
              onSuccess={handleNewPatientAdded}
            />
          )
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default PatientSearch;
