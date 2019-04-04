
//These plans must reflect the ones you've created in stripe manually.

const plans = [{
    id: '1111',
    planId: 'this is a subscription name',
    interval: 'month',
    description: 'This is our product description',
    product: 'product-id',
}, {
    id: '2222',
    planId: 'This is our second subscription',
    interval: 'month',
    description: 'This is our product description',
    product: 'product-id',
}]

exports.plans = plans;