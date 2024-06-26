import axios from 'axios';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PriceSidebar from './PriceSidebar';
import Stepper from './Stepper';
import {
    CardNumberElement,
    CardCvcElement,
    CardExpiryElement,
    useStripe,
    CardElement,
    cardElement,
    useElements,
} from '@stripe/react-stripe-js';
import { newOrder } from '../../actions/orderAction';
import { emptyCart } from '../../actions/cartAction';
import { useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { clearErrors } from '../../actions/orderAction';
import { useSnackbar } from 'notistack';
import { post } from '../../utils/paytmForm';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import MetaData from '../Layouts/MetaData';

const Payment = () => {

    
    axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const stripe = useStripe();

   console.log(stripe);
    const elements = useElements();
    const paymentBtn = useRef(null);

    const [payDisable, setPayDisable] = useState(false);

    const { shippingInfo, cartItems } = useSelector((state) => state.cart);
    const { user } = useSelector((state) => state.user);
    const { error } = useSelector((state) => state.newOrder);

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    

    const paymentData = {
        amount: Math.round(totalPrice),
        email: user.email,
        phoneNo: shippingInfo.phoneNo,
    };

    const order = {
        shippingInfo,
        orderItems: cartItems,
        totalPrice,
    }
   
    const submitHandler = async (e) => {
        e.preventDefault();

        paymentBtn.current.disabled = true;
        // setPayDisable(true);

        try {
        //     const config = {
        //         headers: {
        //             "Content-Type": "application/json",
        //         },
        //     };

        

        const { data } = await axios.post(
            '/api/v1/payment/process',
            { 
                amount: totalPrice,
                description: 'Payment for export transaction' 
            }
        );
        
        

        
        
           
            const client_secret = data.client_secret;
            

        //     let info = {
        //         action: "https://securegw-stage.paytm.in/order/process",
        //         params: data.paytmParams
        //     }

        //     post(info)

        
          const ans = elements.getElement(CardElement);
          console.log(ans)

            if (!stripe || !elements) return;

            console.log('this');

            const result = await stripe.confirmCardPayment(client_secret, {
                payment_method: {
                    card :elements.getElement(CardElement),
                    billing_details: {
                        name: user.name,
                        email: user.email,
                        address: {
                            line1: shippingInfo.address,
                            city: shippingInfo.city,
                            country: shippingInfo.country,
                            state: shippingInfo.state,
                            postal_code: shippingInfo.pincode,
                        },
                    },
                    

                },
                
            });

            console.log("result" , result);
            

            if (result.error) {
                paymentBtn.current.disabled = false;
                enqueueSnackbar(result.error.message, { variant: "error" });
            } else {
                if (result.paymentIntent.status === "succeeded") {

                    order.paymentInfo = {
                        id: result.paymentIntent.id,
                        status: result.paymentIntent.status,
                    };

                    dispatch(newOrder(order));
                    dispatch(emptyCart());

                    navigate("/order/success");
                } else {
                    enqueueSnackbar("Processing Payment Failed!", { variant: "error" });
                }
            }

        } catch (error) {
            paymentBtn.current.disabled = false;
            // setPayDisable(false);
            enqueueSnackbar(error.message || "An error occurred", { variant: "error" });

        }
    };

    useEffect(() => {
        if (error) {
            dispatch(clearErrors());
            enqueueSnackbar(error, { variant: "error" });
        }
    }, [dispatch, error, enqueueSnackbar]);


    return (
        <>
            <MetaData title="Fashion Fusion Hub: Secure Payment | Paytm" />

            <main className="w-full mt-20">

                {/* <!-- row --> */}
                <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-11/12 mt-0 sm:mt-4 m-auto sm:mb-7">

                    {/* <!-- cart column --> */}
                    <div className="flex-1">

                        <Stepper activeStep={3}>
                            <div className="w-full bg-gray-300">

                                {/* <form onSubmit={(e) => submitHandler(e)} autoComplete="off" className="flex flex-col justify-start gap-2 w-full mx-8 my-4 overflow-hidden">
                                    <FormControl>
                                        <RadioGroup
                                            aria-labelledby="payment-radio-group"
                                            defaultValue="paytm"
                                            name="payment-radio-button"
                                        >
                                            <FormControlLabel
                                                value="paytm"
                                                control={<Radio />}
                                                label={
                                                    <div className="flex items-center gap-4">
                                                        <img draggable="false" className="h-6 w-6 object-contain" src="https://rukminim1.flixcart.com/www/96/96/promos/01/09/2020/a07396d4-0543-4b19-8406-b9fcbf5fd735.png" alt="Paytm Logo" />
                                                        <span>Paytm</span>
                                                    </div>
                                                }
                                            />
                                        </RadioGroup>
                                    </FormControl>

                                    <input type="submit" value={`Pay ₹${totalPrice.toLocaleString()}`} disabled={payDisable ? true : false} className={`${payDisable ? "bg-primary-grey cursor-not-allowed" : "bg-primary-orange cursor-pointer"} w-1/2 sm:w-1/4 my-2 py-3 font-medium text-white shadow hover:shadow-lg rounded-sm uppercase outline-none`} />

                                </form> */}

                                {/* stripe form */}
                                <form onSubmit={(e) => submitHandler(e)} autoComplete="off" className="flex flex-col justify-start gap-3 w-full sm:w-3/4 mx-8 my-4">
                                <CardElement/>
                                <input ref={paymentBtn} type="submit" value="Pay" className="bg-gray-600 w-full sm:w-1/3 my-2 py-3.5 text-sm font-medium text-white shadow hover:shadow-lg rounded-sm uppercase outline-none cursor-pointer" />
                            </form>
                                {/* stripe form */}

                            </div>
                        </Stepper>
                    </div>

                    <PriceSidebar cartItems={cartItems} />
                </div>
            </main>
        </>
    );
};

export default Payment;