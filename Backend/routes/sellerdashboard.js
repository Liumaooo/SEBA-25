const express = require('express');
const router = express.Router();
const Adoption = require('../models/Adoption');
const Cat = require('../models/Cat');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');

// Seller dashboard summary endpoint
router.get('/seller/:sellerId/summary', async (req, res) => {
  const sellerId = req.params.sellerId;
  let sellerObjectId;
  try {
    sellerObjectId = new mongoose.Types.ObjectId(sellerId); // Only create a new ObjectId here
  } catch {
    return res.status(400).json({ message: 'Invalid sellerId format' });
  }

  try {
    const now = new Date();

    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    // 1. Total completed adoptions (from Adoption collection)
    const completedAdoptionsCount = await Adoption.countDocuments({
      sellerId: sellerObjectId,
      status: 'completed'
    });

    const totalSalesResult = await Payment.aggregate([
      {
        $match: {
          sellerId: sellerObjectId,
          status: 'paid',
          paidAt: { $gte: currentMonthStart, $lt: nextMonthStart } // ← 当月收入
        }
      },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);

    const totalSales = totalSalesResult.length > 0 ? totalSalesResult[0].sum / 100 : 0;


    // 3. Total cats (all cats from Cat collection for this seller)
    const totalCats = await Cat.countDocuments({ sellerId: sellerObjectId });

    // 4. Adoption summary by status (include open cats and completed adoptions)
    // Count open adoptions from Adoption collection
    const openAdoptionsCount = await Adoption.countDocuments({
      sellerId: sellerObjectId,
      status: 'open'
    });

    // Count open cats from Cat collection (published listings that are not adopted yet)
    const openCatsCount = await Cat.countDocuments({
      sellerId: sellerObjectId,
      status: 'published'
    });

    // Total open = open adoptions + open cats
    const totalOpen = openAdoptionsCount + openCatsCount;

    // Total completed = completed adoptions
    const totalCompleted = completedAdoptionsCount;

    // Total orders = open + completed
    const totalOrders = totalOpen + totalCompleted;

    // Build adoption summary object
    const adoptionSummary = {
      open: {
        count: totalOpen,
        percent: totalOrders > 0 ? Math.round((totalOpen / totalOrders) * 100) : 0,
        text: `${totalOpen}/${totalOrders} Orders`
      },
      completed: {
        count: totalCompleted,
        percent: totalOrders > 0 ? Math.round((totalCompleted / totalOrders) * 100) : 0,
        text: `${totalCompleted}/${totalOrders} Orders`
      }
    };


    // 5. Payment summary for 1-30, 31-60, 61-90 days
    const daysAgo = days => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const paymentRanges = [
      { label: '1-30 days', start: daysAgo(30), end: now },
      { label: '31-60 days', start: daysAgo(60), end: daysAgo(31) },
      { label: '61-90 days', start: daysAgo(90), end: daysAgo(61) }
    ];
    const payments = await Promise.all(paymentRanges.map(async range => {
      const paymentsSum = await Payment.aggregate([
        {
          $match: {
            sellerId: sellerObjectId,
            status: 'paid',
            paidAt: { $gte: range.start, $lt: range.end }
          }
        },
        { $group: { _id: null, sum: { $sum: '$amount' } } }
      ]);
      return {
        label: range.label,
        value: paymentsSum.length > 0 ? paymentsSum[0].sum / 100 : 0
      };
    }));


    // 6. Recent adoptions + Open listings
    const adoptions = await Adoption.find({ sellerId: sellerObjectId })
      .sort({ createdAt: -1  }) //Sorting based on creating date
      .populate('catId', 'name sex ageYears location photoUrl')
      .select('catId catSnapshot status createdAt');

    const openCats = await Cat.find({ sellerId: sellerObjectId, status: 'published' })
      .sort({ createdAt: -1 })
      .select('name ageYears location photoUrl createdAt');

    // Format adoption entries
    const adoptionEntries = adoptions.map(a => ({
      type: 'adoption',
      id: a._id,
      date: a.createdAt ? a.createdAt.toISOString().slice(0, 10) : 'N/A',
      timestamp: a.createdAt ? a.createdAt.getTime() : 0,
      name: a.catSnapshot?.name || (a.catId ? a.catId.name : "Unknown"),
      age: a.catSnapshot?.ageYears || a.catId?.ageYears || "-",
      location: a.catSnapshot?.location || a.catId?.location?.postalCode || "-",
      photoUrl: a.catSnapshot?.photoUrl || a.catId?.photoUrl || null,
      status: a.status
    }));

    // Format open listing entries
    const openEntries = openCats.map(c => ({
      type: 'listing',
      id: c._id,
      date: c.createdAt ? c.createdAt.toISOString().slice(0, 10) : 'N/A',
      timestamp: c.createdAt ? c.createdAt.getTime() : 0,
      name: c.name,
      age: c.ageYears || "-",
      location: c.location?.postalCode || "-",
      photoUrl: c.photoUrl || null,
      status: 'open'
    }));

  const combinedEntries = [...openEntries, ...adoptionEntries]
  .sort((a, b) => b.timestamp - a.timestamp); 


  // 7. Adoption trend (monthly, last 3 months)
  function getMonthRange(offset) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - offset, 1); // First day of the month
    const end = new Date(now.getFullYear(), now.getMonth() - offset + 1, 1); // First day of the next month
    return { start, end };
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const salesChartLabels = [];
  const salesChartData = [];
  const adoptionChartLabels = [];
  const adoptionChartData = [];

  // Sales Chart (last 3 months) using adoption completionDate
  for (let i = 2; i >= 0; i--) {
    const { start, end } = getMonthRange(i);

  //Look up all the completed Adoptions of the month
    const adoptionsInMonth = await Adoption.find({
    sellerId: sellerObjectId,
    status: 'completed',
    completionDate: { $gte: start, $lt: end }
  }).select('_id');

  const adoptionIds = adoptionsInMonth.map(a => a._id);

  //Look up the Payments based on the adoptionID
  const sumResult = await Payment.aggregate([
    { $match: { adoptionId: { $in: adoptionIds }, status: 'paid' } },
    { $group: { _id: null, sum: { $sum: '$amount' } } }
  ]);

    salesChartLabels.push(monthNames[start.getMonth()]);
    salesChartData.push(sumResult.length > 0 ? sumResult[0].sum / 100 : 0);
  }

  // Adoption Chart (last 3 months) using completionDate
for (let i = 2; i >= 0; i--) {
  const { start, end } = getMonthRange(i);

  const count = await Adoption.countDocuments({
    sellerId: sellerObjectId,
    status: 'completed',
    completionDate: { $gte: start, $lt: end }
  });

  adoptionChartLabels.push(monthNames[start.getMonth()]);
  adoptionChartData.push(count);
}




    // Final response
    res.json({
      totalCompleted,
      totalSales,
      totalCats,
      adoptionSummary,
      adoptions: combinedEntries, 
      adoptionChartLabels,
      adoptionChartData,
      salesChartLabels,
      salesChartData
    });

  } catch (err) {
    console.error(err.stack);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
      stack: err.stack
    });
  }
});

module.exports = router;
