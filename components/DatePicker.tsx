"use client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function CustomDatePicker({
  selected,
  onChange,
  disabled,
}: {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}) {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="yyyy-MM-dd"
      disabled={disabled}
      className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
      placeholderText="Select date"
    />
  );
}
