import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupPaymentRoutes(app) {
  // Serve payment page
  app.get('/payment', (req, res) => {
    const clientSecret = req.query.client_secret;
    if (!clientSecret) {
      return res.status(400).send('Missing client_secret parameter');
    }

    const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Оплата курса - TechLab Digital Solutions</title>
        <script src="https://js.stripe.com/v3/"></script>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .payment-container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                padding: 40px;
                max-width: 500px;
                width: 100%;
            }
            
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .logo h1 {
                color: #333;
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            
            .logo p {
                color: #666;
                font-size: 14px;
            }
            
            .payment-form {
                margin-top: 30px;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            label {
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 500;
                font-size: 14px;
            }
            
            #card-element {
                padding: 16px;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                background: white;
                transition: border-color 0.3s ease;
            }
            
            #card-element:focus-within {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            #card-errors {
                color: #e74c3c;
                font-size: 14px;
                margin-top: 8px;
                min-height: 20px;
            }
            
            .pay-button {
                width: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 16px 24px;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-top: 20px;
            }
            
            .pay-button:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            }
            
            .pay-button:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .loading {
                display: none;
                text-align: center;
                margin-top: 20px;
            }
            
            .spinner {
                border: 3px solid #f3f3f3;
                border-top: 3px solid #667eea;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin: 0 auto 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .success-message {
                display: none;
                text-align: center;
                color: #27ae60;
                margin-top: 20px;
            }
            
            .success-message h3 {
                margin-bottom: 10px;
            }
            
            .security-info {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 16px;
                margin-top: 20px;
                font-size: 12px;
                color: #666;
                text-align: center;
            }
            
            .security-info .shield {
                color: #27ae60;
                margin-right: 5px;
            }
        </style>
    </head>
    <body>
        <div class="payment-container">
            <div class="logo">
                <h1>🤖 TechLab Digital Solutions</h1>
                <p>Оплата курса робототехники</p>
            </div>
            
            <form id="payment-form" class="payment-form">
                <div class="form-group">
                    <label for="card-element">Данные карты</label>
                    <div id="card-element"></div>
                    <div id="card-errors"></div>
                </div>
                
                <button type="submit" id="submit-button" class="pay-button">
                    Оплатить курс
                </button>
            </form>
            
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <p>Обработка платежа...</p>
            </div>
            
            <div id="success-message" class="success-message">
                <h3>✅ Оплата прошла успешно!</h3>
                <p>Спасибо за оплату! Мы свяжемся с вами в ближайшее время для уточнения расписания занятий.</p>
            </div>
            
            <div class="security-info">
                <span class="shield">🔒</span>
                Ваши данные защищены SSL-шифрованием. Мы не храним данные вашей карты.
            </div>
        </div>

        <script>
            const stripe = Stripe('${process.env.STRIPE_PUBLISHABLE_KEY}');
            const elements = stripe.elements();
            
            const cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                            color: '#aab7c4',
                        },
                    },
                },
            });
            
            cardElement.mount('#card-element');
            
            const form = document.getElementById('payment-form');
            const submitButton = document.getElementById('submit-button');
            const loading = document.getElementById('loading');
            const successMessage = document.getElementById('success-message');
            
            cardElement.on('change', ({error}) => {
                const displayError = document.getElementById('card-errors');
                if (error) {
                    displayError.textContent = error.message;
                } else {
                    displayError.textContent = '';
                }
            });
            
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                
                submitButton.disabled = true;
                submitButton.textContent = 'Обработка...';
                loading.style.display = 'block';
                
                const {error} = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: window.location.origin + '/payment-success',
                    },
                });
                
                if (error) {
                    const errorElement = document.getElementById('card-errors');
                    errorElement.textContent = error.message;
                    
                    submitButton.disabled = false;
                    submitButton.textContent = 'Оплатить курс';
                    loading.style.display = 'none';
                } else {
                    form.style.display = 'none';
                    loading.style.display = 'none';
                    successMessage.style.display = 'block';
                }
            });
        </script>
    </body>
    </html>
    `;

    res.send(html);
  });

  // Payment success page
  app.get('/payment-success', (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Оплата успешна - TechLab Digital Solutions</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                margin: 0;
            }
            
            .success-container {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                padding: 40px;
                max-width: 500px;
                width: 100%;
                text-align: center;
            }
            
            .success-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            
            h1 {
                color: #27ae60;
                margin-bottom: 16px;
                font-size: 28px;
            }
            
            p {
                color: #666;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            
            .contact-info {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin-top: 20px;
            }
            
            .contact-info h3 {
                color: #333;
                margin-bottom: 10px;
            }
        </style>
    </head>
    <body>
        <div class="success-container">
            <div class="success-icon">✅</div>
            <h1>Оплата прошла успешно!</h1>
            <p>Спасибо за оплату курса! Ваша заявка принята и обрабатывается.</p>
            <p>Мы свяжемся с вами в ближайшее время для уточнения расписания занятий и предоставления дополнительной информации.</p>
            
            <div class="contact-info">
                <h3>📞 Контакты</h3>
                <p>📍 г. Астана, ул. Алихана Бокейхана 17/1</p>
                <p>🤖 Telegram: @TechLabBot</p>
            </div>
        </div>
    </body>
    </html>
    `;

    res.send(html);
  });
}