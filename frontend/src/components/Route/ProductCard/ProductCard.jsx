import React, { useState } from "react";
import {
  AiFillHeart,
  AiOutlineEye,
  AiOutlineHeart,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../../styles/styles";
import { useDispatch, useSelector } from "react-redux";
import ProductDetailsCard from "../ProductDetailsCard/ProductDetailsCard";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../../redux/actions/wishlist";
import { useEffect } from "react";
import { addTocart } from "../../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "../../Products/Ratings";
import { NumericFormat } from "react-number-format";
import { TbArrowsShuffle2 } from "react-icons/tb";
import { addTocompare } from "../../../redux/actions/compare";
import { IoIosShareAlt } from "react-icons/io";

const ProductCard = ({ data, isEvent }) => {
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { compare } = useSelector((state) => state.compare);
  const [click, setClick] = useState(false);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (wishlist && wishlist.find((i) => i._id === data._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [wishlist]);

  const removeFromWishlistHandler = (data) => {
    setClick(!click);
    dispatch(removeFromWishlist(data));
  };

  const addToWishlistHandler = (data) => {
    setClick(!click);
    dispatch(addToWishlist(data));
  };
  const addToCompareHandler = (id) => {
    const isItemExists = compare && compare.find((i) => i._id === id);
    if (isItemExists) {
      toast.error("Product already in comparelist!");
    } else {
      const compareData = { ...data, qty: 1 };
      dispatch(addTocompare(compareData));
      toast.success("Product added to comparelist!");
    }
  };

  const shareToSocialMedia = (value) => {
    // Check if the navigator supports the share API
    if (navigator.share) {
      navigator
        .share({
          title: "Product Link",
          text: "Check out this product!",
          url: value,
        })
        .then(() => {
          console.log("Product link shared successfully!");
        })
        .catch((error) => {
          console.error("Error sharing product link:", error);
        });
    } else {
      // Fallback to copying the link to clipboard
      copyToClipboard(value);
    }
  };

  const copyToClipboard = (value) => {
    navigator.clipboard.writeText(value);
    toast.info("Product link copied to clipboard!");
  };

  const addToCartHandler = (id) => {
    if (data.sizes.length > 1) {
      navigate(`/product/${id}`);
      toast.info("Select size first.");
    } else {
      const isItemExists = cart && cart.find((i) => i._id === id);
      if (isItemExists) {
        toast.error("Item already in cart!");
      } else {
        if (data.stock < 1) {
          toast.error("Product stock limited!");
        } else {
          const cartData = { ...data, qty: 1 };
          dispatch(addTocart(cartData));
          toast.success("Item added to cart successfully!");
        }
      }
    }
  };

  return (
    <>
      <div className=" md:grid-cols-1 gap-2">
        <div className="w-full min-h-[370px] max-h-[370px] mb-2 bg-white rounded-lg shadow-sm p-3 relative cursor-pointer">
          <div className="flex justify-end"></div>
          <Link
            to={`${
              isEvent === true
                ? `/product/${data._id}?isEvent=true`
                : `/product/${data._id}`
            }`}
          >
            <img
              src={`${data.images && data.images[0]?.url}`}
              alt=""
              className="w-full h-[170px] object-contain"
            />
          </Link>
          <Link to={`/shop/preview/${data?.shop._id}`}>
            <h5 className={`${styles.shop_name}`}>{data.shop.name}</h5>
          </Link>
          <Link
            to={`${
              isEvent === true
                ? `/product/${data._id}?isEvent=true`
                : `/product/${data._id}`
            }`}
          >
            <h4 className="pb-3 font-[500]">
              {data.name.length > 25
                ? data.name.slice(0, 25) + "..."
                : data.name}
            </h4>

            <div className="flex">
              <Ratings rating={data?.ratings} />
            </div>
            <div className="flex items-center justify-end">
              <span className="font-[400] text-[14px] mx-3 text-[#68d284]">
                {data.sold_out === 0 ? "New Listed" : `${data.sold_out} sold`}
              </span>
            </div>

            <div className="py-2 flex items-center justify-between">
              <div className="flex">
                <h5 className={`${styles.productDiscountPrice} text-base flex`}>
                  <p className="text-sm mr-1">Ksh</p>
                  <NumericFormat
                    value={
                      data.originalPrice === 0
                        ? data.originalPrice
                        : data.discountPrice
                    }
                    displayType={"text"}
                    thousandSeparator={true}
                    prefix={" "}
                  />
                </h5>
                <h5 className={`${styles.price} text-sm`}>
                  {data.originalPrice ? data.originalPrice : null}
                </h5>
              </div>
            </div>

            <div className="absolute top-2 left-2">
              <span
                className="bg-blue-500 text-white py-1 px-2 text-[10px] lg:text-xs rounded-full"
                style={{ transform: "rotate(45deg)" }}
              >
                {data.condition}
              </span>
            </div>
          </Link>

          {/* side options */}
          <div>
            {click ? (
              <AiFillHeart
                size={22}
                className="cursor-pointer absolute right-2 top-5"
                onClick={() => removeFromWishlistHandler(data)}
                color={click ? "red" : "#333"}
                title="Remove from wishlist"
              />
            ) : (
              <AiOutlineHeart
                size={22}
                className="cursor-pointer absolute right-2 top-5"
                onClick={() => addToWishlistHandler(data)}
                color={click ? "red" : "#333"}
                title="Add to wishlist"
              />
            )}
            <AiOutlineEye
              size={22}
              className="cursor-pointer absolute right-2 top-14"
              onClick={() => setOpen(!open)}
              color="#333"
              title="Quick view"
            />
            <AiOutlineShoppingCart
              size={25}
              className="cursor-pointer absolute right-2 top-24"
              onClick={() => addToCartHandler(data._id)}
              color="#444"
              title="Add to cart"
            />
            <IoIosShareAlt
              size={25}
              className="cursor-pointer absolute right-2 top-36
            "
              // onClick={() => {
              //   copyToClipboard(window.location.href);
              // }}
              onClick={() =>
                shareToSocialMedia(
                  `${
                    isEvent === true
                      ? `/product/${data._id}?isEvent=true`
                      : `/product/${data._id}`
                  }`
                )
              }
              color="#444"
              title="Share"
            />
            <TbArrowsShuffle2
              size={25}
              className="cursor-pointer absolute right-2 top-48"
              onClick={() => addToCompareHandler(data._id)}
              color="#444"
              title="Compare Products"
            />

            {open ? <ProductDetailsCard setOpen={setOpen} data={data} /> : null}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductCard;
