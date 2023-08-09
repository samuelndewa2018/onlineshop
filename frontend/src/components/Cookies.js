// // import React, { useState, useEffect } from "react";

// // const Cookies = () => {
// //   const [showCookieBox, setShowCookieBox] = useState(true);

// //   useEffect(() => {
// //     // Check if the cookie is set
// //     const checkCookie = document.cookie.indexOf("CookieBy=CodingNepal");
// //     setShowCookieBox(checkCookie === -1); // Show the cookie box if cookie is not set
// //   }, []);

// //   const handleAccept = () => {
// //     // Setting cookie for 1 month, after one month it'll be expired automatically
// //     document.cookie = "CookieBy=CodingNepal; max-age=" + 60 * 60 * 24 * 30;
// //     setShowCookieBox(false); // Hide the cookie box after accepting
// //   };

// //   const handleDeny = () => {
// //     setShowCookieBox(false); // Hide the cookie box when denied
// //   };

// //   return (
// //     <>
// //       {showCookieBox && (
// //         <div className="wrapper">
// //           <img src="#" alt="" />
// //           <div className="content">
// //             <header>We Use Cookies</header>
// //             <p>Please, accept these sweeties to continue enjoying our site!</p>
// //             <div className="buttons">
// //               <button className="item" onClick={handleAccept}>
// //                 Mmm... Sweet!
// //               </button>
// //               <a href="#" className="item hidenowcookie" onClick={handleDeny}>
// //                 Nope. I'm on diet
// //               </a>
// //             </div>
// //           </div>
// //         </div>
// //       )}
// //     </>
// //   );
// // };

// // export default Cookies;
// import React, { useState } from "react";

// const Cookies = () => {
//   const [showPopup, setShowPopup] = useState(true);

//   const handleYesClick = () => {
//     // Set a cookie to indicate user's preference for third-party cookies
//     document.cookie =
//       "allowThirdPartyCookies=true; expires=Fri, 31 Dec 9999 23:59:59 GMT";
//     setShowPopup(false);
//   };

//   const handleCloseClick = () => {
//     setShowPopup(false);
//   };

//   return (
//     <div className={`cookie-popup ${showPopup ? "show" : ""}`}>
//       <div className="cookie-content">
//         <p>
//           This website uses cookies to enhance your experience. Do you allow the
//           use of third-party cookies?
//         </p>
//         <div className="cookie-buttons">
//           <button onClick={handleYesClick}>Yes</button>
//           <button onClick={handleCloseClick}>No</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Cookies;
