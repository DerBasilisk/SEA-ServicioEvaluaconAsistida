// src/components/ui/CustomSelect.jsx
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const CUSTOM_SELECT_CSS = `
  .custom-select-container {
    position: relative;
    width: 100%;
  }

  .custom-select-trigger {
    width: 100%;
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1rem;
    padding: 0.7rem 1rem;
    padding-right: 2.5rem;
    color: var(--text-primary);
    font-family: 'Nunito', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .custom-select-trigger:hover {
    border-color: var(--text-accent);
    background: color-mix(in srgb, var(--text-accent) 4%, var(--card-bg));
  }

  .custom-select-trigger.open {
    border-color: var(--text-accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--text-accent) 20%, transparent);
  }

  .custom-select-trigger.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .custom-select-value {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .custom-select-placeholder {
    color: var(--text-muted);
  }

  .custom-select-icon {
    flex-shrink: 0;
    transition: transform 0.2s ease;
    color: var(--text-secondary);
  }

  .custom-select-icon.open {
    transform: rotate(180deg);
  }

  .custom-select-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: var(--card-bg);
    border: 1.5px solid var(--glass-border);
    border-radius: 1rem;
    max-height: 280px;
    overflow-y: auto;
    z-index: 50;
    box-shadow: 0 12px 32px var(--glass-shadow);
    backdrop-filter: blur(16px);
    animation: dropdownFadeIn 0.15s ease;
  }

  @keyframes dropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .custom-select-option {
    padding: 0.7rem 1rem;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .custom-select-option:hover {
    background: color-mix(in srgb, var(--text-accent) 8%, transparent);
  }

  .custom-select-option.selected {
    background: color-mix(in srgb, var(--text-accent) 12%, transparent);
    color: var(--text-accent);
  }

  .custom-select-option-check {
    flex-shrink: 0;
    color: var(--text-accent);
  }

  .custom-select-empty {
    padding: 1rem;
    text-align: center;
    color: var(--text-muted);
    font-size: 0.8rem;
  }

  /* Scrollbar personalizado */
  .custom-select-dropdown::-webkit-scrollbar {
    width: 6px;
  }

  .custom-select-dropdown::-webkit-scrollbar-track {
    background: var(--glass-bg);
    border-radius: 3px;
  }

  .custom-select-dropdown::-webkit-scrollbar-thumb {
    background: var(--text-muted);
    border-radius: 3px;
  }

  .custom-select-dropdown::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
  }
`;

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  disabled = false,
  className = "",
  getOptionLabel = (opt) => opt.name || opt.label || String(opt),
  getOptionValue = (opt) => opt.id || opt.value || opt._id || opt,
  emptyMessage = "No hay opciones disponibles"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const selectedOption = options?.find(opt => String(getOptionValue(opt)) === String(value));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(getOptionValue(option));
    setIsOpen(false);
    // Feedback táctil opcional
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(20);
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={containerRef} className={`custom-select-container ${className}`}>
      <style>{CUSTOM_SELECT_CSS}</style>

      <div
        ref={triggerRef}
        className={`custom-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={toggleDropdown}
      >
        <span className={`custom-select-value ${!selectedOption ? 'custom-select-placeholder' : ''}`}>
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>
        <ChevronDown size={16} className={`custom-select-icon ${isOpen ? 'open' : ''}`} />
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          {(!options || options.length === 0) ? (
            <div className="custom-select-empty">{emptyMessage}</div>
          ) : (
            options.map((option, index) => {
              const isSelected = String(getOptionValue(option)) === String(value);
              return (
                <div
                  key={getOptionValue(option) || index}
                  className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  <span className="truncate">{getOptionLabel(option)}</span>
                  {isSelected && <Check size={16} className="custom-select-option-check" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}