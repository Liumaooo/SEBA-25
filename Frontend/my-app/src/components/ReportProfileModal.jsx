// src/components/ReportProfileModal.jsx

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './ReportProfileModal.css';
import { useAuth } from '../App'; // To get the user and token

const ReportProfileModal = ({ userIdToReport, catIdToReport, onClose, onReportSuccess, onReportError }) => {
    const { user} = useAuth();
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null); // For success or error messages in the modal

    const handleReportSubmit = async () => {
        if (!user) {
            setMessage({ type: 'error', text: 'You must be logged in to report a profile.' });
            return;
        }
        if (!reason && !details) {
            setMessage({ type: 'error', text: 'Please select a reason or provide details.' });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8080/api/reports/profile', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Send the JWT token
                },
                body: JSON.stringify({
                    reporterId: user.id, // The user who is reporting
                    reportedUserId: userIdToReport, // The ID of the user being reported
                    reportedCatId: catIdToReport, // The ID of the cat
                    reason: reason,
                    details: details,
                    timestamp: new Date().toISOString()
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile successfully reported! Thank you for helping us keep our community safe.' });
                onReportSuccess(); // Callback to the parent component
                setTimeout(() => onClose(), 3000); // Close modal after 3 seconds
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to report profile. Please try again.' });
                onReportError(data.error || 'Failed to report profile.'); // Callback to the parent component
            }
        } catch (error) {
            console.error("Error reporting profile:", error);
            setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
            onReportError(error.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal-content" onClick={e => e.stopPropagation()}>
                <button className="report-modal-close" onClick={onClose}>×</button>
                <h2>Report Profile</h2>

                {message && (
                    <p className={`report-message ${message.type === 'success' ? 'success' : 'error'}`}>
                        {message.text}
                    </p>
                )}

                {!message?.type && ( // Show form only if no final message is displayed
                    <>
                        <p>What is the reason for reporting this profile?</p>
                        <div className="report-reasons">
                            <label>
                                <input
                                    type="radio"
                                    name="reportReason"
                                    value="Inappropriate Content"
                                    checked={reason === "Inappropriate Content"}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                Inappropriate Content (Photos, Text)
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="reportReason"
                                    value="Scam/Fraud Attempt"
                                    checked={reason === "Scam/Fraud Attempt"}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                Scam/Fraud Attempt
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="reportReason"
                                    value="Misleading Information"
                                    checked={reason === "Misleading Information"}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                Misleading Information (e.g., Cat details, Seller info)
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="reportReason"
                                    value="Harassment/Abuse"
                                    checked={reason === "Harassment/Abuse"}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                Harassment/Abuse
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="reportReason"
                                    value="Other"
                                    checked={reason === "Other"}
                                    onChange={(e) => setReason(e.target.value)}
                                />
                                Other
                            </label>
                        </div>

                        <textarea
                            placeholder="Provide more details (optional)"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            rows="4"
                        ></textarea>

                        <button
                            className="report-submit-btn"
                            onClick={handleReportSubmit}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

ReportProfileModal.propTypes = {
    userIdToReport: PropTypes.string.isRequired, // The ID of the user being reported (seller)
    catIdToReport: PropTypes.string, // The ID of the cat that led to the report
    onClose: PropTypes.func.isRequired,
    onReportSuccess: PropTypes.func.isRequired,
    onReportError: PropTypes.func.isRequired,
};

export default ReportProfileModal;