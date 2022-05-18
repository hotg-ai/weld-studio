import React from "react";
import { Link } from "react-router-dom";
import "./datasetCard.css";
interface props {
  name: string;
  likes: number;
  updateTime: string;
  downloads: number;
  id: number;
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

export const DatasetCard = ({
  name,
  likes = 0,
  updateTime,
  downloads = 0,
  id,
}: props) => {
  return (
    <div className="dataset__card__container">
      <div className="dataset_title__container">
        <Link to={`/dataset/${id}`}>
          <div className="title">
            <img src="/assets/dataset.svg" alt="" />
            <span>{name}</span>
          </div>
        </Link>

        <div className="likes">
          <img src="/assets/like.svg" alt="" />
          <span>{numberFormatter(likes)}</span>
        </div>
      </div>
      <div className="dataset_details__container">
        <div className="preview_container">
          <img src="/assets/previewIcon.svg" alt="" />
          <span>Preview</span>
        </div>
        <div className="update_container">
          <img src="/assets/updateIcon.svg" alt="" />
          <span>{updateTime}</span>
        </div>
        <div className="download_container">
          <img src="/assets/downloadIcon.svg" alt="" />
          <span>{numberFormatter(downloads)}</span>
        </div>
      </div>
    </div>
  );
};
