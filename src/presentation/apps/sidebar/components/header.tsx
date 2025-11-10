import { faStore } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./header.css";
import { useEffect, useState } from "react";
import { useApp } from "../../../providers/app_provider";

export function MarketplaceHeader() {
  const { getMarketplace } = useApp();
  const [marketplace, setMarketplace] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const mp = await getMarketplace();
      setMarketplace(mp);
    })();
  }, [getMarketplace]);

  return (
    <div className="marketplace-header">
      <div className="header-icon">
        <FontAwesomeIcon icon={faStore} className="i" size="xs" />
      </div>
      {marketplace || "Marketplace Search"}
    </div>
  );
}
