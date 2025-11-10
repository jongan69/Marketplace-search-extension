import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate } from "@fortawesome/free-solid-svg-icons";
import { useApp } from "../../../providers/app_provider";
import "./reloadButton.css";

export const ReloadButton = () => {
  const { extractListings } = useApp();

  return (
    <button
      className="reload-button"
      aria-label="Reload"
      onClick={() => extractListings()}
    >
      <FontAwesomeIcon icon={faRotate} className="i" />
    </button>
  );
};
