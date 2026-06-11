import BottomSheet from './BottomSheet.jsx';
import RulesContent from './RulesContent.jsx';

export default function RulesSheet({ open, onClose }) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy="rules-title"
      padded={false}
      className="mina-rules-sheet"
    >
      <h2 id="rules-title">Regler och poäng</h2>
      <div className="mina-rules-content">
        <RulesContent />
      </div>
    </BottomSheet>
  );
}
