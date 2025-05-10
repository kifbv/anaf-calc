document.addEventListener('DOMContentLoaded', () => {
    const calculateBtn = document.getElementById('calculate');
    calculateBtn.addEventListener('click', calculateInvestment);

    // Initialize calculation on page load
    calculateInvestment();
});

function calculateInvestment() {
    // Get input values - User investment choices
    const initialPrice = parseFloat(document.getElementById('initialPrice').value);
    const marketPrice = parseFloat(document.getElementById('marketPrice').value);
    const annualPriceChange = parseFloat(document.getElementById('annualPriceChange').value) / 100;
    const futureDiscount = parseFloat(document.getElementById('futureDiscount').value) / 100;
    const annualInvestment = parseFloat(document.getElementById('annualInvestment').value);
    const dividend = parseFloat(document.getElementById('dividend').value);
    const duration = parseInt(document.getElementById('duration').value);
    
    // Get input values - Tax parameters
    const capitalGainsTax = parseFloat(document.getElementById('capitalGainsTax').value) / 100;
    const healthInsuranceRate = parseFloat(document.getElementById('healthInsuranceRate').value) / 100;
    const minWage = parseFloat(document.getElementById('minWage').value);
    const eurToLei = parseFloat(document.getElementById('eurToLei').value);
    
    // Calculate investment over time
    const results = calculateInvestmentGrowth(
        initialPrice,
        marketPrice,
        annualPriceChange,
        futureDiscount,
        annualInvestment,
        dividend,
        duration,
        capitalGainsTax,
        healthInsuranceRate,
        minWage,
        eurToLei
    );
    
    // Update chart
    updateChart(results);
    
    // Update summary results
    displaySummary(results);
    
    // Update yearly breakdown
    displayYearlyBreakdown(results);
}

function calculateInvestmentGrowth(
    initialPrice,
    marketPrice,
    annualPriceChange,
    futureDiscount,
    annualInvestment,
    dividend,
    duration,
    capitalGainsTax,
    healthInsuranceRate,
    minWage,
    eurToLei
) {
    const results = [];
    
    // Initial investment
    let currentShares = annualInvestment / initialPrice;
    let totalInvestment = annualInvestment;
    let currentMarketPrice = marketPrice; // Current market price that will change over time
    let marketValue = currentShares * currentMarketPrice;
    let totalDividends = 0;
    
    // Year 0 (initial investment)
    results.push({
        year: 0,
        investmentThisYear: annualInvestment,
        sharesThisYear: currentShares,
        totalShares: currentShares,
        totalInvestment: totalInvestment,
        marketPrice: currentMarketPrice,
        marketValue: marketValue,
        unrealizedGain: marketValue - totalInvestment,
        dividendsThisYear: 0,
        totalDividends: 0,
        capitalGainsTax: 0,
        healthInsuranceTax: 0,
        totalTax: 0,
        netGain: marketValue - totalInvestment
    });
    
    // Calculate for each year
    for (let year = 1; year <= duration; year++) {
        // Update market price based on annual growth/decline
        currentMarketPrice = currentMarketPrice * (1 + annualPriceChange);
        
        // Calculate discounted price for this year's investment
        const discountedPrice = currentMarketPrice * (1 - futureDiscount);
        
        // Dividend income from existing shares (paid before new purchases)
        const dividendsThisYear = currentShares * dividend;
        totalDividends += dividendsThisYear;
        
        // Shares bought with annual investment
        const sharesFromAnnualInvestment = annualInvestment / discountedPrice;
        
        // Reinvest dividends (buy more shares)
        const sharesFromDividends = dividendsThisYear / discountedPrice;
        
        // Update total shares
        const sharesThisYear = sharesFromAnnualInvestment + sharesFromDividends;
        currentShares += sharesThisYear;
        
        // Update total investment
        totalInvestment += annualInvestment;
        
        // Calculate market value
        marketValue = currentShares * currentMarketPrice;
        
        // Calculate unrealized gain
        const unrealizedGain = marketValue - totalInvestment;
        
        // Calculate capital gains tax (on unrealized gains)
        const capitalGainsTaxAmount = unrealizedGain > 0 ? unrealizedGain * capitalGainsTax : 0;
        
        // Calculate health insurance tax (based on dividend income in Lei)
        const dividendsInLei = dividendsThisYear * eurToLei;
        let healthInsuranceTax = 0;
        
        // Convert thresholds to Lei
        const threshold1 = 6 * minWage;  // 6 minimum wages
        const threshold2 = 12 * minWage; // 12 minimum wages
        const threshold3 = 24 * minWage; // 24 minimum wages
        
        if (dividendsInLei >= threshold1 && dividendsInLei < threshold2) {
            healthInsuranceTax = threshold1 * healthInsuranceRate;
        } else if (dividendsInLei >= threshold2 && dividendsInLei < threshold3) {
            healthInsuranceTax = threshold2 * healthInsuranceRate;
        } else if (dividendsInLei >= threshold3) {
            healthInsuranceTax = threshold3 * healthInsuranceRate;
        }
        
        // Convert health insurance tax back to EUR
        healthInsuranceTax = healthInsuranceTax / eurToLei;
        
        // Calculate total tax
        const totalTax = capitalGainsTaxAmount + healthInsuranceTax;
        
        // Calculate net gain
        const netGain = unrealizedGain - totalTax;
        
        // Add results for this year
        results.push({
            year: year,
            investmentThisYear: annualInvestment,
            sharesThisYear: sharesThisYear,
            totalShares: currentShares,
            totalInvestment: totalInvestment,
            marketPrice: currentMarketPrice,
            marketValue: marketValue,
            unrealizedGain: unrealizedGain,
            dividendsThisYear: dividendsThisYear,
            totalDividends: totalDividends,
            capitalGainsTax: capitalGainsTaxAmount,
            healthInsuranceTax: healthInsuranceTax,
            totalTax: totalTax,
            netGain: netGain
        });
    }
    
    return results;
}

// Chart instance
let investmentChart = null;

function updateChart(results) {
    const ctx = document.getElementById('investmentChart').getContext('2d');
    
    // Extract data for chart
    const labels = results.map(result => `Year ${result.year}`);
    const marketValueData = results.map(result => result.marketValue);
    const totalInvestmentData = results.map(result => result.totalInvestment);
    const netGainData = results.map(result => result.netGain);
    const totalTaxData = results.map(result => result.totalTax);
    
    // Destroy previous chart if it exists
    if (investmentChart) {
        investmentChart.destroy();
    }
    
    // Create new chart
    investmentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Market Value (€)',
                    data: marketValueData,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Total Investment (€)',
                    data: totalInvestmentData,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Net Gain (€)',
                    data: netGainData,
                    backgroundColor: 'rgba(153, 102, 255, 0.7)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Total Tax (€)',
                    data: totalTaxData,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (€)'
                    }
                }
            }
        }
    });
}

function displaySummary(results) {
    const finalResult = results[results.length - 1];
    const summaryResults = document.getElementById('summaryResults');
    
    const roi = ((finalResult.netGain / finalResult.totalInvestment) * 100).toFixed(2);
    // Calculate annualized ROI (CAGR - Compound Annual Growth Rate)
    const annualROI = finalResult.year > 0 ? 
        (Math.pow((1 + finalResult.netGain / finalResult.totalInvestment), 1 / finalResult.year) - 1) * 100 : 
        0; // Avoid division by zero for year 0
    
    summaryResults.innerHTML = `
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Total Investment</td>
                <td>${formatCurrency(finalResult.totalInvestment)}</td>
            </tr>
            <tr>
                <td>Final Market Value</td>
                <td>${formatCurrency(finalResult.marketValue)}</td>
            </tr>
            <tr>
                <td>Total Shares</td>
                <td>${finalResult.totalShares.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Total Dividends</td>
                <td>${formatCurrency(finalResult.totalDividends)}</td>
            </tr>
            <tr>
                <td>Total Tax</td>
                <td>${formatCurrency(finalResult.totalTax)}</td>
            </tr>
            <tr>
                <td>Net Gain</td>
                <td>${formatCurrency(finalResult.netGain)}</td>
            </tr>
            <tr>
                <td>Return on Investment (ROI)</td>
                <td>${roi}%</td>
            </tr>
            <tr>
                <td>Annual ROI</td>
                <td>${annualROI.toFixed(2)}%</td>
            </tr>
        </table>
    `;
}

function displayYearlyBreakdown(results) {
    const yearlyBreakdown = document.getElementById('yearlyBreakdown');
    
    let tableHTML = `
        <table>
            <tr>
                <th>Year</th>
                <th>Investment</th>
                <th>Shares Added</th>
                <th>Total Shares</th>
                <th>Stock Price</th>
                <th>Market Value</th>
                <th>Dividends</th>
                <th>Capital Gains Tax</th>
                <th>Health Insurance</th>
                <th>Net Gain</th>
            </tr>
    `;
    
    results.forEach(result => {
        tableHTML += `
            <tr>
                <td>${result.year}</td>
                <td>${formatCurrency(result.investmentThisYear)}</td>
                <td>${result.sharesThisYear.toFixed(2)}</td>
                <td>${result.totalShares.toFixed(2)}</td>
                <td>${formatCurrency(result.marketPrice)}</td>
                <td>${formatCurrency(result.marketValue)}</td>
                <td>${formatCurrency(result.dividendsThisYear)}</td>
                <td>${formatCurrency(result.capitalGainsTax)}</td>
                <td>${formatCurrency(result.healthInsuranceTax)}</td>
                <td>${formatCurrency(result.netGain)}</td>
            </tr>
        `;
    });
    
    tableHTML += '</table>';
    yearlyBreakdown.innerHTML = tableHTML;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}