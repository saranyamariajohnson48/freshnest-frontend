const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

class PaymentService {
  constructor() {
    // Razorpay configuration
    this.razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_RFI';
  }

  // Create order on backend
  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      return await response.json();
    } catch (error) {
      console.error('Create order error:', error);
      throw error;
    }
  }

  // Verify payment on backend
  async verifyPayment(paymentData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  // Save transaction to backend
  async saveTransaction(transactionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/save-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(transactionData)
      });

      if (!response.ok) {
        throw new Error('Failed to save transaction');
      }

      return await response.json();
    } catch (error) {
      console.error('Save transaction error:', error);
      throw error;
    }
  }

  // Initialize Razorpay payment
  async initializePayment(orderData, onSuccess, onError) {
    try {
      // Create order on backend first
      const order = await this.createOrder(orderData);

      const options = {
        key: this.razorpayKeyId,
        amount: order.data.amount,
        currency: order.data.currency,
        name: 'FreshNest',
        description: `Order for ${orderData.items.length} items`,
        order_id: order.data.id,
        handler: async (response) => {
          try {
            // Verify payment on backend
            const verification = await this.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id: order.data.id
            });

            if (!verification.success) {
              onError(new Error('Payment verification failed'));
              return;
            }

            // Persist the transaction so it appears in Purchase History
            try {
              await this.saveTransaction({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                customer: {
                  name: orderData.customer?.name,
                  email: orderData.customer?.email,
                  phone: orderData.customer?.phone
                },
                order: {
                  ...orderData,
                  id: order.data.id,
                  amount: order.data.amount / 100,
                  currency: order.data.currency
                },
                paymentMethod: 'razorpay',
                status: 'completed'
              });
            } catch (saveError) {
              // Do not fail the UX if saving fails; log and proceed
              console.error('Save transaction after verification failed:', saveError);
            }

            onSuccess(response, verification);
          } catch (error) {
            onError(error);
          }
        },
        prefill: {
          name: orderData.customer.name,
          email: orderData.customer.email,
          contact: orderData.customer.phone
        },
        notes: {
          order_id: order.data.id,
          customer_id: orderData.customer.id
        },
        theme: {
          color: '#059669' // Emerald color matching the app theme
        },
        modal: {
          ondismiss: () => {
            onError(new Error('Payment cancelled by user'));
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();

      return razorpayInstance;
    } catch (error) {
      console.error('Payment initialization error:', error);
      onError(error);
    }
  }

  // Get payment status
  async getPaymentStatus(paymentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/status/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Get payment status error:', error);
      throw error;
    }
  }

  // Refund payment
  async refundPayment(paymentId, amount, reason = 'Customer request') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          payment_id: paymentId,
          amount: amount,
          reason: reason
        })
      });

      if (!response.ok) {
        throw new Error('Refund failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Refund error:', error);
      throw error;
    }
  }
}

const paymentService = new PaymentService();
export default paymentService;
