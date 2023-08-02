import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { server } from "../../../server";
import { useSelector } from "react-redux";

const Hero = () => {
  const { statements } = useSelector((state) => state.statements);
  const [carouselData, setCarouselData] = useState([]);
  const [bestSelling, setBestSelling] = useState([]);
  const [featuredProduct, setFeaturedProduct] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchData();
    fetchData2();
    getSellers();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(`${server}/carousel/get-carousel`);
      const products = await axios.get(`${server}/product/get-all-products`);

      setCarouselData(response.data);
      setBestSelling(products.data.products);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching carousel data:", error);
    }
  };
  const fetchData2 = async () => {
    try {
      const products2 = await axios.get(`${server}/product/get-all-products`);
      setFeaturedProduct(products2.data.products);
    } catch (error) {
      console.error("Error fetching carousel data:", error);
    }
  };

  //getting sellers
  const getSellers = async () => {
    axios
      .get(`${server}/shop/get-all-sellers`)
      .then((res) => {
        setSellers(res.data.sellers);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const sortedBestSellingProducts = bestSelling.sort((a, b) => {
    return b.sold_out - a.sold_out;
  });

  const sortedNewProducts = featuredProduct.sort((a, b) => {
    return b.createdAt - a.createdAt;
  });

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-2 sm:grid-cols-1 mb-14">
        {loading ? (
          <div className="rounded mt-3">
            <div class="border border-gray-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
              <div class="relative">
                <div class="h-[50vh] bg-slate-200 rounded animate-stripes"></div>
                <div class="h-3 mt-3 bg-slate-200 rounded animate-stripes"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded carousel-container mt-3">
            <Carousel
              autoPlay
              infiniteLoop
              showStatus={false}
              showThumbs={false}
            >
              {carouselData.map((slide) => (
                <div key={slide._id}>
                  <img
                    className="rounded carousel-image object-contain"
                    src={`${slide.image[0]?.url}`}
                    alt={slide.caption}
                  />
                  <p className="legend">{slide.caption}</p>
                </div>
              ))}
            </Carousel>

            <style jsx>{`
              .carousel-image {
                /* Increase size for smaller screens */
                max-width: 100%;
                height: 500px;
              }
              @media (max-width: 768px) {
                /* Adjust size for smaller screens */
                .carousel-image {
                  /* Increase size for smaller screens */
                  max-width: 100%;
                  width: 100%;
                  height: 400px;
                }
              }
            `}</style>
          </div>
        )}
        <div>
          <div className="rounded grid grid-cols-3 lg:grid-cols-3 gap-2 mt-3 max-h-[370px] mx-2">
            {loading ? (
              <div className="rounded mt-3">
                <div class="border border-gray-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
                  <div class="relative">
                    <div class="h-28 lg:w-full lg:h-[300px] bg-slate-200 rounded animate-stripes"></div>
                    <div class="h-3 mt-3 bg-slate-200 rounded animate-stripes"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex">
                {sortedBestSellingProducts &&
                  sortedBestSellingProducts.slice(0, 1).map((i) => {
                    return (
                      <Link
                        to={`/product/${i._id}`}
                        className="rounded relative overflow-hidden shadow-lg flex flex-col w-36 h-36 lg:w-full lg:h-[350px]"
                      >
                        <div className="absolute top-1 left-2">
                          <span
                            className="bg-blue-500 text-white py-1 px-2 text-xs rounded-full"
                            style={{ transform: "rotate(45deg)" }}
                          >
                            best sold
                          </span>
                        </div>
                        <img
                          className="w-36 h-36 lg:w-full lg:h-[245px] object-cover"
                          src={`${i.images && i.images[0].url}`}
                          alt="Sunset in the mountains"
                        />
                        <div className="px-6 py-6 flex-1 hidden lg:flex flex-col">
                          <div className="font-bold text-sm mb-2">{i.name}</div>
                        </div>
                        <div className="absolute bottom-1 left-2 sm:hidden">
                          <span
                            className="bg-zinc-400 text-white py-1 px-2 text-xs rounded-full"
                            style={{ transform: "rotate(45deg)" }}
                          >
                            {i.name.length > 10
                              ? i.name.slice(0, 10) + "..."
                              : i.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
            {loading ? (
              <div className="rounded carousel-container mt-3">
                <div class="border border-gray-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
                  <div class="relative">
                    <div class="h-28 lg:w-full lg:h-[300px] bg-slate-200 rounded animate-stripes"></div>
                    <div class="h-3 mt-3 bg-slate-200 rounded animate-stripes"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex">
                {featuredProduct &&
                  featuredProduct.slice(0, 1).map((i) => {
                    return (
                      <Link
                        to={`/product/${i._id}`}
                        className="rounded relative overflow-hidden shadow-lg flex flex-col w-36 h-36 lg:w-full lg:h-[350px]"
                      >
                        <div className="absolute top-1 left-2">
                          <span
                            className="bg-blue-500 text-white py-1 px-2 text-xs rounded-full"
                            style={{ transform: "rotate(45deg)" }}
                          >
                            latest
                          </span>
                        </div>
                        <img
                          className="w-36 h-36 lg:w-full lg:h-[245px] object-cover"
                          src={`${i.images && i.images[0].url}`}
                          alt="Sunset in the mountains"
                        />
                        <div className="px-6 py-6 flex-1 flex flex-col">
                          <div className="font-bold text-sm mb-2">{i.name}</div>
                        </div>
                        <div className="absolute bottom-1 left-2 sm:hidden">
                          <span
                            className="bg-zinc-400 text-white py-1 px-2 text-xs rounded-full"
                            style={{ transform: "rotate(45deg)" }}
                          >
                            {i.name.length > 10
                              ? i.name.slice(0, 10) + "..."
                              : i.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}

            {loading ? (
              <div className="rounded carousel-container mt-3">
                <div class="border border-gray-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
                  <div class="relative">
                    <div class="h-28 lg:w-full lg:h-[300px] bg-slate-200 rounded animate-stripes"></div>
                    <div class="h-3 mt-3 bg-slate-200 rounded animate-stripes"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex">
                {statements &&
                  statements.map((i) => {
                    return (
                      <Link
                        to={`/product/${i.productId}`}
                        className="rounded relative overflow-hidden shadow-lg flex flex-col w-36 h-36 lg:w-full lg:h-[350px]"
                      >
                        <div className="absolute top-1 left-2">
                          <span
                            className="bg-blue-500 text-white py-1 px-2 text-xs rounded-full"
                            style={{ transform: "rotate(45deg)" }}
                          >
                            sponsored
                          </span>
                        </div>
                        <img
                          className="w-36 h-36 lg:w-full lg:h-[245px] object-cover"
                          src={i.promotionImage}
                          alt="Sunset in the mountains"
                        />
                        <div className="px-6 py-6 flex-1 flex flex-col">
                          <div className="font-bold text-sm mb-2">
                            {i.promotionDetails}
                          </div>
                        </div>
                        <div className="absolute bottom-1 left-2 sm:hidden">
                          <span
                            className="bg-zinc-400 text-white py-1 px-2 text-xs rounded-full"
                            style={{ transform: "rotate(45deg)" }}
                          >
                            {i.promotionDetails.length > 10
                              ? i.promotionDetails.slice(0, 10) + "..."
                              : i.promotionDetails}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
          {loading ? (
            <div className="rounded carousel-container mt-3">
              <div class="border border-gray-300 shadow rounded-md p-4 max-w-sm w-full mx-auto">
                <div class="relative">
                  <div class="h-14 bg-slate-200 rounded animate-stripes"></div>
                  <div class="h-3 mt-3 bg-slate-200 rounded animate-stripes"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded flex justify-center lg:grid lg:grid-cols-2 gap-2 mt-3 mx-2">
              <div className="flex max-h-[120px] relative">
                <div className="max-w-full lg:max-w-[100%]">
                  <div className="absolute top-1 left-2 z-10">
                    <span
                      className="bg-blue-500 text-white py-1 px-2 text-xs rounded-full"
                      style={{ transform: "rotate(45deg)" }}
                    >
                      best shops
                    </span>
                  </div>
                  <Carousel
                    autoPlay
                    infiniteLoop
                    showStatus={false}
                    showThumbs={false}
                    // interval={5000}
                    // stopOnHover={true}
                    className="rounded relative overflow-hidden shadow-lg flex flex-row w-36 h-36 lg:w-full lg:h-full"
                  >
                    {sellers &&
                      sellers.map((i) => (
                        <Link key={i} to={`/shop/preview/${i._id}`}>
                          {/* {sellers.map((i) => ( */}
                          <div className="relative flex">
                            <img
                              className="w-36 h-36 lg:w-full lg:h-full object-cover lg:max-h-[120px] lg:max-w-[150px]"
                              src={`${i.avatar && i.avatar.url}`}
                              alt="Sunset in the mountains"
                            />
                            <div className="px-6 py-4 flex-1 flex flex-col">
                              <div className="font-bold text-sm mb-2">
                                {i.name}
                                <br />
                                {i.address}
                              </div>
                            </div>
                            <br />
                          </div>
                          <div className="absolute bottom-1 left-2 sm:hidden">
                            <span
                              className="bg-zinc-400 text-white py-1 px-2 text-xs rounded-full"
                              style={{ transform: "rotate(45deg)" }}
                            >
                              {i.name.length > 14
                                ? i.name.slice(0, 14) + "..."
                                : i.name}
                            </span>
                          </div>
                        </Link>
                      ))}
                  </Carousel>
                </div>
              </div>
              <div className="flex max-h-[120px]">
                {sortedNewProducts &&
                  sortedNewProducts.slice(0, 1).map((i) => {
                    return (
                      <Link
                        to={`/product/${i._id}`}
                        className="rounded relative overflow-hidden shadow-lg flex flex-row w-36 h-36 lg:w-full lg:h-full"
                      >
                        <img
                          className="w-36 h-36 min-w-full lg:min-w-[50%] lg:w-full lg:h-full object-cover"
                          src={`${i.images && i.images[0].url}`}
                          alt="Sunset in the mountains"
                        />
                        <div className="px-6 py-4 flex-1 flex flex-col">
                          <div className="font-bold text-sm mb-2">{i.name}</div>
                        </div>
                        <div className="absolute bottom-1 left-2 sm:hidden">
                          <span
                            className="bg-zinc-400 text-white py-1 px-2 text-xs rounded-full"
                            style={{ transform: "rotate(45deg)" }}
                          >
                            {i.name.length > 14
                              ? i.name.slice(0, 14) + "..."
                              : i.name}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default Hero;
