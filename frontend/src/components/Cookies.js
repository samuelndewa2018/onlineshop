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
import React, { useState, useEffect } from "react";

function Cookies() {
  const [cookiesAccepted, setCookiesAccepted] = useState(false);

  useEffect(() => {
    // Check if cookies are accepted from localStorage or cookies
    const areCookiesAccepted =
      localStorage.getItem("cookiesAccepted") === "true";
    setCookiesAccepted(areCookiesAccepted);
  }, []);

  const handleAcceptCookies = () => {
    // Set cookies as accepted in localStorage or cookies
    localStorage.setItem("cookiesAccepted", "true");
    setCookiesAccepted(true);
  };

  return (
    <div className="cookies-consent">
      {!cookiesAccepted && (
        <div className="cookies-message">
          <p>This website uses cookies to improve your experience.</p>
          <button onClick={handleAcceptCookies}>Accept Cookies</button>
        </div>
      )}
      {/* Rest of your app */}
    </div>
  );
}

export default Cookies;
