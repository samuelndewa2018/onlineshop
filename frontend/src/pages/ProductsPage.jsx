import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import Footer from "../components/Layout/Footer";
import Header from "../components/Layout/Header";
import Loader from "../components/Layout/Loader";
import ProductCard from "../components/Route/ProductCard/ProductCard";
import styles from "../styles/styles";
import Meta from "../components/Meta";
import { server } from "../server";
import axios from "axios";

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const categoryData = searchParams.get("category");
  const { allProducts, isLoading } = useSelector((state) => state.products);
  const [data, setData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    fetchCategoriesData();
  }, []);

  const fetchCategoriesData = async () => {
    try {
      const response = await axios.get(`${server}/category/categories`);
      setCategoriesData(response.data);
    } catch (error) {
      console.error("Error fetching categoriesData:", error);
    }
  };

  useEffect(() => {
    if (categoryData === null) {
      const d = allProducts;
      setData(d);
    } else {
      const d =
        allProducts && allProducts.filter((i) => i.category === categoryData);
      setData(d);
    }
  }, [allProducts, categoryData, categoriesData]);

  // Function to handle sorting option change and category selection
  const handleSortChange = (e) => {
    const selectedSort = e.target.value;
    setSortBy(selectedSort);

    let sortedData = [...data];

    if (selectedSort === "priceLowToHigh") {
      sortedData = sortedData.sort((a, b) => a.discountPrice - b.discountPrice);
    } else if (selectedSort === "priceHighToLow") {
      sortedData = sortedData.sort((a, b) => b.discountPrice - a.discountPrice);
    } else if (selectedSort === "ratingHighToLow") {
      sortedData = sortedData.sort((a, b) => b.ratings - a.ratings);
    } else if (selectedSort === "salesHighToLow") {
      sortedData = sortedData.sort((a, b) => b.sold_out - a.sold_out);
    }

    setData(sortedData);
  };

  // Function to handle category selection
  const handleCategoryChange = (value) => {
    const selectedCategory = value;
    setSelectedCategory(selectedCategory);

    if (selectedCategory === "") {
      setData(allProducts);
    } else {
      const filteredData =
        allProducts &&
        allProducts.filter((i) => i.category === selectedCategory);
      setData(filteredData);
    }
  };

  // Function to handle category selection
  const handleCategoryChange2 = (e) => {
    const selectedCategory = e.target.value;
    setSelectedCategory(selectedCategory);

    if (selectedCategory === "") {
      setData(allProducts);
    } else {
      const filteredData =
        allProducts &&
        allProducts.filter((i) => i.category === selectedCategory);
      setData(filteredData);
    }
  };

  return (
    <>
      <Meta title="Products" />

      {isLoading ? (
        <Loader />
      ) : (
        <div>
          <Header activeHeading={3} />
          <br />
          <br />
          <div className={`${styles.section} flex gap-[20px] appear__smoothly`}>
            {/* Category selection */}
            <div className="hidden lg:block ml-2 mb-2 w-48 text-gray-900 bg-white border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <button
                onClick={(value) => handleCategoryChange((value = ""))}
                type="button"
                className="relative inline-flex items-center w-full px-4 py-2 text-sm font-medium border-b border-gray-200 rounded-t-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white"
              >
                <svg
                  aria-hidden="true"
                  className="w-4 h-4 mr-2 fill-current"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
                Sort By Category
              </button>
              {categoriesData.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryChange(category.name)}
                  type="button"
                  className="relative inline-flex items-center w-full px-4 py-2 text-sm font-medium border-b border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white"
                >
                  {category.name}
                </button>
              ))}
              <button
                onClick={(value) => handleCategoryChange((value = ""))}
                className="relative inline-flex items-center w-full px-4 py-2 text-sm font-medium border-b border-gray-200 rounded-t-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:border-gray-600 dark:hover:bg-gray-600 dark:hover:text-white dark:focus:ring-gray-500 dark:focus:text-white"
                type="button"
              >
                Reset All
              </button>
            </div>

            <div className={``}>
              <div className="flex gap-2">
                {/* Sorting options */}
                <div className="lg:flex sm:block  mb-4">
                  <div>
                    <label
                      for="small"
                      className="flex mt-2 mr-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Sort By:
                    </label>
                  </div>
                  <div>
                    <select
                      value={sortBy}
                      onChange={handleSortChange}
                      id="small"
                      className="block w-full p-2 mb-6 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="priceLowToHigh">Price: Low to High</option>
                      <option value="priceHighToLow">Price: High to Low</option>
                      <option value="ratingHighToLow">
                        Rating: High to Low
                      </option>
                      <option value="salesHighToLow">Sales: High to Low</option>
                    </select>
                  </div>
                </div>
                {/* Sorting by category 2 */}
                <div className="lg:flex sm:block">
                  <div>
                    <label
                      for="small"
                      className="flex mt-2 mr-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                      Sort By Category:
                    </label>
                  </div>
                  <div>
                    <select
                      value={selectedCategory}
                      onChange={handleCategoryChange2}
                      id="small"
                      className="block w-full p-2 mb-6 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    >
                      <option value="Choose a category">
                        Choose a category
                      </option>
                      <option value="">All</option>
                      {categoriesData &&
                        categoriesData.map((i) => (
                          <option value={i.name} key={i.name}>
                            {i.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
              {/* <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-[25px] lg:grid-cols-4 lg:gap-[25px] xl:grid-cols-5 xl:gap-[30px] mb-12"> */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12 lg:mb-12 border-0">
                {data &&
                  data.map((i, index) => <ProductCard data={i} key={index} />)}
              </div>
              {data && data.length === 0 ? (
                <h1 className="text-center w-full pb-[100px] text-[20px]">
                  No products Found!
                </h1>
              ) : null}
            </div>
          </div>
          <Footer />
        </div>
      )}
    </>
  );
};

export default ProductsPage;
