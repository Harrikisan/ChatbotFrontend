// javascript
import React, { useId } from "react";
import PropTypes from "prop-types";

/*
  PersonaSelector
  Props:
    - roles: array of strings (roles)
    - selectedRole: current role string
    - onChange: function(newRole)
    - label: optional label text
*/
function PersonaSelector({ roles = [], selectedRole, onChange, label = "Persona" }) {
  const generatedId = useId();
  const selectId = `persona-select-${generatedId}`;

  // Show first letter of role in the badge (can be replaced with icons)
  const badgeText = selectedRole ? String(selectedRole).charAt(0).toUpperCase() : "?";

  return (
    <div className="persona-select-wrapper">
      <label htmlFor={selectId} className="persona-label">
        {label}
      </label>

      <div className="persona-select-row">
        <div className="role-badge" aria-hidden>
          {badgeText}
        </div>

        <div className="persona-select-container">
          <select
            id={selectId}
            className="persona-select"
            value={selectedRole}
            onChange={(e) => onChange && onChange(e.target.value)}
            aria-label={label}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

PersonaSelector.propTypes = {
  roles: PropTypes.arrayOf(PropTypes.string),
  selectedRole: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
};

export default React.memo(PersonaSelector);
