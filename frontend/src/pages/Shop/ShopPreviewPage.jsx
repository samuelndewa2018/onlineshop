import React from "react";
import styles from "../../styles/styles";
import ShopInfo from "../../components/Shop/ShopInfo";
import ShopProfileData from "../../components/Shop/ShopProfileData";
import Meta from "../../components/Meta";
import Header from "../../components/Layout/Header";
import Footer from "../../components/Layout/Footer";

const ShopPreviewPage = () => {
  return (
    <>
      <Header />
      <div className={`${styles.section} bg-[#f5f5f5]`}>
        <Meta title="Shop's Reviews" />

        <div className="w-full 800px:flex py-10 justify-between">
          <div className="800px:w-[25%] bg-[#fff] rounded-[4px] shadow-sm 800px:overflow-y-scroll 800px:h-[90vh] 800px:sticky top-16 left-0 z-10">
            <ShopInfo isOwner={false} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-12 lg:mb-12 border-0">
            <ShopProfileData isOwner={false} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ShopPreviewPage;
