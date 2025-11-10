import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import "./searchInput.css";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = "Search listings...",
}: SearchInputProps) => {
  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="search-input-container">
      <FontAwesomeIcon icon={faSearch} className="search-icon" />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search listings"
      />
      {value && (
        <button
          className="clear-button"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      )}
    </div>
  );
};
