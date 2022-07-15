import stripeInstance from 'stripe';

let stripe = stripeInstance(process.env.STRIPE_SECRET_KEY);

export default stripe;
