import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./datasetCard.css";
interface props {
  name: string;
  likes: number;
  updateTime: Date;
  downloads: number;
  id: number;
  description: string;
  selected: boolean;
  selectDataset: (n: boolean) => void;
}
function numberFormatter(num: any) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "G";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num;
}

const DatasetCard = ({
  name,
  likes = 0,
  updateTime,
  downloads = 0,
  id,
  description,
  selected,
  selectDataset,
}: props) => {
  const [showDescription, setShowDescription] = useState<boolean>(false);


  return (
    <div className="dataset__card__container">
      <div className="dataset_title__container">
        <Link to={`/dataset/${id}`}>
          <div className="title">
            <img src="/assets/dataset.svg" alt="" />
            <span title={name}>{name}</span>
          </div>
        </Link>

        <div className="likes">
          <img
            src={selected ? "/assets/likeFilled.svg" : "/assets/like.svg"}
            alt=""
            onClick={() => selectDataset(!selected)}
          />
        </div>
      </div>
      <div className="dataset_details__container">
        <div
          className="preview_container"
          onClick={() => setShowDescription(!showDescription)}
        >
          <img src="/assets/previewIcon.svg" alt="" />
          <span>Preview</span>
        </div>
        <div className="update_container">
          <img src="/assets/updateIcon.svg" alt="" />
          <span>{updateTime.toISOString()}</span>
        </div>
        <div className="download_container">
          <img src="/assets/downloadIcon.svg" alt="" />
          <span>{numberFormatter(Math.round(Math.random() * downloads))}</span>
        </div>
      </div>
      {showDescription && (
        <p>
          {description.slice(0, 200)}
          {description.length > 200 && "..."}
        </p>
      )}
    </div>
  );
};

export default React.memo(DatasetCard);
