// javascript
import React, { forwardRef } from "react";
import PropTypes from "prop-types";

const SearchBar = forwardRef(function SearchBar(
  {
    value,
    onChange,
    onSubmit,
    placeholder = "Type a message...",
    ariaLabel,
    disabled = false,
    maxLength,
    autoFocus = false,
    showClear = true,
    multiline = false,
    className = "",
    inputProps = {},
  },
  ref
) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !multiline) {
      e.preventDefault();
      if (onSubmit) onSubmit();
    }
  };

  const handleClear = () => {
    if (disabled) return;
    onChange("");
    // Optionally focus back the input when cleared
    if (ref && typeof ref !== "function" && ref?.current) {
      ref.current.focus();
    }
  };

  const InputComponent = multiline ? "textarea" : "input";

  return (
    <div className={`search-bar-container ${className}`} aria-live="polite">
      <InputComponent
        ref={ref}
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        maxLength={maxLength}
        autoFocus={autoFocus}
        rows={multiline ? 3 : undefined}
        {...inputProps}
      />
      {showClear && !disabled && value && value.length > 0 && (
        <button
          type="button"
          className="search-clear-btn"
          onClick={handleClear}
          aria-label="Clear input"
        >
          ✖
        </button>
      )}
    </div>
  );
});

SearchBar.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  placeholder: PropTypes.string,
  ariaLabel: PropTypes.string,
  disabled: PropTypes.bool,
  maxLength: PropTypes.number,
  autoFocus: PropTypes.bool,
  showClear: PropTypes.bool,
  multiline: PropTypes.bool,
  className: PropTypes.string,
  inputProps: PropTypes.object,
};

export default React.memo(SearchBar);
