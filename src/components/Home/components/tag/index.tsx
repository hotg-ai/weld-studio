import React from "react";
import "./tag.css";
interface props {
  title?: string;
  tags: string[];
  tagBackground?: string;
  tagColor?: string;
}
const Tag = ({
  title,
  tags,
  tagBackground = "#323232d0",
  tagColor = "#fff",
}: props) => {
  return (
    <div className="tag__container">
      {title && <span className="tag__container-title">{title}</span>}
      <div className="tags">
        {tags.map((tag) => {
          return (
            <span
              style={{ color: tagColor, background: tagBackground }}
              className="tag_item"
            >
              {tag}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default Tag;
