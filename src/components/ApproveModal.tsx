import React from 'react';

const ApproveModal: React.FC<{ onApprove: () => void; onClose: () => void }> = ({ onApprove, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="card p-4">
                <h2 className="text-lg font-bold mb-2">Approve USDC and Confirm Bet</h2>
                <p>Approve 0.01 USDC spend and select your number.</p>
                <button onClick={onApprove} className="btn btn-primary mr-2">Approve & Confirm</button>
                <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            </div>
        </div>
    );
};

export default ApproveModal;