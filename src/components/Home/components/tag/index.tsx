import React from "react";
import "./tag.css";
interface props {
  title?: string;
  tags: string[];
  tagBackground?: string;
  tagColor?: string;
  onCategoryClicked?: (clickedCategory: string) => void;
  selected?: string;
}
const Tag = ({
  title,
  tags,
  tagBackground = "#323232d0",
  tagColor = "#fff",
  onCategoryClicked,
  selected,
}: props) => {
  return (
    <div className="tag__container">
      {title && <span className="tag__container-title">{title}</span>}
      <div className="tags">
        {tags.map((tag) => {
          return (
            <span
              style={{
                color: tagColor,
                background: tagBackground,
                outline: tag === selected ? `1px solid ${tagColor}` : "none",
              }}
              className="tag_item"
              onClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
                const target = e.target as HTMLSpanElement;
                const value = target.innerText;
                if (onCategoryClicked) return onCategoryClicked(value);
              }}
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
