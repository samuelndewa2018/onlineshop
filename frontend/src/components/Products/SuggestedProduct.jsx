import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "../../styles/styles";
import ProductCard from "../Route/ProductCard/ProductCard";
import { getAllProducts } from "../../redux/actions/product";

const SuggestedProduct = ({ data }) => {
  const { allProducts } = useSelector((state) => state.products);
  const [productData, setProductData] = useState();

  const dispatch = useDispatch();

  useEffect(() => {
    const d =
      allProducts && allProducts.filter((i) => i.category === data.category);
    setProductData(d);
  }, []);

  const handleScrollToTop = () => {
    dispatch(getAllProducts());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div>
      {data ? (
        <div className={`p-4 ${styles.section}`} onClick={handleScrollToTop}>
          <h2
            className={`${styles.heading} text-[25px] font-[500] border-b mb-5`}
          >
            Related Product
          </h2>
          <div className="grid grid-cols-2 gap-[20px] md:grid-cols-2 md:gap-[25px] lg:grid-cols-4 lg:gap-[25px] xl:grid-cols-5 xl:gap-[30px] mb-12">
            {productData &&
              productData.map((i, index) => (
                <ProductCard data={i} key={index} />
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SuggestedProduct;
