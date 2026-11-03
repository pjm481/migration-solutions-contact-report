import { Check, ChevronDown } from "lucide-react";

const MultiSelectPicker = ({
  label,
  pluralLabel,
  options,
  selectedIds,
  onChange,
  disabled = false,
  icon: Icon,
}) => {
  const selected = new Set(selectedIds);
  const allSelected = options.length > 0 && selected.size === options.length;
  const valueLabel =
    allSelected && options.length === 1
      ? options[0].name
      : allSelected
        ? `All ${pluralLabel} (${options.length})`
        : `${selected.size} of ${options.length} ${pluralLabel}`;

  const toggleOption = (optionId) => {
    const next = new Set(selected);
    if (next.has(optionId)) next.delete(optionId);
    else next.add(optionId);
    onChange(options.filter((option) => next.has(option.id)).map((option) => option.id));
  };

  return (
    <details className="multi-picker">
      <summary
        className={`multi-picker__summary ${disabled ? "is-disabled" : ""}`}
        aria-disabled={disabled}
        onClick={(event) => disabled && event.preventDefault()}
      >
        <span className="multi-picker__icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <span>
          <span className="field-label">{label}</span>
          <span className="multi-picker__value">{valueLabel}</span>
        </span>
        <ChevronDown className="multi-picker__chevron" size={18} />
      </summary>
      {!disabled && (
        <div className="multi-picker__menu" role="group" aria-label={label}>
          <button
            type="button"
            className="multi-picker__select-all"
            onClick={() => onChange(allSelected ? [] : options.map((option) => option.id))}
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
          <div className="multi-picker__options">
            {options.map((option) => (
              <label className="multi-option" key={option.id}>
                <input
                  type="checkbox"
                  checked={selected.has(option.id)}
                  onChange={() => toggleOption(option.id)}
                />
                <span className="multi-option__check" aria-hidden="true">
                  {selected.has(option.id) && <Check size={13} strokeWidth={3} />}
                </span>
                <span>{option.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </details>
  );
};

export default MultiSelectPicker;
