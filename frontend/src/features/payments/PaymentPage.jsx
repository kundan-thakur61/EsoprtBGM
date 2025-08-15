/* src/features/payments/PaymentPage.jsx */
import React from 'react'

const PaymentPage = () => {
  return (
    <div className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Payment / Checkout</h1>

      {/* 🚧 Build the real Razorpay or Stripe checkout here */}
      <p className="text-gray-600">
        This screen will handle tournament entry fees, wallet top-ups and
        subscription checkout. Wire it to <code>/api/v1/payments</code> once your
        backend endpoints are finished.
      </p>
    </div>
  )
}

export default PaymentPage
