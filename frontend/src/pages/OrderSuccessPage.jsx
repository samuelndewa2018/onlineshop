import React from "react";
import Footer from "../components/Layout/Footer";
import Header from "../components/Layout/Header";
import Lottie from "react-lottie";
import animationData from "../Assests/animations/107043-success.json";
import Meta from "../components/Meta";
import { Link } from "react-router-dom";

const OrderSuccessPage = () => {
  return (
    <div>
      <Meta title="Orders" />

      <Header />
      <Success />
      <Footer />
    </div>
  );
};

const Success = () => {
  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  return (
    <div>
      <Lottie options={defaultOptions} width={300} height={300} />
      <h5 className="text-center mb-0 text-[25px] text-[#000000a1]">
        Order placed successfully 😍
      </h5>
      <Link
        to="/profile"
        className="m-auto w-32 group mt-2 relative h-[40px] flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
      >
        See my Order
      </Link>
      <br />
      <br />
    </div>
  );
};

export default OrderSuccessPage;
