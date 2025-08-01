import React, { useState, useEffect } from 'react';
import './SellerDashboardPage.css';
import LineChart from '../components/LineChart.jsx';
import SellerUpgradeModal from "../components/SellerUpgradeModal";
import { useSellerSubscription } from "../hooks/useSellerSubscription";
import axios from 'axios'; 

const BACKEND_URL = "http://localhost:8080";
const getImageUrl = (url) => url?.startsWith("http") ? url : BACKEND_URL + url;

const SellerDashboardPage = () => {
  const { canListCats, canManageAdoptions } = useSellerSubscription();
  const canManage = canManageAdoptions();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data for the current logged-in seller
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Always fetch the current logged-in user
        const meRes = await axios.get('/users/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const sellerId = meRes.data._id;

        if (!canManageAdoptions()) {
          setLoading(false);
          return;
        }

        // Fetch dashboard summary data
        const summaryRes = await axios.get(`/sellerdashboard/seller/${sellerId}/summary`);
        setDashboardData(summaryRes.data);
      } catch (err) {
        console.error(err);
        setError('Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [canManage]);

  if (!canManageAdoptions()) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Access Restricted</h2>
            <p>You need a paid seller subscription to access the dashboard.</p>
          </div>
        </div>
        <SellerUpgradeModal
          open={true}
          onClose={() => {}}
          title="Upgrade Required"
          message="You need a paid seller subscription to access the seller dashboard. Please upgrade to continue."
        />
      </div>
    );
  }

  if (loading) return <div className="dashboard-container"><p>Loading...</p></div>;
  if (error) return <div className="dashboard-container"><p>{error}</p></div>;
  if (!dashboardData) return null;

  const {
    totalAdoptions,
    totalSales,
    totalCats,
    adoptionSummary,
    payments,
    adoptions,
    adoptionChartLabels,
    adoptionChartData,
    salesChartLabels,
    salesChartData
  } = dashboardData;

  const adoptionChange = calculateChange(adoptionChartData);
  const salesChange = calculateChange(salesChartData);

  // Calculate percentage change for chart data
  function calculateChange(data) {
    if (!data || data.length < 2) return 0;
    const last = data[data.length - 2];
    const current = data[data.length - 1];
    if (last === 0) return current > 0 ? 100 : 0; // Avoid division by zero
    return ((current - last) / last * 100).toFixed(1); // One decimal place
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">

        {/* KPI Cards */}
        <div className="dashboard-card kpi">
          <h3>Adoptions of the Month</h3>
          <h2>{adoptionChartData[adoptionChartData.length - 1]}</h2>
          <span className={`trend ${adoptionChange >= 0 ? 'up' : 'down'}`}>
            {adoptionChange >= 0 ? `+${adoptionChange}%` : `${adoptionChange}%`} vs last month
          </span>
          <LineChart labels={adoptionChartLabels} dataPoints={adoptionChartData} />
        </div>

        <div className="dashboard-card kpi">
          <h3>Revenue of the Month</h3>
          <h2>{salesChartData[salesChartData.length - 1]} €</h2>
          <span className={`trend ${salesChange >= 0 ? 'up' : 'down'}`}>
            {salesChange >= 0 ? `+${salesChange}%` : `${salesChange}%`} vs last month
          </span>
          <LineChart labels={salesChartLabels} dataPoints={salesChartData} />
        </div>

        {/* Adoption Summary Card */}
        <div className="dashboard-card adoption-summary">
          <h3>Adoption Summary</h3>
          {Object.entries(adoptionSummary)
            .filter(([key]) => ['open', 'completed'].includes(key))  // Only show open/completed
            .map(([key, val]) => (
              <div className="summary-row" key={key}>
                <p>{key === 'open' ? 'Open Adoptions' : 'Completed Adoptions'}</p>
                <div className="progress-bar-wrapper">
                  <div className={`progress-bar ${key}`} style={{ width: `${val.percent}%` }}></div>
                </div>
                <span>{val.text}</span>
              </div>
          ))}
        </div>

        {/* Review Adoptions Card */}
        <div className="dashboard-card review-adoptions">
          <h3>Review Adoptions</h3>
          {adoptions.length > 0 ? (
            adoptions.map((a) => {
              // Prefer catSnapshot data if available
              const name = a.catSnapshot?.name || a.name || 'No Name';
              const photoUrl = a.catSnapshot?.photoUrl || a.photoUrl || '/default-cat.png';
              const age = a.catSnapshot?.ageYears ?? a.age ?? null;
              const location = a.catSnapshot?.location || a.location || '-';

              return (
                <div className="adoption-entry" key={a._id || name}>
                  <div className="adoption-left">
                    <img src={getImageUrl(photoUrl)} alt={name} className="adoption-cat-img" />
                    <span className={`status-tag ${a.status}`}>
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                    </span>
                  </div>
                  <div className="adoption-right">
                    <p className="cat-name">{name}</p>
                    <p className="cat-meta">
                      {age === 0 ? 'less than 1 year' : `${age} ${age === 1 ? 'year' : 'years'}`} | {location}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No adoptions to review.</p>
          )}
        </div>

      </div>

      {/* Seller Upgrade Modal */}
      <SellerUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title="Upgrade Required"
        message="You need a paid seller subscription to access the seller dashboard. Please upgrade to continue."
      />
    </div>
  );
}

export default SellerDashboardPage;
