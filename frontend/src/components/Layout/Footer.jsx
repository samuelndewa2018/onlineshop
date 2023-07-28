import React, { useState } from "react";
import {
  AiFillFacebook,
  AiFillInstagram,
  AiFillYoutube,
  AiOutlineTwitter,
  AiOutlineWhatsApp,
} from "react-icons/ai";
import { Link } from "react-router-dom";
import {
  footercompanyLinks,
  footerProductLinks,
  footerSupportLinks,
} from "../../static/data";
import { useFormik } from "formik";
import * as yup from "yup";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import Spinner from "../Spinner";

const subscribeSchema = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Email should be valid"),
});

const Footer = () => {
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: subscribeSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      await axios
        .post(`${server}/subscribe/subscribe`, {
          email: values.email,
        })
        .then((res) => {
          toast.success(res.data.message);
        })
        .catch((error) => {
          toast.error(error.response.data.message);
          setLoading(false);
        });
      setLoading(false);
      resetForm();
    },
  });

  return (
    <div className="bg-[#000] text-white">
      <div className="md:flex md:justify-between md:items-center px-2 lg:px-4 bg-[#342ac8] py-4 lg:py-7">
        <h1 className="lg:text-[24px] md:mb-0 mb-6 lg:leading-normal font-semibold md:w-2/5 text-[16px]">
          <span className="text-[#56d879]">Subscribe</span> us for get news,
          events and offers
        </h1>
        <div>
          <form onSubmit={formik.handleSubmit} className="block lg:flex">
            <div className="block">
              <input
                type="text"
                placeholder="Enter your email..."
                onChange={formik.handleChange("email")}
                onBlur={formik.handleBlur("email")}
                value={formik.values.email}
                className="text-gray-800
                sm:w-72 w-full sm:mr-5 mr-1 lg:mb-0 mb-4 py-2.5 rounded px-2 focus:outline-none"
              />
              <p className="text-red-500 text-xs mt-0 lg:mt-1">
                {formik.touched.email && formik.errors.email}
              </p>
            </div>
            <button
              type="submit"
              className="bg-[#56d879] hover:bg-teal-500 duration-300 px-5 py-2.5 rounded-md text-whie md:w-auto w-full"
            >
              {loading ? (
                <p className="flex ml-[30%]">
                  <Spinner /> sending...
                </p>
              ) : (
                <p className="">Send</p>
              )}
            </button>
          </form>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:gird-cols-3 lg:grid-cols-4 gap-6 sm:px-8 px-5 py-4 lg:py-8 sm:text-center">
        <ul className="text-center sm:text-start flex sm:block flex-col items-center">
          <img
            src="https://res.cloudinary.com/bramuels/image/upload/v1690362886/logo/logo_kfbukz.png"
            className="w-28 h-28 m-auto"
            alt=""
            style={{ filter: "brightness(0) invert(1)" }}
          />
          <br />
          <p>The home and elements needed to create beautiful products.</p>
          <div className="flex items-center mt-[15px]">
            <AiFillFacebook size={25} className="cursor-pointer" />
            <AiOutlineTwitter
              size={25}
              style={{ marginLeft: "15px", cursor: "pointer" }}
            />
            <AiFillInstagram
              size={25}
              style={{ marginLeft: "15px", cursor: "pointer" }}
            />
            <AiFillYoutube
              size={25}
              style={{ marginLeft: "15px", cursor: "pointer" }}
            />
            <a
              href="https://api.whatsapp.com/send?phone=254712012113"
              target="_blank"
              rel="noopener noreferrer"
            >
              <AiOutlineWhatsApp
                size={25}
                style={{ marginLeft: "15px", cursor: "pointer" }}
              />
            </a>
          </div>
        </ul>
        <ul className="text-center hidden lg:block sm:text-start">
          <h1 className="mb-1 font-semibold">Company</h1>
          {footerProductLinks.map((link, index) => (
            <li key={index}>
              <Link
                className="text-gray-400 hover:text-teal-400 duration-300
                   text-sm cursor-pointer leading-6"
                to={link.link}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="text-center hidden lg:block  sm:text-start">
          <h1 className="mb-1 font-semibold">Shop</h1>
          {footercompanyLinks.map((link, index) => (
            <li key={index}>
              <Link
                className="text-gray-400 hover:text-teal-400 duration-300
                   text-sm cursor-pointer leading-6"
                to={link.link}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <ul className="text-center hidden lg:block  sm:text-start">
          <h1 className="mb-1 font-semibold">Support</h1>
          {footerSupportLinks.map((link, index) => (
            <li key={index}>
              <Link
                className="text-gray-400 hover:text-teal-400 duration-300
                   text-sm cursor-pointer leading-6"
                to={link.link}
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex lg:hidden gap-3 ml-[10%]">
          <ul className="text-start">
            <h1 className="mb-1 font-semibold">Company</h1>
            {footerProductLinks.map((link, index) => (
              <li key={index}>
                <Link
                  className="text-gray-400 hover:text-teal-400 duration-300
                   text-sm cursor-pointer leading-6"
                  to={link.link}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="text-start">
            <h1 className="mb-1 font-semibold">Shop</h1>
            {footercompanyLinks.map((link, index) => (
              <li key={index}>
                <Link
                  className="text-gray-400 hover:text-teal-400 duration-300
                   text-sm cursor-pointer leading-6"
                  to={link.link}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="text-start">
            <h1 className="mb-1 font-semibold">Support</h1>
            {footerSupportLinks.map((link, index) => (
              <li key={index}>
                <Link
                  className="text-gray-400 hover:text-teal-400 duration-300
                   text-sm cursor-pointer leading-6"
                  to={link.link}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 text-center pt-2 text-white-400 text-sm pb-8 mb-[50px] lg:mb-0">
        <span>
          &copy; {new Date().getFullYear()} eShop. All rights reserved.
        </span>
        <span>Terms · Privacy Policy</span>
        <div className="sm:block flex items-center justify-center w-full">
          <img
            src="https://hamart-shop.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ffooter-payment.a37c49ac.png&w=640&q=75"
            alt=""
          />
        </div>
      </div>
      <a
        href="https://api.whatsapp.com/send?phone=254712012113&text=Hey%20Brams,%20what%20do%20I%20add"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-16 lg:bottom-4 right-4 bg-green-500 text-white rounded-full p-3 hover:bg-green-600 transition duration-300 z-10 flex items-center justify-center group appear__smoothly"
      >
        <AiOutlineWhatsApp size={24} />
        <span className="smart-text hidden group-hover:inline-block ml-2 appear__smoothly">
          Chat with us
        </span>
      </a>
    </div>
  );
};

export default Footer;
