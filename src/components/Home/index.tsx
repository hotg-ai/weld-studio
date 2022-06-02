import React, { useEffect, useState } from "react";
import DatasetCard from "./components/datasetCard";
import Tag from "./components/tag";
import "./home.css";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog"

import { useNavigate } from "react-router";

const tags = [
  {
    title: "Tasks",
    tags: [
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

// const datasets = [
//   {
//     name: "dataset 1",
//     likes: 150,
//     updateTime: "12 hours ago",
//     downloads: 1134,
//     id: 1,
//   },
//   {
//     name: "dataset 2",
//     likes: 1642,
//     updateTime: "24 hours ago",
//     downloads: 5025,
//     id: 2,
//   },
//   {
//     name: "dataset 3",
//     likes: 5000,
//     updateTime: "24 hours ago",
//     downloads: 10200,
//     id: 3,
//   },
//   {
//     name: "dataset 4",
//     likes: 10000,
//     updateTime: "168 hours ago",
//     downloads: 1001200,
//     id: 4,
//   },
//   {
//     name: "dataset 5",
//     likes: 10002300,
//     updateTime: "210 hours ago",
//     downloads: 3000600,
//     id: 5,
//   },
//   {
//     name: "dataset 6",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 6,
//   },
//   {
//     name: "dataset 7",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 7,
//   },
//   {
//     name: "dataset 8",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 8,
//   },
//   {
//     name: "dataset 9",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 9,
//   },
//   {
//     name: "dataset 10",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 10,
//   },
//   {
//     name: "dataset 11",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 11,
//   },
//   {
//     name: "dataset 12",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 12,
//   },
//   {
//     name: "dataset 13",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 13,
//   },
//   {
//     name: "dataset 14",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 14,
//   },
//   {
//     name: "dataset 15",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 15,
//   },
//   {
//     name: "dataset 16",
//     likes: 900000,
//     updateTime: "210 hours ago",
//     downloads: 2004758,
//     id: 16,
//   },
// ];

type datasets = {
  title: string;
  description: string;
  tags: string[];
  url: string;
  likes: number;
  downloads: number;
  updateTime: string;
}[];

function Home({setQueryError, setIsLoadingTable} : {setQueryError: (error: string) => void, setIsLoadingTable: (isLoading: boolean) => void}) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [rawDatasets, setRawDatasets] = useState<datasets>();
  const [datasets, setDatasets] = useState<datasets>();
  const history = useNavigate();

  const [categories, setCategories] = useState<any>({
    title: "Task Categories",
    tags: [],
    tagBackground: "#0066FF1A",
    tagColor: "#0066FF",
  });

  useEffect(() => {
    fetch("datasets.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (myJson: datasets) {
        setDatasets(myJson);
        setRawDatasets(myJson);

        const categoriesArray = [
          //@ts-ignore
          ...new Set(
            myJson
              .map((item) => {
                return item["tags"];
              })
              .flat(1)
          ),
        ];
        console.log(categoriesArray);
        setCategories((prev: any) => ({ ...prev, tags: categoriesArray }));
      });
  }, []);

  //filter by search
  const serachOnChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setSelectedCategory("");
    const searchedValue = e.target.value.toLowerCase();
    if (searchedValue === "") {
      setDatasets(rawDatasets);
    } else {
      const filteredData = rawDatasets?.filter((dataset) =>
        dataset.title.toLowerCase().includes(searchedValue)
      );
      setDatasets(filteredData);
    }
  };

  //filter by category selection
  const categoryOnClickHandler = (value: string) => {
    setSelectedCategory(value);
    setSearchValue("");

    if (selectedCategory === value) {
      setSelectedCategory("");
      setDatasets(rawDatasets);
    } else {
      const filteredData = rawDatasets?.filter((dataset) =>
        dataset.tags.some((item) => item === value)
      );
      setDatasets(filteredData);
    }
  };

  return (
    <div className="home__container">
      <div className="home_sidebar">
        <Tag
          selected={selectedCategory}
          onCategoryClicked={categoryOnClickHandler}
          key={categories.title + "23453344453"}
          title={categories.title}
          tags={categories.tags}
          tagBackground={categories.tagBackground}
          tagColor={categories.tagColor}
        />
        {tags.map((item, index) => (
          <Tag
            key={item.title + index}
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
            <span className="amount">{datasets && datasets.length}</span>
          </div>

          <form className="search_container">
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={serachOnChangeHandler}
            />
            <div className="search-icon__container">
              <img src="/assets/searchIcon.svg" alt="" />
            </div>
          </form>

          <div className="upload__container">
            <button onClick={async () => {
              const file = await open({
                title: "Select a CSV file",
                filters: [ { "extensions": ['csv', 'tsv', 'txt'], "name": "delimited files" }]
              })
                    

                if (file) {

                  setIsLoadingTable(true);
                  invoke("load_csv", { invokeMessage: file })
                    .then((res) => {
                      let result = res as string;
                      setQueryError(`${file} loaded as ${result}`);
                      setIsLoadingTable(false);

                      
                      history("/dataset/1", {replace: true});
                    //  this.setState({ queryError: `${files[0]} loaded as ${result}` });
                    })
                    .catch((e) => {
                      setIsLoadingTable(false)
                      setQueryError(e.message);

                    history("/dataset/1", {replace: true});
                    });
                  }

            }}>
              Add Dataset
            </button>
     
          </div>
        </div>




        <div className="datasets__container">
          {datasets &&
            datasets.map((item: any, index: any) => {
              return (
                <DatasetCard
                  key={item.title + index}
                  id={index}
                  name={item.title}
                  description={item.description}
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
