import "./modalPopup.css";
import { useModal } from "../providers/modalContext";
import { useApp } from "../../../providers/app_provider";
import { Listing } from "../../../../domain/entities/listing";

interface ConfirmProps {
  listingsNum: number;
  listings: Listing[];
}

const SaveConfirm = ({ listingsNum, listings }: ConfirmProps) => {
  const { saveListing, setSelectedListings, extractListings } = useApp();
  const { setModal } = useModal();

  const saveListings = async () => {
    try {
      setModal({ action: "save", type: "pending" });
      
      for (const listing of listings) {
        await saveListing(listing);
      }
      
      // Clear selections
      setSelectedListings({});
      
      setModal({ action: "save", type: "success" });
      
      setTimeout(() => {
        extractListings();
      }, 1000);
    } catch {
      setModal({ action: "save", type: "error" });
    }
  };

  return (
    <>
      <p>
        Are you sure you want to <b>save {listingsNum} listing(s)</b> to your watchlist?
      </p>
      <button className="primary" onClick={saveListings}>
        Confirm
      </button>
    </>
  );
};

const SavePending = () => {
  return (
    <>
      <p>Saving listings...</p>
      <div style={{ height: "5px" }}></div>
      <div className="loader"></div>
    </>
  );
};

const SaveSuccess = () => {
  return (
    <>
      <p>✅ Success!</p>
      <p>Selected listings have been saved to your watchlist.</p>
    </>
  );
};

const SaveError = () => {
  return (
    <>
      <p>❌ Error!</p>
      <p>There was an error saving the selected listings.</p>
    </>
  );
};

const NoListing = () => {
  const { setModal } = useModal();
  return (
    <>
      <p>Oops!</p>
      <p>You haven't selected a listing yet.</p>
      <div style={{ height: "20px" }}></div>
      <button className="primary" onClick={() => setModal(null)}>
        Go back
      </button>
    </>
  );
};

export const ModalPopup = () => {
  const { modal, setModal } = useModal();
  if (!modal) return null;

  const { action, type, extras } = modal;
  const id: string = action ? `${action}-${type}-modal` : `${type}-modal`;

  const handleBackgroundClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setModal(null);
    }
  };

  const getChild = (): React.ReactNode => {
    switch (true) {
      case action === "save" && type === "confirm":
        return (
          <SaveConfirm
            listingsNum={extras!.listingsNum}
            listings={extras!.listings}
          />
        );
      case action === "save" && type === "pending":
        return <SavePending />;
      case action === "save" && type === "success":
        return <SaveSuccess />;
      case action === "save" && type === "error":
        return <SaveError />;
      case type === "no-listing":
        return <NoListing />;
      default:
        return <></>;
    }
  };

  return (
    <div
      id={id}
      className="modal"
      style={{ display: "block" }}
      onClick={handleBackgroundClick}
    >
      <div className="modal-content">{getChild()}</div>
    </div>
  );
};
