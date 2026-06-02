import { usePayments } from '../hooks/usePayments.js';
import { SWISH_NUMBER } from '../services/paymentsService.js';

// Shows the signed-in user's entry-fee status and manual Swish instructions.
// Informational only — paying is done in the Swish app, and an admin marks
// the player as paid afterwards (see LeaderboardPage). Renders nothing until
// the payment state has loaded.
export default function PaymentCard({ displayName }) {
  const { myPayment, loading, entryFee } = usePayments();

  if (loading) return null;

  const paid = Boolean(myPayment?.paid);
  // Swish message lets the organizer match the transfer to a player.
  const message = displayName ? `${displayName} VM2026` : 'VM2026';

  if (paid) {
    return (
      <div className="pay-card is-paid">
        <div className="pay-card-row">
          <span className="pay-card-title">Anmälningsavgift</span>
          <span className="lb-paid is-paid">Betald</span>
        </div>
        <p className="pay-card-sub">Tack! Din plats i ligan är betald.</p>
      </div>
    );
  }

  return (
    <div className="pay-card is-unpaid">
      <div className="pay-card-row">
        <span className="pay-card-title">Anmälningsavgift</span>
        <span className="lb-paid is-unpaid">Ej betald</span>
      </div>
      <p className="pay-card-sub">
        Swisha{entryFee ? ` ${entryFee} kr` : ''} för att vara med i potten.
      </p>
      <dl className="pay-card-details">
        {SWISH_NUMBER ? (
          <div>
            <dt>Swish</dt>
            <dd>{SWISH_NUMBER}</dd>
          </div>
        ) : null}
        {entryFee ? (
          <div>
            <dt>Belopp</dt>
            <dd>{entryFee} kr</dd>
          </div>
        ) : null}
        <div>
          <dt>Meddelande</dt>
          <dd>{message}</dd>
        </div>
      </dl>
      <p className="pay-card-foot">
        Status uppdateras manuellt när betalningen bekräftats.
      </p>
    </div>
  );
}
