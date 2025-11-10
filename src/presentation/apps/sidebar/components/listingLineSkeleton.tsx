import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ListingLineSkeleton = () => {
  return (
    <div className="listing-line listing-line-skeleton">
      <div className="begin">
        <div style={{ marginRight: "18px" }}></div>
        <Skeleton width={60} height={60} style={{ marginRight: "10px" }} />
        <div className="listing-details">
          <Skeleton width={150} height={12} />
          <Skeleton width={80} height={10} style={{ marginTop: "5px" }} />
          <Skeleton width={100} height={8} style={{ marginTop: "5px" }} />
        </div>
      </div>
    </div>
  );
};

export default ListingLineSkeleton;

