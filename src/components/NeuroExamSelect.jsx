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
  

const NeuroExamSelect = ({ field, value, onChange }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const { data } = await axios.get(
          `https://patient-management-backend-nine.vercel.app/api/neuro-options/${field}`
        );
        setOptions(data.map(item => ({ label: item.value, value: item.value })));
      } catch (err) {
        console.error("Error loading options:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [field]);

  const handleChange = selectedOption => {
    onChange(field, selectedOption?.value || "");
  };

  const handleCreate = async inputValue => {
    setIsCreating(true);
    try {
      const { data } = await axios.post(
        `https://patient-management-backend-nine.vercel.app/api/neuro-options/${field}`,
        { value: inputValue }
      );

      const newOption = { label: data.data.value, value: data.data.value };
      setOptions(prev => [...prev, newOption]);
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
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="text-gray-500">Loading options...</span>
            </div>
          )}
        styles={{
          control: (base) => ({
            ...base,
            borderRadius: "8px",
            padding: "4px 8px",
            borderColor: "#e5e7eb",
            "&:hover": { borderColor: "#9ca3af" },
            "&:focus-within": {
              borderColor: "#3b82f6",
              boxShadow: "0 0 0 1px #3b82f6"
            }
          }),
          loadingIndicator: (base) => ({
            ...base,
            padding: '0 8px',
            display: 'flex',  // Add this
            alignItems: 'center' // Add this
          }),
          option: (base, { isFocused }) => ({
            ...base,
            backgroundColor: isFocused ? "#f3f4f6" : "white",
            color: "#1f2937",
            "&:active": { backgroundColor: "#e5e7eb" }
          }),
          menu: base => ({
            ...base,
            borderRadius: "8px",
            marginTop: "4px",
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
          })
        }}
        components={{
            LoadingIndicator: () => (
              <div className="animate-spin h-4 w-4 border-2 border-t-blue-500 border-gray-300 rounded-full mr-2" />
            )
          }}
        aria-label={`Select ${fieldLabelMap[field]} option`}
        aria-describedby={`${field}-help`}
      />
    </div>
  );
};

export default NeuroExamSelect;