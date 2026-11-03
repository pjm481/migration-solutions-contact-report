import { Check, ChevronDown, Users } from "lucide-react";

const OwnerPicker = ({ owners, selectedIds, onChange, disabled }) => {
  const selected = new Set(selectedIds);
  const allSelected = owners.length > 0 && selected.size === owners.length;
  const label = allSelected
    ? `All owners (${owners.length})`
    : `${selected.size} of ${owners.length} owners`;

  const toggleOwner = (ownerId) => {
    const next = new Set(selected);
    if (next.has(ownerId)) next.delete(ownerId);
    else next.add(ownerId);
    onChange([...next]);
  };

  return (
    <details className="owner-picker">
      <summary
        className={`owner-picker__summary ${disabled ? "is-disabled" : ""}`}
        aria-disabled={disabled}
      >
        <span className="owner-picker__icon" aria-hidden="true">
          <Users size={18} />
        </span>
        <span>
          <span className="field-label">History owner</span>
          <span className="owner-picker__value">{label}</span>
        </span>
        <ChevronDown className="owner-picker__chevron" size={18} />
      </summary>
      {!disabled && (
        <div className="owner-picker__menu" role="group" aria-label="History owners">
          <button
            type="button"
            className="owner-picker__select-all"
            onClick={() => onChange(allSelected ? [] : owners.map((owner) => owner.id))}
          >
            {allSelected ? "Clear all" : "Select all"}
          </button>
          <div className="owner-picker__options">
            {owners.map((owner) => (
              <label className="owner-option" key={owner.id}>
                <input
                  type="checkbox"
                  checked={selected.has(owner.id)}
                  onChange={() => toggleOwner(owner.id)}
                />
                <span className="owner-option__check" aria-hidden="true">
                  {selected.has(owner.id) && <Check size={13} strokeWidth={3} />}
                </span>
                <span>{owner.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </details>
  );
};

export default OwnerPicker;
