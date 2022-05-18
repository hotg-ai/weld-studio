import React, { useState } from "react";
import { DatasetCard } from "./components/datasetCard";
import Tag from "./components/tag";
import "./home.css";

const tags = [
  {
    title: "Task Categories",
    tags: [
      "Text-classification",
      "Question-answering",
      "Translation",
      "Fill-mask",
      "Text-generating",
    ],
    tagBackground: "#0066FF1A",
    tagColor: "#0066FF",
  },
  {
    title: "Tasks",
    tags: [
      "Lorem-ipsum",
      "Dolor-sit",
      "Language-modeling",
      "Extract-qv",
      "Masked-language-modeling",
      "Multi-class-classification",
    ],
    tagBackground: "#008E5C1A",
    tagColor: "#008E5C",
  },
  {
    title: "Languages",
    tags: ["EN", "ES", "FA", "DU", "RU"],
    tagBackground: "#9B00E41A",
    tagColor: "#9B00E4",
  },
  {
    title: "Multilinguality",
    tags: [
      "Text-classification",
      "Question-answering",
      "BG",
      "Translation",
      "Fill-mask",
      "Text-generating",
    ],
    tagBackground: "#E861001A",
    tagColor: "#E86100",
  },
];

const datasets = [
  {
    name: "dataset 1",
    likes: 150,
    updateTime: "12 hours ago",
    downloads: 1134,
    id: 1,
  },
  {
    name: "dataset 2",
    likes: 1642,
    updateTime: "24 hours ago",
    downloads: 5025,
    id: 2,
  },
  {
    name: "dataset 3",
    likes: 5000,
    updateTime: "24 hours ago",
    downloads: 10200,
    id: 3,
  },
  {
    name: "dataset 4",
    likes: 10000,
    updateTime: "168 hours ago",
    downloads: 1001200,
    id: 4,
  },
  {
    name: "dataset 5",
    likes: 10002300,
    updateTime: "210 hours ago",
    downloads: 3000600,
    id: 5,
  },
  {
    name: "dataset 6",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 6,
  },
  {
    name: "dataset 7",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 7,
  },
  {
    name: "dataset 8",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 8,
  },
  {
    name: "dataset 9",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 9,
  },
  {
    name: "dataset 10",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 10,
  },
  {
    name: "dataset 11",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 11,
  },
  {
    name: "dataset 12",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 12,
  },
  {
    name: "dataset 13",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 13,
  },
  {
    name: "dataset 14",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 14,
  },
  {
    name: "dataset 15",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 15,
  },
  {
    name: "dataset 16",
    likes: 900000,
    updateTime: "210 hours ago",
    downloads: 2004758,
    id: 16,
  },
];
function Home() {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("Latest");
  const [uploadValue, setUploadValue] = useState<any>();

  const submitHandler = (e: any) => {
    e.preventDefault();
    console.log(searchValue);
  };

  console.log(uploadValue);
  console.log(sortValue);

  return (
    <div className="home__container">
      <div className="home_sidebar">
        {tags.map((item) => (
          <Tag
            title={item.title}
            tags={item.tags}
            tagBackground={item.tagBackground}
            tagColor={item.tagColor}
          />
        ))}
      </div>
      <div className="home_content">
        <div className="home_content-header">
          <div className="dataset_amount_container">
            <h5>Datasets</h5>
            <span className="amount">5,500</span>
          </div>

          <form className="search_container" onSubmit={submitHandler}>
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <div className="search-icon__container">
              <img src="/assets/searchIcon.svg" alt="" />
            </div>
          </form>
        </div>

        <div className="datasets__container">
          {datasets.map((item) => {
            return (
              <DatasetCard
                id={item.id}
                name={item.name}
                likes={item.likes}
                updateTime={item.updateTime}
                downloads={item.downloads}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Home;
