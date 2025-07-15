// import React, { useState } from "react";
// import { useSelector } from "react-redux";
// import axios from "axios";
// import { serverEndpoint } from "../../config/config";
// import { SET_USER } from "../../redux/user/actions";


// const CREDIT_PACKS = [10, 20, 50, 100];
// function ManagePayments() {
//   const user = useSelector((state) => state.userDetails);

//   const [errors, setErrors] = useState({});
//   const [message, setMessage] = useState(null);

//   const [loading, setLoading] = useState(false);

//   const handlePayment = async (credits) => {
//     try {
//       setLoading(true);
//       const orderResponse = await axios.post(
//         `${serverEndpoint}/payments/create-order`,
//         { credits: credits },
//         { withCredentials: true }
//       );

//       const order = orderResponse.data.order;
//       const options = {
//         key: process.env.REACT_APP_RAZORPAY_KEY_ID,
//         amount: order.amount,
//         currency: order.currency,
//         name: "affiliate++",
//         description: `${credits} credits pack`,
//         order_id: order.id,
//         theme: {
//           color: "#3399cc",
//         },

//         handler: async (payment) => {
//           try {
//             await axios.post(
//               `${serverEndpoint}/payments/verify-order`,
//               {
//                 razorpay_order_id: payment.razorpay_order_id,
//                 razorpay_payment_id: payment.razorpay_payment_id,
//                 razorpay_signature: payment.razorpay_signature,
//                 credits: credits,
//               },
//               { withCredentials: true }
//             );

//             dispatchEvent({
//                 type:SET_USER,
//                 payload:response.data.user
//             });

//           } catch (error) {
//             console.log(error);
//             setMessage({
//               message: `unable to verify order. please contact customer support service if any amount deducted from your bank account`,
//             });
//           }
//         },
//       };

//       const razorpay = new window.Razorpay(options);
//       razorpay.open();
//     } catch (error) {
//       console.log(error);
//       setErrors({ message: "Unable to prepare order, please try again" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container py-3">
//       {errors.message && (
//         <div className="alert alert-danger" role="alert">
//           {errors.message}
//         </div>
//       )}

//       {message && (
//         <div className="alert alert-success" role="alert">
//           {message}
//         </div>
//       )}

//       <h2>Manage Payment</h2>
//       <p>
//         <strong>Current Balance</strong>
//         {user.credits}
//       </p>

//       {CREDIT_PACKS.map((credit) => (
//         <div key={credit} className="col-auto border m-2 p-2">
//           <h4>{credit}</h4>
//           <p>
//             BUY {credit} credits for INR {credit}
//           </p>
//           <button
//             onClick={() => handlePayment(credit)}
//             className="btn btn-outline-primary"
//             disabled={loading}
//           >
//             Buy Now
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default ManagePayments;








import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { serverEndpoint } from "../../config/config";
import { SET_USER } from "../../redux/user/actions";

// Available credit packs
const CREDIT_PACKS = [10, 20, 50, 100];

function ManagePayments() {
  const user = useSelector((state) => state.userDetails);
  const dispatch = useDispatch();

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePayment = async (credits) => {
    try {
      setLoading(true);
      setErrors({});
      setMessage(null);

      // Step 1: Create Razorpay order
      const orderResponse = await axios.post(
        `${serverEndpoint}/payment/create-order`,
        { credits },
        { withCredentials: true }
      );

      const order = orderResponse.data.order;

      // Step 2: Razorpay options
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "affiliate++",
        description: `${credits} credits pack`,
        order_id: order.id,
        theme: {
          color: "#3399cc",
        },
        handler: async (payment) => {
          try {
            // Step 3: Verify payment
            const verifyResponse = await axios.post(
              `${serverEndpoint}/payment/verify-order`,
              {
                razorpay_order_id: payment.razorpay_order_id,
                razorpay_payment_id: payment.razorpay_payment_id,
                razorpay_signature: payment.razorpay_signature,
                credits,
              },
              { withCredentials: true }
            );

            // Step 4: Update user in Redux
            dispatch({
              type: SET_USER,
              payload: verifyResponse.data.user,
            });

            setMessage("Payment successful and credits added!");
          } catch (error) {
            console.error(error);
            setErrors({
              message:
                "Unable to verify order. If any amount was deducted, please contact customer support.",
            });
          }
        },
        modal: {
          ondismiss: () => {
            setMessage("Payment was cancelled.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      setErrors({ message: "Unable to prepare order, please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-3">
      {errors.message && (
        <div className="alert alert-danger" role="alert">
          {errors.message}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="alert">
          {message}
        </div>
      )}

      <h2>Manage Payment</h2>
      <p>
        <strong>Current Balance:</strong> {user.credits}
      </p>

      <div className="row">
        {CREDIT_PACKS.map((credit) => (
          <div key={credit} className="col-md-3 col-sm-6 mb-3">
            <div className="card p-3 text-center">
              <h4>{credit} Credits</h4>
              <p>Buy for ₹{credit}</p>
              <button
                onClick={() => handlePayment(credit)}
                className="btn btn-outline-primary"
                disabled={loading}
              >
                {loading ? "Processing..." : "Buy Now"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManagePayments;
