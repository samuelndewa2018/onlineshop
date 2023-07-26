import React from "react";
import Lottie from "react-lottie";
import animationData from "../../Assests/animations/24151-ecommerce-animation.json";

const Loader = () => {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  return (
    <div className="">
      <div className="rounded-md px-4 w-full mx-auto">
        <div className="animate-pulse block">
          <div className="rounded-md bg-slate-200 h-10 w-full mt-2"></div>
          <div className="rounded-md bg-slate-200 h-10 w-full mt-2"></div>
          <div className="rounded-md bg-slate-200 h-10 w-full mt-2"></div>
        </div>
      </div>
      <div className="w-full flex items-center justify-center px-4">
        <div className="rounded-md bg-slate-200 h-52 w-1/4 mt-2"></div>
        <Lottie options={defaultOptions} width={300} height={300} />
        <div className="rounded-md bg-slate-200 h-52 w-1/4 mt-2"></div>
      </div>
      <div className="rounded-md px-4 w-full mx-auto bottom-0">
        <div className="animate-pulse">
          <div className="rounded-md bg-slate-200 h-10 w-full mt-2"></div>
          <div className="flex gap-4">
            <div className="rounded-md bg-slate-200 h-52 w-full mt-2"></div>
            <div className="rounded-md bg-slate-200 h-52 w-full mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
