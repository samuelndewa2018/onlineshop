// import React, { useState, useEffect } from "react";

// const Cookies = () => {
//   const [showCookieBox, setShowCookieBox] = useState(true);

//   useEffect(() => {
//     // Check if the cookie is set
//     const checkCookie = document.cookie.indexOf("CookieBy=CodingNepal");
//     setShowCookieBox(checkCookie === -1); // Show the cookie box if cookie is not set
//   }, []);

//   const handleDeny = () => {
//     setShowCookieBox(false); // Hide the cookie box when denied
//   };

//   return (
//     <>
//       {showCookieBox && (
//         <div className="wrapper">
//           <img src="#" alt="" />
//           <div className="content">
//             <header>We Use Cookies</header>
//             <p>Please, accept these sweeties to continue enjoying our site!</p>
//             <div className="buttons">
//               <a href="#" className="item hidenowcookie" onClick={handleDeny}>
//                 Nope. I'm on a diet
//               </a>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default Cookies;
