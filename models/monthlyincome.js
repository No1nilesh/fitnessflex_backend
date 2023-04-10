const mongoose = require("mongoose");

const monthlyIncomeSchema = new mongoose.Schema({
    month: { type: Number, required: true },
    year: { type: Number, required: true },
    income: { type: Number, required: true },
  });

const MonthlyIncome = mongoose.model("monthlyIncome" , monthlyIncomeSchema);

module.exports = MonthlyIncome;