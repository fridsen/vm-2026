import swishIcon from '../assets/swish-icon.png';
import { ENTRY_FEE_SEK, SWISH_NUMBER } from '../services/paymentsService.js';
import { buildSwishPayUrl, formatSwishDisplay } from '../utils/swish.js';
import { haptics } from '../utils/haptics.js';

export default function SwishPaymentPrompt({ firstName, className }) {
  const fee = ENTRY_FEE_SEK > 0 ? ENTRY_FEE_SEK : 200;
  const swishDisplay = formatSwishDisplay(SWISH_NUMBER);
  const message = `VM-tips ${(firstName || 'namn').trim()}`.trim();
  const swishUrl = buildSwishPayUrl({
    phone: SWISH_NUMBER,
    amountSek: fee,
    message,
  });

  const content = (
    <>
      <div className="swish-payment-prompt__icon">
        <img src={swishIcon} alt="" />
      </div>
      <div className="swish-payment-prompt__copy">
        <p className="swish-payment-prompt__title">Swisha för att vara med</p>
        <p className="swish-payment-prompt__body">
          Insatsen är <strong>{fee} kr via Swish</strong> och går till potten.
          {swishDisplay ? (
            <>
              {' '}
              Swisha till: <strong>{swishDisplay}</strong>
            </>
          ) : (
            <> Swish-nummer saknas — kontakta arrangören.</>
          )}
        </p>
        <p className="swish-payment-prompt__body">Meddelande: {message}</p>
      </div>
    </>
  );

  if (swishUrl) {
    return (
      <a
        href={swishUrl}
        className={['swish-payment-prompt', 'stagger-child', className].filter(Boolean).join(' ')}
        onClick={() => haptics.light()}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={['swish-payment-prompt', 'stagger-child', className].filter(Boolean).join(' ')}>
      {content}
    </div>
  );
}
