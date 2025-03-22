import React, { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import axios from "axios";

const fieldLabelMap = {
  motor_function: "Motor Functions",
  muscle_tone: "Muscle Tone",
  muscle_strength: "Muscle Strength",
  straight_leg_raise_test: "SLR",
  deep_tendon_reflexes: "Reflexes",
  plantar_reflex: "Plantar",
  cranial_nerves: "Cranial Nerves",
  gait: "Gait & Balance",
  pupillary_reaction: "Pupillary Reaction",
  speech_assessment: "Speech Assessment",
  gait_assessment: "Gait Assessment",
  coordination: "Coordination",
  sensory_examination: "Sensory Examination",
  mental_status: "Mental Status",
  cerebellar_function: "Cerebellar Function",
  muscle_wasting: "Muscle Wasting",
  abnormal_movements: "Abnormal Movements",
  romberg_test: "Romberg Test",
  nystagmus: "Nystagmus",
  fundoscopy: "Fundoscopy",
};

const fieldColors = {
  motor_function: "#3b82f6", // Blue
  muscle_tone: "#10b981", // Emerald
  muscle_strength: "#f59e0b", // Amber
  straight_leg_raise_test: "#8b5cf6", // Violet
  deep_tendon_reflexes: "#ef4444", // Red
  plantar_reflex: "#ec4899", // Pink
  cranial_nerves: "#14b8a6", // Teal
  gait: "#f97316", // Orange
  pupillary_reaction: "#06b6d4", // Cyan
  speech_assessment: "#84cc16", // Lime
  coordination: "#a855f7", // Purple
  sensory_examination: "#22c55e", // Green
  mental_status: "#eab308", // Yellow
  cerebellar_function: "#0ea5e9", // Sky Blue
  nystagmus: "#d946ef", // Fuchsia
  fundoscopy: "#64748b", // Slate
  // Default color for unspecified fields
  default: "#3b82f6",
};

const NeuroExamSelect = ({ field, value, onChange }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fieldColor = fieldColors[field] || fieldColors.default;

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const { data } = await axios.get(
          `https://patient-management-backend-nine.vercel.app/api/neuro-options/${field}`
        );
        setOptions(
          data.map((item) => ({ label: item.value, value: item.value }))
        );
      } catch (err) {
        console.error("Error loading options:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [field]);

  const handleChange = (selectedOption) => {
    onChange(field, selectedOption?.value || "");
  };

  const handleCreate = async (inputValue) => {
    setIsCreating(true);
    try {
      const { data } = await axios.post(
        `https://patient-management-backend-nine.vercel.app/api/neuro-options/${field}`,
        { value: inputValue }
      );

      const newOption = { label: data.data.value, value: data.data.value };
      setOptions((prev) => [...prev, newOption]);
      onChange(field, newOption.value);
    } catch (error) {
      console.error("Error adding custom option:", error);
      alert("Failed to add custom option. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mb-6">
      <label className="block mb-2 text-sm  text-gray-700 font-[500]">
        {fieldLabelMap[field] || field.replace(/_/g, " ")}
      </label>
      <CreatableSelect
        isClearable
        isLoading={loading || isCreating}
        options={options}
        value={value ? { label: value, value } : null}
        onChange={handleChange}
        onCreateOption={handleCreate}
        placeholder="Select or create option..."
        noOptionsMessage={() => "Type to create new option"}
        loadingMessage={() => (
          <div className="flex items-center gap-2">
            <div className="bouncing-loader">
              {[...Array(3)].map((_, i) => (
                <span
                  key={i}
                  style={{ backgroundColor: fieldColor }}
                  className="h-2 w-2 rounded-full animate-bounce"
                />
              ))}
            </div>
            <span className="text-gray-500">Loading options...</span>
          </div>
        )}
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: "0.75rem",
            padding: "8px 12px",
            borderWidth: "2px",
            borderColor: "#e5e7eb",
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "#9ca3af",
              boxShadow: `0 1px 3px ${fieldColor}20`,
            },
            "&:focus-within": {
              borderColor: fieldColor,
              boxShadow: `0 0 0 3px ${fieldColor}20`,
            },
          }),
          indicatorSeparator: (base) => ({
            ...base,
            backgroundColor: "#e5e7eb",
          }),
          dropdownIndicator: (base) => ({
            ...base,
            color: "#6b7280",
            "&:hover": { color: "#374151" },
          }),
          option: (base, { isFocused }) => ({
            ...base,
            backgroundColor: isFocused ? `${fieldColor}10` : "white",
            color: isFocused ? fieldColor : "#1f2937",
            fontWeight: isFocused ? "500" : "400",
            ":active": {
              backgroundColor: `${fieldColor}20`,
            },
          }),
          menu: (base) => ({
            ...base,
            borderRadius: "0.75rem",
            border: "2px solid #f3f4f6",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            marginTop: "8px",
          }),
          singleValue: (base) => ({
            ...base,
            color: fieldColor,
            fontWeight: "500",
          }),
          placeholder: (base) => ({
            ...base,
            color: "#9ca3af",
            fontSize: "0.875rem",
          }),
        }}
        components={{
          LoadingIndicator: () => (
            <div
              className="animate-spin h-4 w-4 border-2 border-current rounded-full mr-2"
              style={{
                borderTopColor: "transparent",
                color: fieldColor,
              }}
            />
          ),
        }}
        aria-label={`Select ${fieldLabelMap[field]} option`}
        aria-describedby={`${field}-help`}
      />
    </div>
  );
};

export default NeuroExamSelect;
